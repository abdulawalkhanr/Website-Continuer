# CIR Consultation Service — Hostinger + Supabase

## What was fixed

The admin screen is `artifacts/cir-website/src/pages/AdminLoginPage.tsx`.
It uses the generated `useLogin` client and **POST /api/auth/login**, handled by
`artifacts/api-server/src/routes/auth.ts`. It does NOT use the staff login route.

The API client raises `ApiError` with `status` and parsed JSON in `data`.
The admin screen incorrectly read `response.data` (an Axios-style shape). That
made a real server error, network problem or bad response look like
"Invalid credentials". It now shows the actual safe API message.

Exact text locations:
- "Invalid credentials": customer `LoginPage.tsx`, staff `StaffLoginPage.tsx`,
  staff API `routes/staff.ts`, and credential-response descriptions in
  `lib/api-spec/openapi.yaml`. The admin fallback was removed.
- "Login service temporarily unavailable": `AdminLoginPage.tsx`.
- "Invalid email or password": the admin/customer API `routes/auth.ts`.
- New database/session errors return JSON with HTTP 503, not a password error.

The browser calls `/api/auth/login` on the **same domain as the website**.
There is no production localhost or Replit API base URL. No Supabase frontend
key is required. The root production build now creates `dist/index.mjs` and
`dist/public`; one Express process serves both `/api/*` and the React pages,
including direct visits and refreshes at `/admin/login`.
Same-origin checks also recognize the public host forwarded by Hostinger's
reverse proxy, rather than comparing the browser origin only with an internal
Node hostname.

## 1. Complete Supabase safely

1. Open your Supabase project. Save a database backup before any migration.
2. Open **SQL Editor**, then **New query**.
3. Open `deployment/supabase-missing-schema.sql` from GitHub (Raw view), or from
   the supplied ZIP. Copy the **whole file**, paste it into the editor, click **Run**.
4. The script creates 15 missing non-users tables and 15 enum types if absent.
   It includes all primary keys, unique constraints and foreign keys defined in
   every exported Drizzle schema. Primary/unique indexes are automatic.
5. It does **not** create, alter, reset, delete or update `public.users`, its
   password hashes or its sequence. It does not insert demo/admin accounts.
6. It is safe to run again. It does not silently repair an incompatible
   already-existing table or enum. The final read-only compatibility checks
   should say **OK**. If they report MISSING, keep that result and request an
   additive repair; do not delete/recreate the table. Expected users columns are
   `id, email, password_hash, name, mobile, city, role, created_at, updated_at`.
   These checks report column presence and enum labels, not every possible
   pre-existing column-type or constraint mismatch.
7. The session table is named **auth_sessions**, not `sessions`.
8. This site uses Express with direct Postgres, not Supabase Auth/Data API.
   In **Project settings → Data API**, disable the Data API if nothing else uses
   it. Otherwise have appropriate RLS policies configured before exposing the
   application tables. Do not publish an unprotected `users` table via the
   Supabase REST API. Disabling Data API does not stop this Postgres connection.

Tables covered: `auth_sessions`, `cases`, `leads`, `documents`, `payments`,
`payu_transactions`, `tickets`, `referrals`, `notifications`, `staff_profiles`,
`staff_assignments`, `staff_tasks`, `case_activities`, `case_notes`, `case_comms`.
There are no additional explicit secondary indexes in the current Drizzle
definitions beyond the primary/unique constraints. `$onUpdate` is maintained by
Drizzle when the app updates rows, not by SQL triggers.

## 2. Hostinger environment variables

Open **Hostinger hPanel → Websites → your Node.js website → Environment variables**.
Use the actual private values there, never in GitHub source or this document.

| Name | Needed for | Value / explanation |
|---|---|---|
| `DATABASE_URL` | Required | Supabase Postgres connection string below. Not a MySQL URL or Supabase HTTPS project URL. |
| `SESSION_SECRET` | Required | A random secret of at least 32 characters. Keep unchanged between redeploys to preserve sessions. |
| `NODE_ENV` | Required | `production`. Required even if Hostinger launches the entry file directly rather than `npm start`. |
| `PORT` | Server | Use the value supplied by Hostinger. Do not replace it with the Postgres port (6543). If your hosting setup requires a manual value, use the application port shown by Hostinger. |
| `ADMIN_OWNER_PASSWORD` | Optional owner override | Allows the configured password for an already-existing OWNER account only. Does not create an account. The stored password still works. Remove this override when not needed. |
| `DATABASE_SSL_CA` | Only if certificate verification fails | Supabase CA certificate PEM from the project's database SSL settings. Paste the entire PEM; literal `\\n` line separators are also accepted. Certificate checking is never disabled. |
| `DATABASE_POOL_MAX` | Optional | Application-side connection limit; default `5`, allowed `1` to `20`. Keep small with the transaction pooler. |
| `FAST2SMS_API_KEY` | Customer SMS/OTP | Your Fast2SMS key. Without it production OTP sign-in deliberately fails safely instead of displaying the OTP. Not required for admin email/password login. |
| `PAYU_KEY` | Online payments | Your live PayU merchant key. |
| `PAYU_SALT` | Online payments | Your live PayU merchant salt. |
| `PAYU_CALLBACK_BASE_URL` | Online payments | `https://YOUR-DOMAIN` — the actual live website origin, without a trailing slash. |
| `LOG_LEVEL` | Optional | Default `info`. |

Production does not require `REPL_ID`, `REPLIT_DEV_DOMAIN`, any AI key, object
storage secrets, `APITXT_AUTH_KEY`, or a Supabase API/anon/service-role key in
this version of the application. Existing uploads are database-backed records.
Never put database URLs, passwords, salts or session secrets in `VITE_*` variables.
`BASE_PATH=/` and the Vite build-only port are supplied automatically by the
root build script. No manual Vite URL configuration is needed.

