import { pgTable, text, serial, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const referralStatusEnum = pgEnum("referral_status", ["PENDING", "APPROVED", "PAID"]);

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerName: text("referrer_name").notNull(),
  referrerMobile: text("referrer_mobile").notNull(),
  referrerEmail: text("referrer_email"),
  referrerCity: text("referrer_city"),
  refereeName: text("referee_name").notNull(),
  refereeMobile: text("referee_mobile").notNull(),
  rewardAmount: numeric("reward_amount", { precision: 10, scale: 2 }).notNull().default("1000"),
  status: referralStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReferralSchema = createInsertSchema(referralsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referralsTable.$inferSelect;
