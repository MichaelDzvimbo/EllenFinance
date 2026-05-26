import { Router, type IRouter } from "express";
import { db, notificationsTable, applicationsTable } from "@workspace/db";
import { requireAdmin } from "../../lib/session";
import { logAudit } from "../../lib/audit";
import { sendSms as smsSend } from "../../lib/sms";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";

const router: IRouter = Router();

const NotificationBody = z.object({
  recipientPhone: z.string().min(1),
  recipientEmail: z.string().email().nullable().optional(),
  message: z.string().min(1),
  type: z.string().min(1),
  applicationId: z.number().int().nullable().optional(),
  loanId: z.number().int().nullable().optional(),
  // Legacy fields from old API — tolerate them silently
  userId: z.number().int().nullable().optional(),
  channel: z.string().nullable().optional(),
});

function serializeNotif(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    recipientPhone: n.recipient ?? "",
    recipientEmail: null,
    message: n.message,
    type: n.channel ?? "sms",
    status: n.status,
    applicationId: n.userId ?? null,
    loanId: null,
    createdAt: n.sentAt.toISOString(),
  };
}

router.get("/admin/notifications", requireAdmin, async (req, res): Promise<void> => {
  const notifs = await db
    .select()
    .from(notificationsTable)
    .orderBy(desc(notificationsTable.sentAt))
    .limit(100);
  res.json(notifs.map(serializeNotif));
});

router.post("/admin/notifications", requireAdmin, async (req, res): Promise<void> => {
  const parsed = NotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { recipientPhone, message, type, applicationId } = parsed.data;

  // Send SMS via stub
  await smsSend(recipientPhone, message);

  // Look up application if provided
  let userId: number | undefined;
  if (applicationId) {
    const [app] = await db.select({ id: applicationsTable.id }).from(applicationsTable)
      .where(eq(applicationsTable.id, applicationId));
    if (app) userId = app.id;
  }

  const [notif] = await db
    .insert(notificationsTable)
    .values({
      userId,
      channel: type,
      message,
      recipient: recipientPhone,
      status: "sent",
    })
    .returning();

  await logAudit("SEND_NOTIFICATION", "notification", notif.id, `${type} to ${recipientPhone.slice(0, 6)}****`);

  res.status(201).json(serializeNotif(notif));
});

export default router;
