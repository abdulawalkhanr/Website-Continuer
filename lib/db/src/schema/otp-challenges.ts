import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const otpChallengesTable = pgTable("otp_challenges", {
  id: serial("id").primaryKey(),
  mobile: text("mobile").notNull().unique(),
  otpHash: text("otp_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOtpChallengeSchema = createInsertSchema(otpChallengesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOtpChallenge = z.infer<typeof insertOtpChallengeSchema>;
export type OtpChallenge = typeof otpChallengesTable.$inferSelect;