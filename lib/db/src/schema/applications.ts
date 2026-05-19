import { pgTable, serial, text, numeric, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  fullName: text("full_name").notNull(),
  nationalId: varchar("national_id", { length: 50 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().default(""),
  email: text("email").notNull(),
  address: text("address").notNull(),
  employmentType: varchar("employment_type", { length: 50 }).notNull(),
  employer: text("employer").notNull(),
  monthlyIncome: numeric("monthly_income", { precision: 12, scale: 2 }).notNull(),
  requestedAmount: numeric("requested_amount", { precision: 12, scale: 2 }).notNull(),
  repaymentMonths: integer("repayment_months").notNull(),
  payoutMethod: varchar("payout_method", { length: 50 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  referenceNumber: varchar("reference_number", { length: 20 }).notNull().unique(),
  adminNotes: text("admin_notes"),
  approvedAmount: numeric("approved_amount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true, status: true, referenceNumber: true, createdAt: true, updatedAt: true,
});
export const selectApplicationSchema = createSelectSchema(applicationsTable);

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
