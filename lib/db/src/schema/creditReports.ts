import { boolean, date, integer, jsonb, numeric, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const preferredLanguageEnum = pgEnum("preferred_language", ["ENGLISH", "HINDI", "ASSAMESE"]);
export const reportVersionEnum = pgEnum("credit_report_version", ["ORIGINAL", "UPDATED", "RECTIFIED"]);
export const reportProcessingEnum = pgEnum("credit_report_processing", ["UPLOADED", "PROCESSING", "PROCESSED", "NEEDS_MANUAL_REVIEW", "FAILED"]);
export const callbackStatusEnum = pgEnum("callback_status", ["REQUESTED", "CONTACTED", "CLOSED"]);

export const customerOnboardingsTable = pgTable("customer_onboardings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id),
  preferredLanguage: preferredLanguageEnum("preferred_language").notNull().default("ENGLISH"),
  panName: text("pan_name"),
  panEncrypted: text("pan_encrypted"),
  panMasked: text("pan_masked"),
  consentedAt: timestamp("consented_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const callbackRequestsTable = pgTable("callback_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  message: text("message"),
  preferredTime: text("preferred_time"),
  status: callbackStatusEnum("status").notNull().default("REQUESTED"),
  assignedToId: integer("assigned_to_id").references(() => usersTable.id),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const creditReportsTable = pgTable("credit_reports", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => usersTable.id),
  objectPath: text("object_path").notNull(),
  originalFilename: text("original_filename").notNull(),
  contentType: text("content_type").notNull(),
  uploaderId: integer("uploader_id").notNull().references(() => usersTable.id),
  bureau: text("bureau"),
  version: reportVersionEnum("version").notNull().default("ORIGINAL"),
  isCurrent: boolean("is_current").notNull().default(true),
  processingStatus: reportProcessingEnum("processing_status").notNull().default("UPLOADED"),
  manualReviewReason: text("manual_review_reason"),
  score: integer("score"),
  reportDate: date("report_date", { mode: "string" }),
  analysis: jsonb("analysis"),
  accounts: jsonb("accounts"),
  factors: jsonb("factors"),
  flags: jsonb("flags"),
  summaries: jsonb("summaries"),
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  adminReviewNotes: text("admin_review_notes"),
  reviewedById: integer("reviewed_by_id").references(() => usersTable.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const pricingRulesTable = pgTable("pricing_rules", {
  id: serial("id").primaryKey(),
  version: integer("version").notNull(),
  name: text("name").notNull(),
  serviceInfo: text("service_info"),
  baseFee: numeric("base_fee", { precision: 10, scale: 2 }).notNull(),
  issueFees: jsonb("issue_fees").notNull(),
  capFee: numeric("cap_fee", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(false),
  createdById: integer("created_by_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quoteSnapshotsTable = pgTable("quote_snapshots", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => usersTable.id),
  reportId: integer("report_id").references(() => creditReportsTable.id),
  pricingRuleId: integer("pricing_rule_id").notNull().references(() => pricingRulesTable.id),
  items: jsonb("items").notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  // Acceptance freezes this already deterministic snapshot for checkout.
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  acceptedById: integer("accepted_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("quote_snapshot_customer_report_rule_idx").on(table.customerId, table.reportId, table.pricingRuleId)]);

export const insertCustomerOnboardingSchema = createInsertSchema(customerOnboardingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCallbackRequestSchema = createInsertSchema(callbackRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditReportSchema = createInsertSchema(creditReportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type CustomerOnboarding = typeof customerOnboardingsTable.$inferSelect;
export type CallbackRequest = typeof callbackRequestsTable.$inferSelect;
export type CreditReport = typeof creditReportsTable.$inferSelect;
export type PricingRule = typeof pricingRulesTable.$inferSelect;
export type QuoteSnapshot = typeof quoteSnapshotsTable.$inferSelect;