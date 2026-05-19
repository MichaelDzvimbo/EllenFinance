import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { loansTable } from "./loans";

export const penaltiesTable = pgTable("penalties", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull().references(() => loansTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Penalty = typeof penaltiesTable.$inferSelect;
