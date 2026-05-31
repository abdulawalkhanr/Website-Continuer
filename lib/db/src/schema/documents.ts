import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { casesTable } from "./cases";

export const documentTypeEnum = pgEnum("document_type", ["PAN", "AADHAAR", "CREDIT_REPORT", "NOC", "CLOSURE_LETTER", "OTHER"]);
export const documentStatusEnum = pgEnum("document_status", ["PENDING", "UPLOADED", "VERIFIED", "REJECTED"]);

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id),
  name: text("name").notNull(),
  type: documentTypeEnum("type").notNull(),
  fileUrl: text("file_url"),
  status: documentStatusEnum("status").notNull().default("PENDING"),
  verifiedAt: text("verified_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, createdAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
