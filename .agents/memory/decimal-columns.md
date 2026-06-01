---
name: Decimal columns in payments
description: Drizzle decimal columns require string values for INSERT; parse to number before sending in API response.
---

Drizzle ORM maps PostgreSQL `decimal` columns to TypeScript `string`. The payments table has `serviceFee`, `advancePaid`, and `pendingAmount` as decimal columns.

**Rule:**
- INSERT: convert numbers to `String(value)` before passing to Drizzle
- SELECT/Response: `parseFloat(row.serviceFee as string)` before sending to the client
- The OpenAPI spec and frontend types use `number` — the conversion is the backend's responsibility

**Why:** Drizzle's type for decimal is `string | SQL | Placeholder`, not `number`. Passing a `number` directly causes TS2769 overload errors.

**How to apply:** In `payments.ts`, always do `serviceFee: String(serviceFee)` in the insert values object.
