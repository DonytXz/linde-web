# Backend API design and contract increment

Status: proposed design, 2026-09-26. Nothing in this file asserts that these endpoints are implemented. The user's selected implementation stack is NestJS and MongoDB. Read the [architecture](README.md), [MongoDB model](MONGODB-MODEL.md), [delivery plan](DELIVERY-PLAN.md), [requirements](../redesign/BACKEND-REQUIREMENTS.md) and [existing client OpenAPI](../redesign/openapi.json) together.

The existing OpenAPI `0.1.0-draft` is the client compatibility baseline. This document proposes a separate reviewed increment for operations and resolves implementation choices that the client contract leaves open. Do not silently regenerate the current frontend contract from NestJS decorators or change it while frontend work continues.

## 1. Compatibility boundary

| Concern | Existing contract to preserve |
| --- | --- |
| Addressing | `/v1`; camelCase JSON; opaque string IDs of 1–128 characters. DTOs map database IDs explicitly and never expose MongoDB documents directly. |
| Successful object | `{ "data": value }`; an unsubmitted intake is `{ "data": null }`. |
| Paginated list | `{ "data": [], "pagination": { "nextCursor": null } }`; nextCursor is an opaque string or null. |
| Error | `{ "error": { "code": "...", "message": "...", "requestId": "...", "fieldErrors": [{ "field": "...", "code": "...", "message": "..." }] } }`; fieldErrors is optional. |
| Validation | Reject unknown write fields and server-owned assignment. Do not let NestJS's default exception body replace the error wrapper. |
| Identity | Opaque cookie named `session`; Secure, HttpOnly, Path=/, no Domain, SameSite=Lax for the proposed same-site deployment. No local-storage bearer token. |
| Browser writes | Session-bound `X-CSRF-Token` plus trusted Origin validation, including public authentication writes. Signed Stripe webhook is separately verified. |
| Time | RFC 3339 UTC strings ending in Z, IANA zones, date-only strings where appropriate. Availability `from` is inclusive and `to` exclusive. |
| Money | Nonnegative integer minor units, lowercase configured/provider-supported ISO currency; never floating-point major amounts. |
| Cache | `Cache-Control: no-store` for sessions, profile, booking, intake, payment and staff data. |
| Pagination | Limit 1–100, default 20. Ownership/scope filters apply before pagination; stable sort includes an ID tie-breaker. |

NestJS controllers remain thin: validate DTO, derive authenticated actor, invoke application operation, map explicit response DTO. Guards enforce session, CSRF, verified-email and permission requirements; each application operation still enforces object scope inside its transaction. A shared exception filter maps domain errors to the exact wrapper. Sensitive fields never enter general request/response logging.

The current `src/api/http.ts` sets `credentials: 'include'`, uses `cache: 'no-store'`, bootstraps CSRF before mutations and expects the environment API base to include `/v1`. Successful login provides the rotated token through `Session.csrfToken`. Preserve these behaviors. A 403 does not invalidate an otherwise valid session. Logout remains repeatable without an authenticated session, but requires a valid anonymous or authenticated CSRF context.

## 2. Existing operations

