import { Router, type IRouter } from "express";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import { db, applicationsTable, documentsTable, loansTable } from "@workspace/db";
import {
  SubmitApplicationBody,
  TrackApplicationQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EF-${ts}-${rand}`;
}

router.post("/applications", async (req, res): Promise<void> => {
  const parsed = SubmitApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { monthlyIncome, requestedAmount, approvedAmount, ...rest } = parsed.data as Record<string, unknown>;

  const [app] = await db
    .insert(applicationsTable)
    .values({
      ...(rest as typeof applicationsTable.$inferInsert),
      monthlyIncome: String(monthlyIncome),
      requestedAmount: String(requestedAmount),
      referenceNumber: generateRef(),
    })
    .returning();

  req.log.info({ id: app.id, ref: app.referenceNumber }, "Application submitted");
  res.status(201).json(serializeApp(app));
});

router.get("/applications/track", async (req, res): Promise<void> => {
  const parsed = TrackApplicationQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const apps = await db
    .select()
    .from(applicationsTable)
    .where(ilike(applicationsTable.email, parsed.data.email))
    .orderBy(desc(applicationsTable.createdAt));

  if (apps.length === 0) {
    res.json({ found: false, applications: [] });
    return;
  }

  const appIds = apps.map((a) => a.id);

  const docs = await db
    .select()
    .from(documentsTable)
    .where(sql`${documentsTable.applicationId} = ANY(${sql`ARRAY[${sql.join(appIds.map((id) => sql`${id}`), sql`, `)}]::int[]`})`);

  const loans = await db
    .select()
    .from(loansTable)
    .where(sql`${loansTable.applicationId} = ANY(${sql`ARRAY[${sql.join(appIds.map((id) => sql`${id}`), sql`, `)}]::int[]`})`);

  const loanByAppId = new Map(loans.map((l) => [l.applicationId, l]));
  const docsByAppId = new Map<number, typeof docs>();
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
      fullName: app.fullName,
      status: app.status,
      requestedAmount: Number(app.requestedAmount),
      repaymentMonths: app.repaymentMonths,
      approvedAmount: app.approvedAmount ? Number(app.approvedAmount) : null,
      adminNotes: app.adminNotes,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      documents: appDocs.map((d) => ({
        id: d.id,
        docType: d.docType,
        status: d.status,
        uploadedAt: d.uploadedAt.toISOString(),
      })),
      loanStatus: loan?.status ?? null,
      loanOutstanding: loan ? Number(loan.outstandingBalance) : null,
      loanNextDue: loan?.nextDueDate ? loan.nextDueDate.toISOString() : null,
      loanTotalPaid: loan ? Number(loan.totalPaid) : null,
    };
  });

  res.json({ found: true, applications });
});

function serializeApp(app: typeof applicationsTable.$inferSelect) {
  return {
    id: app.id,
    fullName: app.fullName,
    nationalId: app.nationalId,
    phone: app.phone,
    email: app.email,
    address: app.address,
    employmentType: app.employmentType,
    employer: app.employer,
    monthlyIncome: Number(app.monthlyIncome),
    requestedAmount: Number(app.requestedAmount),
    repaymentMonths: app.repaymentMonths,
    payoutMethod: app.payoutMethod,
    status: app.status,
    referenceNumber: app.referenceNumber,
    adminNotes: app.adminNotes,
    approvedAmount: app.approvedAmount ? Number(app.approvedAmount) : null,
    notes: app.notes,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

export { serializeApp };
export default router;
