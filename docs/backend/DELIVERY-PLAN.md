# Backend delivery and acceptance plan

Status: proposed execution plan for the [NestJS/MongoDB design](README.md). No service, migration, provider integration or automated test described here has been implemented by this design package.

## 1. Implementation sequence

### BE-01 — Contract and foundation

Create the separate backend project with API/worker entry points, pinned toolchain and lockfile. Reconcile the [client OpenAPI](../redesign/openapi.json) with [API-PLAN.md](API-PLAN.md), add staff/MFA/notices contracts, publish synthetic fixtures and generate a client. Keep one versioned contract source after bootstrap. Do not silently rewrite the frontend's draft while its remake is in progress.

Implement validated configuration, an injectable clock, redacted request logging, domain error mapping and health checks. Establish MongoDB replica-set startup and explicit migrations for collections, validators, indexes and guards. Disable production automatic index synchronization. A local replica set may be simplified for development; staging must exercise failover and the production transaction configuration.

Exit evidence: a clean checkout starts API, worker and database from instructions; migrations succeed on empty and previous supported schemas; invalid/missing production configuration fails startup; contract references and examples validate; readiness confirms the required schema/index version without exposing secrets.

### BE-02 — Identity and catalogue

Implement session and CSRF flow, registration/verification/recovery, revocation, role grants and staff MFA. Add public catalogue projections and audited staff configuration for services, lawyers, prices, policy documents and eligibility. Support synthetic Spanish/English fixtures with explicit IANA zones and currencies. Do not publish invented firm credentials or customer-facing terms.

Exit evidence: single-use token/reset behavior, action-mail crash recovery, secure session rotation, Origin/CSRF rejection, neutral account-recovery responses and staff permission/step-up tests pass. Disabled/unpublished services cannot be booked. Effective prices and required legal notices have explicit versions.

### BE-03 — Scheduling and reservations

Implement recurring rules, exceptions, bounded offers, guards, occupancy, quotes, idempotency and owned booking reads. Add expiry both on the worker and on transactional access paths. Implement cancellation and safe same-price staff reassignment using the shared lock order. Introduce minimal protected intake and actual acknowledgement records.

Exit evidence: two overlapping reservations have exactly one winner on a real replica set, including different starts/durations and cross-midnight buffers; expiration works with the worker stopped; concurrent duplicate HTTP requests produce one record; timezones/DST and owner/assigned-lawyer permissions pass.

### BE-04 — Money and durable work

Implement durable attempts, stable provider keys, signed inbox, verified transitions, late-payment resolution, refunds and reconciliation. Add outbox delivery, reminders and operational retry commands. Select an explicit payment-method allowlist and test asynchronous methods before enabling them; method-specific delays must respect the late-success policy.

Exit evidence: crash after remote creation but before local persistence does not create another payable intent; duplicate/reordered events cannot double-confirm; success after cancellation/expiry records funds and a resolution task; pending refunds reserve available balance; mail outage does not affect booking/payment truth. Provider-sandbox tests complement real-DB tests.

### BE-05 — Operations and release

Complete lawyer/admin tooling for availability, assignment, completion/no-show, cancellation overrides, payment/refund exceptions, account administration and audit. Add dashboards, restore runbook, rollback process, synthetic staging walkthrough and explicit production configuration checks.

Exit evidence: staff perform routine operations without editing MongoDB manually; user flows pass against staging; load results meet agreed targets; backup restore and provider reconciliation are rehearsed; the firm supplies the unresolved release decisions below. No elapsed calendar estimate is implied by these dependency stages.

## 2. Required test scenarios

Tests here verify business invariants rather than duplicating schema decorators. Use an injectable clock and independent clients/processes for concurrency; mocks cannot establish the guard protocol.