| Method and route | Required behavior |
| --- | --- |
| `GET /v1/csrf` | Public anonymous/session bootstrap; return `{data:{csrfToken,expiresAt}}`. |
| `POST /v1/auth/register` | Validate RegisterRequest; queue verification; generic 202 acknowledgement for both eligible new and existing identities; no auto-login. |
| `POST /v1/auth/verify-email` | Consume hashed single-use token; 200 acknowledgement; no auto-login. |
| `POST /v1/auth/resend-verification` | Generic 202 acknowledgement; account/IP throttling. |
| `POST /v1/auth/login` | Return `{data:Session}` with user, csrfToken, expiresAt; rotate session. Unverified accounts can log in and view profile. |
| `POST /v1/auth/logout` | Revoke session and clear cookie; 200 acknowledgement even when already logged out. |
| `POST /v1/auth/forgot-password` | Generic 202 acknowledgement with queued delivery where eligible. |
| `POST /v1/auth/reset-password` | Consume token once, change password, revoke sessions; 200 acknowledgement; login required afterwards. |
| `GET/PATCH /v1/me` | Own profile. Patch permits names, optional E.164 phone, preferredLanguage, timeZone; null removes phone. No email or role changes. |
| `GET /v1/topics` | Cursor-paginated published services, with Spanish/English names and descriptions. |
| `GET /v1/topics/{topicId}` | Published service or non-disclosing 404. |
| `GET /v1/lawyers/{lawyerId}` | Approved public LawyerSummary only. |
| `GET /v1/availability` | Required topicId, durationMinutes, language, consultationMode, from, to, timeZone; bounded search; advisory offers. |
| `POST /v1/bookings` | Verified owner; required Idempotency-Key; input only slotId, topicId, durationMinutes, timeZone, language, consultationMode; 201 Booking. |
| `GET /v1/bookings` | Owned, ordered, cursor-paginated Bookings; optional status filter in OpenAPI. |
| `GET /v1/bookings/{bookingId}` | Owned authoritative Booking; another client's resource returns 404. |
| `GET /v1/bookings/{bookingId}/intake` | Owner only; SavedIntake or null; 404 for missing/inaccessible booking. |
| `PUT /v1/bookings/{bookingId}/intake` | Owner only; allowed state/cutoff; replace minimal payload; return IntakeReceipt with bookingVersion. |
| `POST /v1/bookings/{bookingId}/payment-intents` | Verified owner; required Idempotency-Key; input `{bookingVersion}`; return PaymentIntent; server quote and active hold are mandatory. |
| `POST /v1/bookings/{bookingId}/cancel` | Owner under policy; required Idempotency-Key; optional reason up to 500 characters; return Booking. |
| `POST /v1/webhooks/stripe` | Raw-body signature verification and durable event inbox, described below; no cookie/CSRF requirement. |

Acknowledgements are exactly `{data:{accepted:true}}`. Other response properties must be copied from the actual shared schemas when implementing. No user directory is implied by `/me`, and no staff-wide search is implied by `/bookings`.

## 3. Validation, state and idempotency

Keep the existing public enums exactly:

- Booking: `pendingPayment`, `confirmed`, `completed`, `noShow`, `cancelled`, `expired`.
- Payment: `unpaid`, `requiresAction`, `processing`, `succeeded`, `failed`, `cancelled`.
- Refund: `none`, `pending`, `partial`, `refunded`, `failed`.
- Language: `es`, `en`; consultation mode: `inPerson`, `video`, `phone`.

`Booking.resolutionRequired` reports a money/reservation mismatch requiring resolution; it does not imply confirmation. Retain successful payment status after cancellation or a refund. Use the provider's current object to resolve reordered events; a stale failure must not overwrite verified success. Terminal bookings are never revived by webhook delivery.

Selected MVP offer design: generate a cryptographically random 32-byte opaque token, encode it as unpadded base64url (43 characters), and return it as `Slot.id`. Persist its binding in `slotOffers`: lawyer, service, start/end, duration, language, mode, offer expiry and relevant configuration versions. Lookup by the token's hash; no self-contained signed payload must fit into the existing 128-character ID limit. Recheck current eligibility, schedule and price when reserving. Offer `expiresAt`, booking `holdExpiresAt` and quote `expiresAt` have distinct meanings. Return conflicts through stable codes; no client amount, owner or status is accepted.

Idempotency keys are 8–128 characters. Scope uniqueness to actor + operation + target resource + key and hash the validated canonical payload. Authenticate and recheck current access before returning a stored response. A matching completed request with a nonsecret response replays its original HTTP status and body; changed input returns `409 IDEMPOTENCY_CONFLICT`. An active execution returns `409 IDEMPOTENCY_IN_PROGRESS` plus `Retry-After`. Do not store arbitrary transient validation/dependency failures as permanent successes. Crash recovery resumes durable financial attempts using their independent provider idempotency identity.

