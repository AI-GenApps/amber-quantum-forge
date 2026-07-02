# START — Task Execution Guide

This file is the **single entry point** for any agent or developer implementing the powerpack evolution of `starter-expo-mobile`. Read it fully before touching any code.

---

## What this repo becomes

A Turborepo + Bun monorepo that can bootstrap **either an Expo/React Native app OR a native iOS SwiftUI app** (or both), with:

- **Two-stage JWT auth**: Firebase Auth on-device → `POST /api/auth/exchange` → long-lived API access token + refresh token. All mobile API calls use `Authorization: Bearer <accessToken>`. Web admin keeps existing cookie/session flow.
- **AI first-class**: Vercel AI SDK + OpenAI server-side, streaming SSE in Vercel data-stream format. iOS has a native Swift SSE parser for token streaming parity.
- **Plugin architecture**: features live in `plugins/expo/*` (TS) and `plugins/ios/*` (Swift packages). Adding/removing a feature = editing two lines.
- **3-screen onboarding carousel** in the Expo app.
- **iOS app** (`apps-native/ios-app/`) using SwiftUI + SwiftData + XcodeGen + SPM. iOS 17 min. Xcode 26.2.
- **Chat history**: client-only v1 (SwiftData / AsyncStorage). Periodic sync via `POST /api/chat/sync`.
- **CI**: self-hosted macOS runner for iOS, EAS workflow for Expo, GitHub Actions for web.
- **Husky pre-commit hooks** — NEVER bypass with `--no-verify`.

---

## Repo layout (target state)

```
starter-expo-mobile/
  apps/
    native/                         # Expo 55 app (upgraded in epic 04)
    web/                            # Next.js 16 + Hono API
  apps-native/
    ios-app/                        # SwiftUI app (epic 05+). NOT a bun workspace.
      project.yml                   # XcodeGen spec
      Package.swift                 # root SPM manifest (links plugins)
      Starter/
        Core/                       # networking, auth, analytics, config
        Features/                   # Chat, Onboarding, Plans, Profile
        Resources/                  # assets, colors, strings
        Generated/                  # auto-generated Swift from codegen script
      StarterWidget/
  plugins/
    ios/
      auth/                         # Swift package — Apple/Google sign-in + exchange
      ai/                           # Swift package — AICore + SSE parser + OnDeviceAI stub
      chat-module/                  # Swift package — SwiftUI chat + SwiftData + sync
    expo/
      auth/                         # @plugin/expo-auth bun workspace
      ai/                           # @plugin/expo-ai bun workspace
      chat-module/                  # @plugin/expo-chat-module bun workspace
  packages/
    api/                            # Hono app — src/routes/, src/middleware/
    db/                             # Drizzle ORM — src/schema.ts, src/db.ts
    ui/                             # shared React components
    ai/                             # NEW — Vercel AI SDK + OpenAI wrapper
    analytics/                      # NEW — TS event registry (Swift codegen source)
    typescript-config/
  scripts/
    codegen-swift.ts                # generates Generated/*.swift from TS types
    check-max-lines.ts              # existing
    check-staged-types.ts           # existing
    check-no-middleware.ts          # existing
    check-banned-deps.ts            # existing
  docs-internal/
    setup/
      00-overview.md
      01-prerequisites.md
      02-env-vars.md
      03-database.md
      04-firebase.md
      05-revenuecat.md
      06-expo.md
      07-ios-app.md
      08-ios-plugins.md
      09-expo-plugins.md
      10-ci-cd.md
      11-release.md
    architecture/
      auth.md
      ai.md
      analytics.md
      config.md
      design-tokens.md
  docs-public/                  # public docs for users/support
  tasks/
    START.md                        # this file
    STATUS.md                       # global epic checklist
    epics/
      00-foundations/
      01-auth-redesign/
      02-ai-server/
      03-expo-plugins/
      04-expo-app-upgrade/
      05-ios-scaffold/
      06-ios-auth-plugin/
      07-ios-ai-plugin/
      08-ios-chat-module/
      09-ci-cd/
      10-polish-release/
  .husky/
  .github/workflows/
  .eas/workflows/
```

---

## Key environment variables

These must be set in `.env` (local) and Vercel dashboard (production):

```
# Database
DATABASE_URL=postgresql://...

# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# JWT (new — for API access tokens)
API_JWT_SECRET=<random 64-char hex>

# OpenAI
OPENAI_API_KEY=sk-...

# RevenueCat (server-side notifications, optional)
REVENUECAT_WEBHOOK_SECRET=

# Expo (client)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_API_URL=https://your-domain.com/api
```

---

## Execution Protocol

Follow this protocol **exactly** for every task. Context is lost between sessions — the task files are the single source of truth.

### Step 1 — Pick the next task

1. Open `tasks/STATUS.md` — find the first unchecked epic.
2. Open `tasks/epics/XX-<epic>/STATUS.md` — find the first task with `status: pending` whose `depends_on` entries are all `status: completed`.
3. Open the task file `tasks/epics/XX-<epic>/YY-<task>.md`.

### Step 2 — Mark in-progress

Update the task file frontmatter: `status: pending` → `status: in-progress`.
Update `tasks/epics/XX-<epic>/STATUS.md` task row: `[ ]` → `[~]` (tilde = in-progress).

### Step 3 — Implement

Follow the **Implementation Checklist** in the task file step by step.
- Read the **Context** section for exact file paths and relevant existing code.
- Follow the **Files Touched** list — these are the files to create or modify.
- Do **not** skip a checklist item.
- Each item must be a real, concrete change in the codebase.

### Step 4 — Verify

