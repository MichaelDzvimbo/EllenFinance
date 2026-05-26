import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, documentsTable } from "@workspace/db";
import { requireAdmin } from "../../lib/session";
import { logAudit } from "../../lib/audit";
import {
  GetAdminDocumentsQueryParams,
  UpdateAdminDocumentParams,
  UpdateAdminDocumentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDoc(d: typeof documentsTable.$inferSelect) {
  return {
    id: d.id,
    applicationId: d.applicationId,
    docType: d.docType,
    objectKey: d.objectKey,
    fileName: d.fileName,
    status: d.status,
    uploadedAt: d.uploadedAt.toISOString(),
    reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : null,
  };
}

router.get("/admin/documents", requireAdmin, async (req, res): Promise<void> => {
  const parsed = GetAdminDocumentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, applicationId } = parsed.data;
  const conditions = [];
  if (status) conditions.push(eq(documentsTable.status, status));
  if (applicationId) conditions.push(eq(documentsTable.applicationId, applicationId));

  let query = db.select().from(documentsTable).$dynamic();
  if (conditions.length === 1) {
    query = query.where(conditions[0]);
  } else if (conditions.length > 1) {
    query = query.where(sql`${conditions[0]} AND ${conditions[1]}`);
  }

  const docs = await query.orderBy(sql`uploaded_at DESC`);
  res.json(docs.map(serializeDoc));
});

router.patch("/admin/documents/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateAdminDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAdminDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Filter out null values since Drizzle requires undefined (not null) to skip a column
  const updateFields: Record<string, unknown> = { reviewedAt: new Date() };
  if (parsed.data.status != null) updateFields.status = parsed.data.status;
  if (parsed.data.adminNotes != null) updateFields.adminNotes = parsed.data.adminNotes;

  const [updated] = await db
    .update(documentsTable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set(updateFields as any)
    .where(eq(documentsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  await logAudit("UPDATE_DOCUMENT", "document", updated.id, `Status: ${parsed.data.status}`);

  res.json(serializeDoc(updated));
});

export default router;