Proposed retention is a configurable 24-hour replay window for completed idempotency records only, published in the contract increment. After that window, atomically replace a completed record under its unique key when reuse is permitted; do not depend on asynchronous TTL deletion. Running, unknown-outcome or otherwise unresolved operations have no expiry/purge time that permits a new execution. Recover or reconcile the original durable operation before treating it as completed. Permanent booking/payment/refund uniqueness continues beyond HTTP replay retention.

Never persist provider client secrets, including in idempotency responses. For payment creation, persist a safe replay descriptor referencing the same booking, quote and provider intent. On replay, reauthorize the owner, retrieve that same provider object, and revalidate the live hold and effective payable attempt under the shared guard protocol before returning SDK fields. Preserve the original nonsecret fields when a compatible secret-bearing response can safely be reconstructed; do not create a replacement intent as a replay side effect. If the hold has expired, return `409 HOLD_EXPIRED`; if the intent is retired or the booking/attempt is no longer payable, return `409 INVALID_STATE` and instruct the client to reload authoritative Booking state. Confirmed/succeeded state needs no payable secret. This is an explicit exception to byte-identical secret-bearing replay and to the draft's unconditional original-result wording; publish it in the reviewed contract increment and test active, retired, expired and unauthorized replay paths before implementation release.

Client booking/payment/cancellation operations retain their current concurrency input. All new staff aggregate edits require a positive integer `expectedVersion` in the body; reject stale writes with `409 VERSION_CONFLICT`. New creates have no expectedVersion. No hidden last-write-wins staff edit is permitted. Read DTOs expose version >= 1; successful changes increment it atomically. Policy/version changes that affect an operation must be checked in the same serialized operation as eligibility and reservation changes.

| HTTP status | Representative stable codes |
| --- | --- |
| 400 | `MALFORMED_REQUEST`, `INVALID_CURSOR`, `INVALID_WEBHOOK_SIGNATURE` |
| 401 | `AUTHENTICATION_REQUIRED`, `INVALID_CREDENTIALS` |
| 403 | `CSRF_INVALID`, `ORIGIN_NOT_ALLOWED`, `EMAIL_NOT_VERIFIED`, `PERMISSION_DENIED`, `MFA_REQUIRED`, `MFA_ENROLLMENT_REQUIRED` |
| 404 | `RESOURCE_NOT_FOUND` for nonexistent or inaccessible client records |
| 409 | `SLOT_UNAVAILABLE`, `HOLD_EXPIRED`, `BOOKING_VERSION_CONFLICT`, `VERSION_CONFLICT`, `INVALID_STATE`, `IDEMPOTENCY_CONFLICT`, `IDEMPOTENCY_IN_PROGRESS`, `REFUND_LIMIT_EXCEEDED` |
| 422 | `VALIDATION_FAILED`, `POLICY_VERSION_UNAVAILABLE`, `REQUIRED_ACKNOWLEDGEMENT_MISSING`, `UNSUPPORTED_PRICE_CONFIGURATION` |
| 429 | `RATE_LIMITED`, with Retry-After |
| 503 | `DEPENDENCY_UNAVAILABLE`; retryable failures must not pretend a provider operation definitively failed |

These additional codes are proposals for formal publication. Match codes already consumed by the frontend before assigning overlapping meanings. Field errors use exact camelCase paths, such as `consents.termsVersion`. Validate valid IANA zone/currency membership, safe integer bounds, nonempty strings, enums and cross-field business rules beyond JSON syntax. Return safe messages without legal text or provider secrets.

## 4. Consent and price decisions

