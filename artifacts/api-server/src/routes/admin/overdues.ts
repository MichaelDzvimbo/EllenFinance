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

    return {
      id: r.loan.id,
      applicationId: r.loan.applicationId,
      status: r.loan.status,
      principalAmount: Number(r.loan.principalAmount),
      outstandingBalance: Number(r.loan.outstandingBalance),
      interestRate: Number(r.loan.interestRate),
      startDate: r.loan.startDate.toISOString(),
      endDate: r.loan.endDate.toISOString(),
      nextDueDate: r.loan.nextDueDate ? r.loan.nextDueDate.toISOString() : null,
      totalPaid: Number(r.loan.totalPaid),
      notes: r.loan.notes,
      createdAt: r.loan.createdAt.toISOString(),
      updatedAt: r.loan.updatedAt.toISOString(),
      daysOverdue,
      clientName: r.app?.fullName ?? "Unknown",
      clientPhone: r.app?.phone ?? "",
      clientEmail: r.app?.email ?? "",
    };
  });

  overdues.sort((a, b) => b.daysOverdue - a.daysOverdue);

  res.json(overdues);
});

export default router;
