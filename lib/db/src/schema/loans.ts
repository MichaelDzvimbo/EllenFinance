import { pgTable, serial, integer, numeric, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { applicationsTable } from "./applications";

export const loansTable = pgTable("loans", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id).unique(),
  status: varchar("status", { length: 30 }).notNull().default("active"),
  principalAmount: numeric("principal_amount", { precision: 12, scale: 2 }).notNull(),
  outstandingBalance: numeric("outstanding_balance", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull().default("8"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  nextDueDate: timestamp("next_due_date"),
  totalPaid: numeric("total_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Loan = typeof loansTable.$inferSelect;
