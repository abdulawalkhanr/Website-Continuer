import { pgTable, text, serial, timestamp, integer, numeric, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { casesTable } from "./cases";
import { quoteSnapshotsTable } from "./creditReports";

export const paymentStatusEnum = pgEnum("payment_status", ["PAID", "PARTIAL", "PENDING"]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  // Legacy manual payments retain their case. Quote payments only receive a case after verified PayU success.
  caseId: integer("case_id").references(() => casesTable.id),
  quoteSnapshotId: integer("quote_snapshot_id").references(() => quoteSnapshotsTable.id),
  serviceFee: numeric("service_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  advancePaid: numeric("advance_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  pendingAmount: numeric("pending_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
  receiptUrl: text("receipt_url"),
  agreementUrl: text("agreement_url"),
  payuTxnId: text("payu_txn_id"),
  payuPaymentId: text("payu_payment_id"),
  // Exact amount signed for this merchant transaction; never derived from mutable balances on callback.
  payuAmount: numeric("payu_amount", { precision: 10, scale: 2 }),
  payuProductInfo: text("payu_product_info"),
  payuFirstName: text("payu_first_name"),
  payuEmail: text("payu_email"),
  paymentSource: text("payment_source").notNull().default("MANUAL"),
  verificationStatus: text("verification_status").notNull().default("NOT_APPLICABLE"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("payments_quote_snapshot_unique").on(table.quoteSnapshotId),
  uniqueIndex("payments_payu_txn_unique").on(table.payuTxnId),
  uniqueIndex("payments_payu_payment_unique").on(table.payuPaymentId),
]);

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
