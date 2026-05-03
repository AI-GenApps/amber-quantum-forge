---
epic: 00-foundations
task: 03-docs-setup-skeleton
status: pending
depends_on: []
estimate: M
commit_scope: docs
---

# 03 — docs/setup Skeleton

## Goal

Create the 11 `docs/setup/*.md` files that document how to set up every part of the system from scratch. These files are the onboarding guide for new developers and must contain enough detail that someone with no prior context can get the project running.

Also create stub `docs/architecture/` files (beyond auth.md and ai.md which are created separately): `analytics.md`, `config.md`, `design-tokens.md`.

## Context

### Why this is in epic 00

Every subsequent task references `docs/setup/` files. Creating stubs now means later tasks can fill in their specific section rather than creating the file from scratch.

### Target files

```
docs/setup/
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

docs/architecture/
  analytics.md           — event registry, Swift codegen, naming conventions
  config.md              — app_config table, GET /api/config/:key, AppConfigContext
  design-tokens.md       — token registry, codegen to Swift colors/spacing
```

## Implementation Checklist

- [ ] Create `docs/setup/00-overview.md` with:
  - One-paragraph description of what this repo produces
  - Table: epic name → what it adds to the repo
  - "How to navigate docs" pointer to START.md
  - Pre-commit hook description (the 5 hooks that run)
  - Commit message format (copy from START.md)

- [ ] Create `docs/setup/01-prerequisites.md` with:
  - Bun ≥1.1 (install: `curl -fsSL https://bun.sh/install | bash`)
  - Node.js ≥20 (for tools that need it; Bun handles most things)
  - Xcode 26.2+ from Mac App Store (required for epic 05+)
  - XcodeGen: `brew install xcodegen`
  - SwiftLint: `brew install swiftlint`
  - swift-format: `brew install swift-format`
  - Firebase CLI: `bun add -g firebase-tools`
  - EAS CLI: `bun add -g eas-cli`
  - Note: no Ruby, no CocoaPods (SPM only)

- [ ] Create `docs/setup/02-env-vars.md` with a full table:
  | Variable | Required | Description | Where to get it |
  |---|---|---|---|
  | DATABASE_URL | yes | PostgreSQL connection string | Neon / Supabase / local |
  | FIREBASE_PROJECT_ID | yes | Firebase project ID | Firebase Console |
  | FIREBASE_CLIENT_EMAIL | yes | Firebase service account email | Firebase Console → Service Accounts |
  | FIREBASE_PRIVATE_KEY | yes | Firebase service account private key | Firebase Console → Service Accounts |
  | API_JWT_SECRET | yes | 64-char hex secret for signing API JWTs | `openssl rand -hex 32` |
  | OPENAI_API_KEY | yes | OpenAI API key | platform.openai.com |
  | EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID | yes | Google OAuth web client ID | Google Cloud Console |
  | EXPO_PUBLIC_API_URL | yes | Base URL for the API | e.g. https://your-app.vercel.app/api |
  | REVENUECAT_WEBHOOK_SECRET | no | RevenueCat S2S notification secret | RevenueCat dashboard |

- [ ] Create `docs/setup/03-database.md` with:
  - Recommended: Neon (serverless Postgres, free tier)
  - Connection string format
  - First-time setup: `cd packages/db && bun run db:push`
  - After schema changes: `bun run db:generate && bun run db:push`
  - Viewing data: `bun run db:studio`
  - Schema location: `packages/db/src/schema.ts`

- [ ] Create `docs/setup/04-firebase.md` with:
  - Create Firebase project at console.firebase.google.com
  - Enable Authentication → Google + Apple providers
  - Download `google-services.json` → `apps/native/google-services.json`
  - Download `GoogleService-Info.plist` → `apps/native/GoogleService-Info.plist`
  - For admin SDK: create service account, download JSON, extract `project_id`, `client_email`, `private_key` into env vars
  - Grant admin custom claim: `bun --cwd packages/api run grant-admin <uid>`

- [ ] Create `docs/setup/05-revenuecat.md` with:
  - Create RevenueCat project
  - Add iOS app (bundle ID: `app.w3dev.starter`) and Android app
  - Create entitlement: `pro`
  - Create offering: `default`
  - Add `REVENUECAT_API_KEY_IOS` and `REVENUECAT_API_KEY_ANDROID` to Expo `app.json` `extra` block
  - Same project/entitlement IDs used in iOS native app

