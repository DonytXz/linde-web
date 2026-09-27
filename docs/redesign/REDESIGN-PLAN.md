# Complete redesign plan

> Historical planning baseline. The frontend redesign has since been implemented; see [Frontend handoff](../FRONTEND-HANDOFF.md) and [Migration record](../MIGRATION-RECORD.md) for current status. Backend implementation is outside this delivery. Legacy source citations below refer to the preserved recovery snapshot, not the new source tree.

Status: proposed implementation plan, grounded in the existing law consultation frontend. The only product removal already performed is the unrelated `property_valuation` folder, as requested.

## 1. Product definition

Build a trustworthy, bilingual way to understand the firm's services, choose an eligible consultation, reserve an available time, pay when required, and retrieve appointment instructions. Position the product around immigration law and the firm's legal expertise, without a city, regional or border-market focus. Product copy must distinguish the actual jurisdictions and services the firm offers.

Primary users:

- **Prospective client:** understands available services, lawyer credentials, language, mode, price and next steps.
- **Client:** manages identity, books a consultation, submits a brief intake and sees their own appointments.
- **Lawyer:** sees assigned appointments, necessary intake and their own availability.
- **Administrator:** manages service offerings, lawyer assignment, schedules, exceptions and payment reconciliation.

Launch scope is consultation booking. Full legal case management, document submission, immigration eligibility determinations, government filing, chatbots giving legal advice, and property valuation are excluded. A successful booking is not automatically a retained case; the firm supplies the appropriate engagement language.

## 2. Identity and naming

Use **Linde** as a provisional software brand with the descriptor **Consultas legales / Legal consultations**. Develop the identity around immigration services and professional legal guidance, without a geographic or border theme. The owner must approve the public name before assets, domains or repositories are finalized.

Suggested technical names: frontend repository/package `linde-web`; backend repository/package `linde-api`. Use one spelling consistently in folder names, package metadata, browser title, deployment labels and documentation. If the firm already has a public name, that name can replace the working brand while the software repositories use a neutral technical slug.

Deliver a brand sheet containing:

- Primary wordmark, compact mark, monochrome and reversed versions.
- Editable vector masters and SVG exports; transparent raster exports only where needed.
- Favicon set, app icons, social preview and email header.
- Clear space, minimum size, backgrounds, contrast rules and permitted variants.
- Asset provenance, licensing, photographer permission and approved lawyer biographies.

Do not keep historical claims, testimonials, addresses, phone numbers or credentials merely because they appear in the old pages. The firm must supply or confirm each one. Retain applicable source-code license notices separately from visible branding.

## 3. Visual direction

Direction: a calm professional service with clear reading order, generous whitespace, legible forms and explicit appointment status. Favor authentic lawyer/team photography and imagery that supports the immigration consultation journey, with appropriate permissions. Geographic landmarks are not a defining brand element. Avoid imagery that implies a government affiliation or suggests guaranteed immigration outcomes.

Proposed design tokens for exploration, not approved artwork:

- Ink `#142C38` for headings and navigation; paper `#F7F5F0` for backgrounds; white surfaces.
- Deep teal `#176B67` for primary actions; muted sand `#D8C5A2` for non-text accents.
- A readable sans-serif for forms and body text; an optional restrained serif for editorial headings. Confirm font licenses and language coverage before shipping.
- A 4/8-pixel spacing scale, consistent input heights, visible keyboard focus and moderate corner radius.

Measure contrast in the final combinations. Set a design acceptance target of WCAG 2.2 AA and verify against the standard during implementation. At 320 px width and 200% zoom, critical booking tasks must remain usable. Use text alongside status colors; respect reduced motion; do not place essential content only inside images.

Build reusable navigation, language switcher, service card, lawyer summary, timezone selector, slot picker, progress indicator, price summary, form field, error summary, status panel and notification components. Keep Spanish and English strings outside component markup; never concatenate translated phrases around dynamic dates or currency.

## 4. Information architecture and screen migration

Each localized public page should have its own shareable URL. Proposed paths below are new product paths; the API retains `topics` as the initial technical name for service categories.

- **Home:** `/es` and `/en`. Explain services, location and booking process; primary action "Agendar consulta / Book a consultation". Replace legacy marketing copy and photography.
- **Services:** `/es/servicios/:slug`, with an English equivalent. State actual practice area, supported jurisdiction, lawyer language, duration options, consultation mode, approved price/currency and preparation guidance. Replaces `/topics/:id` with ID-to-slug mapping where legacy links exist.
- **Authentication:** registration, email verification, login, password recovery and reset. Preserve the intended booking on sign-in; explain expired links and failed delivery.
- **Booking:** `/es/agendar`. Service and duration → eligible lawyer/assignment → timezone and real available slot → brief intake → review. Do not permit arbitrary times the backend cannot serve.
- **Payment:** `/es/citas/:bookingId/pago`. Read the server's booking quote, display the exact currency and hold expiry, permit retry safely, and resume on refresh. Replaces the current sample-product checkout.
- **Confirmation:** `/es/citas/:bookingId/confirmacion`. Show pending verification until the server confirms payment; then show localized time, office time, mode and instructions. Reloading must preserve state.
- **Client dashboard:** `/es/mis-citas` and `/es/citas/:bookingId`. Real appointment history, next appointment, payment status, editable intake where permitted, and cancellation rules.
- **Lawyer workspace:** `/equipo/agenda`. Assigned appointments and protected intake with own-availability controls.
- **Admin workspace:** `/administracion`. Service/lawyer setup, schedule exceptions, booking intervention and payment/refund exceptions. UI access alone is never authorization.
- **Contact, privacy, terms and cancellation policy:** named, working destinations in both languages with firm-approved content.
- **Not found and service unavailable:** actionable routes that retain navigation and support details.

