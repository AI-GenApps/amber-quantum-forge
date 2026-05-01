# Starter Expo Mobile

Turborepo monorepo with an Expo/React Native mobile app and a Next.js web app that hosts a shared Hono API.

## Architecture

```
apps/
  native/     Expo SDK 55 (React Native 0.83) — Firebase Auth, RevenueCat, push notifications
  web/        Next.js 16 — hosts the Hono API at /api/*
packages/
  api/        Hono API (mounted in web at /api/*)
  db/         Drizzle ORM + PostgreSQL
  ui/         Shared React component library
  typescript-config/  Shared tsconfig
```

## Setup

```bash
cp .env.example .env   # then fill in values — see .env.example for the full list
bun install
bun run dev            # all apps
bun run build          # all apps
bun run format         # prettier
bun run clean          # remove build outputs + node_modules
```

## Admin panel

The web app exposes `/admin` for managing app metadata that the native app reads from `/api/config/app-metadata` — version gate, feature flags, maintenance mode, store URLs, support/legal URLs — plus a users + devices view. Access is gated by a Firebase `admin: true` custom claim (or the `ADMIN_UIDS` allowlist while bootstrapping). See [apps/web/README.md](apps/web/README.md#admin-panel).

See individual READMEs: [native](apps/native/README.md) | [web](apps/web/README.md) | [api](packages/api/README.md) | [db](packages/db/README.md)
