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

GitHub source-control integration health is not proof that a workspace push is authenticated or has succeeded.

**Why:** The integration reported healthy while native Git rejected the saved authentication; connection-card setup also failed. A local commit remained absent from the remote branch.

**How to apply:** Verify the remote branch after uploading changes. If authentication is blocked, distinguish saved local changes from uploaded code and never imply Hostinger can pull an unpushed fix.

Hostinger Node.js builds can reject a repository that pins a different pnpm version than the builder supplies.

**Why:** The build stopped before running application scripts when Hostinger's pnpm 11.24.0 differed from the repository pin.

**How to apply:** Check the Hostinger build log for its actual pnpm version. Avoid a strict packageManager pin when the builder's version cannot be selected; keep the lockfile/workspace settings compatible with both local and host pnpm.
