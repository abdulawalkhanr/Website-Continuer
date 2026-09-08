import { pgTable, text, serial, timestamp, integer, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const caseStatusEnum = pgEnum("case_status", [
  "DOCUMENTS_SUBMITTED",
  "CASE_REVIEW",
  "DOCUMENTATION_VERIFIED",
  "DISPUTE_SUBMITTED",
  "BUREAU_LENDER_REVIEW",
  "FOLLOW_UP",
  "COMPLETED",
]);

export const casesTable = pgTable("cases", {
  id: serial("id").primaryKey(),
  caseNumber: text("case_number").notNull().unique(),
  customerId: integer("customer_id").notNull().references(() => usersTable.id),
  // Linked to the verified quote payment; kept as a scalar to avoid a circular schema dependency.
  quotePaymentId: integer("quote_payment_id"),
  assignedToId: integer("assigned_to_id").references(() => usersTable.id),
  serviceType: text("service_type").notNull(),
  status: caseStatusEnum("status").notNull().default("DOCUMENTS_SUBMITTED"),
  progressPercentage: integer("progress_percentage").notNull().default(10),
  notes: text("notes"),
  expectedCompletionDate: text("expected_completion_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [uniqueIndex("cases_quote_payment_unique").on(table.quotePaymentId)]);

export const insertCaseSchema = createInsertSchema(casesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof casesTable.$inferSelect;