Add public `GET /v1/notices?workflow=registration|booking&language=es|en`. Return `{data:{workflow,language,required:[{kind,version,title,content,format,publishedAt}]}}`, where kind is privacyNotice or terms, format is plainText or an approved sanitized format, and publishedAt is a UTC instant. Each version's published content is immutable. Add `GET /v1/notices/{kind}/{version}?language=...` for the exact displayed version; return 404 for unavailable content.

`RegisterRequest.consents` and `IntakeInput.consents` already require privacyNoticeVersion and termsVersion. Validate that supplied versions are published, enabled for that workflow, and were available in the selected locale. A notice update cannot fabricate acceptance. If an older displayed version is no longer acceptable, return a documented 422 and require the UI to show and obtain acceptance of the new version. Server records actor, workflow, booking when applicable, exact versions and acceptance timestamp in an immutable acknowledgement event. Existing saved intake metadata is not permission to auto-check a new acknowledgement.

The frontend currently obtains notice versions from `src/api/index.ts` environment configuration. The formal increment must coordinate fetching actual notice content and versions before production signup/payment. Publishing and firm approval of that copy are release gates. No marketing permission is inferred from these acknowledgements.

The existing `CreateBookingRequest` has no currency, lawyer-price or mode-price selector, and `ServicePrice` only identifies duration and Money. Proposed compatible MVP restriction: exactly one configured checkout currency per service, one active price per allowed duration, and no lawyer/mode price variation. Publish all Topic.prices in that service currency, reject duplicate duration prices, and calculate a quote in the same currency. Choose no actual currency until supplied by the firm. Multiple-currency selection or dimensional pricing requires a reviewed request/schema/UI increment before enabling that configuration.

Booking input also has no selected jurisdiction. Every lawyer eligible for an MVP service must cover that service's entire advertised jurisdiction scope; merely intersecting the service's jurisdiction list is insufficient. Alternatively, publish a separate service for each approved jurisdiction. Recheck full-scope eligibility at offer, reservation and reassignment. Supporting lawyers who cover only a selected subset requires a reviewed selected-jurisdiction request/response/UI increment before enabling that offering.

Published price and notice activation is immediate-only in the MVP. The server assigns effectiveAt at the guarded publication transaction; clients cannot backdate it. Future activation is rejected with `422 VALIDATION_FAILED` if submitted, and effectiveAt is not an accepted write field in the proposed DTOs. Scheduled activation requires an explicit later workflow and worker/transaction design. Published versions and their accepted/quoted history remain immutable.

Require quote total > 0 for this paid-booking MVP and validate provider-specific supported limits. Although Money/Quote schemas permit zero, a zero-total consultation has no defined confirmation pathway; reject publication of a zero-total bookable price with `422 UNSUPPORTED_PRICE_CONFIGURATION` until a free-booking workflow is separately designed. Do not try to create a zero-value Stripe intent.

An optional summary remains optional. Required payment gates can include actual notice acknowledgements, but cannot silently require a narrative. Disable pre-booking conflict screening until the firm defines its staff workflow and a reviewed contract represents its decisions. `IntakeInput.preferredLanguage` must match the reserved consultation language in this MVP; a language change requires revalidated booking assignment, not merely updating intake.

## 5. Staff authentication and permission model

Public signup always grants client access. A staff administrator grants explicit scoped permissions through an audited operation. The legacy `User.role` field remains a client-compatible display classification; it is not the source of authorization and cannot encode the full grant set. Add `GET /v1/staff/me` returning `{data:{userId,permissions,scopes,mfa:{enrolled,verifiedAt,expiresAt}}}`. This minimal self-access endpoint requires a base session but can be used before staff step-up; it exposes only the caller's own grants.

The proposed additional factor is WebAuthn. Use a maintained implementation to validate challenge, relying-party ID, trusted origins, user verification and credential ownership; registration/assertion objects need exact OpenAPI schemas in the formal increment. Store public credentials and replay-defense metadata; never invent cryptographic validation.

