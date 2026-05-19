import { Router, type IRouter } from "express";
import { db, applicationsTable, loansTable, repaymentsTable, auditLogsTable } from "@workspace/db";
import { requireAdmin } from "../../lib/session";
import { sql, eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/admin/dashboard", requireAdmin, async (req, res): Promise<void> => {
  const [[appStats], [loanStats], [repayStats]] = await Promise.all([
    db.select({
      total: count(),
      pending: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')`,
      approved: sql<number>`COUNT(*) FILTER (WHERE status = 'approved')`,
      rejected: sql<number>`COUNT(*) FILTER (WHERE status = 'rejected')`,
      under_review: sql<number>`COUNT(*) FILTER (WHERE status = 'under_review')`,
    }).from(applicationsTable),
    db.select({
      active: sql<number>`COUNT(*) FILTER (WHERE status = 'active')`,
      overdue: sql<number>`COUNT(*) FILTER (WHERE status = 'overdue')`,
      completed: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
      totalDisbursed: sql<string>`COALESCE(SUM(principal_amount), 0)`,
      totalOutstanding: sql<string>`COALESCE(SUM(outstanding_balance), 0)`,
    }).from(loansTable),
    db.select({
      totalCollected: sql<string>`COALESCE(SUM(amount), 0)`,
    }).from(repaymentsTable),
  ]);

  const totalDisbursed = Number(loanStats?.totalDisbursed ?? 0);
  const totalCollected = Number(repayStats?.totalCollected ?? 0);
  const collectionRate = totalDisbursed > 0 ? Math.round((totalCollected / totalDisbursed) * 100) : 0;

  res.json({
    totalApplications: Number(appStats?.total ?? 0),
    pendingApplications: Number(appStats?.pending ?? 0),
    approvedApplications: Number(appStats?.approved ?? 0),
    rejectedApplications: Number(appStats?.rejected ?? 0),
    activeLoans: Number(loanStats?.active ?? 0),
    overdueLoans: Number(loanStats?.overdue ?? 0),
    completedLoans: Number(loanStats?.completed ?? 0),
    totalDisbursed,
    totalOutstanding: Number(loanStats?.totalOutstanding ?? 0),
    collectionRate,
  });
});

router.get("/admin/stats/charts", requireAdmin, async (req, res): Promise<void> => {
  const monthly = await db.execute(sql`
    SELECT
      TO_CHAR(created_at, 'Mon YYYY') AS month,
      COUNT(*) AS count,
      DATE_TRUNC('month', created_at) AS sort_key
    FROM applications
    GROUP BY month, sort_key
    ORDER BY sort_key DESC
    LIMIT 12
  `);

  const statusBreakdown = await db.execute(sql`
    SELECT status, COUNT(*) AS count
    FROM loans
    GROUP BY status
  `);

  const appStatusBreakdown = await db.execute(sql`
    SELECT status, COUNT(*) AS count
    FROM applications
    GROUP BY status
  `);

  res.json({
    monthlyApplications: (monthly.rows as { month: string; count: string }[])
      .reverse()
      .map((r) => ({ month: r.month, count: Number(r.count) })),
    loanStatusBreakdown: (statusBreakdown.rows as { status: string; count: string }[]).map((r) => ({
      status: r.status,
      count: Number(r.count),
    })),
    appStatusBreakdown: (appStatusBreakdown.rows as { status: string; count: string }[]).map((r) => ({
      status: r.status,
      count: Number(r.count),
    })),
  });
});

router.get("/admin/activity", requireAdmin, async (req, res): Promise<void> => {
  const logs = await db
    .select()
    .from(auditLogsTable)
    .orderBy(sql`created_at DESC`)
    .limit(20);

  res.json(
    logs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      details: l.details,
      performedBy: l.performedBy,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});

export default router;
