import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import { db, usersTable, applicationsTable, documentsTable, loansTable } from "@workspace/db";
import { z } from "zod/v4";
import {
  createUserSession,
  destroyUserSession,
  getUserSession,
  hashPassword,
  verifyPassword,
} from "../../lib/userSession";

const router: IRouter = Router();

interface AuthedRequest extends Request {
  userSession: { userId: number; email: string; fullName: string };
}

const RegisterBody = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  nationalId: z.string().min(5),
  address: z.string().min(5),
  occupation: z.string().min(2),
  password: z.string().min(6),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ApplicationBody = z.object({
  requestedAmount: z.coerce.number().min(100).max(10000),
  repaymentMonths: z.coerce.number().int().min(1).max(24),
  payoutMethod: z.string().min(1),
  employmentType: z.string().min(1),
  employer: z.string().min(1),
  monthlyIncome: z.coerce.number().min(1),
  notes: z.string().optional(),
});

const DocUploadBody = z.object({
  docType: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

const DocRegisterBody = z.object({
  docType: z.string().min(1),
  objectKey: z.string().min(1),
  fileName: z.string().min(1),
});

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    nationalId: user.nationalId,
    address: user.address,
    occupation: user.occupation,
    kycStatus: user.kycStatus,
    createdAt: user.createdAt.toISOString(),
  };
}

function generateRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EF-${ts}-${rand}`;
}

function requireUser(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "") ?? "";
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const session = getUserSession(token);
  if (!session) {
    res.status(401).json({ error: "Invalid or expired session — please log in again" });
    return;
  }
  (req as AuthedRequest).userSession = session;
  next();
}

// ── REGISTER ──────────────────────────────────────────────────────────────
router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const { fullName, email, nationalId, address, occupation, password } = parsed.data;

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const [existingId] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.nationalId, nationalId)).limit(1);
  if (existingId) {
    res.status(409).json({ error: "An account with this National ID already exists" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    fullName, email: email.toLowerCase(), nationalId, address, occupation,
    passwordHash: hashPassword(password),
  }).returning();

  const token = createUserSession(user.id, user.email, user.fullName);
  req.log.info({ userId: user.id }, "User registered");
  res.status(201).json({ token, user: serializeUser(user) });
});

// ── LOGIN ─────────────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase())).limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = createUserSession(user.id, user.email, user.fullName);
  req.log.info({ userId: user.id }, "User logged in");
  res.json({ token, user: serializeUser(user) });
});

// ── LOGOUT ────────────────────────────────────────────────────────────────
router.post("/auth/logout", (req, res): void => {
  const token = req.headers.authorization?.replace("Bearer ", "") ?? "";
  if (token) destroyUserSession(token);
  res.json({ ok: true });
});

// ── ME ────────────────────────────────────────────────────────────────────
router.get("/auth/me", requireUser, async (req, res): Promise<void> => {
  const { userId } = (req as AuthedRequest).userSession;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(serializeUser(user));
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────
router.get("/user/dashboard", requireUser, async (req, res): Promise<void> => {
  const { userId } = (req as AuthedRequest).userSession;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const apps = await db.select().from(applicationsTable)
    .where(eq(applicationsTable.userId, userId))
    .orderBy(desc(applicationsTable.createdAt));

  const appIds = apps.map((a) => a.id);
  let docs: (typeof documentsTable.$inferSelect)[] = [];
  let loans: (typeof loansTable.$inferSelect)[] = [];

  if (appIds.length > 0) {
    [docs, loans] = await Promise.all([
      db.select().from(documentsTable).where(inArray(documentsTable.applicationId, appIds)),
      db.select().from(loansTable).where(inArray(loansTable.applicationId, appIds)),
    ]);
  }

  const loanByAppId = new Map(loans.map((l) => [l.applicationId, l]));
  const docsByAppId = new Map<number, (typeof documentsTable.$inferSelect)[]>();
  for (const d of docs) {
    if (!docsByAppId.has(d.applicationId)) docsByAppId.set(d.applicationId, []);
    docsByAppId.get(d.applicationId)!.push(d);
  }

  const applications = apps.map((app) => {
    const loan = loanByAppId.get(app.id);
    const appDocs = docsByAppId.get(app.id) ?? [];
    return {
      id: app.id,
      referenceNumber: app.referenceNumber,
      status: app.status,
      requestedAmount: Number(app.requestedAmount),
      repaymentMonths: app.repaymentMonths,
      approvedAmount: app.approvedAmount ? Number(app.approvedAmount) : null,
      adminNotes: app.adminNotes ?? null,
      payoutMethod: app.payoutMethod,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      documents: appDocs.map((d) => ({ id: d.id, docType: d.docType, status: d.status, uploadedAt: d.uploadedAt.toISOString() })),
      loanStatus: loan?.status ?? null,
      loanOutstanding: loan ? Number(loan.outstandingBalance) : null,
      loanNextDue: loan?.nextDueDate ? loan.nextDueDate.toISOString() : null,
      loanTotalPaid: loan ? Number(loan.totalPaid) : null,
    };
  });

  res.json({
    user: serializeUser(user),
    applications,
    documents: docs.map((d) => ({ id: d.id, applicationId: d.applicationId, docType: d.docType, status: d.status, uploadedAt: d.uploadedAt.toISOString() })),
    kycStatus: user.kycStatus,
  });
});

// ── SUBMIT LOAN APPLICATION ───────────────────────────────────────────────
router.post("/user/applications", requireUser, async (req, res): Promise<void> => {
  const { userId } = (req as AuthedRequest).userSession;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (user.kycStatus !== "approved") {
    res.status(403).json({ error: "KYC documents must be approved before applying for a loan" });
    return;
  }

  const parsed = ApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const { requestedAmount, repaymentMonths, payoutMethod, employmentType, employer, monthlyIncome, notes } = parsed.data;

  const [app] = await db.insert(applicationsTable).values({
    userId,
    fullName: user.fullName,
    nationalId: user.nationalId,
    phone: "",
    email: user.email,
    address: user.address,
    employmentType,
    employer,
    monthlyIncome: String(monthlyIncome),
    requestedAmount: String(requestedAmount),
    repaymentMonths,
    payoutMethod,
    notes: notes ?? null,
    referenceNumber: generateRef(),
  }).returning();

  req.log.info({ id: app.id, userId }, "User loan application submitted");
  res.status(201).json({
    id: app.id,
    referenceNumber: app.referenceNumber,
    status: app.status,
    requestedAmount: Number(app.requestedAmount),
    repaymentMonths: app.repaymentMonths,
    createdAt: app.createdAt.toISOString(),
  });
});

// ── REQUEST DOCUMENT UPLOAD URL ───────────────────────────────────────────
router.post("/user/documents/upload-url", requireUser, async (req, res): Promise<void> => {
  const { userId } = (req as AuthedRequest).userSession;
  const parsed = DocUploadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const { docType, fileName, contentType } = parsed.data;
  const objectKey = `kyc/user-${userId}/${docType}/${Date.now()}-${fileName}`;

  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  let uploadUrl: string;
  if (bucketId) {
    const { getUploadUrl } = await import("../../lib/storage");
    uploadUrl = await getUploadUrl(objectKey, contentType);
  } else {
    uploadUrl = `/api/stub-upload/${encodeURIComponent(objectKey)}`;
  }

  res.json({ uploadUrl, objectKey });
});

// ── REGISTER UPLOADED DOCUMENT ────────────────────────────────────────────
router.post("/user/documents", requireUser, async (req, res): Promise<void> => {
  const { userId } = (req as AuthedRequest).userSession;
  const parsed = DocRegisterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const { docType, objectKey, fileName } = parsed.data;

  // Find most recent application for this user
  const [latestApp] = await db.select({ id: applicationsTable.id }).from(applicationsTable)
    .where(eq(applicationsTable.userId, userId))
    .orderBy(desc(applicationsTable.createdAt)).limit(1);

  // If no application exists, create a placeholder
  let applicationId: number;
  if (!latestApp) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const [placeholder] = await db.insert(applicationsTable).values({
      userId,
      fullName: user.fullName,
      nationalId: user.nationalId,
      phone: "",
      email: user.email,
      address: user.address,
      employmentType: "pending",
      employer: "Pending",
      monthlyIncome: "0",
      requestedAmount: "0",
      repaymentMonths: 1,
      payoutMethod: "ecocash",
      referenceNumber: generateRef(),
      status: "kyc_only",
    }).returning();
    applicationId = placeholder.id;
  } else {
    applicationId = latestApp.id;
  }

  const [doc] = await db.insert(documentsTable).values({ applicationId, docType, objectKey, fileName }).returning();

  // Advance KYC status
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (user && (user.kycStatus === "not_submitted" || user.kycStatus === "rejected")) {
    await db.update(usersTable).set({ kycStatus: "pending", updatedAt: new Date() })
      .where(eq(usersTable.id, userId));
  }

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