| Method and route | Proposed flow |
| --- | --- |
| Existing `POST /v1/auth/login` | Password creates the ordinary session only; no staff operation becomes available before factor verification. |
| `POST /v1/staff/auth/mfa/authentication-options` | Base session; return `{data:{challengeId,publicKey,expiresAt}}`; short-lived server-bound single-use challenge. |
| `POST /v1/staff/auth/mfa/authentication-verification` | `{challengeId,credential}`; verify factor; rotate session and CSRF; return existing `{data:Session}`; record bounded staff assurance expiry server-side. |
| `POST /v1/staff/auth/mfa/enrollment-options` | Recent password authentication plus controlled one-time enrollment invitation, or an existing fresh staff factor; return challengeId, publicKey, expiresAt. |
| `POST /v1/staff/auth/mfa/enrollment-verification` | `{challengeId,credential}`; consume challenge; record credential; return `{data:{credentialId,enrolledAt}}`; require subsequent authentication verification for elevation. |
| `POST /v1/staff/users/{userId}/mfa-reset` | `accounts:mfaReset`, fresh factor, Idempotency-Key, `{expectedVersion,reason}`; revoke target factors and sessions, queue controlled enrollment, return an operation receipt; no factor bypass. |

All these browser writes use CSRF and Origin checks and are throttled. Authenticated clients without staff grants cannot enroll to obtain a staff role. Password reset, factor reset, role/permission changes and staff offboarding revoke affected sessions/assurance. Factor recovery requires a documented human identity check, audited reason and an authorized separate administrator; first-admin bootstrap is a controlled deployment procedure with no public bootstrap endpoint. Test inability to use the recovery flow to self-elevate. Session idle/absolute and factor-assurance lifetimes are configurable technical defaults to be reviewed before launch.

Every staff endpoint below requires a valid staff grant, verified email, current staff MFA and object scope. Require fresh step-up for role grants, refunds, session/factor revocation and policy exceptions. An admin role alone does not imply `intake:read:any`. Assigned lawyers may read only their assigned appointment metadata and intake and change only the permitted status/schedule scope.

Grant changes select from approved permission templates and authorized target scopes; actors cannot grant permissions beyond their delegated grant authority. Staff cannot submit or replace client consent through intake administration. Anonymous factor failures and ordinary permission errors do not disclose unrelated account or appointment records.

Role, account-disable, session/factor revocation and MFA-recovery operations serialize authorization invariants by writing the shared firm authorization guard first, followed by affected users' security revisions in sorted user-ID order. Re-read effective grants and active recovery-administrator membership inside that transaction before applying changes. The last-recovery-administrator rule must survive concurrent removals/resets; a preflight count alone is insufficient. Invalidate affected session assurance through the updated security revisions and record the audited mutation atomically.

## 6. Proposed staff operation surface

New routes use the same `/v1` conventions and are additive. Inputs below are allowlists, not arbitrary JSON patches. `reason` is required, bounded plain text (maximum 500 characters), and must not contain legal narrative. `expectedVersion` is required for each update, including action routes. Creates return 201; reads/updates 200; accepted durable asynchronous commands 202. All return `{data:...}`. Lists use the common cursor wrapper and bounded date/search filters.

