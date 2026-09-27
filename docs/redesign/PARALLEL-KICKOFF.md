# Parallel frontend and backend kickoff

> Historical planning baseline. The frontend redesign has since been implemented; see [Frontend handoff](../FRONTEND-HANDOFF.md) and [Migration record](../MIGRATION-RECORD.md) for current status. Backend implementation is outside this delivery. Legacy source citations below refer to the preserved recovery snapshot, not the new source tree.

This is a handoff package for two implementation streams. The frontend stream is implemented. The owner will implement the separate API; this frontend delivery creates no backend service or remote repository.

## Shared contract first

Use [openapi.json](openapi.json) as the initial client-facing draft and [BACKEND-REQUIREMENTS.md](BACKEND-REQUIREMENTS.md) for business rules. Reconcile any discrepancy before implementation, then tag a contract release. The proposed backend repository owns the contract after bootstrap; the frontend pins an exported version or generated client rather than maintaining an independent copy by hand.

Changes to fields, enum values, authentication, status transitions or errors need both teams' review. Introduce compatible additions before retiring fields. Publish contract fixtures alongside each revision and run producer/consumer checks in CI. Staff/admin endpoints are a required separate increment before launch; the initial client API draft does not cover the complete operational application.

The current legacy API is not the new contract. Map the existing `/api/v1/authenticate`, `/user`, `/registrations`, `/topics`, `/bookings` and `/create-payment-intent` usages explicitly to new `/v1` operations. Replace existing frontend calls or introduce an adapter during migration. Do not point the unchanged app at the new API and assume compatibility.

## Frontend stream

1. **FE-01 — Brand and journeys.** Produce approved wordmark/asset kit, content inventory and bilingual mobile/desktop wireframes for services → schedule → intake → payment → confirmation. Done when the owner approves the public identity and service copy.
2. **FE-02 — Foundation.** Set up new project identity, reproducible tooling, design tokens, routes, language handling and typed API adapter. Done when production build and direct navigation work with contract fixtures.
3. **FE-03 — Session and booking.** Implement registration/verification/recovery, sessions, available slots and persisted booking IDs. Done when form validation, session expiry, slot collision and hold-expiry fixtures render correctly.
4. **FE-04 — Payment and client area.** Implement quote display, provider SDK integration, payment processing/retry, authoritative confirmation and appointment views. Done when refresh/retry does not create a duplicate and a client can resume their booking.
5. **FE-05 — Staff operations and QA.** Implement the agreed minimum lawyer/admin workflows; finish assets, translations, accessibility and redirects. Done when required operational tasks work against staging, not just mocks.

## Backend stream

1. **BE-01 — Architecture and environment.** Select the framework/runtime, define configuration, database migrations, isolated environments, health checks and CI. A single modular API with a relational store and background worker is the initial design proposal; microservices are unnecessary until an actual operating need appears. Done when the empty service deploys with synthetic seed data and no committed secrets.
2. **BE-02 — Identity and catalogue.** Implement session/CSRF flow, email verification/recovery, roles, profile and practice-area catalogue. Done when authorization and account-enumeration/abuse cases have integration coverage.
3. **BE-03 — Lawyer scheduling and bookings.** Implement eligibility, timezone rules, schedule exceptions, transactional holds, ownership, intake and cancellation. Done when overlapping intervals, concurrent requests, retries and daylight-saving cases pass.
4. **BE-04 — Payments and jobs.** Implement server pricing, PaymentIntent lifecycle, signed webhook inbox, idempotency, reconciliation/refunds and notification outbox. Done when duplicate and reordered events cannot double-confirm or enqueue duplicate business notifications; use provider idempotency where available and reconcile uncertain sends. Late payment has an operational resolution path.
5. **BE-05 — Firm administration and release.** Add staff contracts/endpoints, audit records, permission controls, operational exception handling and restore rehearsal. Done when the firm can run the service without database edits for routine tasks.

## Fixtures to create together

Use synthetic people, no real legal matters, and a test clock or relative dates. Fixture prices and schedules are test values only.

- Spanish client viewing an eligible immigration consultation in office time.
- English client viewing the same slot in another IANA timezone.
- No available slots; slot taken by another client; invalid service/duration combination.
- Pending-payment booking with expiry; same idempotency key replay; changed payload with reused key.
- Declined payment, additional authentication required, processing, verified success, duplicate webhook and success after hold expiry.
- Expired session during checkout; unverified email; reset link expired; a valid session without access to another client's booking.
- Appointment cancellation before/after the configured cutoff; refund pending/failure; completed and no-show records.
- Assigned lawyer versus unrelated lawyer; administrator metadata view versus specifically authorized intake access.

## Integration checkpoints

**Checkpoint A:** authentication and services work from the new frontend against a local backend. Until then, frontend development uses the same response fixtures behind its adapter.

**Checkpoint B:** two clients attempt the same lawyer/time. Exactly one reservation succeeds, and the second UI handles a stable conflict error. Availability results alone are never a reservation.

**Checkpoint C:** a complete provider-sandbox booking survives reload and a delayed webhook. Confirmation reads backend state. Notification outbox events have unique business keys; the delivery adapter uses provider idempotency where available and a documented reconciliation policy when a send result is uncertain. Do not promise exactly-once external delivery.

**Checkpoint D:** staff handle a cancellation, refund exception and schedule change; record-level access checks pass; production configuration and backup restoration are rehearsed.

## Decisions and owners

The firm owner supplies the final name, lawyer roster, offered services/jurisdictions, languages, appointment modes, prices/currency, refund policy, required intake and screening rules. Technical leads own runtime/framework choice, contract versioning, provider implementation and deployment setup. Neither team needs final colors or the public name to begin the agreed scheduling/auth contract work.

Do not infer immigration-law jurisdictions, accepted currencies or lawyer authorization from an office address or client location. Do not promise government processing outcomes. Service coverage and commercial rules are explicit firm decisions that affect the catalogue and payment setup.

## Suggested backend implementation brief

> Build a separate backend for an immigration-focused law firm's bilingual consultation-booking product, without city-specific positioning or defaults. Read the backend requirements and draft OpenAPI contract before coding. Start with identity, a service/lawyer catalogue, transactional timezone-aware appointment reservations, minimal protected intake, server-priced payments, verified idempotent webhooks and operational tooling. Configure office/lawyer timezones, service jurisdictions and accepted currencies explicitly. Use synthetic fixtures; no property valuation or automated legal advice. Preserve unresolved firm policies as explicit configuration/decision gates. Deliver a reproducible local setup, migrations, environment example, integration tests and documented staging deployment. Reconcile contract details with the frontend before treating them as stable.
