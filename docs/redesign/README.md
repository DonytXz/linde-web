# Law firm booking redesign

Planning package prepared 2026-09-26 from the legacy source and the owner's clarification. Implementation status: the approved frontend redesign is now delivered as Linde. See [Frontend handoff](../FRONTEND-HANDOFF.md) and [Migration record](../MIGRATION-RECORD.md). Backend implementation remains outside this task and belongs to the owner.

Backend technology update: the owner has selected **NestJS and MongoDB**. The [backend design package](../backend/README.md) translates the requirements into module boundaries, MongoDB consistency rules, API increments and implementation stages. It supersedes the earlier relational-store proposal without claiming the backend has been implemented.

## Confirmed direction

This product helps clients book consultations with an immigration-focused law firm. Its positioning, visual identity and booking experience are not tied to a particular city, region or border market. Property valuation is unrelated; its folder was removed at the owner's explicit request.

The requested outcome is a complete new identity, redesigned client experience, newly named repository with fresh Git history, and a separately developed backend. This package preserves the original specification. The frontend is implemented; the backend remains a separate, unimplemented project.

## Read in this order

1. [Redesign plan](REDESIGN-PLAN.md): product scope, working identity, visual direction, screens, parallel work and release gates.
2. [Rebrand inventory](REBRAND-INVENTORY.md): exact legacy names, assets and configuration surfaces to replace.
3. [Repository migration](REPOSITORY-MIGRATION.md): rename, fresh history, remote boundaries, preservation and verification.
4. [Backend requirements](BACKEND-REQUIREMENTS.md): workflows, permissions, data model, scheduling, payments and acceptance criteria.
5. [Draft API contract](openapi.json): machine-readable starting point for independent frontend mocks and backend implementation.
6. [Parallel kickoff](PARALLEL-KICKOFF.md): initial assignments, shared fixtures and integration milestones.
7. [Excluded subproject](EXCLUDED-SUBPROJECT.md): scope correction and removal record.

## Decisions still open

- **Public product/firm name:** the approved frontend uses `Linde` and `linde-web`. `linde-api` is a suggested name for the separate backend. No domain, repository, business-name or trademark availability has been checked. Rebranding the software does not establish a new legal entity.
- **Services:** exact practice areas, offered jurisdictions, lawyer roster, languages and consultation modes need the firm's input. A lawyer's authorized jurisdictions determine the services offered; the product's geographic reach does not establish authority to practice.
- **Commercial rules:** prices, currency, tax/invoice handling, booking lead times, cancellation and refund policy.
- **Operating model:** assignment by practice area versus client-selected lawyer; conflict screening before payment if the firm requires it; email/video/calendar providers.
- **Technical ownership:** hosting account, new remote namespace and any legacy data migration. The selected backend technologies are NestJS and MongoDB; see the design package above.

The recommendations retain Spanish as the proposed default language and English as a first-release alternative. Office/lawyer timezones, service jurisdictions and accepted currencies are explicitly configured by the firm; there is no location-based production default. The language choices remain proposed defaults, not answers supplied by the owner.

## Status and evidence limits

- Code inspection identified actual existing requests and UI gaps; the deployed API, its database, provider accounts and production traffic were not accessed.
- Frontend implementation and unrelated-folder removal are complete; legacy local changes were preserved in an external recovery snapshot before replacement.
- See the migration record for repository status and the handoff for validation and release prerequisites. No remote deployment was changed.
- The API contract is a draft until both workstreams reconcile and version it. Staff/admin operations need their own contract increment.

The contract contains 19 paths, 22 operations, 41 schemas and 243 internal references. Frontend-generated types derive from this contract. This is not a running-backend test.

Payment requirements were checked against [Stripe PaymentIntents](https://docs.stripe.com/payments/payment-intents) and [Stripe webhooks](https://docs.stripe.com/webhooks). These sources support server-created intents, idempotency and verified event processing; they do not establish this firm's pricing or refund policy.
