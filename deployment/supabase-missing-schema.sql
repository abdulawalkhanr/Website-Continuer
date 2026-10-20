-- CIR Consultation Service: safe, create-only Supabase setup.
-- Generated from EVERY exported lib/db/src/schema definition.
-- Existing public.users and its data, password hashes, constraints and sequence
-- are NOT created, altered, updated or reset by this script.
-- Existing incompatible tables/enums are NOT silently rewritten.
-- Run in Supabase > SQL Editor using the postgres role. Safe to run again.
-- Keep the Supabase Data API disabled unless you separately configure RLS.
-- Primary keys / UNIQUE constraints create their indexes automatically.
-- Drizzle $onUpdate is application-side behavior, not a database trigger.

BEGIN;
SET LOCAL search_path = public, pg_catalog;
DO $cir$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'Existing public.users is required. This script deliberately does not create or modify users.';
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'user_role') THEN
    CREATE TYPE "public"."user_role" AS ENUM('OWNER', 'MANAGER', 'EXECUTIVE', 'SUPPORT', 'CUSTOMER', 'STAFF');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'lead_source') THEN
    CREATE TYPE "public"."lead_source" AS ENUM('HOMEPAGE', 'CONTACT', 'CHATBOT', 'REFERRAL', 'GST_PAGE', 'ITR_PAGE', 'MSME_PAGE', 'BIZ_REG_PAGE', 'LEGAL_PAGE');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'lead_stage') THEN
    CREATE TYPE "public"."lead_stage" AS ENUM('NEW', 'CONTACTED', 'SCHEDULED', 'CONVERTED', 'COMPLETED');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'case_status') THEN
    CREATE TYPE "public"."case_status" AS ENUM('DOCUMENTS_SUBMITTED', 'CASE_REVIEW', 'DOCUMENTATION_VERIFIED', 'DISPUTE_SUBMITTED', 'BUREAU_LENDER_REVIEW', 'FOLLOW_UP', 'COMPLETED');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'document_status') THEN
    CREATE TYPE "public"."document_status" AS ENUM('PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'document_type') THEN
    CREATE TYPE "public"."document_type" AS ENUM('PAN', 'AADHAAR', 'CREDIT_REPORT', 'NOC', 'CLOSURE_LETTER', 'OTHER');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'payment_status') THEN
    CREATE TYPE "public"."payment_status" AS ENUM('PAID', 'PARTIAL', 'PENDING');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'referral_status') THEN
    CREATE TYPE "public"."referral_status" AS ENUM('PENDING', 'APPROVED', 'PAID');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'ticket_status') THEN
    CREATE TYPE "public"."ticket_status" AS ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'notification_type') THEN
    CREATE TYPE "public"."notification_type" AS ENUM('CASE_UPDATE', 'DOCUMENT', 'PAYMENT', 'TICKET', 'GENERAL');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'assignment_priority') THEN
    CREATE TYPE "public"."assignment_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'case_comm_type') THEN
    CREATE TYPE "public"."case_comm_type" AS ENUM('CALLED_CUSTOMER', 'WHATSAPP_SENT', 'EMAIL_SENT', 'DOCUMENTS_REQUESTED', 'CUSTOMER_RESPONDED', 'FOLLOW_UP_REQUIRED');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'staff_account_status') THEN
    CREATE TYPE "public"."staff_account_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'staff_employment_status') THEN
    CREATE TYPE "public"."staff_employment_status" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'PROBATION');
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'staff_task_status') THEN
    CREATE TYPE "public"."staff_task_status" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');
  END IF;
END;
$cir$;

CREATE TABLE IF NOT EXISTS "public"."leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mobile" text NOT NULL,
	"email" text,
	"city" text,
	"service_required" text,
	"stage" "lead_stage" DEFAULT 'NEW' NOT NULL,
	"source" "lead_source" DEFAULT 'HOMEPAGE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"customer_id" integer NOT NULL,
	"assigned_to_id" integer,
	"service_type" text NOT NULL,
	"status" "case_status" DEFAULT 'DOCUMENTS_SUBMITTED' NOT NULL,
	"progress_percentage" integer DEFAULT 10 NOT NULL,
	"notes" text,
	"expected_completion_date" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cases_case_number_unique" UNIQUE("case_number")
);

