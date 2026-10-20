---
name: Hostinger migration constraints
description: User-managed production hosting and data-preservation requirements during migration.
---

The user hosts production on Hostinger Business Node.js, with Supabase PostgreSQL through its transaction pooler on port 6543. They do not want Replit hosting.

**Why:** The user explicitly chose their own hosting and domain. A working Replit preview does not establish the state of their Hostinger configuration or Supabase database.

**How to apply:** Prepare and verify Hostinger-compatible files and give simple hPanel steps. Do not suggest Replit publishing. State clearly when live Hostinger/Supabase access is unavailable.

Preserve existing customer records and the existing Supabase users table when preparing migration SQL. Do not reset accounts, delete data, or run automatic schema synchronization to fix sign-in.

**Why:** The user explicitly required no data deletion/reset and no changes to the existing users table in the setup script.

**How to apply:** Use create-only setup plus read-only compatibility checks. Report incompatible existing columns/types rather than silently rewriting them.
