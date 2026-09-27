# Rebrand inventory

> Historical planning baseline. The frontend redesign has since been implemented; see [Frontend handoff](../FRONTEND-HANDOFF.md) and [Migration record](../MIGRATION-RECORD.md) for current status. Backend implementation is outside this delivery. Legacy source citations below refer to the preserved recovery snapshot, not the new source tree.

Status: planning only, based on the local source inspected on 2026-09-26. The `property_valuation/` folder was removed at the owner's explicit request. No application rename, asset replacement, Git reset, remote change, or deployment has been performed.

The confirmed product is a law firm consultation and lawyer booking service focused on immigration law, without a city, regional or border-market positioning. **Linde — Consultas legales / Legal consultations** is a provisional working label, with `linde-web` and `linde-api` proposed repository names. The identity is not approved and availability has not been checked. No replacement logos or images have been generated. See [Redesign plan](REDESIGN-PLAN.md) for scope and target screens.

## 1. Observed starting point

| Surface | Evidence | Migration consequence |
| --- | --- | --- |
| Actual local/package name | Current folder and [package.json](../../package.json), line 2: `mee_app` | Search both `mee_app` and the user's spelling `mee__app`; the observed name has one underscore. |
| Package branding | [package.json](../../package.json), lines 4, 14, 17, 20, 22: Brockerhub, CILABS, GitHub `montycode/mee_app` metadata | Replace description and repository/issues/homepage metadata with approved destinations. Review attribution separately from public brand. |
| Current remote | Read-only Git config inspection: host `gitlab.com`, project `manuelxwhite/mee_app.git` | Origin differs from the package's GitHub metadata. Confirm target host/owner before creating the new remote. |
| Git baseline | Local branch `master`; `git rev-list --count HEAD` returned 2 | This count describes local HEAD, not every remote branch or clone. |
| Existing local changes | Before documentation work: modified `package.json`, `package-lock.json`, `webpack.config.js` | Preserve these changes in the reviewed migration snapshot. They predate this plan. |
| Unrelated application | `property_valuation/` previously declared package name `mapv2`; removed at explicit owner request | It is excluded from the legal product, not a future rename or integration target. See [removal record](EXCLUDED-SUBPROJECT.md). |
| Browser identity | legacy `public/index.html`, lines 2 and 7: English `lang` with Spanish PBH/Mexicanos title | Set language per locale and replace title, metadata, and icons. |
| Visible identity | Header (legacy `src/Components/Header.jsx`), Home (legacy `src/Pages/Home.jsx`), Navbar (legacy `src/Components/Navbar.jsx`), Footer (legacy `src/Components/Footer.jsx`) | PBH, Mexicanos en el Extranjero, sponsorship, and contact information are spread across components. |
| Deployment identity | [vercel.json](../../vercel.json), line 3: `Mexicanos en el extranejero` | Update hosting metadata and actual external project/domain configuration separately. |
| API environment | webpack.config.js (legacy `webpack.config.js`), line 77: hardcoded legacy API base URL | Introduce documented environment settings and the new backend contract. Live availability/ownership was not verified. |
| Build/style baseline | [package.json](../../package.json): React 16, Router 5, Tailwind 2, Webpack 4; webpack.config.js (legacy `webpack.config.js`), line 10: development mode | Modernize and verify production builds as a separate workstream alongside visual changes. This is not a vulnerability assessment. |
| Attribution | [LICENSE](../../LICENSE): MIT, copyright 2021 Omar Montoya; package metadata declares ISC | Retain the existing copyright and permission notice for retained source; reconcile the contradictory package declaration. Fresh Git history does not remove the source notice. |

## 2. Naming and configuration changes

| Exact current path or external surface | Planned action | Completion evidence |
| --- | --- | --- |
| `package.json` | Update `name`, `description`, `repository.url`, `bugs.url`, `homepage`; review `author` and reconcile `license`. | Approved slug and actual destinations agree; required attribution remains. |
| `package-lock.json` | Update root metadata using chosen package tooling. Do not blanket replace matches inside dependency integrity strings. | Top-level and root-package names match the manifest. |
| Local folder `mee_app` | Prepare the approved new project directory according to [Repository migration](REPOSITORY-MIGRATION.md). | App/editor/project paths refer to the new checkout; existing root changes remain recoverable. |
| `.git/config`, remote repository, default branch | Establish the approved new remote and clean initial history during migration. | Intended remote and one reviewed initial commit verified. |
| `vercel.json` and hosting dashboard | Update project identity, build settings, domains, and environment configuration. | Preview/production point to the correct project and deep links resolve. |
| `webpack.config.js` or replacement build config | Replace hardcoded environment settings; verify production output, favicon binding, and asset handling. Current SVG loader emits assets under `fonts/`. | New vector logos render and production does not depend on the legacy API host. |
| `.gitignore` | Review environment variants, build output, caches, and backup exclusions. | No credentials, `node_modules`, `dist`, private backups, or unrelated project enter the new repository. |
| `public/index.html` | Replace title and add approved description, social metadata, locale handling, and icon references. | Browser/share identity and language are correct for each locale. |
| `public/favicon.ico` | Replace current mark and supply approved icon family. | Browser tabs and saved shortcuts use the new mark. |
| `src/App/App.jsx` | Apply shared providers/configuration and route shell; move public payment configuration into environment settings. | App and provider configuration agree with the new environment. |
| `src/Assets/css/style.css`, `tailwind.config.js` | Replace image bindings and introduce semantic design tokens. Current purge patterns omit `.jsx`. | Production retains required styles; typography, color, spacing, and states are consistent. |
| README, setup guide, environment example, CI | Create new-repository onboarding and reproducible build/check instructions. | Another developer runs the client against mocks or the local backend without undocumented setup. |
| Domain/DNS, email sender/templates, payment descriptors, meeting invitations, analytics | Inventory and update whichever services the new product adopts. External accounts were not inspected. | Visitor-facing identity agrees across application, communication, and payment surfaces. |

