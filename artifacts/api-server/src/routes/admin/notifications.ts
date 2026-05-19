import { Router, type IRouter } from "express";
import { db, notificationsTable, applicationsTable } from "@workspace/db";
import { requireAdmin } from "../../lib/session";
import { logAudit } from "../../lib/audit";
import { sendSms as smsSend } from "../../lib/sms";
import { SendNotificationBody } from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

function serializeNotif(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    userId: n.userId,
    channel: n.channel,
    message: n.message,
    status: n.status,
    recipient: n.recipient,
    sentAt: n.sentAt.toISOString(),
  };
}

router.get("/admin/notifications", requireAdmin, async (req, res): Promise<void> => {
  const notifs = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.sentAt)).limit(100);
  res.json(notifs.map(serializeNotif));
});

router.post("/admin/notifications", requireAdmin, async (req, res): Promise<void> => {
  const parsed = SendNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, channel, message } = parsed.data;

  let recipient: string | undefined;
  if (userId) {
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, userId));
    if (app) {
      recipient = app.phone;
      await smsSend(app.phone, message);
    }
  }

  const [notif] = await db
    .insert(notificationsTable)
    .values({ userId, channel, message, recipient, status: "sent" })
    .returning();

  await logAudit("SEND_NOTIFICATION", "notification", notif.id, `Channel: ${channel}`);

  res.status(201).json(serializeNotif(notif));
});

export default router;