| Method and route | Permission and scope | Input / output |
| --- | --- | --- |
| `GET /v1/staff/topics` | `catalogue:read` | Publication/status filters; paginated StaffTopic including version. |
| `POST /v1/staff/topics` | `catalogue:write` | Approved translations, jurisdictions, durations, languages, modes, checkoutCurrency, reason; create draft StaffTopic. |
| `PATCH /v1/staff/topics/{id}` | `catalogue:write` | expectedVersion, permitted catalogue fields, reason; StaffTopic. |
| `POST /v1/staff/topics/{id}/publish` | `catalogue:publish` | expectedVersion, reason; validate approved metadata and complete active prices; StaffTopic. |
| `POST /v1/staff/topics/{id}/unpublish` | `catalogue:publish` | expectedVersion, reason; stop new reservations; StaffTopic; retain existing bookings. |
| `POST /v1/staff/topics/{id}/price-versions` | `catalogue:prices` | expectedVersion, duration-to-minor-amount prices, tax configuration reference, reason; immediately active immutable PriceVersion with server-assigned effectiveAt. |
| `GET/POST /v1/staff/notices` | `notices:read` / `notices:write` | List versions / create draft kind, workflow, locale content and reason; NoticeDraft with version; no implied legal approval. |
| `POST /v1/staff/notices/{id}/publish` | `notices:publish` | expectedVersion, firm approval reference, reason; immediately active immutable PublishedNotice with server-assigned effectiveAt; prior accepted versions remain retrievable. |
| `GET/POST /v1/staff/lawyers` | `lawyers:read` / `lawyers:write` | Bounded list / create linked existing user plus approved public profile and schedule timezone; StaffLawyer includes version. |
| `PATCH /v1/staff/lawyers/{id}` | `lawyers:write` | expectedVersion, approved credentials, languages, eligible topic/jurisdiction references, modes, active, reason; StaffLawyer. |
| `GET /v1/staff/lawyers/{id}/schedule` | `schedules:read:own|any` | Bounded effective-date range; Schedule with version, wall-clock rules and exceptions. |
| `PUT /v1/staff/lawyers/{id}/schedule` | `schedules:write:own|any` | expectedVersion, IANA timezone, bounded recurring rule set/effective dates/buffers, reason; Schedule. |
| `POST /v1/staff/lawyers/{id}/schedule/exceptions` | `schedules:write:own|any` | Parent schedule expectedVersion, startAt/endAt, closure or extraOpening, reason; Exception and scheduleVersion. |
| `DELETE /v1/staff/lawyers/{id}/schedule/exceptions/{exceptionId}` | `schedules:write:own|any` | JSON expectedVersion and reason; return Schedule version receipt. |
| `GET /v1/staff/bookings` | `bookings:read:assigned|any` | Bounded date range, status, lawyerId, exact client reference where permitted; paginated StaffBooking, no intake text. |
| `GET /v1/staff/bookings/{id}` | `bookings:read:assigned|any` | StaffBooking metadata with version, permitted financial summary and policy snapshot reference. |
| `POST /v1/staff/bookings/{id}/intake-access` | `intake:read:assigned|any` | `{reasonCode,ticketId?}`; audited sensitive read; SavedIntake or null. No intake search or bulk listing. |
| `POST /v1/staff/bookings/{id}/reschedule` | `bookings:reschedule` | Idempotency-Key, expectedVersion, slotId, reason; atomic validated move/assignment; StaffBooking. |
| `POST /v1/staff/bookings/{id}/cancel` | `bookings:cancel` and `bookings:override` if outside policy | Idempotency-Key, expectedVersion, reason, overridePolicy boolean; StaffBooking, refund processing remains separate. |
| `POST /v1/staff/bookings/{id}/complete` | `bookings:complete:assigned|any` | expectedVersion, reason; time/state checked; StaffBooking. |
| `POST /v1/staff/bookings/{id}/no-show` | `bookings:noShow:assigned|any` | expectedVersion, reason; configured grace period checked; StaffBooking. |
| `GET /v1/staff/payments/{paymentId}` | `payments:read` | PaymentSummary, captured/refunded/pending totals, safe provider references and version; no clientSecret. |
| `POST /v1/staff/payments/{paymentId}/refunds` | `payments:refund`, fresh MFA | Idempotency-Key, payment expectedVersion, amountMinor, reason; 202 Refund with pending state. |
| `GET /v1/staff/refunds/{refundId}` | `payments:read` | Refund state, amount, reason category, retryability and version. |
| `GET /v1/staff/operations` | `operations:read` | Cursor list filtered by type/status/age; safe late-payment, refund, webhook or notification exception summaries. |
| `GET /v1/staff/operations/{id}` | `operations:read` | Safe operation details, related IDs, version and allowedActions. |
| `POST /v1/staff/operations/{id}/retry` | `operations:retry` and underlying financial permission when applicable | Idempotency-Key, expectedVersion, reason; 202 OperationReceipt; only allowlisted safe retries. |
| `POST /v1/staff/payments/{paymentId}/reconcile` | `payments:reconcile` | Idempotency-Key, expectedVersion, reason; 202 OperationReceipt; fetch provider state, never accept a client-supplied financial state. |
| `GET /v1/staff/users` | `accounts:read` | Exact normalized email or ID lookup, bounded pagination, minimal AccountSummary; no public equivalent. |
| `PATCH /v1/staff/users/{id}/access` | `accounts:grant`, fresh MFA | expectedVersion, allowed grants/scopes, active status, reason; AccountAccess; no self-elevation or removal of last active recovery administrator. |
| `POST /v1/staff/users/{id}/revoke-sessions` | `accounts:revoke`, fresh MFA | Idempotency-Key, expectedVersion, reason; revocation receipt; avoid exposing session tokens. |
| `GET /v1/staff/audit-events` | `audit:read` | Bounded actor/target/time filters; paginated safe audit metadata, never legal narrative. |

