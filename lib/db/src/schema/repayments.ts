import { pgTable, serial, integer, numeric, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { loansTable } from "./loans";

export const repaymentsTable = pgTable("repayments", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull().references(() => loansTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull().default("ecocash"),
  referenceNumber: varchar("reference_number", { length: 50 }),
  notes: text("notes"),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
});

export type Repayment = typeof repaymentsTable.$inferSelect;
