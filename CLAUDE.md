# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies (uses Bun as package manager)
bun install

# Run all apps in development
bun run dev

# Build all apps
bun run build

# Format code
bun run format

# Clean all build outputs and node_modules
bun run clean
```

### App-specific commands

**Native (Expo):**

```bash
cd apps/native
bun run dev          # Start Expo web
bun run android      # Run on Android
bun run ios          # Run on iOS
```

**Web (Next.js):**

```bash
cd apps/web
bun run dev          # Runs on port 4001
bun run build
bun run lint
```

**Database (Drizzle):**

```bash
cd packages/db
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
bun run db:push      # Push schema changes
bun run db:studio    # Open Drizzle Studio
```

**UI Package:**

```bash
cd packages/ui
bun run build        # Build with tsup
bun run dev          # Watch mode
```

## Architecture

This is a Turborepo monorepo with:

### Apps

- **`apps/native`**: Expo/React Native app using expo-router for navigation. Uses Firebase Auth (Google Sign-In, Apple Auth), RevenueCat for subscriptions, and communicates with the API.
- **`apps/web`**: Next.js 16 app with Tailwind CSS and shadcn/ui components. Hosts the Hono API via catch-all route.

### Packages

- **`@repo/api`**: Hono API. Routes under `src/routes/`. Exported from `packages/api` and mounted in the web app at `/api/*`. Not deployed standalone.
- **`@repo/db`**: Drizzle ORM with PostgreSQL. Schema in `src/schema.ts`, connection in `src/db.ts`. Requires `DATABASE_URL` env var.
- **`@repo/ui`**: Shared React component library built with tsup. Currently exports Button component.
- **`@repo/typescript-config`**: Shared TypeScript configurations.

## Key Integration Points

- **Hono API in Next.js**: The `@repo/api` package exports the Hono app which is imported and mounted in `apps/web/app/api/[[..route]]/route.ts` as a catch-all route handler.
- **Firebase Auth**: Native app uses `@react-native-firebase/auth` with Google Sign-In. API validates Firebase tokens via `firebase-admin`.
- **Database Access**: Both `apps/web` and `@repo/api` import `@repo/db` to access the database. Schema defines users, auth (Firebase links), and device registrations tables.