Legacy `/payment`, `/confirmation` and `/details` do not carry a booking ID. If they cannot be resolved from an authenticated user's real booking, redirect to their appointment list with an explanation; never invent or select a booking arbitrarily. Public redirects must preserve useful inbound links without carrying private intake in URLs.

## 5. Data and UX changes beyond appearance

- Remove hardcoded client names and mock appointments from production views. Loading, empty, error, unauthorized and success states need distinct designs.
- Persist a booking ID through checkout and details. Refresh, back navigation and a second browser tab must not cause duplicate reservations or payments.
- Display the client's selected timezone and the configured office/lawyer timezone, clearly labeled. Store instants in UTC; require a valid IANA timezone for each lawyer's schedule rather than a location-derived default or fixed offset. Test daylight-saving and non-daylight-saving zones, cross-date appointments and clients in different zones.
- Start with minimal legal intake: service, brief issue summary, preferred language and contact details. Detailed immigration histories, identity documents and family data are not default booking fields.
- A firm-approved conflict-screening policy must determine whether intake is reviewed before a paid consultation. If pre-screening is required, add the review state and UI before implementing checkout; it is not silently covered by the draft payment-first contract.
- Keep operational messages free of detailed case facts. Confirm actual meeting instructions and secure access rules before sending them.
- Translate content deliberately and review immigration/service terminology with the firm. Do not infer a user's language from nationality.

## 6. Frontend technical migration

The current root app uses React 16, Router 5, Webpack 4 and Tailwind 2 according to its manifest. A local compatibility change already exists in Webpack. These are inventory facts, not a verified support or vulnerability assessment.

Start the new frontend in a clean repository using a maintained React toolchain and TypeScript, with exact versions selected and checked at implementation time. Keep this planning package framework-neutral. Choose prerendering/server rendering for public content if discovery and multilingual search are launch priorities; client-only private appointment screens can share the same application shell.

Before selecting dependencies, record the runtime, package manager, lockfile, deployment constraints and accessible component strategy. Add an environment example with names only, explicit build/start/lint/typecheck commands, and a reproducible production build. Avoid carrying the old crypto override or giant copied theme configuration without a demonstrated need.

Extract API calls behind one typed client. Create mock responses from the shared contract; use a visible development-only mock mode that cannot reach production. Browser configuration must contain only public settings. Keep server secrets and provider credentials in the backend.

## 7. Parallel milestones

These are dependency stages, not calendar commitments. Estimate duration after staffing, approved scope and legacy-data access are known.

### M0 — Shared decisions and contract

Owner confirms firm identity, services, jurisdictions, consultation modes and commercial rules. Frontend/backend leads reconcile the draft OpenAPI contract, business state machines, error codes and representative fixtures. Resolve conflict-screening timing. Inventory legacy data and provider-account ownership. Exit: a versioned contract both teams can build against.

### M1 — Foundations in parallel

Design/frontend: initialize the newly named repository with fresh history after the approved identity/configuration edits, then develop mobile/desktop wireframes, tokens, accessible components and bilingual navigation. Backend: create its independent repository, service skeleton, database migrations, auth, roles, seed data, CI and environment setup. Exit: frontend renders shared fixtures; backend serves session and service endpoints in a non-production environment.

### M2 — First complete booking slice

Frontend: service selection, timezone-aware availability, intake, review and resumable booking screens. Backend: lawyer eligibility, schedules, exceptions, transactional reservations and owned booking reads. Exit: two concurrent clients cannot reserve the same lawyer/time; both teams demonstrate the same error and expiry states.

### M3 — Payment and firm operations

Frontend: payment, processing, failed/retry, paid confirmation, dashboards and minimum staff tools. Backend: server-priced payment intents, verified webhooks, cancellation/refund workflow, outbox notifications and operational tooling. Exit: payment survives refresh and delayed events; staff can handle a cancellation and a late-payment exception.

### M4 — Migration and release

Complete asset/copy replacement, verify the new repositories and their intended history, migrate accounts/configuration, map redirects and perform any approved legacy-data import. Keep the development commits created since M1. Run end-to-end, accessibility, language, concurrency and provider-sandbox checks. Rehearse backup restore and rollback. Exit: named owners accept the release checklist and deployment switches to the new system without lost appointments.

## 8. Release acceptance

- A Spanish- or English-speaking client can discover an offered service and book an eligible slot on mobile and desktop.
- Price/currency, timezone, duration, lawyer or assignment policy, meeting mode and cancellation terms are visible before payment.
- Booking, payment and intake remain correct after reload, retries, double-clicks and session expiry.
- Clients see only their own appointments; lawyers see only assigned work; staff permissions and audit history are enforced server-side.
- Transactional booking conflict and webhook duplicate/reordering tests pass.
- No mock client data, sample product, old visible logo, broken placeholder link or unconfirmed firm claim appears in the release.
- Both languages have reviewed service/legal copy and functional keyboard navigation.
- Fresh repository contains the approved source and required license notices; excluded files, secrets, generated output and old Git objects are absent.
- Monitoring, exception handling, support ownership and rollback steps are ready before real payments are enabled.

See [Parallel kickoff](PARALLEL-KICKOFF.md) for actionable assignments and [Backend requirements](BACKEND-REQUIREMENTS.md) for implementation-level rules.
