# CIR Consultation Service

A premium fintech-grade website and customer management platform for credit report rectification and CIBIL dispute assistance. Tagline: "Your Partner in Financial Health."

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/cir-website run dev` — run the React frontend (Vite, port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed the DB with demo data
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — express session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Recharts
- API: Express 5 (port 8080, base path /api)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle)
- Auth: in-memory session Map, cookie `session_id`, password hash = sha256(password + "cir_salt_2026")

## Where things live

- `lib/db/src/schema/` — DB schema (users, leads, cases, documents, payments, referrals, tickets)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — generated React Query hooks + types (do not edit)
- `artifacts/api-server/src/routes/` — all 9 Express route files (auth, leads, customers, cases, documents, payments, referrals, tickets, admin)
- `artifacts/cir-website/src/pages/` — all public pages, dashboard pages, and admin pages
- `artifacts/cir-website/src/components/` — Layout, AdminLayout, DashboardLayout, AIChatbot, FloatingButtons, CreditScoreGauge, shadcn/ui
- `artifacts/cir-website/src/index.css` — cotton candy theme CSS variables
- `scripts/src/seed.ts` — DB seed script

## Architecture decisions

- **Contract-first API**: OpenAPI spec defines the contract; Orval generates all React Query hooks and Zod schemas. Never hand-write API types on the frontend.
- **In-memory session store**: Sessions stored in a `Map<string, Session>` keyed by UUID cookie. No external Redis needed for MVP; replace with `connect-pg-simple` before production scale.
- **Role-based routing**: Three distinct auth tiers — public (no auth), CUSTOMER (dashboard), and OWNER/MANAGER/EXECUTIVE (admin). Protected by `requireAuth`/`requireAdmin` middleware.
- **Decimal fields as strings in DB, numbers in API**: Drizzle `decimal` columns return strings; API routes parse them to `number` before sending. Frontend always receives `number` from API.
- **Cotton candy theme**: CSS custom properties in `index.css` drive the entire palette (#A7D8FF primary, #FFD6E8 secondary, #DCC6FF accent). Use `btn-gradient`, `glass-card`, `stat-card`, `gradient-text` utility classes.

## Product

- **Public website**: HomePage with animated credit score gauge, Services, Process (7-step workflow), Pricing (3 tiers), Success Stories, FAQ, Blog, Contact, Track Case (by case number)
- **Customer portal**: Dashboard with case progress tracker, documents upload, payment status, support tickets, notifications
- **Admin panel**: Full CRM — leads management (pipeline), customers, cases (status updates), payments, referrals (approve/pay), tickets (respond), analytics dashboard with Recharts

## Seed credentials

| Role | Email | Password |
|------|-------|----------|
| Admin (OWNER) | admin@circonsultationservice.site | Admin@2026 |
| Manager | manager@circonsultationservice.site | Manager@2026 |
| Executive | exec@circonsultationservice.site | Exec@2026 |
| Test Customer | customer@example.com | Customer@2026 |

## Contact info embedded in UI

- Phone: 01169310902
- WhatsApp: +91 9864920810

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`, then restart the API workflow.
- DB decimal columns (serviceFee, advancePaid, pendingAmount, rewardAmount) return strings from Drizzle — routes parse them to `number` before API response.
- Session cookie `session_id` is HttpOnly. The in-memory store is per-process; a restart clears all sessions (acceptable for dev).
- `pnpm --filter @workspace/cir-website run typecheck` (not `build`) for frontend type verification — `build` requires workflow-provided env vars.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
