import { pgTable, serial, text, boolean, integer, timestamp, varchar } from "drizzle-orm/pg-core";

export const loanOfficersTable = pgTable("loan_officers", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  permissions: text("permissions").array().notNull().default([]),
  assignedApplications: integer("assigned_applications").notNull().default(0),
  activityCount: integer("activity_count").notNull().default(0),
  createdBy: varchar("created_by", { length: 50 }).notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export type LoanOfficer = typeof loanOfficersTable.$inferSelect;
export type InsertLoanOfficer = typeof loanOfficersTable.$inferInsert;