Before finalizing identity, confirm whether PBH remains the operating firm or sponsor. The software name does not establish a new legal entity. Obtain the actual firm's contact details, credentials, practice areas, lawyer roster, service jurisdictions, and approved history; do not carry old claims into a new brand by default.

## 3. Complete root asset inventory

| Current file | Observed use | Planned replacement/disposition |
| --- | --- | --- |
| `src/Assets/img/pbh_2.png` | Navbar fallback and Footer; imported by Booking, BookingDetails, Dashboard, Login, Payment, Register, Topic | Approved light-background wordmark through one shared brand component. |
| `src/Assets/img/pbh_blanco1.png` | Home passes it to the hero Navbar | Approved inverse wordmark. |
| `src/Assets/img/pbh_icon.png` | Present; no root source reference found | Review and retire from the new product if unused. |
| `src/Assets/img/icn_about_pbh.png` | Home about section | Approved firm/team imagery or illustration. |
| `src/Assets/img/img_intro.jpg` | `.header` background in `src/Assets/css/style.css` | New hero asset with desktop/mobile crops. Existing image is a consultation photograph with a dark overlay. |
| `src/Assets/img/img_banner.jpg` | `.banner` background in `src/Assets/css/style.css` | Replace or retire after homepage composition is selected. |
| `src/Assets/img/img_cover2.jpg` | Present; no root source reference found | Review and exclude if unused. |
| `src/Assets/img/img_asesoria.jpg` | Present; no root source reference found | Review and exclude if unused. |
| `src/Assets/img/icons/alfiler.png`, `correo.png`, `facebook.png`, `instagram.png`, `linkedin.png`, `telefono.png` | Present; Footer currently uses inline SVGs | Consolidate into one accessible icon family; retire unused files from the new product. |
| `public/favicon.ico` | HtmlWebpackPlugin favicon | Approved symbol in the favicon family. |
| `dist/**` | Generated output | Rebuild from reviewed source; never manually rename fingerprinted assets as a migration method. |

Proposed brand delivery specification:

- Editable vector masters plus optimized SVG wordmark and symbol in full color, monochrome dark, and inverse variants; correct view boxes and no external dependencies.
- Transparent wordmark PNG exports at 320 px and 640 px wide with the approved aspect ratio; square mark exports at 256 px and 512 px. Verify readability at actual navigation sizes.
- ICO with 16, 32, and 48 px renditions; SVG favicon; 180 px touch icon; 192 and 512 px application icons if included in the product.
- Social preview at 1200 × 630 px, with both language versions when text is embedded; email header asset sized for its approved template.
- Hero imagery at approximately 1920 px desktop and 960 px mobile with composition-specific crops, compressed formats/fallback, focal-point guidance, explicit dimensions, and intentional loading behavior. Essential headings stay in HTML.
- Brand guide covering clear space, minimum sizes, palette, typography, focus/error/disabled states, permitted backgrounds, imagery, provenance/usage rights, and alt-text intent.

New artwork must not represent invented lawyers, client testimonials, certifications, government affiliation, or guaranteed outcomes as facts. Real lawyer photographs and biographies require firm approval.

## 4. Screen and copy checklist

The existing visual language is largely black/gray Tailwind styling, a full-height photographic hero, repeated page-level logo imports, and a three-step booking/payment/details presentation. Build a shared design system and redesign the journeys in [Redesign plan](REDESIGN-PLAN.md); the inventory below identifies the current source surfaces.

