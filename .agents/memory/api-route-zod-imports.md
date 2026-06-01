---
name: API route zod imports
description: Backend Express routes must import from @workspace/api-zod, not zod/v4 directly — api-server has no zod dependency.
---

The `artifacts/api-server` package has `@workspace/api-zod` as a dependency but NOT `zod` directly. All Express route files must:

1. Import validation schemas from `@workspace/api-zod` (e.g. `LoginBody`, `CreateCaseBody`, etc.)
2. Never use `import { z } from "zod/v4"` — this will cause `TS2307: Cannot find module 'zod/v4'`
3. Never use `import { z } from "zod"` either — not in the package's dependencies

**Why:** The workspace uses Orval codegen to generate Zod schemas from the OpenAPI spec into `@workspace/api-zod`. Routes should validate against those generated schemas to stay in sync with the contract.

**How to apply:** When writing a new route, import named schemas from `@workspace/api-zod`. If you need a schema that isn't generated (e.g. internal logic), do manual JS validation without Zod, or add the endpoint to openapi.yaml and run codegen.
