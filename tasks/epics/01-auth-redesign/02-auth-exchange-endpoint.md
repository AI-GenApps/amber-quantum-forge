---
epic: 01-auth-redesign
task: 02-auth-exchange-endpoint
status: pending
depends_on:
  - 01-auth-redesign/00-db-refresh-tokens-table
  - 01-auth-redesign/01-jwt-utils-package
estimate: M
commit_scope: auth
---

# 02 — Auth Exchange Endpoint

## Goal

Implement `POST /api/auth/exchange`. This is the bridge between Firebase Auth (on-device) and the API's own JWT system. Mobile apps call this once after Firebase sign-in to obtain an API access token + refresh token pair.

## Context

### Request / Response

**Request** (no auth header required — this is a public endpoint):
```json
POST /api/auth/exchange
Content-Type: application/json

{
  "idToken": "<Firebase ID token from device>"
}
```

**Response 200**:
```json
{
  "accessToken": "<6h JWT>",
  "refreshToken": "<64-char opaque hex>",
  "expiresIn": 21600,
  "tokenType": "Bearer",
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com",
    "displayName": "User Name",
    "photoURL": "https://..."
  }
}
```

**Response 401**: invalid or expired Firebase ID token.
**Response 400**: missing `idToken` field.

### Internal flow

1. Parse `idToken` from request body.
2. Call `verifyIdToken(idToken)` from `packages/api/src/firebase/admin.ts` (already exists).
3. Extract: `uid`, `email`, `email_verified`, `firebase.sign_in_provider`, and custom claim `admin`.
4. Upsert the user in the `users` table (create if not exists by `email`; update `name` / `profilePictureUrl` from Firebase token if present).
5. Upsert the `auth` table row for `firebase_uid`.
6. Generate refresh token: `generateRefreshToken()` from `packages/api/src/lib/jwt.ts`.
7. Hash it: `hashRefreshToken(rawToken)`.
8. Insert row into `auth_refresh_tokens`: `{ userId, tokenHash, deviceId: null, expiresAt: now + 60 days }`.
9. Sign access token: `signAccessToken({ sub: uid, uid, email, emailVerified, provider, admin })`.
10. Return response with raw (unhashed) refresh token + access token.

### Where to add the route

The Hono app is exported from `packages/api/src/index.ts`. Auth routes are in `packages/api/src/routes/auth.ts`. Add the exchange handler to the existing auth routes file.

Current `packages/api/src/routes/auth.ts` already has `/register-device`, `/me`, `/device/:fcmToken` routes. Add `/exchange` as the first route (it runs before auth middleware, so it must NOT have `authMiddleware` applied).

### Existing file to read

Before writing, read `packages/api/src/routes/auth.ts` (the full file is in the session context above) to understand the existing pattern.

## Implementation Checklist

- [ ] Open `packages/api/src/routes/auth.ts`
- [ ] Add the exchange handler at the top of the file (before the `authMiddleware`-protected routes):
  ```typescript
  authRoutes.post("/exchange", async (c) => {
    // 1. Parse body
    // 2. Verify Firebase ID token
    // 3. Upsert user + auth rows
    // 4. Generate + hash refresh token
    // 5. Insert auth_refresh_tokens row
    // 6. Sign access token
    // 7. Return response
  });
  ```
- [ ] Import `authRefreshTokens` from `@repo/db` (it will be available after task 00).
- [ ] Import `signAccessToken`, `generateRefreshToken`, `hashRefreshToken` from `../lib/jwt`.
- [ ] Import `verifyIdToken` from `../firebase/admin`.
- [ ] Set `expiresAt` = `new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)` (60 days).
- [ ] Handle errors: Firebase token verification failure → 401; missing body → 400; DB error → 500.
- [ ] Add the route to `packages/api/src/index.ts` mount if not already mounted (the auth routes should already be mounted; verify).
- [ ] Write a test in `packages/api/src/routes/__tests__/auth.test.ts` that mocks `verifyIdToken` and tests the happy path + invalid token path.

## Files Touched

- `packages/api/src/routes/auth.ts` — add `/exchange` handler
- `packages/api/src/routes/__tests__/auth.test.ts` — create or update with exchange tests

## Verification

- [ ] `bun run check` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `bun run test` — exchange tests pass
- [ ] Manual test (requires running server + valid Firebase token):
  ```bash
  curl -X POST http://localhost:4001/api/auth/exchange \
    -H "Content-Type: application/json" \
    -d '{"idToken": "<valid firebase id token>"}'
  ```
  Response should contain `accessToken`, `refreshToken`, `expiresIn: 21600`.
- [ ] Missing `idToken` → 400 response
- [ ] Invalid `idToken` → 401 response

## Commit

```
feat(auth): add POST /api/auth/exchange endpoint [01-auth-redesign/02]
```
