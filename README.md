# Linde

Bilingual immigration and law firm consultation booking frontend. Spanish and English, with no city-specific positioning. This repository contains the client application and the documentation for a separately implemented API. **There is no backend server in this project.**

[Production website](https://donytxz.github.io/linde-web/) · [GitHub repository](https://github.com/DonytXz/linde-web)

## Run locally

Use Node.js 22.12+ and npm. Install with `npm ci`, then run `npm run dev` and open <http://127.0.0.1:5178>.

Development defaults to a clearly labeled demo. Choose “Explore the sample account” on the login page to try booking, simulated payment, appointment details and cancellation. Use synthetic information only. Demo data lives in session storage for the current browser tab; closing the tab clears it. The demo adapter is excluded from production builds.

## Connect your API

Copy `.env.example` to `.env.local`, set `VITE_API_MODE=live`, and provide your `/v1` API URL. Configure cookie sessions, credentialed CORS, CSRF, published policy URLs/versions, and a Stripe publishable key as described in [Frontend handoff](docs/FRONTEND-HANDOFF.md). Browser variables are public; server secrets do not belong here. Rebuild after changing production configuration.

Your backend implementation is a separate project. Start with [Backend requirements](docs/redesign/BACKEND-REQUIREMENTS.md), the [API contract](docs/redesign/openapi.json), and the existing [backend design notes](docs/backend/README.md). The client contract contains 19 paths and 22 operations. Staff operations require a separate contract increment; the frontend's protected team page is a handoff placeholder.

## Checks and build

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run preview
```

Browser tests use installed Google Chrome. They cover the synthetic bilingual booking journey, refresh/recovery, payment simulation, cancellation, mobile navigation and authentication routes. Live backend and Stripe integration still need testing against your API and Stripe test account.

`npm run generate:api` regenerates client types from the OpenAPI contract. `npm run brand:export` regenerates PNG/ICO exports from the vector assets using Chrome.

## Product and delivery notes

- [Frontend handoff](docs/FRONTEND-HANDOFF.md): routes, integration, environments, release prerequisites and known limits.
- [Brand guide](docs/BRAND.md): identity, assets, typography, colors and licensing.
- [Migration record](docs/MIGRATION-RECORD.md): preserved legacy source, local history reset and repository boundaries.
- [Original redesign package](docs/redesign/README.md): product decisions and historical inventory.

The new identity is Linde; package and local repository name are `linde-web`. No domain or trademark availability is asserted. Firm details, credentials, service catalogue, commercial rules and reviewed policies must be supplied before public release. The public repository is [DonytXz/linde-web](https://github.com/DonytXz/linde-web). GitHub Pages deployment and API configuration are documented in [GitHub Pages](docs/GITHUB-PAGES.md).

Original applicable MIT attribution remains in [LICENSE](LICENSE). Font licenses ship in [public/brand/licenses](public/brand/licenses).
