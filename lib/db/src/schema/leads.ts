import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadStageEnum = pgEnum("lead_stage", ["NEW", "CONTACTED", "SCHEDULED", "CONVERTED", "COMPLETED"]);
export const leadSourceEnum = pgEnum("lead_source", ["HOMEPAGE", "CONTACT", "CHATBOT", "REFERRAL"]);

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  city: text("city"),
  serviceRequired: text("service_required"),
  stage: leadStageEnum("stage").notNull().default("NEW"),
  source: leadSourceEnum("source").notNull().default("HOMEPAGE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
