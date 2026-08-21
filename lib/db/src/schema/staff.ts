import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { casesTable } from "./cases";

// ─── Enums ─────────────────────────────────────────────────────────────────

export const staffAccountStatusEnum = pgEnum("staff_account_status", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "ARCHIVED",
]);

export const staffEmploymentStatusEnum = pgEnum("staff_employment_status", [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "PROBATION",
]);

export const assignmentPriorityEnum = pgEnum("assignment_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const staffTaskStatusEnum = pgEnum("staff_task_status", [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
]);

export const caseCommTypeEnum = pgEnum("case_comm_type", [
  "CALLED_CUSTOMER",
  "WHATSAPP_SENT",
  "EMAIL_SENT",
  "DOCUMENTS_REQUESTED",
  "CUSTOMER_RESPONDED",
  "FOLLOW_UP_REQUIRED",
]);

// ─── Staff Profile ─────────────────────────────────────────────────────────

export const staffProfilesTable = pgTable("staff_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id),
  employeeId: text("employee_id").notNull().unique(),
  profilePhotoUrl: text("profile_photo_url"),
  address: text("address"),
  joiningDate: date("joining_date", { mode: "string" }),
  designation: text("designation"),
  department: text("department"),
  staffRole: text("staff_role"), // e.g. "Case Handler", "Document Verifier"
  employmentStatus: staffEmploymentStatusEnum("employment_status").notNull().default("FULL_TIME"),
  accountStatus: staffAccountStatusEnum("account_status").notNull().default("ACTIVE"),
  permissions: text("permissions").array().notNull().default([]),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactMobile: text("emergency_contact_mobile"),
  allowMobileDisplay: boolean("allow_mobile_display").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStaffProfileSchema = createInsertSchema(staffProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStaffProfile = z.infer<typeof insertStaffProfileSchema>;
export type StaffProfile = typeof staffProfilesTable.$inferSelect;

// ─── Staff Case Assignments ────────────────────────────────────────────────

export const staffAssignmentsTable = pgTable("staff_assignments", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => casesTable.id),
  staffId: integer("staff_id")
    .notNull()
    .references(() => usersTable.id),
  priority: assignmentPriorityEnum("priority").notNull().default("MEDIUM"),
  dueDate: date("due_date", { mode: "string" }),
  createdById: integer("created_by_id").references(() => usersTable.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStaffAssignmentSchema = createInsertSchema(staffAssignmentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertStaffAssignment = z.infer<typeof insertStaffAssignmentSchema>;
export type StaffAssignment = typeof staffAssignmentsTable.$inferSelect;

// ─── Staff Tasks ───────────────────────────────────────────────────────────

export const staffTasksTable = pgTable("staff_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  relatedCustomerId: integer("related_customer_id").references(() => usersTable.id),
  relatedCaseId: integer("related_case_id").references(() => casesTable.id),
  assigneeId: integer("assignee_id")
    .notNull()
    .references(() => usersTable.id),
  createdById: integer("created_by_id").references(() => usersTable.id),
  priority: assignmentPriorityEnum("priority").notNull().default("MEDIUM"),
  dueDate: date("due_date", { mode: "string" }),
  status: staffTaskStatusEnum("status").notNull().default("NOT_STARTED"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStaffTaskSchema = createInsertSchema(staffTasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStaffTask = z.infer<typeof insertStaffTaskSchema>;
export type StaffTask = typeof staffTasksTable.$inferSelect;

// ─── Case Activity Log ─────────────────────────────────────────────────────

export const caseActivitiesTable = pgTable("case_activities", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => casesTable.id),
  actorId: integer("actor_id").references(() => usersTable.id),
  action: text("action").notNull(),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  previousProgress: integer("previous_progress"),
  newProgress: integer("new_progress"),
  summary: text("summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCaseActivitySchema = createInsertSchema(caseActivitiesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCaseActivity = z.infer<typeof insertCaseActivitySchema>;
export type CaseActivity = typeof caseActivitiesTable.$inferSelect;

// ─── Internal Case Notes ───────────────────────────────────────────────────

export const caseNotesTable = pgTable("case_notes", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => casesTable.id),
  authorId: integer("author_id")
    .notNull()
    .references(() => usersTable.id),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCaseNoteSchema = createInsertSchema(caseNotesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCaseNote = z.infer<typeof insertCaseNoteSchema>;
export type CaseNote = typeof caseNotesTable.$inferSelect;

// ─── Customer Communication Logs ───────────────────────────────────────────

export const caseCommsTable = pgTable("case_comms", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => casesTable.id),
  staffId: integer("staff_id")
    .notNull()
    .references(() => usersTable.id),
  type: caseCommTypeEnum("type").notNull(),
  note: text("note"),
  nextFollowUpDate: date("next_follow_up_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCaseCommSchema = createInsertSchema(caseCommsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCaseComm = z.infer<typeof insertCaseCommSchema>;
export type CaseComm = typeof caseCommsTable.$inferSelect;