CREATE TABLE IF NOT EXISTS "public"."documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" "document_type" NOT NULL,
	"file_url" text,
	"status" "document_status" DEFAULT 'PENDING' NOT NULL,
	"verified_at" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"service_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"advance_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"pending_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"receipt_url" text,
	"agreement_url" text,
	"payu_txn_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."payu_transactions" (
	"txnid" text PRIMARY KEY NOT NULL,
	"payment_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"credited" boolean DEFAULT false NOT NULL,
	"mihpayid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_name" text NOT NULL,
	"referrer_mobile" text NOT NULL,
	"referrer_email" text,
	"referrer_city" text,
	"referee_name" text NOT NULL,
	"referee_mobile" text NOT NULL,
	"reward_amount" numeric(10, 2) DEFAULT '1000' NOT NULL,
	"status" "referral_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"case_id" integer,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" "ticket_status" DEFAULT 'OPEN' NOT NULL,
	"response" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" "notification_type" DEFAULT 'GENERAL' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."case_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"actor_id" integer,
	"action" text NOT NULL,
	"previous_status" text,
	"new_status" text,
	"previous_progress" integer,
	"new_progress" integer,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."case_comms" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"staff_id" integer NOT NULL,
	"type" "case_comm_type" NOT NULL,
	"note" text,
	"next_follow_up_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."case_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."staff_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"staff_id" integer NOT NULL,
	"priority" "assignment_priority" DEFAULT 'MEDIUM' NOT NULL,
	"due_date" date,
	"created_by_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."staff_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"employee_id" text NOT NULL,
	"profile_photo_url" text,
	"address" text,
	"joining_date" date,
	"designation" text,
	"department" text,
	"staff_role" text,
	"employment_status" "staff_employment_status" DEFAULT 'FULL_TIME' NOT NULL,
	"account_status" "staff_account_status" DEFAULT 'ACTIVE' NOT NULL,
	"permissions" text[] DEFAULT '{}' NOT NULL,
	"emergency_contact_name" text,
	"emergency_contact_mobile" text,
	"allow_mobile_display" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "staff_profiles_employee_id_unique" UNIQUE("employee_id")
);