### Exact DATABASE_URL format

```text
postgresql://postgres.PROJECT_REF:URL_ENCODED_DATABASE_PASSWORD@EXACT_POOLER_HOST:6543/postgres?sslmode=verify-full
```

Get the actual host, user and port from **Supabase → Connect → Transaction
pooler**. Replace only the password placeholder with the **database password**,
not your admin website password or Supabase account password. Reserved password
characters must be URL-encoded (for example `@` becomes `%40`). Do not paste the
placeholder words literally and do not surround the URL with quote marks.

This project uses **node-postgres (`pg`)**, not Postgres.js. Its queries do not
use named prepared statements or `.prepare(name)`, so the transaction pooler is
supported without a `prepare: false` option (that is a different driver's
option). SSL is enabled automatically for Supabase and certificates are verified.
The URL SSL flag is normalized so it cannot discard a supplied CA certificate.
Connection/query timeouts prevent a missing database from hanging indefinitely.
For a long-running backend, Supabase also recommends its session pooler on
5432; changing to that mode is optional, not necessary for this fix.

## 3. Redeploy from GitHub (recommended)

1. Open **Hostinger → Websites → your Node.js website → Deployments**.
2. Check the source says **Website-Continuer**, branch **main**.
3. Open **Deployment settings** (or click **Redeploy** to open the settings).
4. Set:
   - Application type/framework: **Express** (not static React/Vite).
   - Root directory: **/** (repository root), not `artifacts/cir-website`.
   - Node.js: **22** (at least 22.12; 24 also satisfies the declared engines).
   - Package manager: **pnpm**, using the version provided in Hostinger's build environment (the reported version was **11.24.0**). The repository intentionally does not pin a conflicting pnpm version.
   - Build script: **build**. If the box asks for a full command, use
     **pnpm run build**.
   - Entry file: **dist/index.mjs** (relative to repository root).
   - Output directory: leave **empty** for Express. If using **Other** rather
     than Express, entry file remains `dist/index.mjs`; output is ignored.
   - Start command, if shown: **pnpm start**.
5. Confirm the environment variables above, then **Save and redeploy**.
6. Wait for **Completed** and the new deployment to be marked **Current**.
7. In **Runtime logs**, expect "Server listening". The build log must say
   "Hostinger build ready: dist/index.mjs serves both /api and the React website."

The root build checks types, builds the React site at `/`, bundles the API, and
copies both into `dist`. No database migration, seeding, password reset or
schema push runs during install/build/start. Do not run the separate
**Create Admin Account** GitHub Action for this migration: you already have an
owner account. It is now create-only and leaves existing accounts unchanged.
The **Initialize Supabase Database** action
is manual and now uses the same create-only SQL instead of `drizzle push`.

Dependency lifecycle approval lives in `pnpm-workspace.yaml`, compatible with
the pinned pnpm 10 and with pnpm 11's allowlist format. The ignored root
`package.json.pnpm` configuration has been removed.

## 4. Alternative: upload the prebuilt ZIP

If using the downloadable production ZIP instead of GitHub, choose
**Deployments → Redeploy → Upload new files** (not Use previous files).
The ZIP has `package.json`, `index.mjs`, logger worker bundles and `public/`
at its root. Choose **Express**, root `/`, Node **22**, package manager **npm**,
build script **build**, entry file **index.mjs**, output directory empty,
and start command **npm start** if shown. The build script only checks the
prebuilt files. There are no pnpm installs, workspace dependencies, esbuild
postinstall steps, credentials, or database/customer data inside this ZIP.
Use the same runtime environment variables as for GitHub deployment.

## 5. Test in a private/incognito browser window

1. Open `https://YOUR-DOMAIN/api/healthz`. You should see JSON saying the API is
   healthy. This checks routing only, not the whole database schema.
2. Open `https://YOUR-DOMAIN/admin/login`. Refresh it once; it must still show
   the login page, not a 404 or a file download.
3. Sign in with the existing OWNER email and the password stored in Supabase,
   or the owner override configured privately in Hostinger.
4. You should reach `/admin`; refresh again to confirm the session persists.
5. Log out; a wrong password should show **Invalid email or password**.
6. A database/setup failure should instead show a service/setup message.
   If login works but the dashboard errors, check the SQL compatibility output:
   the dashboard needs the rest of the tables, not only `users`.
7. Because a password was shared in conversation, change it to a new unique
   password after access is restored. Do not paste the new password into chat.

If it still fails, share only the displayed message, HTTP status, and a redacted
runtime log (no connection URL/password/cookie). Missing tables are PostgreSQL
error `42P01`; missing columns `42703`; bad database credentials `28P01`.
The admin website password and database password are different credentials.

## 6. Payments after migration

Configure the live PayU merchant webhook separately in PayU:
`https://YOUR-DOMAIN/api/payu/callback?webhook=1`. Browser return URLs alone do
not guarantee status updates when the customer closes the tab. Use your actual
domain for `PAYU_CALLBACK_BASE_URL`. A real live payment/callback needs separate
merchant-side verification after deployment.

## Verification boundaries

The supplied schema can be tested against an isolated temporary Postgres
database twice without touching existing users. Local build, login/session and
ownership tests do not prove the Hostinger environment values or live Supabase
state are correct. This workspace has no access to your Hostinger panel or
your Supabase dashboard. Follow the live checks above after redeploying.

Reference: https://docs.hostinger.com/node.js/build-settings
and https://supabase.com/docs/guides/database/connecting-to-postgres