- [ ] Create `docs/setup/06-expo.md` with:
  - Install EAS CLI, login: `eas login`
  - Create EAS project: `eas init`
  - Configure `eas.json` profiles
  - Local development: `cd apps/native && bun run dev`
  - OTA updates: `eas update --branch preview`
  - Build: `eas build --platform ios --profile development`

- [ ] Create `docs/setup/07-ios-app.md` with:
  - Prerequisites: Xcode 26.2, XcodeGen, SwiftLint, swift-format
  - Generate project: `cd apps-native/ios-app && xcodegen generate`
  - Open: `open Starter.xcodeproj`
  - First build: select simulator, ⌘B
  - Bundle IDs: `app.w3dev.starter` (app), `app.w3dev.starter.widget` (widget)
  - App Group: `group.app.w3dev.starter`
  - Signing: use automatic signing in Xcode for development

- [ ] Create `docs/setup/08-ios-plugins.md` with:
  - Plugin location: `plugins/ios/<plugin-name>/`
  - Each plugin is a Swift Package with its own `Package.swift`
  - To add: (1) add `path: "../../plugins/ios/<name>"` to `Package.swift` dependencies, (2) add target dependency in `project.yml`
  - To remove: reverse the two steps, delete `plugins/ios/<name>/`
  - Run `xcodegen generate` after any `project.yml` change

- [ ] Create `docs/setup/09-expo-plugins.md` with:
  - Plugin location: `plugins/expo/<plugin-name>/`
  - Each plugin is a bun workspace named `@plugin/expo-<name>`
  - Add to `workspaces` in root `package.json`
  - Import in Expo app: `import { ... } from "@plugin/expo-auth"`
  - To remove: remove workspace entry, remove import, `bun install`

- [ ] Create `docs/setup/10-ci-cd.md` (stub — detailed content added in epic 09):
  - iOS CI: `.github/workflows/ios-ci.yml` on self-hosted macOS runner
  - Runner labels: `[self-hosted, macOS, xcode-26.2]`
  - Expo CI: `.eas/workflows/expo-ci.yml`
  - Web CI: `.github/workflows/web-ci.yml`
  - See epic 09 tasks for full setup instructions

- [ ] Create `docs/setup/11-release.md` (stub — detailed content added in epic 10):
  - iOS: Xcode Archive → App Store Connect
  - Android: `eas build --platform android --profile production`
  - Web: Vercel auto-deploys on push to `main`

- [ ] Create `docs/architecture/analytics.md` stub with:
  - TS event registry in `packages/analytics/src/events.ts`
  - Codegen script generates `apps-native/ios-app/Starter/Generated/AnalyticsEvents.swift`
  - Event naming: `screen_viewed`, `button_tapped`, `purchase_completed` (snake_case)
  - Both Expo and iOS call the same event names for cross-platform consistency

- [ ] Create `docs/architecture/config.md` with:
  - `app_config` table: `{ key: text PK, value: jsonb, updatedAt: timestamp }`
  - Public endpoint: `GET /api/config/app-metadata` (no auth required)
  - Protected write: `PUT /api/config/:key` (admin only)
  - Typed key registry: `packages/api/src/types/config.ts`
  - Native reads via `apps/native/services/appMetadata.ts` → `AppConfigContext`
  - iOS reads via `Core/Config/AppConfigService.swift` (created in epic 05)

- [ ] Create `docs/architecture/design-tokens.md` stub with:
  - Token registry in `packages/ui/src/tokens.ts`
  - Colors, spacing, typography
  - Codegen: `scripts/codegen-swift.ts` → `Generated/DesignTokens.swift`

## Files Touched

- `docs/setup/00-overview.md` — create
- `docs/setup/01-prerequisites.md` — create
- `docs/setup/02-env-vars.md` — create
- `docs/setup/03-database.md` — create
- `docs/setup/04-firebase.md` — create
- `docs/setup/05-revenuecat.md` — create
- `docs/setup/06-expo.md` — create
- `docs/setup/07-ios-app.md` — create
- `docs/setup/08-ios-plugins.md` — create
- `docs/setup/09-expo-plugins.md` — create
- `docs/setup/10-ci-cd.md` — create
- `docs/setup/11-release.md` — create
- `docs/architecture/analytics.md` — create
- `docs/architecture/config.md` — create
- `docs/architecture/design-tokens.md` — create

## Verification

- [ ] All 15 files exist and are non-empty
- [ ] `bun run check` exits 0 (Biome will format markdown)
- [ ] Each file has at least a `# Title` H1 heading
- [ ] `docs/setup/02-env-vars.md` contains `API_JWT_SECRET` (new env var)

## Commit

```
docs(docs): add setup skeleton and architecture stubs [00-foundations/03]
```
