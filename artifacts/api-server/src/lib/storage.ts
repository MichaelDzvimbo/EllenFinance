import { logger } from "./logger";

export async function getUploadUrl(objectKey: string, _contentType: string): Promise<string> {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    logger.warn("Object storage not configured — returning placeholder upload URL");
    return `https://storage.example.com/upload/${objectKey}`;
  }

  try {
    const { getSignedUploadUrl } = await import("@replit/object-storage");
    const url = await getSignedUploadUrl(objectKey, { bucketId });
    return url;
  } catch (err) {
    logger.error({ err, objectKey }, "Failed to generate signed upload URL");
    throw new Error("Could not generate upload URL");
  }
}
