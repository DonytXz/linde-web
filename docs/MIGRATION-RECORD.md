# Local migration record

## Frontend replacement

Implemented identity: **Linde**. Package name: **linde-web**. The former React/Webpack frontend, PBH artwork and legacy API configuration were replaced by the new bilingual TypeScript/Vite client. The unrelated `property_valuation` folder was removed at the owner's explicit request before implementation. No property-valuation code or data is part of this product.

The existing MIT copyright notice remains. Package license metadata now agrees with that notice. Fonts include their redistribution notices. The old application files cited by the planning inventory are historical evidence; they are available in the external recovery snapshot, not under the new `src` directory.

## Recovery material

Before replacing source or dependencies, the original working files were copied outside the project to `C:\Users\CarlosDonatoAlvarezF\AppData\Local\Temp\linde-legacy-20260926-194240`.

- `source/`: 67 original files, including the pre-existing package, lockfile and Webpack edits, with SHA-256 verification against `manifest.json`.
- `legacy-history.bundle`: verified Git bundle containing all seven refs captured at backup time.
- `node_modules/`: previous dependency tree, retained outside the active product.

This temporary recovery location can be cleared by operating-system cleanup. Move it to an intentional private archive if longer retention is desired. It is not published, copied into the new repository or needed to run Linde.

## Repository migration status

The active local folder is `C:\Users\CarlosDonatoAlvarezF\Proyects\linde-web`. Source files were copied and hash-verified, dependencies transferred, and the old `.git` archived as `legacy-dotgit/` in the recovery location. A fresh `main` repository was initialized; the delivery is recorded in one new initial commit with no remote.

Windows held the original workspace directory open, preventing an in-place folder rename. Its contents were instead copied to `retired-workspace/` in the recovery location, verified, and removed from the old folder. The old `mee_app` folder contains only a README pointing to the new location. Open `linde-web` as the project for future work; the old empty workspace can be removed after closing the app/terminal handles that hold it.

The original remote is not deleted, force-pushed or renamed. Remote hosting namespace and deployment ownership were not specified. Resetting local history does not erase old remote commits, other clones, forks or the private recovery archive.

## Scope boundary

No backend implementation, server deployment, production data migration, mail delivery, live charge or domain cutover is included. Backend Markdown and the OpenAPI draft are the handoff for the owner's independent API project. The protected staff page is a placeholder for a later operational contract/UI increment.

## Subsequent publication

The owner subsequently requested a push to GitHub and verification of GitHub Pages, and explicitly selected a public repository. The new destination is [DonytXz/linde-web](https://github.com/DonytXz/linde-web); it receives only the fresh Linde history. The original legacy remote remains untouched. See [GitHub Pages](GITHUB-PAGES.md) for the deployment workflow.
