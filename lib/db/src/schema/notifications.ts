import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  channel: varchar("channel", { length: 20 }).notNull().default("sms"),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("sent"),
  recipient: varchar("recipient", { length: 50 }),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export type Notification = typeof notificationsTable.$inferSelect;
