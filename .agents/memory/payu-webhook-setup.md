---
name: PayU webhook setup
description: Operational requirement for automatic payment confirmation when checkout is closed.
---

PayU's Successful and Failed payment webhook events must be configured separately in the merchant dashboard. Supplying success/failure return URLs when starting checkout does not subscribe those webhook events.

**Why:** A browser return may never reach CIR if the customer closes the tab after paying. A server-to-server notification can still update the payment record.

**How to apply:** When publishing payment changes or changing domains, obtain the current public production URL and guide the merchant to configure the payment notification endpoint. Do not claim that merchant-dashboard subscriptions are configured or live payment settlement has been verified based only on local callback tests.