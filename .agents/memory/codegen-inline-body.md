---
name: Codegen inline request body naming collision
description: Inline request body objects in OpenAPI spec cause duplicate name exports in api-zod; always use a named $ref schema.
---

Orval generates both a Zod schema (in `api-zod/generated/api.ts`) and a TypeScript type (in `api-client-react/generated/api.ts`) for each request body. When a request body is defined inline (not as a `$ref` to a named schema), Orval derives the name from the operationId (e.g. `markAllNotificationsRead` → `MarkAllNotificationsReadBody`). If that same name appears in both generated files, the barrel export `export * from "./generated/api"; export * from "./generated/types"` causes a TS2308 ambiguity error.

**Fix:** Always extract inline request body schemas to named components in `openapi.yaml`:
```yaml
requestBody:
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/MarkAllReadInput"  # Named, not inline
```

**Why:** Prevents TS2308 duplicate export errors in `lib/api-zod/src/index.ts`.

**How to apply:** Before adding any new POST endpoint with a request body, define a named schema in `components/schemas` and reference it with `$ref`.
