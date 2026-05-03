# Starter Expo Mobile — Powerpack

Turborepo + Bun monorepo that bootstraps a production-ready mobile product with an Expo/React Native app, a native iOS SwiftUI app, and a Next.js + Hono API backend.

## What you get

- **Expo app** (`apps/native`) — Firebase Auth, RevenueCat, 3-screen onboarding, streaming AI chat
- **Next.js web app** (`apps/web`) — Tailwind CSS, shadcn/ui, admin panel
- **Hono API** (`packages/api`) — hosted in Next.js, JWT auth, OpenAI streaming chat, config system
- **SwiftUI iOS app** (`apps-native/ios-app`) — XcodeGen, SPM, SwiftData, widget
- **Two-stage JWT auth** — Firebase ID token → API access token + refresh token
- **OpenAI streaming chat** — Vercel AI SDK server-side, native SSE parser on iOS
- **Plugin architecture** — features in `plugins/expo/*` and `plugins/ios/*`
- **CI/CD** — self-hosted macOS runner (iOS), EAS (Expo), GitHub Actions (web)

## Quick start

```bash
bun install
cp .env.example .env   # fill in values — see docs/setup/02-env-vars.md
cd packages/db && bun run db:push
bun run dev
```

## Docs

| File | Contents |
|---|---|
| [docs/setup/00-overview.md](docs/setup/00-overview.md) | Repo overview, hooks, commit format |
| [docs/setup/01-prerequisites.md](docs/setup/01-prerequisites.md) | Bun, Xcode, tools |
| [docs/setup/02-env-vars.md](docs/setup/02-env-vars.md) | All environment variables |
| [docs/setup/03-database.md](docs/setup/03-database.md) | Postgres + Drizzle |
| [docs/setup/04-firebase.md](docs/setup/04-firebase.md) | Firebase project setup |
| [docs/setup/05-revenuecat.md](docs/setup/05-revenuecat.md) | RevenueCat setup |
| [docs/setup/06-expo.md](docs/setup/06-expo.md) | EAS + Expo CLI |
| [docs/setup/07-ios-app.md](docs/setup/07-ios-app.md) | Xcode + XcodeGen |
| [docs/setup/08-ios-plugins.md](docs/setup/08-ios-plugins.md) | iOS plugin system |
| [docs/setup/09-expo-plugins.md](docs/setup/09-expo-plugins.md) | Expo plugin system |
| [docs/setup/10-ci-cd.md](docs/setup/10-ci-cd.md) | CI/CD pipelines |
| [docs/setup/11-release.md](docs/setup/11-release.md) | Release checklist |

## Task system

This repo is built task-by-task. See [`tasks/START.md`](tasks/START.md) for the full execution guide.

## Architecture

- [Auth](docs/architecture/auth.md) — two-stage JWT flow
- [AI](docs/architecture/ai.md) — Vercel AI SDK + SSE streaming
- [Analytics](docs/architecture/analytics.md) — event registry + Swift codegen
- [Config](docs/architecture/config.md) — app_config table + typed key registry
- [Design tokens](docs/architecture/design-tokens.md) — token registry + Swift codegen
