import { db, auditLogsTable } from "@workspace/db";

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string | number | null,
  details: string | null,
  performedBy = "admin",
): Promise<void> {
  await db.insert(auditLogsTable).values({
    action,
    entityType,
    entityId: entityId != null ? String(entityId) : null,
    details,
    performedBy,
  });
}
