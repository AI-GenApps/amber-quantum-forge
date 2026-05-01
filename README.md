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
bun install
bun run dev       # all apps
bun run build     # all apps
bun run format    # prettier
bun run clean     # remove build outputs + node_modules
```

See individual READMEs: [native](apps/native/README.md) | [web](apps/web/README.md) | [api](packages/api/README.md) | [db](packages/db/README.md)
