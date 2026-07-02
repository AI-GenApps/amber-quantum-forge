---
epic: 00-foundations
task: 03-docs-setup-skeleton
status: completed
depends_on: []
estimate: M
commit_scope: docs
---

# 03 — docs-internal/setup Skeleton

## Goal

Create the 11 `docs-internal/setup/*.md` files that document how to set up every part of the system from scratch. These files are the onboarding guide for new developers and must contain enough detail that someone with no prior context can get the project running.

Also create stub `docs-internal/architecture/` files (beyond auth.md and ai.md which are created separately): `analytics.md`, `config.md`, `design-tokens.md`.

## Context

### Why this is in epic 00

Every subsequent task references `docs-internal/setup/` files. Creating stubs now means later tasks can fill in their specific section rather than creating the file from scratch.

### Target files

```
docs-internal/setup/
  00-overview.md         — what this repo is, how epics relate, how to navigate docs
  01-prerequisites.md    — Node, Bun, Xcode, Ruby-free note, Firebase CLI, EAS CLI
  02-env-vars.md         — full table of every env var with descriptions
  03-database.md         — Postgres setup, Drizzle commands, migration workflow
  04-firebase.md         — Firebase project setup, google-services.json, GoogleService-Info.plist
  05-revenuecat.md       — RevenueCat dashboard, entitlement IDs, shared across Expo + iOS
  06-expo.md             — EAS project setup, app.json, running locally, OTA updates
  07-ios-app.md          — Xcode 26.2, XcodeGen install, SPM, first build
  08-ios-plugins.md      — how to add/remove an iOS plugin
  09-expo-plugins.md     — how to add/remove an Expo plugin
  10-ci-cd.md            — self-hosted macOS runner setup, EAS workflow, web CI
  11-release.md          — App Store + Play Store release checklist

docs-internal/architecture/
  analytics.md           — event registry, Swift codegen, naming conventions
  config.md              — app_config table, GET /api/config/:key, AppConfigContext
  design-tokens.md       — token registry, codegen to Swift colors/spacing
```

## Implementation Checklist

- [x] Create `docs-internal/setup/00-overview.md` with:
  - One-paragraph description of what this repo produces
  - Table: epic name → what it adds to the repo
  - "How to navigate docs" pointer to START.md
  - Pre-commit hook description (the 5 hooks that run)
  - Commit message format (copy from START.md)

- [x] Create `docs-internal/setup/01-prerequisites.md` with:
  - Bun ≥1.1 (install: `curl -fsSL https://bun.sh/install | bash`)
  - Node.js ≥20 (for tools that need it; Bun handles most things)
  - Xcode 26.2+ from Mac App Store (required for epic 05+)
  - XcodeGen: `brew install xcodegen`
  - SwiftLint: `brew install swiftlint`
  - swift-format: `brew install swift-format`
  - Firebase CLI: `bun add -g firebase-tools`
  - EAS CLI: `bun add -g eas-cli`
  - Note: no Ruby, no CocoaPods (SPM only)

- [x] Create `docs-internal/setup/02-env-vars.md` with a full table

- [x] Create `docs-internal/setup/03-database.md` with Neon setup, Drizzle commands

- [x] Create `docs-internal/setup/04-firebase.md` with Firebase project setup instructions

- [x] Create `docs-internal/setup/05-revenuecat.md` with RevenueCat dashboard setup

- [x] Create `docs-internal/setup/06-expo.md` with EAS project setup and commands

- [x] Create `docs-internal/setup/07-ios-app.md` with Xcode setup and build instructions

- [x] Create `docs-internal/setup/08-ios-plugins.md` with plugin add/remove workflow

- [x] Create `docs-internal/setup/09-expo-plugins.md` with plugin add/remove workflow

- [x] Create `docs-internal/setup/10-ci-cd.md` (stub)

- [x] Create `docs-internal/setup/11-release.md` (stub)

- [x] Create `docs-internal/architecture/analytics.md` stub

- [x] Create `docs-internal/architecture/config.md`

- [x] Create `docs-internal/architecture/design-tokens.md` stub

## Files Touched

- `docs-internal/setup/00-overview.md` — create
- `docs-internal/setup/01-prerequisites.md` — create
- `docs-internal/setup/02-env-vars.md` — create
- `docs-internal/setup/03-database.md` — create
- `docs-internal/setup/04-firebase.md` — create
- `docs-internal/setup/05-revenuecat.md` — create
- `docs-internal/setup/06-expo.md` — create
- `docs-internal/setup/07-ios-app.md` — create
- `docs-internal/setup/08-ios-plugins.md` — create
- `docs-internal/setup/09-expo-plugins.md` — create
- `docs-internal/setup/10-ci-cd.md` — create
- `docs-internal/setup/11-release.md` — create
- `docs-internal/architecture/analytics.md` — create
- `docs-internal/architecture/config.md` — create
- `docs-internal/architecture/design-tokens.md` — create

## Verification

- [ ] All 15 files exist and are non-empty
- [ ] `bun run check` exits 0 (Biome will format markdown)
- [ ] Each file has at least a `# Title` H1 heading
- [ ] `docs-internal/setup/02-env-vars.md` contains `API_JWT_SECRET` (new env var)

## Commit

```
docs(docs): add setup skeleton and architecture stubs [00-foundations/03]
```
