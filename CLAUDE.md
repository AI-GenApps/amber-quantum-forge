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

# Format + lint everything (Biome) — must pass before every commit
bun run check

# TypeScript check across all packages
bun run typecheck

# Format only
bun run format

# Lint only
bun run lint

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
```

**Database (Drizzle):**

```bash
cd packages/db
bun run db:generate  # Generate migrations
bun run db:push      # Push schema changes
bun run db:studio    # Open Drizzle Studio
```

**iOS app:**

```bash
cd apps-native/ios-app
xcodegen generate    # Regenerate Xcode project after editing project.yml
```

**Flutter app:**

```bash
cd apps-native/flutter-app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:4001 --dart-define=REVENUECAT_API_KEY=your_key
flutter build apk --debug          # Android
flutter build ios --no-codesign    # iOS
```

**Codegen:**

```bash
bun run scripts/codegen-swift.ts   # generate Swift types from TS
bun run codegen:dart               # generate Dart types from TS
```

## Task system

This repo is built task-by-task. See [`tasks/START.md`](tasks/START.md) for the execution protocol. Always check `tasks/STATUS.md` first to find the next task.

## Architecture

This is a Turborepo monorepo with:

### Apps

- **`apps/native`**: Expo/React Native app using expo-router for navigation. Uses Firebase Auth (Google Sign-In, Apple Auth), RevenueCat for subscriptions, and communicates with the API.
- **`apps/web`**: Next.js 16 app with Tailwind CSS and shadcn/ui components. Hosts the Hono API via catch-all route.
- **`apps-native/ios-app`**: SwiftUI app using XcodeGen + SPM. **NOT a bun workspace.** iOS 17 min, Xcode 26.2.
- **`apps-native/flutter-app`**: Flutter app mirroring the iOS app's feature set (onboarding, two-stage Firebase→JWT auth, streaming AI chat, RevenueCat, config gating). **NOT a bun workspace.** Targets Android and iOS.

### Packages

- **`@repo/api`**: Hono API. Routes under `src/routes/`. Exported from `packages/api` and mounted in the web app at `/api/*`.
- **`@repo/db`**: Drizzle ORM with PostgreSQL. Schema in `src/schema.ts`, connection in `src/db.ts`.
- **`@repo/ui`**: Shared React component library.
- **`@repo/ai`**: Vercel AI SDK + OpenAI wrapper. Server-side streaming chat.
- **`@repo/analytics`**: TypeScript event registry. Source for Swift codegen.
- **`@repo/typescript-config`**: Shared TypeScript configurations.

### Plugins

- **`plugins/expo/*`**: Bun workspaces named `@plugin/expo-<name>`. Feature modules for the Expo app.
- **`plugins/ios/*`**: Swift packages. Feature modules for the iOS app. Linked via `project.yml`.
- **`plugins/flutter/*`**: Dart packages. Feature modules for the Flutter app. Linked via path deps in `pubspec.yaml`.

## Auth architecture

Two-stage JWT flow:

1. Native app signs in with Firebase Auth → gets Firebase ID token
2. Native app calls `POST /api/auth/exchange` with Firebase ID token
3. Server verifies Firebase token, issues API access token (JWT, signed with `API_JWT_SECRET`) + refresh token
4. All subsequent mobile API calls use `Authorization: Bearer <accessToken>`
5. Web admin keeps existing cookie/session flow

See [`docs/architecture/auth.md`](docs/architecture/auth.md) for full details.

## Key Integration Points

- **Hono API in Next.js**: The `@repo/api` package exports the Hono app which is imported and mounted in `apps/web/app/api/[...route]/route.ts` as a catch-all route handler.
- **Firebase Auth**: Native app uses `@react-native-firebase/auth` with Google Sign-In. API validates Firebase tokens via `firebase-admin`.
- **API JWT Auth**: `POST /api/auth/exchange` verifies Firebase ID token, returns API JWT. All mobile requests use `Authorization: Bearer <apiJwt>`. Web admin keeps cookie session.
- **AI streaming**: `POST /api/ai/chat` streams Vercel AI SDK data-stream format. iOS parses with native SSE parser in `plugins/ios/ai`.
- **Admin gating**: `/admin` (web) and `PUT /api/config/:key` (Hono) require admin. Admin = Firebase custom claim `admin: true` (granted via `bun --cwd packages/api run grant-admin <uid>`) or `ADMIN_UIDS` env allowlist.
- **App metadata**: The native app reads from `GET /api/config/app-metadata` via `apps/native/services/appMetadata.ts`. Typed key registry in `packages/api/src/types/config.ts`.
- **Database Access**: Both `apps/web` and `@repo/api` import `@repo/db` to access the database.
- **No middleware.ts**: `apps/web/middleware.ts` must not exist — enforced by `scripts/check-no-middleware.ts`. Use `apps/web/proxy.ts` instead.
