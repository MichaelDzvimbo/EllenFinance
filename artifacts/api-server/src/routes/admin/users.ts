import { Router, type IRouter } from "express";
import { eq, ilike, or, desc } from "drizzle-orm";
import { db, applicationsTable, documentsTable, loansTable } from "@workspace/db";
import { requireAdmin } from "../../lib/session";
import {
  GetAdminUsersQueryParams,
  GetAdminUserParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const parsed = GetAdminUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search } = parsed.data;

  let query = db
    .selectDistinctOn([applicationsTable.email], {
      id: applicationsTable.id,
      fullName: applicationsTable.fullName,
      email: applicationsTable.email,
      phone: applicationsTable.phone,
      nationalId: applicationsTable.nationalId,
      createdAt: applicationsTable.createdAt,
    })
    .from(applicationsTable)
    .$dynamic();

  if (search) {
    query = query.where(
      or(
        ilike(applicationsTable.fullName, `%${search}%`),
        ilike(applicationsTable.email, `%${search}%`),
        ilike(applicationsTable.phone, `%${search}%`)
      )!
    );
  }

  const users = await query.orderBy(applicationsTable.email, desc(applicationsTable.createdAt));

  res.json(
    users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      nationalId: u.nationalId,
      createdAt: u.createdAt.toISOString(),
    }))
  );
});

router.get("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = GetAdminUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [docs, [loan]] = await Promise.all([
    db.select().from(documentsTable).where(eq(documentsTable.applicationId, user.id)),
    db.select().from(loansTable).where(eq(loansTable.applicationId, user.id)),
  ]);

  const allApps = await db
    .select()
    .from(applicationsTable)
    .where(ilike(applicationsTable.email, user.email))
    .orderBy(desc(applicationsTable.createdAt));

  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    nationalId: user.nationalId,
    address: user.address,
    employmentType: user.employmentType,
    employer: user.employer,
    monthlyIncome: Number(user.monthlyIncome),
    createdAt: user.createdAt.toISOString(),
    applications: allApps.map((a) => ({
      id: a.id,
      referenceNumber: a.referenceNumber,
      status: a.status,
      requestedAmount: Number(a.requestedAmount),
      approvedAmount: a.approvedAmount ? Number(a.approvedAmount) : null,
      createdAt: a.createdAt.toISOString(),
    })),
    loan: loan
      ? {
          id: loan.id,
          status: loan.status,
          principalAmount: Number(loan.principalAmount),
          outstandingBalance: Number(loan.outstandingBalance),
          totalPaid: Number(loan.totalPaid),
        }
      : null,
  });
});

export default router;
