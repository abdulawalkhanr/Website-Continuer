import { pgTable, text, serial, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { casesTable } from "./cases";

export const paymentStatusEnum = pgEnum("payment_status", ["PAID", "PARTIAL", "PENDING"]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id),
  serviceFee: numeric("service_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  advancePaid: numeric("advance_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  pendingAmount: numeric("pending_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
  receiptUrl: text("receipt_url"),
  agreementUrl: text("agreement_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