StaffTopic, StaffLawyer, Schedule, StaffBooking, PriceVersion, PaymentSummary, Refund and OperationReceipt are **new schema proposals**, not current generated types. OperationReceipt must contain operationId, type, status, createdAt and a status-resource URL. Refund must expose its own `pending|succeeded|failed` state independently of aggregate refundStatus. StaffBooking contains no intake narrative; include only fields needed by that operation and permission scope.

Schedule changes that conflict with existing held/confirmed appointments return `409 SCHEDULE_CONFLICT`; they do not silently move/cancel appointments. Roster/catalogue deactivation prevents new offers and reservations while preserving existing bookings for staff resolution. Assignment to a different lawyer uses reschedule with an eligible offer and the same interval transaction protocol, including both lawyers' locks; there is no unrestricted `lawyerId` patch.

For MVP reschedule, restrict to confirmed bookings, unchanged service/duration/language/mode/currency and an approved equal-total quote basis. Revalidate the replacement price; reject price-changing moves with `409 PRICE_CHANGE_REQUIRES_NEW_BOOKING`. Secure the new interval before releasing the old one in one database transaction; preserve paid quote/history and refresh reminders. A price adjustment, additional collection, refund difference or change in consultation scope needs a separate reviewed workflow. Configure firm approval for even equal-price moves before enabling the route.

Refund requests reserve the refundable balance transactionally against captured amount minus succeeded and pending refunds. Retry a durable refund attempt; never create a second refund just because an HTTP response was lost. A failed attempt releases its reservation only after reconciliation proves it did not succeed remotely. `operations/retry` cannot overwrite statuses, inject provider events or bypass permission/state checks. Ambiguous exceptions stay open; there is no generic force-confirm/force-paid API.

## 7. Stripe webhook and asynchronous response boundary

Keep `POST /v1/webhooks/stripe` and Stripe-Signature header. Configure NestJS to preserve exact raw bytes and verify timestamp tolerance/signature with the environment's endpoint secret before trusting any fields. Verify intended account and environment, supported event/API version, provider intent binding and amount/currency. Reject malformed/invalid signatures with 400; return 503 when durable inbox acceptance fails; return 200 for already accepted duplicate events.

The success body remains `{data:{received:true}}`. A 200 means durable inbox acceptance only. Unique event identity is scoped to provider/account/environment; asynchronous processing marks processed only after successful business application. Quarantine wrong amount/currency or foreign intent references for restricted operational review. Valid irrelevant event types may be recorded as ignored; they never cause a booking transition.

