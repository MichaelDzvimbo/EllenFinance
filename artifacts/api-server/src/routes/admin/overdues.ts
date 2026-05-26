import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, loansTable, applicationsTable } from "@workspace/db";
import { requireAdmin } from "../../lib/session";

const router: IRouter = Router();

router.get("/admin/overdues", requireAdmin, async (req, res): Promise<void> => {
  const now = new Date();

  const rows = await db
    .select({ loan: loansTable, app: applicationsTable })
    .from(loansTable)
    .leftJoin(applicationsTable, eq(loansTable.applicationId, applicationsTable.id))
    .where(sql`${loansTable.status} IN ('active', 'overdue') AND ${loansTable.nextDueDate} < ${now}`);

  const overdues = rows.map((r) => {
    const daysOverdue = r.loan.nextDueDate
      ? Math.floor((now.getTime() - r.loan.nextDueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const principal = Number(r.loan.principalAmount);
    const rate = Number(r.loan.interestRate) / 100;
    const repaymentMonths = r.app?.repaymentMonths ?? 12;
    const totalRepayable = principal * (1 + rate);
    const monthlyPayment = repaymentMonths > 0 ? totalRepayable / repaymentMonths : 0;

    return {
      id: r.loan.id,
      applicationId: r.loan.applicationId,
      applicantName: r.app?.fullName ?? "Unknown",
      applicantPhone: r.app?.phone ?? "",
      applicantEmail: r.app?.email ?? "",
      principalAmount: principal,
      interestRate: Number(r.loan.interestRate),
      repaymentMonths,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalRepayable: Math.round(totalRepayable * 100) / 100,
      outstandingBalance: Number(r.loan.outstandingBalance),
      totalPaid: Number(r.loan.totalPaid),
      penaltyAmount: 0,
      status: r.loan.status,
      payoutMethod: r.app?.payoutMethod ?? null,
      disbursedAt: r.loan.startDate.toISOString(),
      dueDate: r.loan.endDate.toISOString(),
      nextDueDate: r.loan.nextDueDate ? r.loan.nextDueDate.toISOString() : null,
      adminNotes: r.loan.notes ?? null,
      createdAt: r.loan.createdAt.toISOString(),
      updatedAt: r.loan.updatedAt.toISOString(),
      daysOverdue,
    };
  });

  overdues.sort((a, b) => b.daysOverdue - a.daysOverdue);

  res.json(overdues);
});

export default router;
