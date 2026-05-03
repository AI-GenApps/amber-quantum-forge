# Auth Architecture

## Overview

Two-stage authentication: Firebase Auth handles identity verification, then we issue our own short-lived JWT + long-lived refresh token. All mobile API calls use the API JWT, never the Firebase ID token directly.

## Flow

```
Mobile App
  │
  ├─ 1. Sign in via Firebase (Google / Apple)
  │     → Firebase returns idToken (1h TTL)
  │
  ├─ 2. POST /api/auth/exchange  { idToken }
  │     ← { accessToken (JWT, 6h), refreshToken (opaque, 60d) }
  │
  ├─ 3. All API calls: Authorization: Bearer <accessToken>
  │
  └─ 4. When accessToken expires (or on 401):
        POST /api/auth/refresh  { refreshToken }
        ← { accessToken (new), refreshToken (new, rotated) }
```

## Tokens

### Access Token (API JWT)
- Format: HS256 JWT signed with `API_JWT_SECRET`
- TTL: 6 hours
- Payload: `{ sub: userId, email, isAdmin, iat, exp }`
- Stateless — no DB lookup on every request
- `isAdmin` from JWT claim; `requireAdmin` middleware trusts it directly

### Refresh Token
- Format: random 64-byte hex string (opaque)
- TTL: 60 days, rolling (reset to 60d on every successful rotation)
- Stored in DB table `auth_refresh_tokens`
- One rotation per use — old token is deleted, new token issued atomically

## Database: `auth_refresh_tokens` table

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `token_hash` | text unique | sha256(rawToken) |
| `expires_at` | timestamptz | now + 60d, reset on rotation |
| `rotated_at` | timestamptz | updated on each rotation (DAU signal) |
| `revoked` | boolean | set true on explicit revoke |
| `created_at` | timestamptz | |

## Public vs Protected Endpoints

### Public (no auth required)

| Method | Path | Description |
|---|---|---|
| GET | /health | Health check |
| GET | /config/app-metadata | App config |
| POST | /auth/exchange | Firebase token → API JWT |
| POST | /auth/refresh | Rotate refresh token |
| POST | /auth/revoke | Revoke refresh token |

### Protected (`Authorization: Bearer <apiJwt>`)

| Method | Path | Description |
|---|---|---|
| POST | /auth/register-device | Register FCM token |
| DELETE | /auth/device/:fcmToken | Unregister device |
| GET | /auth/me | Current user profile |
| GET | /profile/* | Profile routes |
| PUT | /config/:key | Update config (admin only) |
| POST | /ai/chat | AI chat stream (epic 02) |
| POST | /chat/sync | Chat history sync (epic 02) |



### `POST /api/auth/exchange`
- Public (no auth required)
- Body: `{ idToken: string }`
- Calls `firebase-admin` `verifyIdToken`
- Upserts user in `users` + `auth` tables
- Creates refresh token record
- Returns `{ accessToken, refreshToken, expiresIn: 21600 }`

### `POST /api/auth/refresh`
- Public (no auth required)
- Body: `{ refreshToken: string }`
- Hashes incoming token, looks up in DB
- Validates: not revoked, not expired
- Atomically deletes old record, inserts new record with new token + reset TTL
- Returns `{ accessToken, refreshToken, expiresIn: 21600 }`

### `POST /api/auth/revoke`
- Requires valid access token
- Body: `{ refreshToken: string }` (optional — if omitted, revokes all tokens for user)
- Marks token(s) as revoked
- Returns `{ ok: true }`

## Middleware: `requireAuth`

Located at `packages/api/src/middleware/auth.ts` after epic 01/05.

```
Authorization: Bearer <jwt>
  → verify HS256 signature with API_JWT_SECRET
  → check exp
  → set c.var.user = { userId, email, isAdmin }
```

No DB call. Token is self-contained.

## Admin Access

Admin status is embedded in the JWT `isAdmin` claim. To grant admin:

```bash
bun --cwd packages/api run grant-admin <uid>
```

This sets Firebase custom claim `admin: true`, which gets copied into JWT on next exchange.

Web admin sessions use a separate cookie flow (`apps/web/lib/admin-session.ts`) and are unaffected by this redesign.

## Security Notes

- Refresh tokens are stored hashed (sha256) — raw token is never persisted
- Access tokens are not revocable (short TTL mitigates this)
- `ADMIN_UIDS` env var provides bootstrap admin access before custom claims are set
- All token operations use parameterized queries via Drizzle ORM