The worker applies payment, booking and notification-outbox effects atomically in MongoDB. If a success arrives after cancellation/expiry or reservation release, record the actual payment, set resolutionRequired and create a durable refund/reconciliation operation. Never reclaim another client's interval. Provider creation/refund calls happen outside database transactions and use persisted attempt identities so a crash can be recovered without duplicate effects.

The client only polls `GET /v1/bookings/{id}` after provider SDK completion. It must display processing until server state resolves. No polling endpoint can fetch arbitrary provider IDs. Do not cache/log provider clientSecret, webhook raw legal metadata, passwords, tokens or cookies. Persist only minimal provider payload fields needed for processing; any retained raw payload has explicit restricted retention.

## 8. Gaps to resolve before a formal OpenAPI increment

| Observed file/schema | Required resolution |
| --- | --- |
| `openapi.json` has no staff operations or MFA schemas | Add reviewed routes/DTOs/security and scope tests from sections 5–6 before enabling production operations. Do not claim this prose is an implemented API. |
| `User.role` is singular; requirements allow scoped role assignments | Keep compatible public role; expose effective staff permissions separately; never authorize solely from role in a browser DTO. |
| `ServicePrice`/`CreateBookingRequest` lack price dimensions/currency selection | Enforce the single service currency and duration-price restriction, or coordinate a versioned client increment first. |
| `Topic.jurisdictions` advertises scope, but `CreateBookingRequest` has no selected jurisdiction | Require every eligible lawyer to cover the full service scope or split services by jurisdiction; subset offerings require an explicit selected-jurisdiction contract/UI increment. |
| Money/Quote allow zero; payment flow requires Stripe | Disable zero-total publishing until free-booking confirmation/idempotency/lifecycle is specified. |
| `src/api/index.ts` supplies notice versions from environment only | Add immutable notice retrieval/publication workflow and UI presentation; require actual acceptance, not configured strings alone. |
| `createPaymentIntent` description mentions completed required intake/screening | Specify permitted configured gates; optional summary never blocks payment; screening disabled until reviewed workflow exists. |
| `IdempotencyKey` description promises original-result replay without a secret-bearing exception | Publish descriptor-based payment replay and current-state 409 recovery, preserve exact nonsecret response replay, and prove no provider client secret is persisted or exposed after retirement. |
| `src/api/types.ts` makes `saveIntake` return void; OpenAPI returns IntakeReceipt | Future client integration must consume receipt bookingVersion or reload Booking before payment creation; backend must not ignore stale payment versions. |
| `src/api/http.ts` drops error message/requestId and does not automatically retry CSRF failures | Preserve exact server wrapper; coordinate diagnostic requestId support and safe rebootstrap UX. Do not blindly replay unknown-outcome financial calls with new keys. |
| `ClientApi.cancel` sends `{}` though CancelBookingRequest permits reason | Backend supports optional reason; future UI can add it without inventing required client fields. |
| Topic query implementation loads at most 20 pages of 50 | Keep published catalogue within that frontend limit or revise the client UX before catalogue expansion. Backend still enforces per-page bounds. |
| Booking DTO lacks cancellation eligibility/refund amounts, meeting access and schedule-change history | Initial UI can show aggregate states only; richer policy preview, refund totals, meeting access or reschedule UI needs reviewed explicit DTOs and access rules. |

Acceptance gate: produce a separately reviewed OpenAPI revision containing exact new request/response schemas, bounded filters, status/error enums, CSRF/session/MFA security, mutation version inputs, idempotency retention/replay semantics and webhook behavior. Lint/validate it, compare existing endpoints for breaking changes, generate client types, and run producer/consumer fixture checks. Coordinate any changed existing schema with the frontend; incompatible changes require an explicit API-version/migration decision. Staff routes, notice delivery, provider sandbox scenarios, authorization and real MongoDB concurrency tests must pass before release. This design leaves the current `docs/redesign/openapi.json` untouched.
