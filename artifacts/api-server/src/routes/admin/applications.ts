import { Router, type IRouter } from "express";
import { eq, ilike, or, desc, sql, and } from "drizzle-orm";
import { db, applicationsTable, documentsTable, loansTable } from "@workspace/db";
import { requireAdmin } from "../../lib/session";
import { logAudit } from "../../lib/audit";
import { sendSms } from "../../lib/sms";
import {
  GetAdminApplicationsQueryParams,
  GetAdminApplicationParams,
  UpdateAdminApplicationParams,
  UpdateAdminApplicationBody,
} from "@workspace/api-zod";
import { serializeApp } from "../public/applications";

const router: IRouter = Router();

router.get("/admin/applications", requireAdmin, async (req, res): Promise<void> => {
  const parsed = GetAdminApplicationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, search, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(applicationsTable.status, status));
  if (search) {
    conditions.push(
      or(
        ilike(applicationsTable.fullName, `%${search}%`),
        ilike(applicationsTable.email, `%${search}%`),
        ilike(applicationsTable.referenceNumber, `%${search}%`),
        ilike(applicationsTable.phone, `%${search}%`)
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(applicationsTable)
      .where(whereClause)
      .orderBy(desc(applicationsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`COUNT(*)` })
      .from(applicationsTable)
      .where(whereClause),
  ]);

  res.json({
    items: items.map(serializeApp),
    total: Number(total),
    page,
    limit,
  });
});

router.get("/admin/applications/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = GetAdminApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id));

  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const [docs, [loan]] = await Promise.all([
    db.select().from(documentsTable).where(eq(documentsTable.applicationId, app.id)),
    db.select().from(loansTable).where(eq(loansTable.applicationId, app.id)),
  ]);

  res.json({
    ...serializeApp(app),
    documents: docs.map((d) => ({
      id: d.id,
      applicationId: d.applicationId,
      docType: d.docType,
      objectKey: d.objectKey,
      fileName: d.fileName,
      status: d.status,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
    loan: loan
      ? {
          id: loan.id,
          status: loan.status,
          outstandingBalance: Number(loan.outstandingBalance),
        }
      : null,
  });
});

router.patch("/admin/applications/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateAdminApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAdminApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sendSms: shouldSms, approvedAmount, ...rest } = parsed.data;

  const updates: Record<string, unknown> = {
    ...rest,
    updatedAt: new Date(),
  };
  if (approvedAmount != null) {
    updates.approvedAmount = String(approvedAmount);
  }

  // If approving, create a loan automatically
  if (rest.status === "approved" && approvedAmount != null) {
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, params.data.id));
    if (app) {
      const existing = await db.select().from(loansTable).where(eq(loansTable.applicationId, app.id));
      if (existing.length === 0) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + app.repaymentMonths);
        const nextDue = new Date();
        nextDue.setMonth(nextDue.getMonth() + 1);

        await db.insert(loansTable).values({
          applicationId: app.id,
          principalAmount: String(approvedAmount),
          outstandingBalance: String(approvedAmount),
          startDate,
          endDate,
          nextDueDate: nextDue,
        });
      }
    }
  }

  const [updated] = await db
    .update(applicationsTable)
    .set(updates as typeof applicationsTable.$inferInsert)
    .where(eq(applicationsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  await logAudit(
    `UPDATE_APPLICATION_${(rest.status ?? "").toUpperCase()}`,
    "application",
    updated.id,
    `Status changed to ${rest.status ?? "unchanged"}`
  );

  if (shouldSms) {
    const msg = `Dear ${updated.fullName}, your Ellen Finance application (${updated.referenceNumber}) status: ${updated.status?.toUpperCase()}. ${rest.status === "approved" ? `Approved: $${approvedAmount}` : ""}`;
    await sendSms(updated.phone, msg);
  }

  res.json(serializeApp(updated));
});

export default router;
