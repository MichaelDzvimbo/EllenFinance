import { pgTable, serial, integer, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id),
  docType: varchar("doc_type", { length: 50 }).notNull(),
  objectKey: text("object_key").notNull(),
  fileName: text("file_name").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  reviewNotes: text("review_notes"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true, status: true, uploadedAt: true, reviewedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
