import { pgTable, text, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { paymentsTable } from "./payments";

// Keep every checkout attempt, including attempts superseded by a retry.
export const payuTransactionsTable = pgTable("payu_transactions", {
  txnid: text("txnid").primaryKey(),
  paymentId: integer("payment_id").notNull().references(() => paymentsTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  credited: boolean("credited").notNull().default(false),
  mihpayid: text("mihpayid"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPayuTransactionSchema = createInsertSchema(payuTransactionsTable).omit({ createdAt: true });
export type InsertPayuTransaction = z.infer<typeof insertPayuTransactionSchema>;
export type PayuTransaction = typeof payuTransactionsTable.$inferSelect;