Run every item in the **Verification** section of the task file.
The mandatory baseline for every task is:
```bash
bun run check          # Biome format + lint + typecheck
```
For tasks that add new packages or routes, also run:
```bash
bun run typecheck
```
For DB tasks:
```bash
cd packages/db && bun run db:generate && bun run db:push
```
**Do not proceed to commit if any check fails. Fix first.**

### Step 5 — Mark complete

- Tick all `- [ ]` items in the task Implementation Checklist → `- [x]`.
- Set frontmatter `status: in-progress` → `status: completed`.
- Update `tasks/epics/XX-<epic>/STATUS.md`: `[~]` → `[x]`.
- If this was the last task in the epic, update `tasks/STATUS.md`: `[ ]` → `[x]` for that epic.

### Step 6 — Commit

One task = one commit. Format:

```
<type>(<scope>): <short imperative summary> [<epic-slug>/<task-num>]
```

Where:
- `<type>` is one of: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`
- `<scope>` is the `commit_scope` field from the task frontmatter
- `<short imperative summary>` is ≤72 chars, present tense (e.g. "add exchange endpoint", not "added")
- `[<epic-slug>/<task-num>]` is the bracket suffix identifying the task

Examples:
```
feat(auth): add JWT utils package with sign/verify helpers [01-auth-redesign/01]
chore(foundations): add husky + lint-staged pre-commit hooks [00-foundations/00]
feat(ai): scaffold packages/ai with Vercel AI SDK wrapper [02-ai-server/00]
docs(tasks): mark epic 00 complete [tasks/status]
```

**NEVER use `--no-verify` or `--no-gpg-sign`. Pre-commit hooks must pass.**
If a hook fails, fix the issue, stage the fix, and retry the commit.

The pre-commit hook runs:
1. `bun run check:max-lines` — no file may exceed 300 lines
2. `bun run check:no-middleware` — `apps/web/middleware.ts` must not exist
3. `bun run check:banned-deps` — no banned npm packages
4. `bun run check:staged-types` — TypeScript types check on staged files
5. `bunx lint-staged` — Biome format + lint on staged files

### Step 7 — Move to next task

Repeat from Step 1.

---

## Dependency graph (inter-epic)

```
00-foundations  ──► all other epics (must complete first)
01-auth-redesign ──► 03-expo-plugins, 04-expo-app-upgrade, 05-ios-scaffold
02-ai-server    ──► 03-expo-plugins, 04-expo-app-upgrade, 05-ios-scaffold
03-expo-plugins ──► 04-expo-app-upgrade
05-ios-scaffold ──► 06-ios-auth-plugin, 07-ios-ai-plugin, 08-ios-chat-module
06-ios-auth-plugin ──► 08-ios-chat-module
07-ios-ai-plugin   ──► 08-ios-chat-module
all             ──► 09-ci-cd, 10-polish-release
```

Epics 01 and 02 can run in parallel after 00 is done.
Epics 03 and 04 can start once 01+02 are done.
Epic 05 can start once 01 is done (needs auth contract).
Epics 06, 07, 08 can run in parallel once 05 is done.

---

## Blocked task protocol

If a task is blocked (missing secret, external service not configured, etc.):
1. Set frontmatter `status: blocked`.
2. Add a `## Blocked Reason` section to the task file explaining what is needed.
3. Update epic STATUS.md Notes.
4. Skip to next unblocked task.
5. Surface the blocker to the user in a summary message.

---

## Architecture references

Before implementing auth tasks, read: `docs-internal/architecture/auth.md`
Before implementing AI tasks, read: `docs-internal/architecture/ai.md`
Before implementing analytics: `docs-internal/architecture/analytics.md` (created in epic 00)
Config system: `docs-internal/architecture/config.md` (created in epic 00)

---

## Conventions

- **Package manager**: Bun only. Never use npm or yarn.
- **Linter/formatter**: Biome. Config in `biome.json`. Run `bun run check` not `eslint`.
- **Line limit**: 300 lines per file. Split if needed.
- **No comments** in source code unless the task explicitly says to add them.
- **TypeScript strict**: all new TS files must typecheck cleanly.
- **No `any`**: avoid TypeScript `any`; use `unknown` + type guards.
- **Imports**: use named imports. No default imports for internal modules except React and Hono route handlers.
- **Env vars**: never hardcode secrets. Always read from `process.env`. Validate at startup with a guard.
- **Drizzle**: schema changes require `bun run db:generate` + `bun run db:push` before testing.
- **Hono routes**: each route file exports a `new Hono()` instance. Mount in `packages/api/src/index.ts`.
- **Swift**: SwiftUI views in `Features/<FeatureName>/Views/`. Models in `Core/Models/`. No UIKit unless unavoidable.
- **XcodeGen**: never edit `*.xcodeproj` directly. Edit `project.yml`, then run `xcodegen generate`.
- **SPM plugins**: each `plugins/ios/<name>/` is a Swift package with its own `Package.swift`. Linked via `project.yml` `packages:` and `dependencies:`.

---

## Quick-start cheat sheet

```bash
# Install all JS/TS dependencies
bun install

# Run all checks (must pass before every commit)
bun run check

# Start web + API in dev
bun run dev

# Run only native app
cd apps/native && bun run dev

# Generate DB migrations after schema change
cd packages/db && bun run db:generate && bun run db:push

# Open Drizzle Studio
cd packages/db && bun run db:studio

# Generate Swift code from TS types
bun run scripts/codegen-swift.ts

# iOS: regenerate Xcode project after editing project.yml
cd apps-native/ios-app && xcodegen generate
```

## Architecture references

- [Auth flow](../docs-internal/architecture/auth.md)
- [AI streaming](../docs-internal/architecture/ai.md)
- [Analytics](../docs-internal/architecture/analytics.md)
- [Config system](../docs-internal/architecture/config.md)
- [Design tokens](../docs-internal/architecture/design-tokens.md)
