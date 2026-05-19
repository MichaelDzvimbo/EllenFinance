import { Router, type IRouter } from "express";
import { db, documentsTable } from "@workspace/db";
import {
  RequestDocumentUploadUrlBody,
  CreateDocumentBody,
} from "@workspace/api-zod";
import { getUploadUrl } from "../../lib/storage";

const router: IRouter = Router();

router.post("/documents/upload-url", async (req, res): Promise<void> => {
  const parsed = RequestDocumentUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { applicationId, docType, fileName, contentType } = parsed.data;
  const objectKey = `kyc/${applicationId}/${docType}/${Date.now()}-${fileName}`;

  const uploadUrl = await getUploadUrl(objectKey, contentType);

  res.json({ uploadUrl, objectKey });
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doc] = await db
    .insert(documentsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json({
    id: doc.id,
    applicationId: doc.applicationId,
    docType: doc.docType,
    objectKey: doc.objectKey,
    fileName: doc.fileName,
    status: doc.status,
    uploadedAt: doc.uploadedAt.toISOString(),
  });
});

export default router;
