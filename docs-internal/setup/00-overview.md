# 00 — Overview

`starter-expo-mobile` is a Turborepo + Bun monorepo that bootstraps a production-ready mobile app with an Expo/React Native app, a native iOS SwiftUI app, and a Flutter app, backed by a Next.js + Hono API with Drizzle ORM.

## What each epic adds

| Epic | Name | What it adds |
|------|------|--------------|
| 00 | Foundations | Husky, lint-staged, commitlint, secretlint, docs skeleton |
| 01 | Auth Redesign | Two-stage JWT auth, exchange/refresh/revoke endpoints |
| 02 | AI Server | `packages/ai`, Vercel AI SDK, `/api/ai/chat`, `/api/chat/sync` |
| 03 | Expo Plugins | `plugins/expo/auth`, `plugins/expo/ai`, `plugins/expo/chat-module` |
| 04 | Expo App Upgrade | Zustand, React Query, axios, themed components, onboarding carousel |
| 05 | iOS Scaffold | XcodeGen, SPM, SwiftUI shell, Widget, codegen script |
| 06 | iOS Auth Plugin | `plugins/ios/auth` — Apple/Google sign-in, Keychain, refresh interceptor |
| 07 | iOS AI Plugin | `plugins/ios/ai` — AICore, SSE parser, OnDeviceAI stub |
| 08 | iOS Chat Module | `plugins/ios/chat-module` — SwiftUI chat, SwiftData, sync |
| 09 | CI/CD | Self-hosted macOS runner, EAS workflow, web CI |
| 10 | Polish & Release | Codegen verification, seed data, doc cross-links, release checklist |
| 12 | Flutter App | `apps-native/flutter-app`, `plugins/flutter/{auth,ai,chat}`, shared codegen registry, `codegen-dart.ts`, Flutter CI |

## How to navigate docs

- Start here, then read `docs-internal/setup/01-prerequisites.md` before writing any code.
- For task execution rules, read `tasks/START.md`.
- Architecture decisions are in `docs-internal/architecture/`.

## Pre-commit Hooks

This repository uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to enforce code quality on every commit.

The pre-commit hook runs the following checks in order:

1. `bun run check:max-lines` — no file may exceed 300 lines
2. `bun run check:no-middleware` — `apps/web/middleware.ts` must not exist
3. `bun run check:banned-deps` — no banned npm packages
4. `bun run check:staged-types` — TypeScript type-check on staged files
5. `bunx lint-staged` — Biome format + lint + secretlint on staged files

**Never bypass hooks with `--no-verify`.**

## Commit message format

```
<type>(<scope>): <short imperative summary> [<epic-slug>/<task-num>]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`, `build`

Example:
```
feat(auth): add JWT exchange endpoint [01-auth-redesign/02]
```
