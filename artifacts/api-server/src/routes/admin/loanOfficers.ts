import { Router, type IRouter } from "express";
import { eq, desc, sql, count } from "drizzle-orm";
import { db, loanOfficersTable, applicationsTable } from "@workspace/db";
import { requireAdmin } from "../../lib/session";
import { logAudit } from "../../lib/audit";
import { hashPassword, verifyPassword } from "../../lib/userSession";
import { z } from "zod/v4";

const router: IRouter = Router();

const MAX_OFFICERS = 20;

const CreateOfficerBody = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9_]+$/, "Username: lowercase letters, numbers, underscores only"),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  permissions: z.array(z.string()).optional().default([]),
});

const UpdateOfficerBody = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

const ResetPasswordBody = z.object({
  newPassword: z.string().min(6),
});

function serializeOfficer(o: typeof loanOfficersTable.$inferSelect) {
  return {
    id: o.id,
    username: o.username,
    fullName: o.fullName,
    email: o.email,
    isActive: o.isActive,
    permissions: o.permissions ?? [],
    assignedApplications: o.assignedApplications,
    activityCount: o.activityCount,
    createdBy: o.createdBy,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    lastLoginAt: o.lastLoginAt ? o.lastLoginAt.toISOString() : null,
  };
}

// GET all loan officers
router.get("/admin/loan-officers", requireAdmin, async (req, res): Promise<void> => {
  const officers = await db.select().from(loanOfficersTable).orderBy(desc(loanOfficersTable.createdAt));
  const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(loanOfficersTable);
  res.json({ items: officers.map(serializeOfficer), total: Number(total) });
});

// POST create loan officer
router.post("/admin/loan-officers", requireAdmin, async (req, res): Promise<void> => {
  const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(loanOfficersTable);
  if (Number(total) >= MAX_OFFICERS) {
    res.status(409).json({ error: `Maximum of ${MAX_OFFICERS} loan officers allowed` });
    return;
  }

  const parsed = CreateOfficerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const { username, fullName, email, password, permissions } = parsed.data;

  const [existingUser] = await db.select({ id: loanOfficersTable.id }).from(loanOfficersTable)
    .where(eq(loanOfficersTable.username, username)).limit(1);
  if (existingUser) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const [existingEmail] = await db.select({ id: loanOfficersTable.id }).from(loanOfficersTable)
    .where(eq(loanOfficersTable.email, email.toLowerCase())).limit(1);
  if (existingEmail) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const [officer] = await db.insert(loanOfficersTable).values({
    username,
    fullName,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    permissions,
    createdBy: "admin",
  }).returning();

  await logAudit("CREATE_LOAN_OFFICER", "loan_officer", officer.id, `Created loan officer: ${username}`);
  res.status(201).json(serializeOfficer(officer));
});

// PATCH update loan officer
router.patch("/admin/loan-officers/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = UpdateOfficerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const updates: Partial<typeof loanOfficersTable.$inferInsert> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.email) updates.email = parsed.data.email.toLowerCase();

  const [updated] = await db.update(loanOfficersTable).set(updates)
    .where(eq(loanOfficersTable.id, id)).returning();

  if (!updated) { res.status(404).json({ error: "Loan officer not found" }); return; }

  await logAudit("UPDATE_LOAN_OFFICER", "loan_officer", id, `Updated officer: ${updated.username}`);
  res.json(serializeOfficer(updated));
});

// DELETE loan officer
router.delete("/admin/loan-officers/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [deleted] = await db.delete(loanOfficersTable).where(eq(loanOfficersTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Loan officer not found" }); return; }

  await logAudit("DELETE_LOAN_OFFICER", "loan_officer", id, `Deleted officer: ${deleted.username}`);
  res.json({ ok: true });
});

// POST reset password
router.post("/admin/loan-officers/:id/reset-password", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [updated] = await db.update(loanOfficersTable)
    .set({ passwordHash: hashPassword(parsed.data.newPassword), updatedAt: new Date() })
    .where(eq(loanOfficersTable.id, id)).returning();

  if (!updated) { res.status(404).json({ error: "Loan officer not found" }); return; }

  await logAudit("RESET_PASSWORD_LOAN_OFFICER", "loan_officer", id, `Password reset for: ${updated.username}`);
  res.json({ ok: true });
});

// POST assign application to officer
router.post("/admin/loan-officers/:id/assign/:applicationId", requireAdmin, async (req, res): Promise<void> => {
  const officerId = parseInt(req.params.id as string, 10);
  const applicationId = parseInt(req.params.applicationId as string, 10);
  if (isNaN(officerId) || isNaN(applicationId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [officer] = await db.select().from(loanOfficersTable).where(eq(loanOfficersTable.id, officerId)).limit(1);
  if (!officer) { res.status(404).json({ error: "Loan officer not found" }); return; }
  if (!officer.isActive) { res.status(400).json({ error: "Cannot assign to inactive officer" }); return; }

  const [updated] = await db.update(applicationsTable)
    .set({ assignedOfficerId: officerId, assignedAt: new Date(), updatedAt: new Date() })
    .where(eq(applicationsTable.id, applicationId)).returning();

  if (!updated) { res.status(404).json({ error: "Application not found" }); return; }

  // Increment officer's assigned count
  await db.update(loanOfficersTable)
    .set({ assignedApplications: officer.assignedApplications + 1, activityCount: officer.activityCount + 1, updatedAt: new Date() })
    .where(eq(loanOfficersTable.id, officerId));

  await logAudit("ASSIGN_APPLICATION", "application", applicationId, `Assigned to officer: ${officer.username}`);
  res.json({ ok: true, applicationId, officerId, officerName: officer.fullName });
});

// POST auto-distribute unassigned applications
router.post("/admin/loan-officers/auto-distribute", requireAdmin, async (req, res): Promise<void> => {
  const activeOfficers = await db.select().from(loanOfficersTable)
    .where(eq(loanOfficersTable.isActive, true));

  if (activeOfficers.length === 0) {
    res.status(400).json({ error: "No active loan officers to assign to" });
    return;
  }

  const unassigned = await db.select({ id: applicationsTable.id }).from(applicationsTable)
    .where(sql`${applicationsTable.assignedOfficerId} IS NULL AND ${applicationsTable.status} != 'kyc_only'`)
    .orderBy(applicationsTable.createdAt);

  if (unassigned.length === 0) {
    res.json({ ok: true, distributed: 0, message: "No unassigned applications" });
    return;
  }

  let distributed = 0;
  for (let i = 0; i < unassigned.length; i++) {
    const officer = activeOfficers[i % activeOfficers.length];
    await db.update(applicationsTable)
      .set({ assignedOfficerId: officer.id, assignedAt: new Date(), updatedAt: new Date() })
      .where(eq(applicationsTable.id, unassigned[i].id));
    distributed++;
  }

  // Refresh counts
  for (const officer of activeOfficers) {
    const [{ cnt }] = await db.select({ cnt: sql<number>`COUNT(*)` }).from(applicationsTable)
      .where(eq(applicationsTable.assignedOfficerId, officer.id));
    await db.update(loanOfficersTable)
      .set({ assignedApplications: Number(cnt), updatedAt: new Date() })
      .where(eq(loanOfficersTable.id, officer.id));
  }

  await logAudit("AUTO_DISTRIBUTE_APPLICATIONS", "system", null, `Distributed ${distributed} applications among ${activeOfficers.length} officers`);
  res.json({ ok: true, distributed, officers: activeOfficers.length });
});

export default router;