| Current route / files | Required redesign coverage |
| --- | --- |
| `/` — `src/Pages/Home.jsx`, `src/Components/Header.jsx` | Immigration-focused firm positioning, approved practice areas/services, authentic trust evidence, language switch, booking entry; topic loading/empty/error states. |
| `/topics/:id` — `src/Pages/Topic.jsx`, `src/Components/TopicCard.jsx`, `TopicList.jsx` | Service scope, jurisdiction, duration, explicit currency, approved price and preparation information; missing/error states; carry the selected service into booking. |
| `/register`, `/login` — `src/Pages/Register.jsx`, `Login.jsx` | Shared bilingual form system; invalid/submitting/duplicate/expired-link states; proposed recovery/verification flows and return to interrupted booking. |
| `/booking` — `src/Pages/Booking.jsx` | Service and eligible lawyer/assignment, real slots, timezone, price summary; no-availability, conflict, retry, and hold-expiry states. Arbitrary date/time fields do not establish availability. |
| `/payment` — `src/Pages/Payment.jsx`, `src/Components/CheckoutForm.jsx` | Server quote, booking summary, pending/declined/authentication/retry states; resumable booking ID; remove developer-facing payment dashboard links. |
| `/details` — `src/Pages/BookingDetails.jsx` | Minimum service-appropriate intake, validated save/submission and consent states. Current form-like markup ends in a dashboard link; it is not a working intake system. |
| `/confirmation` — `src/Pages/Confirmation.jsx` | Real reference, service/lawyer, timezone, server-confirmed payment state, next steps and meeting information. Current page is only a heading. |
| `/dashboard` — `src/Pages/Dashboard.jsx` | Real upcoming/past appointments, status, details, receipt and permitted cancellation/rescheduling; empty/loading/error states. |
| Missing route — `src/Pages/NotFound.jsx`, `src/App/App.jsx` | Useful 404 and recovery navigation. The existing NotFound component is not registered in the current route list. |
| Shared — `src/Components/Navbar.jsx`, `Footer.jsx` | Unified brand, signed-in/out and bilingual states, keyboard/focus/menu behavior, accessible names, approved contact details, real legal/social links. Footer contact form needs a backend path or removal. |

Review all of the following legacy content:

- Header: “Mexicanos en el Extranjero y PBH Abogados” and sponsorship claims.
- Home: PBH name, 2005 founding date, firm history and professional/online-service claims.
- Navbar: screen-reader-only `PBH` text and mixed English/Spanish menu labels.
- Footer: email, phone, street address, social `href="#"` placeholders, 2020 copyright, “Made by CILABS” presentation.
- Topic: fee wording `dlls`; use explicit currency and locale formatting agreed with backend pricing.
- Booking/intake: field labels, declarations, validation, and time/currency formatting in both languages.
- New privacy, terms, cancellation/refund, and consent surfaces: working routes with firm-reviewed content. Do not invent policy from existing UI.

Spanish default and English at first release are proposed defaults. Scheduling uses the firm's explicitly configured office/lawyer IANA timezones with clearly labeled client-local display where relevant; do not hardcode a regional default or fixed offset. Every responsive screen must account for long translated text and clear status labels.

## 5. Parallel visual migration workstreams

1. Approve name, content hierarchy, terminology, public route mapping, and booking state flow with the backend owner.
2. Explore two visual directions on the same homepage, service detail, and booking screens; select one before delivering the full logo/asset family.
3. Define semantic tokens and shared navigation, buttons, inputs, slot picker, cards, alerts, dialogs, stepper, status badges, skeletons, and empty states.
4. Deliver mobile/desktop designs for each state above; use the common API fixtures so both frontend and backend implement the same statuses and errors.
5. Replace copy, assets, and screens; connect the versioned contract; preserve refresh/retry/back-navigation correctness across booking and payment.
6. Verify contrast, keyboard/focus flow, labels/errors, zoom, responsiveness, both languages, deep links, and a complete booking in a non-production environment.

## 6. Rebrand acceptance checklist

- [ ] Public name, legal operator, repository names/owner/host, domains, and language strategy approved.
- [ ] Existing root modifications preserved; unrelated property valuation stays excluded following the requested removal.
- [ ] Required source notices retained; package license metadata reconciled.
- [ ] Logo family, favicon, imagery, social/email assets, brand guide, and usage records delivered.
- [ ] Every source asset reference replaced or intentionally retired; no unused old brand artwork ships.
- [ ] Review occurrences of `mee_app`, `mee__app`, `meeapi`, `PBH`, `pbhabogados`, `Mexicanos en el Extranjero`, `extranejero`, `Brockerhub`, `CILABS`, `montycode`, and stale repository URLs. Required attribution and explicitly historical planning evidence may remain; explain them instead of deleting blindly.
- [ ] Ensure `mapv2` or `property_valuation` source/data is absent from the new legal product. Historical exclusion documentation is intentional.
- [ ] Current-route replacements and redirects work in Spanish/English and mobile/desktop, including loading/error/empty/pending states.
- [ ] Browser metadata, screen-reader labels, external links, communication/payment identity, and firm contact information agree.
- [ ] Production build retains `.jsx` styling and serves vector assets; generated output has no accidental obsolete identity or API configuration.
- [ ] Fresh repository has the intended initial history, correct remote, safe example configuration, reproducible setup, and required notices.
- [ ] Backend integration and hosting/domain cutover verified before retiring the old deployment.

Follow [Repository migration](REPOSITORY-MIGRATION.md) for the exact fresh-history sequence. Renaming a folder/repository or removing local `.git` alone does not erase old remote branches, forks, other clones, caches, or backups. This inventory does not execute history deletion.
