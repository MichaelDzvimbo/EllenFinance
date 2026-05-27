import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

/**
 * Dev-only stub upload endpoint.
 *
 * When DEFAULT_OBJECT_STORAGE_BUCKET_ID is not set the user-facing upload
 * flow returns /api/stub-upload/<objectKey> as the PUT target.  The client
 * does a PUT to this URL; without a handler it gets a 404, the error is
 * swallowed, and the file bytes are silently lost.
 *
 * Using router.use for prefix matching avoids path-to-regexp wildcard issues
 * in Express 5.  The handler only responds to PUT requests; all other methods
 * fall through to the next middleware.
 */
router.use("/stub-upload", (req: Request, res: Response, next: NextFunction): void => {
  if (req.method !== "PUT") return next();
  // req.path is everything after /stub-upload (e.g. /kyc/user-1/doc.pdf)
  const objectKey = req.path.replace(/^\//, "");
  logger.warn(
    { objectKey },
    "Stub upload: file bytes discarded — configure DEFAULT_OBJECT_STORAGE_BUCKET_ID for real persistence",
  );
  res.status(200).json({ ok: true, stub: true });
});

export default router;
