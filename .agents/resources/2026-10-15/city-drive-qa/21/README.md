# Task 21: release readiness evidence

Date: 2026-10-16. Nothing here was deployed, run on a device, or submitted to a store.

| File | What it is |
|---|---|
| `no-data-audit.txt` | Raw grep output for the no-data audit (network APIs, analytics SDKs, URLs, CDN references, Android permissions and dependencies, iOS usage strings). |
| `competitor-categories.txt` | Play category of the five task 00 competitors, read from their store pages on 2026-10-16 (3 Racing, 2 Simulation). Basis for choosing Racing. |
| `city-drive-test.log` | Full `bun run city-drive:test` output (core 483 tests, app 651 passed and 1 skipped). |
| `workflow-yaml-check.txt` | PyYAML load of `deploy-city-drive-web.yml`: triggers and step names. |

## Audit result

Clean. The single `fetch(` is `src/main.ts`, loading the app's own `assets/...` files relative to
`BASE_URL`. The one SDK-name hit (`segment`, in `lane-index.ts`) is a road-lane "segment", not an
analytics SDK. Android declares only `INTERNET`; `Info.plist` has no usage strings. The audit is now a
permanent test: `apps-games/city-drive/test/release/noData.test.ts`.

## What was added

- `docs-public/legal/street-royale-privacy-policy.md` (+ `docs-public/docs.json` navigation).
- `.agents/games/city-drive/store-listing.md` completed; lengths enforced by
  `test/release/storeListing.test.ts` (title 13/30, short 70/80, full 1417/4000, subtitle 22/30,
  keywords 81/100, promo 138/170). Eight-shot screenshot plan included.
- `.github/workflows/deploy-city-drive-web.yml` (dispatch only; first step fails when
  `CITY_DRIVE_VERCEL_PROJECT_ID` or `VERCEL_TOKEN` is missing). Never run.
- `apps-games/city-drive/vercel.json` (immutable cache for hashed bundles, `application/wasm`,
  install/build/output settings).
- WebGL2 fallback: `src/support/{webgl,guard,unsupported}.ts|css`, wired into `src/main.ts`, plus a
  `<noscript>` in `index.html`; tested with `getContext` stubbed to return null.
- Version sync: `scripts/syncVersion.ts` + `scripts/sync-version.ts` (`bun run sync-version`,
  `--check`), applied once: `versionName` "1.0" became "0.1.0"; `MARKETING_VERSION` 1.0 became 0.1.0.
  `versionCode` and `CURRENT_PROJECT_VERSION` were already 1.
- `docs-internal/gaming/city-drive-release.md` (+ `docs-internal/docs.json`), including the Vercel
  project settings and the decision to edit `project.pbxproj` in place.
- `.agents/games/city-drive/open-questions.md`: rows 3 and 6 updated, rows 16 to 20 added.

## NOT RUN

Deploy workflow run, Vercel project creation, device/emulator runs, iOS build, store console steps,
screenshots, feature graphic, trademark clearance, signing.
