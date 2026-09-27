# Linde frontend handoff

## Delivered scope

The former app has been replaced with React, TypeScript and Vite, an original Linde identity, responsive Spanish/English layouts, and a shared design system. It covers the public homepage and service catalogue; login, registration, verification and recovery; service/slot selection; reservation, minimal intake, checkout and confirmation; appointment listing/detail and cancellation; policy routes; and a useful 404. It has no Tijuana, border-town or property-valuation positioning.

**Backend implementation is explicitly excluded.** You own the separate API project. `src/api/demo.ts` is a synthetic frontend preview adapter, not a backend, database, real authentication service or payment processor. API requirements/design files are documentation only.

## Source map

- `src/content.ts` contains Spanish and English UI text.
- `src/components` contains navigation, footer, brand and shared accessible controls.
- `src/pages` contains the client journeys; checkout loads Stripe only when needed.
- `src/api/http.ts` implements the draft HTTP contract; `schema.d.ts` is generated.
- `src/api/demo.ts` supplies local development fixtures and tab-scoped demo state.
- `src/lib/routes.ts` owns localized paths and language switching.
- `public/brand` contains original vector assets, exports and font notices.

## API connection

Set the values from `.env.example` in `.env.local` for development and in the hosting build environment for deployment. Production never uses demo fixtures, even if `VITE_API_MODE=demo` is present. An absent API URL produces a configuration/error state instead of simulated success.

`VITE_API_BASE_URL` includes `/v1`. Use HTTPS in production. Requests include browser credentials; the API must send credentialed CORS for the exact frontend origin when origins differ. Same-origin proxying is preferable where available. Configure secure cookie attributes appropriate to the actual hosting origins and implement origin checks on the server.

`GET /csrf` bootstraps the token used in `X-CSRF-Token` on mutations. The browser does not store session tokens in local storage. Login/logout update the client identity from server responses; server ownership and permission checks remain mandatory for every protected resource. Errors use the contract envelope and status codes. Requests time out after 20 seconds; state-changing requests are not blindly retried.

Booking creation, payment-intent creation and cancellation send stable `Idempotency-Key` headers. The API must implement durable idempotency, authoritative availability, hold expiry, quote snapshots and payment state. A 409 during reservation sends the user back to select another available slot. An optional intake-save failure preserves the created reservation and routes to its resumable checkout, with an explanation and editable intake.

Prices use integer minor units and explicit currencies; display respects zero- and three-decimal currencies. Scheduling uses UTC timestamps plus IANA timezone display. Available durations, modes, languages, lawyer profiles and service jurisdictions come from the API. No production currency or firm timezone is inferred from a city.

The client contract uses `topics` for legal services. Preserve the contract's names while implementing your preferred module organization. Required statuses are `pendingPayment`, `confirmed`, `completed`, `noShow`, `cancelled`, and `expired`. Payment, refund and operational-resolution states are separate. Confirmed UI is driven by the server's booking state.

## Payments and policies

Set `VITE_STRIPE_PUBLISHABLE_KEY` to a test publishable key for integration work. Stripe Elements collects card details; the API creates the intent for an owned booking and its quote. Stripe confirmation starts server-state polling. Signed webhook processing, expiry, cancellation, refunds and reconciliation belong to your backend. A successful browser payment callback alone must not confirm the appointment.

Set `VITE_PRIVACY_VERSION` and `VITE_TERMS_VERSION` to the API's accepted policy versions. Supply HTTPS URLs in `VITE_PRIVACY_URL`, `VITE_TERMS_URL` and `VITE_CANCELLATION_URL`. Live reservations are disabled until these are configured. Policy pages link to the published documents; the app does not invent legal policy text. Review those documents and operator details before launch.

## Route behavior

Spanish routes start at `/es`, English at `/en`. Booking IDs stay in the URL through payment, confirmation, reload and language changes. Legacy routes such as `/login`, `/register`, `/booking`, `/dashboard` and `/topics/:id` redirect to the redesigned screens. Old checkout/detail routes without a booking ID return to the appointment list rather than fabricating a reservation. Protected deep links return to the intended internal route after login.

Team routes are role-gated placeholders. Staff scheduling, catalogue editing, refund operations and audit screens need an operational API contract and a later UI increment. There is no claim that these tools are delivered or that a browser route guard is an authorization boundary.

## Release prerequisites

Connect the real API and run its integration tests for concurrent slot contention, expiry, idempotent retries, ownership, authentication, payment failures, webhooks and refunds. Run a real Stripe test-mode booking in both languages. Verify account email actions through your mail provider, including expired links. No live API/provider integration has been exercised by this frontend-only delivery.

Supply firm identity, operator contact details, licensed lawyer profiles, approved services/jurisdictions, prices, policies and customer-support instructions. The contact page is currently a neutral routing page; it does not invent a phone number or submit an unimplemented contact form. Demo services and people are labeled synthetic and do not ship in production.

Configure hosting SPA fallbacks, HTTPS, API CORS/cookies and security headers. `vercel.json` supplies a Vite output configuration and SPA rewrite if that host is chosen. The initial frontend delivery changed no hosting account or remote. The subsequent GitHub Pages setup is documented in [GitHub Pages](GITHUB-PAGES.md). Set the final absolute social-image URL in `index.html` after the domain is selected; add localized/prerendered public metadata if search indexing is a launch priority. The current app is a client-rendered SPA.

## Validation

Unit checks cover the HTTP contract boundary, CSRF/idempotency headers, conflict preservation, missing configuration, currency formatting, safe internal redirects and language-switch route preservation. Browser checks use only synthetic fixtures. Responsive visual review covers desktop and mobile. These checks establish frontend behavior; they are not evidence of backend concurrency, production security, legal compliance or live payments.

Final local checks: lint, TypeScript and production build passed; 6 unit tests and 3 Chrome journey tests passed. The production browser smoke check showed the intended unavailable state without an API URL, and production assets contained none of the tested demo or legacy markers. Screenshots: [desktop](previews/linde-desktop.png) and [mobile](previews/linde-mobile.png).
