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

function serializeLoan(l: typeof loansTable.$inferSelect, app?: typeof applicationsTable.$inferSelect | null) {
  return {
    id: l.id,
    applicationId: l.applicationId,
    status: l.status,
    principalAmount: Number(l.principalAmount),
    outstandingBalance: Number(l.outstandingBalance),
    interestRate: Number(l.interestRate),
    startDate: l.startDate.toISOString(),
    endDate: l.endDate.toISOString(),
    nextDueDate: l.nextDueDate ? l.nextDueDate.toISOString() : null,
    totalPaid: Number(l.totalPaid),
    notes: l.notes,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    ...(app
      ? {
          clientName: app.fullName,
          clientPhone: app.phone,
          clientEmail: app.email,
        }
      : {}),
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

  res.json(filtered.map((r) => serializeLoan(r.loan, r.app)));
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

  res.json({
    ...serializeLoan(row.loan, row.app),
    repayments: reps.map((r) => ({
      id: r.id,
      loanId: r.loanId,
      amount: Number(r.amount),
      paymentMethod: r.paymentMethod,
      referenceNumber: r.referenceNumber,
      notes: r.notes,
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
  const updates = { ...rest, updatedAt: new Date() };

  const [updated] = await db
    .update(loansTable)
    .set(updates)
    .where(eq(loansTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  await logAudit("UPDATE_LOAN", "loan", updated.id, `Status: ${rest.status ?? "unchanged"}`);

  if (shouldSms) {
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, updated.applicationId));
    if (app) {
      await smsSend(app.phone, `Dear ${app.fullName}, your Ellen Finance loan status has been updated to: ${updated.status?.toUpperCase()}.`);
    }
  }

  res.json(serializeLoan(updated));
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

  // Add penalty to outstanding balance
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

  const { amount, paymentMethod, referenceNumber, notes } = parsed.data;

  const [repayment] = await db
    .insert(repaymentsTable)
    .values({ loanId: params.data.id, amount: String(amount), paymentMethod, referenceNumber, notes })
    .returning();

  // Reduce outstanding balance
  const [updatedLoan] = await db
    .update(loansTable)
    .set({
      outstandingBalance: sql`GREATEST(0, outstanding_balance - ${amount})`,
      totalPaid: sql`total_paid + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(loansTable.id, params.data.id))
    .returning();

  // Mark as completed if fully paid
  if (updatedLoan && Number(updatedLoan.outstandingBalance) <= 0) {
    await db.update(loansTable).set({ status: "completed", updatedAt: new Date() }).where(eq(loansTable.id, params.data.id));
  }

  await logAudit("RECORD_REPAYMENT", "loan", params.data.id, `Payment $${amount} via ${paymentMethod}`);

  res.status(201).json({
    id: repayment.id,
    loanId: repayment.loanId,
    amount: Number(repayment.amount),
    paymentMethod: repayment.paymentMethod,
    referenceNumber: repayment.referenceNumber,
    notes: repayment.notes,
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
