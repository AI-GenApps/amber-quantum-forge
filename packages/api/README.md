# @repo/api

[Hono](https://hono.dev/) API. Routes are defined in `src/routes/`.

This package is not deployed standalone. It is consumed by `apps/web` and mounted at `/api/*` via a Next.js catch-all route handler (`apps/web/app/api/[...route]/route.ts`), so it ships as part of the web app's Vercel deployment.

## Routes

- `auth/*` — Firebase ID token registration + device push tokens (auth required).
- `profile/*` — profile picture upload via Vercel Blob (auth required).
- `config/app-metadata` — public read of the typed metadata bag consumed by the native app.
- `config/:key` — admin-only write of a typed metadata key. Validates against the registry in `src/types/config.ts`.

## Auth

Firebase ID tokens are validated by `middleware/auth.ts` via `firebase-admin`. Admin-only routes additionally chain `requireAdmin`, which checks the `admin: true` Firebase custom claim on the decoded token.

### Granting admin

```bash
bun --cwd packages/api run grant-admin <firebaseUid>
bun --cwd packages/api run revoke-admin <firebaseUid>
```

Requires `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` in the environment. The user must sign out and back in for the claim to take effect.

## Typed metadata registry

`src/types/config.ts` defines the shape and parser for every key stored in the freeform `app_config` JSONB table:

- `version_config` — `latestVersion`, `minVersion`, `updateType`, optional `forceUpdateMessage` / `optionalUpdateMessage`
- `feature_flags` — `Record<string, boolean>`
- `maintenance_mode` — `enabled`, `message`, optional `allowedVersions`
- `store_urls` — `ios`, `android`
- `support_urls` — `supportEmail`, `supportUrl`, `termsUrl`, `privacyUrl`

Both the web admin and native app import from `@repo/api/types/config` for type safety.
