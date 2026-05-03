# Config Architecture

## Overview

App configuration is stored in the `app_config` table as JSONB key-value pairs. This allows runtime configuration changes without redeployment.

## Database table

```sql
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Schema definition: `packages/db/src/schema.ts`

## API endpoints

### Public read

```
GET /api/config/:key
```

No authentication required. Returns the JSONB value for the given key.

Example: `GET /api/config/app-metadata`

### Admin write

```
PUT /api/config/:key
```

Requires admin authentication (Firebase custom claim `admin: true` or `ADMIN_UIDS` env var).

Request body: any JSON value.

## Typed key registry

`packages/api/src/types/config.ts` defines the allowed keys and their TypeScript types:

```typescript
export type ConfigKey = "app-metadata" | "feature-flags";
export type AppMetadata = { version: string; minVersion: string; };
```

Both the web admin UI and the native apps import from this registry for type safety.

## Native clients

### Expo

`apps/native/services/appMetadata.ts` fetches config and stores it in `AppConfigContext`.

### iOS

`apps-native/ios-app/Starter/Core/Config/AppConfigService.swift` fetches config on app launch (created in epic 05).