1. **Overlap:** equal starts, different starts, nested intervals, touching boundaries, buffers, cross-midnight and two lawyers. Force transactions to race and retry; inspect bookings plus occupancy after completion.
2. **Configuration races:** service disable/price switch and lawyer eligibility/schedule edit race reservation creation; outcomes follow guard ordering and snapshots. Concurrent rescheduling holds both lawyers and cannot lose the original slot on failure.
3. **Expiry:** hold exactly at its deadline, worker offline, expired offer versus unexpired booking, stale read and expiry/payment/booking contention. Verify retries resample time and released intervals remain released after late success.
4. **Idempotency:** same key/same input, same key/different input, simultaneous keys for one payment, in-progress recovery, response loss after commit, logical retention expiry before TTL cleanup and revoked-session replay.
5. **Transactions:** transient aborts, unknown commit results, replica failover, lease takeover and stale worker acknowledgements. All multi-document writes use the same session and no external side effect occurs in a retried callback.
6. **Timezones:** explicit zones with/without DST, nonexistent starts, both ambiguous occurrences, overnight hours, elapsed duration through a transition and a client's different display zone. No city-derived default.
7. **Payments:** decline, action required, asynchronous processing, valid success, provider timeout, crash at each external/local boundary, retired intent success, pruned provider key ambiguity and unrecognized intent. Assert durable attempt uniqueness.
8. **Webhooks:** invalid signature, wrong environment/account, duplicate event ID, reordered success/failure, wrong amount/currency, inbox database outage and unprocessed event replay. Test actual raw-body verification.
9. **Refunds:** concurrent partial requests, duplicate provider refund events, timeout with funds still reserved, failed refund retry and successful refunds totaling no more than captured funds.
10. **Permissions:** every nested client endpoint rejects another owner; assigned versus unrelated lawyer; admin metadata versus explicit intake permission; changes to grants/assignment invalidate access; staff MFA is enforced server-side. Concurrent removals/disables/factor resets targeting different recovery administrators cannot remove the last eligible administrator.
11. **Privacy/auth:** no tokens/secrets/narratives in logs or generic jobs; token replay, sibling invalidation, action-mail loss/retry, CSRF/origin failures, revoked/expired sessions and bounded brute force across API replicas.
12. **Delivery/restore:** uncertain email result, stale reminder after cancellation, worker outage/restart, backup restoration of idempotency/inbox/outbox state and reconciliation with payments made after the backup point.

Contract tests must check exact `{data}` / `{error}` shapes, integer minor units, Z-suffixed instants, separate payment/refund states, every documented error and examples consumed by the frontend. The acceptance record must distinguish mocked, real-database and provider-sandbox results.

## 3. Configuration contract

Create a backend `.env.example` during implementation with names and synthetic development defaults only. Do not reuse frontend environment files or inspect/copy legacy credentials.

- **Process/HTTP:** `NODE_ENV`, `PORT`, `PUBLIC_FRONTEND_ORIGIN`, `TRUSTED_ORIGINS`, `TRUST_PROXY_HOPS`, request/body size limits, graceful shutdown timeout.
- **Database:** `MONGODB_URI`, `MONGODB_DATABASE`, expected schema version, transaction retry/time budgets and pool limits. Credential values come from a secret manager.
- **Identity:** session cookie/idle/absolute lifetimes, CSRF secret/key versions, verification/reset expiry, password-hash cost, MFA encryption key reference and shared abuse-limit configuration.
- **Scheduling:** slot-offer lifetime, search horizon and maximum range, hold duration, bounded expiry batches, booking policy version. Lead time, buffers, timezone and DST policy are validated domain configuration per service/lawyer.
- **Catalogue:** enabled locales, configured currencies and minor-unit metadata, approved notice versions and active price pointers. No production price, jurisdiction, currency or timezone is inferred from the host location.
- **Payments:** selected provider, expected account/environment, API key reference, webhook secret reference, API version, permitted methods, timeout/reconciliation settings and late-payment policy version.
- **Worker/email:** poll interval, lease duration, retry/backoff limits, backlog thresholds, approved sender/template identifiers and provider credential references. Job payloads contain IDs and minimum metadata.
- **Operations:** audit export destination, retention configuration, backup encryption/key references and telemetry endpoints with redaction.

