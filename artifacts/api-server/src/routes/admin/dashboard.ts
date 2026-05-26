import { Router, type IRouter } from "express";
import { db, applicationsTable, loansTable, repaymentsTable, auditLogsTable, documentsTable, usersTable } from "@workspace/db";
import { requireAdmin } from "../../lib/session";
import { sql, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/admin/dashboard", requireAdmin, async (req, res): Promise<void> => {
  const [[appStats], [loanStats], [repayStats], [docStats], [userStats]] = await Promise.all([
    db.select({
      total: count(),
      pending: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')`,
      approved: sql<number>`COUNT(*) FILTER (WHERE status = 'approved')`,
      rejected: sql<number>`COUNT(*) FILTER (WHERE status = 'rejected')`,
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

    db.select({
      pendingDocuments: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')`,
    }).from(documentsTable),

    db.select({ totalUsers: count() }).from(usersTable),
  ]);

  res.json({
    totalApplications: Number(appStats?.total ?? 0),
    pendingApplications: Number(appStats?.pending ?? 0),
    approvedApplications: Number(appStats?.approved ?? 0),
    rejectedApplications: Number(appStats?.rejected ?? 0),
    activeLoans: Number(loanStats?.active ?? 0),
    overdueLoans: Number(loanStats?.overdue ?? 0),
    totalDisbursed: Number(loanStats?.totalDisbursed ?? 0),
    totalOutstanding: Number(loanStats?.totalOutstanding ?? 0),
    totalCollected: Number(repayStats?.totalCollected ?? 0),
    pendingDocuments: Number(docStats?.pendingDocuments ?? 0),
    totalUsers: Number(userStats?.totalUsers ?? 0),
  });
});

router.get("/admin/stats/charts", requireAdmin, async (req, res): Promise<void> => {
  const monthly = await db.execute(sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', l.created_at), 'Mon YYYY') AS month,
      DATE_TRUNC('month', l.created_at) AS sort_key,
      COALESCE(SUM(l.principal_amount), 0)::float AS disbursed,
      COALESCE(SUM(r.total), 0)::float AS collected,
      COUNT(DISTINCT a.id)::int AS applications
    FROM loans l
    LEFT JOIN applications a ON a.id = l.application_id
    LEFT JOIN (
      SELECT loan_id, SUM(amount) AS total FROM repayments GROUP BY loan_id
    ) r ON r.loan_id = l.id
    GROUP BY month, sort_key
    ORDER BY sort_key DESC
    LIMIT 12
  `);

  const statusBreakdown = await db.execute(sql`
    SELECT status, COUNT(*)::int AS count
    FROM loans
    GROUP BY status
  `);

  res.json({
    monthly: (monthly.rows as { month: string; disbursed: number; collected: number; applications: number }[])
      .reverse()
      .map((r) => ({
        month: r.month,
        disbursed: Number(r.disbursed),
        collected: Number(r.collected),
        applications: Number(r.applications),
      })),
    statusBreakdown: (statusBreakdown.rows as { status: string; count: number }[]).map((r) => ({
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

  const typeMap: Record<string, string> = {
    application: "application",
    loan: "loan",
    payment: "payment",
    notification: "notification",
    document: "document",
    admin: "system",
  };

  res.json(
    logs.map((l) => {
      const amountMatch = l.details?.match(/\$(\d+(?:\.\d+)?)/);
      const amount = amountMatch ? Number(amountMatch[1]) : null;

      const actionLabel = l.action
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        id: l.id,
        type: typeMap[l.entityType ?? ""] ?? l.entityType ?? "system",
        description: l.details ? `${actionLabel}: ${l.details}` : actionLabel,
        applicantName: l.performedBy && l.performedBy !== "admin" ? l.performedBy : null,
        amount,
        createdAt: l.createdAt.toISOString(),
      };
    })
  );
});

export default router;
