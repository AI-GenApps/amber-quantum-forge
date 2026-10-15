---
epic: 17-city-drive
task: 21-release-readiness
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/20-apply-name-and-brand]
estimate: M
owner: agent
---

# Release readiness: privacy, data safety, listing, web deploy workflow

## Goal

Prepare everything the stores and the web launch need that an agent can do
without consoles or devices.

## Context / Decisions

- **Privacy:**
  - v1 collects **no data**: no network, no analytics, no accounts, no ads.
    Verify this in code (grep for `fetch(`, `XMLHttpRequest`, `WebSocket`,
    `navigator.sendBeacon`, and analytics SDKs) and in the native manifests:
    Android `INTERNET` is needed only for the WebView; Capacitor adds it by
    default, and that is fine to keep, but document it.
  - Write a privacy policy page in `docs-public/` (follow the existing
    per-game privacy pages there, if any; check first) stating that no data is
    collected.
- **Store listing** (`.agents/games/city-drive/store-listing.md`):
  - title (≤ 30), short description (≤ 80), full description (≤ 4000)
  - category Racing or Simulation (pick one and justify it against the
    competitor research)
  - tags; content rating answers (IARC: no violence beyond cartoon car
    collisions, no user interaction)
  - Google Play Data Safety (no data collected or shared)
  - App Store privacy nutrition label (Data Not Collected)
  - "Contains ads: No", "In-app purchases: No"
- **Screenshot plan:** list the 8 shots needed (phone 16:9 landscape, 7"
  and 10" tablet) with a scene, state, and caption for each. **Capturing them
  is a human task (task 22)**, because agents do no browser or screen captures.
- **Web deploy workflow** (repo rule: deployments only via GitHub Actions,
  never the Vercel CLI):
  - Add `.github/workflows/deploy-city-drive-web.yml`, modelled on
    `deploy-vercel.yml` (same `W3Dev/vercel-deploy` action).
  - Trigger: `workflow_dispatch` only for now.
  - It builds `apps-games/city-drive` and deploys `dist/` to a **separate
    Vercel project** whose ID comes from the repository secret or variable
    `CITY_DRIVE_VERCEL_PROJECT_ID`.
  - The job fails fast with a clear message if the secret is missing.
  - Do **not** run it. Creating the Vercel project and the secret is in human
    task 22.
- **Web build hardening:**
  - Add correct cache headers for hashed assets via a `vercel.json` in the app
    dir.
  - Serve `.wasm` with `application/wasm`.
  - Add a `<noscript>` / WebGL2-unsupported fallback screen (tested by
    stubbing `getContext` to return null).
- **Release docs:** `docs-internal/gaming/city-drive-release.md` covers:
  - versioning (`versionName` / `versionCode` / `CFBundleVersion` from the
    registry release fields; add a small sync script, if the existing games
    tooling doesn't cover web games, and test it)
  - signing steps (human)
  - the upload checklist

## Implementation Checklist

- [ ] No-data audit (record the grep output in evidence) and the privacy
      policy page.
- [ ] `store-listing.md`, completed.
- [ ] Screenshot plan.
- [ ] `deploy-city-drive-web.yml` (dispatch only, fail-fast on the missing
      project id) plus the app `vercel.json`.
- [ ] The WebGL2-unsupported fallback, with a test.
- [ ] Version sync script, tested.
- [ ] Release doc; update `.agents/games/city-drive/open-questions.md`.

## Files Touched

- `docs-public/**` (privacy page), `docs-internal/gaming/city-drive-release.md`
- `.github/workflows/deploy-city-drive-web.yml`, `apps-games/city-drive/{vercel.json,index.html,src/**,scripts/sync-version.ts,test/**}`
- `.agents/games/city-drive/{store-listing.md,open-questions.md}`, `.agents/resources/2026-10-15/city-drive-qa/21/README.md`

## Acceptance Criteria

- The no-data audit is clean.
- The listing fields are within their length limits; a test or script checks
  the lengths.
- The deploy workflow is valid YAML, is dispatch-only, and is never executed
  by the agent.
- The fallback and version-sync tests pass.
- `bun run docs:validate` passes for the new docs (or the staged-docs hook
  passes).

## Out of Scope

- Running deploys, store console work, signing, real screenshots.

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:build`
- `bun run check:ci`
- `bun run check:staged-docs` (after staging)

## Commit message

`chore(city-drive): add release readiness docs and web deploy workflow [17-city-drive/21]`

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **Privacy page:** follow the precedent `docs-public/legal/glow-rescue-privacy-policy.md`, and add the page to `docs-public/docs.json` navigation.
- **Version sync:** the script sets these fields, and the sync test asserts all of them:
  - `versionName` and `versionCode` (Android `build.gradle`)
  - `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` (iOS)

  Editing `ios/App/App.xcodeproj/project.pbxproj` is a documented exception for Capacitor projects (the "never edit .xcodeproj" rule is for XcodeGen apps); the alternative is an xcconfig. Record which in the release doc.
- **Vercel project settings,** documented in the release doc and in task 22:
  - Root Directory = `apps-games/city-drive`
  - "Include source files outside of the Root Directory" = on
  - Install command run from the repo root (`cd ../.. && bun install --frozen-lockfile`), because `@city-drive/core` is a workspace dependency
  - Build command `bun run build`, output `dist`
- **Tooling tests:** after any `games:test:tooling` run, run `git checkout -- apps-native/`.
