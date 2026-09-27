# GitHub Pages deployment

The Pages build publishes the production frontend. It never enables synthetic demo accounts or simulated payments. Without API configuration, the public design loads and the service catalogue explains that online appointments are unavailable.

## Deployment

The `Deploy Linde to GitHub Pages` workflow installs locked dependencies, checks lint/unit tests/types, builds the site and publishes the `dist` artifact. It runs on pushes to `main` and supports manual dispatch. GitHub Pages must use **GitHub Actions** as its publishing source. Deployment permissions are limited to the deploy job; no personal token is stored in the workflow.

The app uses hash routes on Pages, for example `/linde-web/#/en/services`. This preserves links and refreshes on a static host without server rewrite support. Other builds retain normal browser routes. Asset URLs use Vite's base path and manifest icons are relative. The workflow reads the actual repository site path from GitHub Pages metadata.

## Connect the separate API

Set repository Actions variables named as in `.env.example`: `VITE_API_BASE_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`, policy versions and HTTPS policy URLs. These values are public browser configuration. Never enter secret API keys, database credentials or Stripe secret keys. Push a change or rerun the workflow after updating values.

Your API must allow the site's HTTPS origin for credentialed CORS. Since the API and Pages may be on different sites, verify browser cookie behavior; prefer a same-site custom domain arrangement for production authentication. Reset/verification email links must use the deployed hash route, e.g. `https://OWNER.github.io/linde-web/#/en/reset-password?token=...`. Do not put the query before the hash.

Backend implementation, email delivery, Stripe webhooks and production legal/business configuration remain separate work. Pages cannot host a NestJS server.

## Verify

Run `npm run build:pages` and `npm run test:pages` locally. The Pages-specific browser tests check images, manifest icons, language switching, login/service deep-link reloads and mobile navigation. To test the deployed artifact, set `PAGES_TEST_URL` to the full site URL ending in `/`, then run `npm run test:pages`. This skips the local preview server and visits that exact site.

The default local Pages base is `/linde-web/`; override `PAGES_BASE_PATH` when using another repository or a custom domain. `PAGES_SITE_URL` optionally supplies the absolute social-image URL.

References: [Vite static deployment](https://vite.dev/guide/static-deploy.html#github-pages), [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
