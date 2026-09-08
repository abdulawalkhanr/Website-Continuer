---
name: App Storage URL signing
description: Replit-specific constraint for generating private App Storage upload URLs.
---

Generate private App Storage signed URLs through the Replit sidecar endpoint, not `File.getSignedUrl()`.

**Why:** App Storage authenticates GCS data access with external-account credentials. Those credentials can read and write objects but do not include the `client_email` needed for Google service-account URL signing.

**How to apply:** POST the bucket, object name, method, and expiry to the local `/object-storage/signed-object-url` sidecar endpoint. Keep ownership, size, MIME, and magic-byte checks in application finalization.