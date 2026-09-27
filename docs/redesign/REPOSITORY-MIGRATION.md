# Repository naming and fresh-history migration

> Historical planning baseline. The frontend redesign has since been implemented; see [Frontend handoff](../FRONTEND-HANDOFF.md) and [Migration record](../MIGRATION-RECORD.md) for current status. Backend implementation is outside this delivery. Legacy source citations below refer to the preserved recovery snapshot, not the new source tree.

Status: original migration runbook. Consult the migration record for the executed local migration; remote history and deployments are separate.

## Observed starting point

- Current folder and package name: `mee_app` (one underscore), rather than the `mee__app` spelling in the request.
- Current origin: `https://gitlab.com/manuelxwhite/mee_app.git`.
- Package repository/bugs/homepage fields instead reference `github.com/montycode/mee_app`; treat these as stale metadata, not a confirmed destination.
- The inspected branch is `master`, with two reachable commits in its log. This is not proof that no other branches, tags, remote copies or historical objects exist.
- `package.json`, `package-lock.json` and `webpack.config.js` already have local changes. Preserve their current content when migrating.
- `property_valuation` was untracked and has now been removed by explicit user request. It must not enter the new frontend or backend repository.
- `LICENSE` contains an MIT notice and original copyright; `package.json` says ISC. Resolve the metadata inconsistency while retaining applicable notices. Rebranding and resetting Git do not replace license obligations.

## Target

After name approval, create independent frontend and backend repositories, provisionally `linde-web` and `linde-api`, with default branch `main`. The frontend's first commit contains the approved source snapshot and planning package; the backend begins with its own scaffold and contract. Each starts without the legacy commit graph or old remotes.

A new active repository can have no old history while a private rollback archive still exists. If “remove any history” means erasing archives, remote copies and every accessible clone as well, that is a separate destructive scope that must identify each location. Local deletion cannot establish global erasure.

## Procedure

### 1. Confirm the migration inputs

Record the approved product name, repository slugs, hosting namespace, target absolute folder paths, deploy owners and whether existing users/bookings need data migration. Confirm no ongoing process depends on the checkout before a folder move. A folder rename is a filesystem operation; a package rename, remote rename and hosting project rename are separate actions.

### 2. Preserve a recoverable source snapshot

Before discarding the old Git directory, preserve the current working files, local modifications and any untracked files that belong to the product. A Git bundle preserves committed history only; it does not preserve uncommitted or untracked work. If rollback history is wanted, keep that archive outside the new repository with restricted access and an agreed retention date.

Record a file manifest and hashes for the selected source. Exclude `node_modules`, generated `dist`, caches, real environment files and credentials from the distributable snapshot. Preserve necessary private configuration separately in the deployment's secret store. Verify restoration before irreversible deletion. Do not use `git archive HEAD` as the only source snapshot because it omits the current edits.

### 3. Create the newly named checkout

Preferred method: copy the approved working source into a newly named directory without copying any `.git` directory or file. An export/copy is not a Git clone and imports no old Git objects. Initialize a fresh Git repository on `main` during the foundation milestone. Apply the identity/configuration changes in step 4 before staging inspected product files and making the first commit. Continue ordinary new development history after that; do not reset it again at release.

If the owner instead wants an in-place reset, resolve the exact `.git` target, confirm it is a normal Git directory rather than a worktree pointer or reparse point, validate it lies within the selected checkout, and verify backups before removing it. Then initialize fresh history. Do not reset Git by orphan-branch creation alone: old refs, reflogs or objects can remain.

No deletion script is supplied or run as part of this plan. The execution task should operate on resolved, reviewed paths; it should never use broad wildcard deletion across project folders.

### 4. Apply identity changes

Update folder/repository/package names, lockfile root metadata, description, author/organization where accurate, repository/bugs/homepage URLs and deployment project labels. Remove stale old-owner URLs rather than substituting an invented new owner. Replace branding and assets according to the [inventory](REBRAND-INVENTORY.md).

Replace hardcoded API configuration with environment-specific public API URLs. Create new deployment bindings deliberately: domain, TLS, email sender, CORS origins, CSRF/origin checks, OAuth callbacks if later added, Stripe webhook URL, analytics tags and CI secret names. Public publishable keys and private backend secrets require different handling; deleting history does not revoke any credential.

Once the reviewed initial snapshot has the approved identity, source notices and safe configuration, create the initial commit. Full screen redesign can then proceed as normal commits in the new repository.

### 5. Establish the remote boundary

Create a new empty remote under the approved owner, add it as the new checkout's only intended origin, and push the initial branch. Review branch protection, CI and access roles. Avoid force-pushing over the existing shared repository as a default migration strategy.

Creating a new remote does not remove the existing GitLab/GitHub repositories, their issues, pipelines, cached objects or other people's clones. Archive, rename or delete old remotes only within the owner's explicit instructions and permissions. A remote project rename alone retains its history.

### 6. Verify and cut over

- `git log --all --oneline` shows only new project commits; before additional work, `git rev-list --all --count` is 1.
- `git show-ref` and `git remote -v` contain only intended refs/remotes. Inspect that no nested `.git` or copied Git archive exists in the new source.
- Compare the source manifest with the preserved snapshot, accounting for intentional identity edits and exclusions.
- Search product files for `mee_app`, `mee__app`, `PBH`, `Punto Broker`, `Brockerhub`, `CILABS`, stale owners and the legacy API URL. Allow historical mentions in migration documentation and required license notices; review rather than blindly replace them.
- Build the production bundle, inspect assets/metadata, test direct URLs/redirects, and confirm the API base URL targets the intended environment.
- Deploy preview first. Confirm login, booking, webhook receipt and notification links on the new domains before production cutover.
- If real appointments exist, reconcile counts/statuses and define a write cutover so two backends cannot accept inconsistent bookings. A code/Git reset does not migrate a database.
- Update saved project paths, developer setup instructions and CI checkout locations after the directory move.

Rollback is a documented switch to the verified prior deployment and data plan. Do not restore old code against incompatible new database migrations without a tested compatibility path.
