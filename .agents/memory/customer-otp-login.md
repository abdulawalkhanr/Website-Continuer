---
name: Customer OTP login
description: Security and reliability constraints for customer mobile OTP authentication.
---

Customer OTP login must use a persistent, hashed challenge rather than in-memory state, and it may authenticate only existing `CUSTOMER` accounts. OTP values must never be returned to a client, including after an SMS provider failure.

**Why:** In-memory challenges are lost during restarts and cannot work reliably across multiple server instances. Returning an OTP in an error response defeats the second authentication factor. OTP login is a login mechanism, not an account-registration mechanism.

**How to apply:** Keep the send/verify routes backed by the shared database, expire challenges after a short interval, throttle resends, limit failed attempts, and remove the challenge after successful verification or a send failure.