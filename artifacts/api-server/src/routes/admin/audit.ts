import { Router, type IRouter } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { requireAdmin } from "../../lib/session";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/admin/audit-logs", requireAdmin, async (req, res): Promise<void> => {
  const logs = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(200);

  res.json(
    logs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId != null ? Number(l.entityId) : null,
      adminUsername: l.performedBy ?? "admin",
      details: l.details ?? null,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});

export default router;