CREATE TABLE IF NOT EXISTS "public"."staff_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"related_customer_id" integer,
	"related_case_id" integer,
	"assignee_id" integer NOT NULL,
	"created_by_id" integer,
	"priority" "assignment_priority" DEFAULT 'MEDIUM' NOT NULL,
	"due_date" date,
	"status" "staff_task_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."auth_sessions" (
	"sid_hash" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.cases'::regclass AND conname = 'cases_customer_id_users_id_fk') THEN
    ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.cases'::regclass AND conname = 'cases_assigned_to_id_users_id_fk') THEN
    ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.documents'::regclass AND conname = 'documents_case_id_cases_id_fk') THEN
    ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.payments'::regclass AND conname = 'payments_case_id_cases_id_fk') THEN
    ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.payu_transactions'::regclass AND conname = 'payu_transactions_payment_id_payments_id_fk') THEN
    ALTER TABLE "public"."payu_transactions" ADD CONSTRAINT "payu_transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.tickets'::regclass AND conname = 'tickets_customer_id_users_id_fk') THEN
    ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.tickets'::regclass AND conname = 'tickets_case_id_cases_id_fk') THEN
    ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.notifications'::regclass AND conname = 'notifications_user_id_users_id_fk') THEN
    ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.case_activities'::regclass AND conname = 'case_activities_case_id_cases_id_fk') THEN
    ALTER TABLE "public"."case_activities" ADD CONSTRAINT "case_activities_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.case_activities'::regclass AND conname = 'case_activities_actor_id_users_id_fk') THEN
    ALTER TABLE "public"."case_activities" ADD CONSTRAINT "case_activities_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.case_comms'::regclass AND conname = 'case_comms_case_id_cases_id_fk') THEN
    ALTER TABLE "public"."case_comms" ADD CONSTRAINT "case_comms_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.case_comms'::regclass AND conname = 'case_comms_staff_id_users_id_fk') THEN
    ALTER TABLE "public"."case_comms" ADD CONSTRAINT "case_comms_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.case_notes'::regclass AND conname = 'case_notes_case_id_cases_id_fk') THEN
    ALTER TABLE "public"."case_notes" ADD CONSTRAINT "case_notes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.case_notes'::regclass AND conname = 'case_notes_author_id_users_id_fk') THEN
    ALTER TABLE "public"."case_notes" ADD CONSTRAINT "case_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.staff_assignments'::regclass AND conname = 'staff_assignments_case_id_cases_id_fk') THEN
    ALTER TABLE "public"."staff_assignments" ADD CONSTRAINT "staff_assignments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.staff_assignments'::regclass AND conname = 'staff_assignments_staff_id_users_id_fk') THEN
    ALTER TABLE "public"."staff_assignments" ADD CONSTRAINT "staff_assignments_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.staff_assignments'::regclass AND conname = 'staff_assignments_created_by_id_users_id_fk') THEN
    ALTER TABLE "public"."staff_assignments" ADD CONSTRAINT "staff_assignments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.staff_profiles'::regclass AND conname = 'staff_profiles_user_id_users_id_fk') THEN
    ALTER TABLE "public"."staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.staff_tasks'::regclass AND conname = 'staff_tasks_related_customer_id_users_id_fk') THEN
    ALTER TABLE "public"."staff_tasks" ADD CONSTRAINT "staff_tasks_related_customer_id_users_id_fk" FOREIGN KEY ("related_customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.staff_tasks'::regclass AND conname = 'staff_tasks_related_case_id_cases_id_fk') THEN
    ALTER TABLE "public"."staff_tasks" ADD CONSTRAINT "staff_tasks_related_case_id_cases_id_fk" FOREIGN KEY ("related_case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.staff_tasks'::regclass AND conname = 'staff_tasks_assignee_id_users_id_fk') THEN
    ALTER TABLE "public"."staff_tasks" ADD CONSTRAINT "staff_tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.staff_tasks'::regclass AND conname = 'staff_tasks_created_by_id_users_id_fk') THEN
    ALTER TABLE "public"."staff_tasks" ADD CONSTRAINT "staff_tasks_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END;
$cir$;

DO $cir$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.auth_sessions'::regclass AND conname = 'auth_sessions_user_id_users_id_fk') THEN
    ALTER TABLE "public"."auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END;
$cir$;

COMMIT;

-- Read-only compatibility checks, including the untouched users table.
-- Every row should show OK. Report any MISSING result rather than resetting data.
WITH required(table_name, column_name) AS (VALUES
('users', 'id'),
('users', 'email'),
('users', 'password_hash'),
('users', 'name'),
('users', 'mobile'),
('users', 'city'),
('users', 'role'),
('users', 'created_at'),
('users', 'updated_at'),
('leads', 'id'),
('leads', 'name'),
('leads', 'mobile'),
('leads', 'email'),
('leads', 'city'),
('leads', 'service_required'),
('leads', 'stage'),
('leads', 'source'),
('leads', 'created_at'),
('leads', 'updated_at'),
('cases', 'id'),
('cases', 'case_number'),
('cases', 'customer_id'),
('cases', 'assigned_to_id'),
('cases', 'service_type'),
('cases', 'status'),
('cases', 'progress_percentage'),
('cases', 'notes'),
('cases', 'expected_completion_date'),
('cases', 'created_at'),
('cases', 'updated_at'),
('documents', 'id'),
('documents', 'case_id'),
('documents', 'name'),
('documents', 'type'),
('documents', 'file_url'),
('documents', 'status'),
('documents', 'verified_at'),
('documents', 'created_at'),
('payments', 'id'),
('payments', 'case_id'),
('payments', 'service_fee'),
('payments', 'advance_paid'),
('payments', 'pending_amount'),
('payments', 'payment_status'),
('payments', 'receipt_url'),
('payments', 'agreement_url'),
('payments', 'payu_txn_id'),
('payments', 'created_at'),
('payments', 'updated_at'),
('payu_transactions', 'txnid'),
('payu_transactions', 'payment_id'),
('payu_transactions', 'amount'),
('payu_transactions', 'status'),
('payu_transactions', 'credited'),
('payu_transactions', 'mihpayid'),
('payu_transactions', 'created_at'),
('referrals', 'id'),
('referrals', 'referrer_name'),
('referrals', 'referrer_mobile'),
('referrals', 'referrer_email'),
('referrals', 'referrer_city'),
('referrals', 'referee_name'),
('referrals', 'referee_mobile'),
('referrals', 'reward_amount'),
('referrals', 'status'),
('referrals', 'created_at'),
('referrals', 'updated_at'),
('tickets', 'id'),
('tickets', 'customer_id'),
('tickets', 'case_id'),
('tickets', 'subject'),
('tickets', 'description'),
('tickets', 'status'),
('tickets', 'response'),
('tickets', 'created_at'),
('tickets', 'updated_at'),
('notifications', 'id'),
('notifications', 'user_id'),
('notifications', 'title'),
('notifications', 'message'),
('notifications', 'type'),
('notifications', 'is_read'),
('notifications', 'created_at'),
('case_activities', 'id'),
('case_activities', 'case_id'),
('case_activities', 'actor_id'),
('case_activities', 'action'),
('case_activities', 'previous_status'),
('case_activities', 'new_status'),
('case_activities', 'previous_progress'),
('case_activities', 'new_progress'),
('case_activities', 'summary'),
('case_activities', 'created_at'),
('case_comms', 'id'),
('case_comms', 'case_id'),
('case_comms', 'staff_id'),
('case_comms', 'type'),
('case_comms', 'note'),
('case_comms', 'next_follow_up_date'),
('case_comms', 'created_at'),
('case_notes', 'id'),
('case_notes', 'case_id'),
('case_notes', 'author_id'),
('case_notes', 'note'),
('case_notes', 'created_at'),
('staff_assignments', 'id'),
('staff_assignments', 'case_id'),
('staff_assignments', 'staff_id'),
('staff_assignments', 'priority'),
('staff_assignments', 'due_date'),
('staff_assignments', 'created_by_id'),
('staff_assignments', 'is_active'),
('staff_assignments', 'created_at'),
('staff_profiles', 'id'),
('staff_profiles', 'user_id'),
('staff_profiles', 'employee_id'),
('staff_profiles', 'profile_photo_url'),
('staff_profiles', 'address'),
('staff_profiles', 'joining_date'),
('staff_profiles', 'designation'),
('staff_profiles', 'department'),
('staff_profiles', 'staff_role'),
('staff_profiles', 'employment_status'),
('staff_profiles', 'account_status'),
('staff_profiles', 'permissions'),
('staff_profiles', 'emergency_contact_name'),
('staff_profiles', 'emergency_contact_mobile'),
('staff_profiles', 'allow_mobile_display'),
('staff_profiles', 'created_at'),
('staff_profiles', 'updated_at'),
('staff_tasks', 'id'),
('staff_tasks', 'title'),
('staff_tasks', 'description'),
('staff_tasks', 'related_customer_id'),
('staff_tasks', 'related_case_id'),
('staff_tasks', 'assignee_id'),
('staff_tasks', 'created_by_id'),
('staff_tasks', 'priority'),
('staff_tasks', 'due_date'),
('staff_tasks', 'status'),
('staff_tasks', 'created_at'),
('staff_tasks', 'updated_at'),
('auth_sessions', 'sid_hash'),
('auth_sessions', 'user_id'),
('auth_sessions', 'expires_at'),
('auth_sessions', 'created_at')
)
SELECT r.table_name,
  CASE WHEN count(*) FILTER (WHERE c.column_name IS NULL) = 0 THEN 'OK'
    ELSE 'MISSING COLUMNS: ' || string_agg(r.column_name, ', ') FILTER (WHERE c.column_name IS NULL) END AS compatibility
FROM required r
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public' AND c.table_name = r.table_name AND c.column_name = r.column_name
GROUP BY r.table_name ORDER BY r.table_name;

WITH required(enum_name, enum_label) AS (VALUES
('user_role', 'OWNER'),
('user_role', 'MANAGER'),
('user_role', 'EXECUTIVE'),
('user_role', 'SUPPORT'),
('user_role', 'CUSTOMER'),
('user_role', 'STAFF'),
('lead_source', 'HOMEPAGE'),
('lead_source', 'CONTACT'),
('lead_source', 'CHATBOT'),
('lead_source', 'REFERRAL'),
('lead_source', 'GST_PAGE'),
('lead_source', 'ITR_PAGE'),
('lead_source', 'MSME_PAGE'),
('lead_source', 'BIZ_REG_PAGE'),
('lead_source', 'LEGAL_PAGE'),
('lead_stage', 'NEW'),
('lead_stage', 'CONTACTED'),
('lead_stage', 'SCHEDULED'),
('lead_stage', 'CONVERTED'),
('lead_stage', 'COMPLETED'),
('case_status', 'DOCUMENTS_SUBMITTED'),
('case_status', 'CASE_REVIEW'),
('case_status', 'DOCUMENTATION_VERIFIED'),
('case_status', 'DISPUTE_SUBMITTED'),
('case_status', 'BUREAU_LENDER_REVIEW'),
('case_status', 'FOLLOW_UP'),
('case_status', 'COMPLETED'),
('document_status', 'PENDING'),
('document_status', 'UPLOADED'),
('document_status', 'VERIFIED'),
('document_status', 'REJECTED'),
('document_type', 'PAN'),
('document_type', 'AADHAAR'),
('document_type', 'CREDIT_REPORT'),
('document_type', 'NOC'),
('document_type', 'CLOSURE_LETTER'),
('document_type', 'OTHER'),
('payment_status', 'PAID'),
('payment_status', 'PARTIAL'),
('payment_status', 'PENDING'),
('referral_status', 'PENDING'),
('referral_status', 'APPROVED'),
('referral_status', 'PAID'),
('ticket_status', 'OPEN'),
('ticket_status', 'IN_PROGRESS'),
('ticket_status', 'RESOLVED'),
('ticket_status', 'CLOSED'),
('notification_type', 'CASE_UPDATE'),
('notification_type', 'DOCUMENT'),
('notification_type', 'PAYMENT'),
('notification_type', 'TICKET'),
('notification_type', 'GENERAL'),
('assignment_priority', 'LOW'),
('assignment_priority', 'MEDIUM'),
('assignment_priority', 'HIGH'),
('assignment_priority', 'URGENT'),
('case_comm_type', 'CALLED_CUSTOMER'),
('case_comm_type', 'WHATSAPP_SENT'),
('case_comm_type', 'EMAIL_SENT'),
('case_comm_type', 'DOCUMENTS_REQUESTED'),
('case_comm_type', 'CUSTOMER_RESPONDED'),
('case_comm_type', 'FOLLOW_UP_REQUIRED'),
('staff_account_status', 'ACTIVE'),
('staff_account_status', 'INACTIVE'),
('staff_account_status', 'SUSPENDED'),
('staff_account_status', 'ARCHIVED'),
('staff_employment_status', 'FULL_TIME'),
('staff_employment_status', 'PART_TIME'),
('staff_employment_status', 'CONTRACT'),
('staff_employment_status', 'PROBATION'),
('staff_task_status', 'NOT_STARTED'),
('staff_task_status', 'IN_PROGRESS'),
('staff_task_status', 'COMPLETED'),
('staff_task_status', 'ON_HOLD')
)
SELECT r.enum_name,
  CASE WHEN count(*) FILTER (WHERE e.enumlabel IS NULL) = 0 THEN 'OK'
    ELSE 'MISSING VALUES: ' || string_agg(r.enum_label, ', ') FILTER (WHERE e.enumlabel IS NULL) END AS compatibility
FROM required r
LEFT JOIN pg_type t ON t.typname = r.enum_name AND t.typnamespace = 'public'::regnamespace
LEFT JOIN pg_enum e ON e.enumtypid = t.oid AND e.enumlabel = r.enum_label
GROUP BY r.enum_name ORDER BY r.enum_name;
