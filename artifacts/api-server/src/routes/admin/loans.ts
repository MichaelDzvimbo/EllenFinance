import { Router, type IRouter } from "express";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import { db, loansTable, applicationsTable, repaymentsTable, penaltiesTable } from "@workspace/db";
import { requireAdmin } from "../../lib/session";
import { logAudit } from "../../lib/audit";
import { sendSms as smsSend } from "../../lib/sms";
import {
  GetAdminLoansQueryParams,
  GetAdminLoanParams,
  UpdateAdminLoanParams,
  UpdateAdminLoanBody,
  AddLoanPenaltyParams,
  AddLoanPenaltyBody,
  RecordRepaymentParams,
  RecordRepaymentBody,
  SendLoanSmsParams,
  SendLoanSmsBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeLoanFields(
  l: typeof loansTable.$inferSelect,
  app?: typeof applicationsTable.$inferSelect | null,
  penaltyTotal = 0
) {
  const principal = Number(l.principalAmount);
  const rate = Number(l.interestRate) / 100;
  const repaymentMonths = app?.repaymentMonths ?? 12;
  // Flat-rate simple-interest calculation (standard for microfinance)
  const totalRepayable = principal * (1 + rate);
  const monthlyPayment = repaymentMonths > 0 ? totalRepayable / repaymentMonths : 0;

  return {
    id: l.id,
    applicationId: l.applicationId,
    applicantName: app?.fullName ?? null,
    applicantPhone: app?.phone ?? null,
    applicantEmail: app?.email ?? null,
    principalAmount: principal,
    interestRate: Number(l.interestRate),
    repaymentMonths,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalRepayable: Math.round(totalRepayable * 100) / 100,
    outstandingBalance: Number(l.outstandingBalance),
    totalPaid: Number(l.totalPaid),
    penaltyAmount: penaltyTotal,
    status: l.status,
    payoutMethod: app?.payoutMethod ?? null,
    disbursedAt: l.startDate.toISOString(),
    dueDate: l.endDate.toISOString(),
    nextDueDate: l.nextDueDate ? l.nextDueDate.toISOString() : null,
    adminNotes: l.notes ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

router.get("/admin/loans", requireAdmin, async (req, res): Promise<void> => {
  const parsed = GetAdminLoansQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, search } = parsed.data;

  const rows = await db
    .select({ loan: loansTable, app: applicationsTable })
    .from(loansTable)
    .leftJoin(applicationsTable, eq(loansTable.applicationId, applicationsTable.id))
    .orderBy(desc(loansTable.createdAt));

  const filtered = rows.filter((r) => {
    if (status && r.loan.status !== status) return false;
    if (search) {
      const s = search.toLowerCase();
      const app = r.app;
      if (!app) return false;
      return (
        app.fullName.toLowerCase().includes(s) ||
        app.email.toLowerCase().includes(s) ||
        app.phone.includes(s)
      );
    }
    return true;
  });

  res.json(filtered.map((r) => computeLoanFields(r.loan, r.app)));
});

router.get("/admin/loans/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = GetAdminLoanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ loan: loansTable, app: applicationsTable })
    .from(loansTable)
    .leftJoin(applicationsTable, eq(loansTable.applicationId, applicationsTable.id))
    .where(eq(loansTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  const [reps, pens] = await Promise.all([
    db.select().from(repaymentsTable).where(eq(repaymentsTable.loanId, row.loan.id)).orderBy(desc(repaymentsTable.paidAt)),
    db.select().from(penaltiesTable).where(eq(penaltiesTable.loanId, row.loan.id)).orderBy(desc(penaltiesTable.createdAt)),
  ]);

  const penaltyTotal = pens.reduce((sum, p) => sum + Number(p.amount), 0);

  res.json({
    ...computeLoanFields(row.loan, row.app, penaltyTotal),
    repayments: reps.map((r) => ({
      id: r.id,
      loanId: r.loanId,
      amount: Number(r.amount),
      paymentMethod: r.paymentMethod,
      reference: r.referenceNumber ?? null,
      paidAt: r.paidAt.toISOString(),
    })),
    penalties: pens.map((p) => ({
      id: p.id,
      loanId: p.loanId,
      amount: Number(p.amount),
      reason: p.reason,
      createdAt: p.createdAt.toISOString(),
    })),
  });
});

router.patch("/admin/loans/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateAdminLoanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAdminLoanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sendSms: shouldSms, ...rest } = parsed.data;

  // Map adminNotes → notes for DB
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (rest.status != null) updates.status = rest.status;
  if ("adminNotes" in rest && rest.adminNotes != null) updates.notes = rest.adminNotes;
  if ("nextDueDate" in rest && rest.nextDueDate != null) updates.nextDueDate = new Date(rest.nextDueDate as string);

  const [updated] = await db
    .update(loansTable)
    .set(updates)
    .where(eq(loansTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, updated.applicationId));

  await logAudit("UPDATE_LOAN", "loan", updated.id, `Status: ${rest.status ?? "unchanged"}`);

  if (shouldSms && app) {
    await smsSend(app.phone, `Dear ${app.fullName}, your Ellen Finance loan status has been updated to: ${updated.status?.toUpperCase()}.`);
  }

  res.json(computeLoanFields(updated, app ?? null));
});

router.post("/admin/loans/:id/penalty", requireAdmin, async (req, res): Promise<void> => {
  const params = AddLoanPenaltyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddLoanPenaltyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { amount, reason } = parsed.data;

  const [penalty] = await db
    .insert(penaltiesTable)
    .values({ loanId: params.data.id, amount: String(amount), reason })
    .returning();

  await db
    .update(loansTable)
    .set({ outstandingBalance: sql`outstanding_balance + ${amount}`, updatedAt: new Date() })
    .where(eq(loansTable.id, params.data.id));

  await logAudit("ADD_PENALTY", "loan", params.data.id, `Penalty $${amount}: ${reason}`);

  res.status(201).json({
    id: penalty.id,
    loanId: penalty.loanId,
    amount: Number(penalty.amount),
    reason: penalty.reason,
    createdAt: penalty.createdAt.toISOString(),
  });
});

router.post("/admin/loans/:id/repayment", requireAdmin, async (req, res): Promise<void> => {
  const params = RecordRepaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = RecordRepaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { amount, paymentMethod, reference } = parsed.data;

  const [repayment] = await db
    .insert(repaymentsTable)
    .values({ loanId: params.data.id, amount: String(amount), paymentMethod, referenceNumber: reference ?? null })
    .returning();

  const [updatedLoan] = await db
    .update(loansTable)
    .set({
      outstandingBalance: sql`GREATEST(0, outstanding_balance - ${amount})`,
      totalPaid: sql`total_paid + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(loansTable.id, params.data.id))
    .returning();

  if (updatedLoan && Number(updatedLoan.outstandingBalance) <= 0) {
    await db.update(loansTable).set({ status: "completed", updatedAt: new Date() }).where(eq(loansTable.id, params.data.id));
  }

  await logAudit("RECORD_REPAYMENT", "loan", params.data.id, `Payment $${amount} via ${paymentMethod}`);

  res.status(201).json({
    id: repayment.id,
    loanId: repayment.loanId,
    amount: Number(repayment.amount),
    paymentMethod: repayment.paymentMethod,
    reference: repayment.referenceNumber ?? null,
    paidAt: repayment.paidAt.toISOString(),
  });
});

router.post("/admin/loans/:id/sms", requireAdmin, async (req, res): Promise<void> => {
  const params = SendLoanSmsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SendLoanSmsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [loan] = await db.select().from(loansTable).where(eq(loansTable.id, params.data.id));
  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, loan.applicationId));
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  await smsSend(app.phone, parsed.data.message);
  await logAudit("SEND_SMS", "loan", loan.id, `SMS to ${app.phone.slice(0, 6)}****`);

  res.json({ ok: true, message: "SMS sent" });
});

export default router;