A 15-minute hold and 24-hour HTTP idempotency replay are development proposals from the requirements, not approved commercial policy. Expiry comparisons use trusted synchronized server time; simulate time in tests rather than modifying the host clock. Production startup rejects missing firm policy configuration instead of silently applying synthetic defaults.

## 4. Observability and deployment

Expose liveness without dependency checks and readiness for DB connectivity, transaction capability and supported schema version. Track worker heartbeat separately so a responding HTTP process does not conceal stopped jobs. Dependency outages should fail readiness only where they prevent the process's required work; no secret values or client data appear in health output.

Record request/trace IDs across API, inbox, attempts and outbox. Measure request latency/error rate, guard retries, booking conflict rate, elapsed-hold backlog, oldest unprocessed event, stale payment attempts, unresolved funds, reserved/pending refunds, oldest outbox job and worker lease failures. Agree alert thresholds with the operational owner; this design invents no uptime, latency or capacity commitment.

Deploy compatible schema/index additions first, then API/worker versions that understand them, then frontend features. Remove old fields only after consumers and jobs have migrated. Drain API requests and worker leases on shutdown. Financial state transitions cannot be undone by an application rollback; old binaries must understand new records or rollout must stop with a recovery plan.

Use managed MongoDB or an equivalently operated replica set with encrypted backups, access control, private network paths and restore testing. Hosting/provider selection is open. Separate environments and credentials. Changes to replica topology or sharding require transaction/index compatibility review; sharding is not an MVP assumption.

Restore MongoDB into isolation, keep provider calls paused, inventory restored attempts/inbox/outbox, reconcile the provider's current state and identify events after the recovery point. Resume jobs only after deduplication and reconciliation checks. Store stable provider identities and sufficient durable history to avoid duplicate charges/refunds after restoration.

## 5. Decision register

The following are release gates; engineering may use clearly synthetic fixtures while they are unresolved.

- **Firm owner — service catalogue:** approved services, practice areas, jurisdictions, lawyer roster/credentials, languages and consultation modes. Required before public catalogue publication.
- **Firm owner — money:** prices, accepted currencies, tax computation/rounding, invoicing and refund/cancellation terms. Proposed v1 chooses one configured checkout currency per service; multi-currency choice needs a reviewed contract increment. Zero-total services remain unpublished until a no-payment confirmation flow is designed.
- **Firm owner — screening/intake:** whether pre-booking conflict review is required, justified mandatory fields, actual terms/privacy content and intake edit cutoff. If screening is required, add its workflow, staff capacity and contract before enabling payment.
- **Firm operations — scheduling:** lead time, hold duration, buffers, booking horizon, DST occurrence policy, schedule editing permissions and no-show grace. Proposed same-price staff rescheduling requires no change to the original commercial commitment.
- **Firm operations — late money:** approve automatic full refund for unfulfillable payments or define a monitored staff resolution procedure and response target. Until approved, record received funds and an exception; do not claim a refund has been initiated.
- **Firm/security owner — identity:** staff enrollment, second-factor method, initial administrator bootstrap, step-up requirements and recovery procedure. Proposed staff auth uses MFA; the exact implementation is specified in the API increment before development.
- **Firm/privacy owner — records:** access scopes, legal intake versus financial retention, export/deletion procedures, backup handling and review of any provider carrying personal data. No jurisdiction-specific period is assumed.
- **Technical/operations owner — providers:** hosting, database region, payment account, mail/video/calendar service, meeting-link access, support escalation and incident ownership.
- **Technical leads — contract:** client-role compatibility, capabilities, notices, payment replay semantics, staff concurrency headers, error codes and ownership of the generated client. Version before frontend/backend integration.
- **Operations owner — reliability:** expected concurrency, service objectives, backup recovery point/time, on-call coverage and measured load/restore acceptance.

Legacy import is a separate optional project after inventory, consent/provenance mapping and rehearsal. Fresh Git history, software rebranding and a new database do not migrate existing customers or financial records automatically.
