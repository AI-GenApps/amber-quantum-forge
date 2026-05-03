---
epic: 01-auth-redesign
task: 03-auth-refresh-endpoint
status: pending
depends_on:
  - 01-auth-redesign/02-auth-exchange-endpoint
estimate: M
commit_scope: auth
---

# 03 — Auth Refresh Endpoint

## Goal

Implement `POST /api/auth/refresh`. Mobile apps call this when the 6h access token is expired (or about to expire). It validates the refresh token, rotates it (issues a new one, invalidates the old one), and returns a new access token.

Refresh token rotation on every use serves two purposes:
1. Security: a stolen refresh token becomes invalid after the legitimate client uses it.
2. DAU tracking: `rotated_at` is updated on every call, enabling daily active user counts without a separate analytics event.

## Context

### Request / Response

**Request** (no auth header required — public endpoint):
```json
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<64-char opaque hex from /exchange or previous /refresh>"
}
```

**Response 200**:
```json
{
  "accessToken": "<new 6h JWT>",
  "refreshToken": "<new 64-char opaque hex>",
  "expiresIn": 21600,
  "tokenType": "Bearer"
}
```

**Response 401**: invalid, expired, or revoked refresh token.
**Response 400**: missing `refreshToken`.

### Internal flow

1. Parse `refreshToken` from body.
2. Hash it: `hashRefreshToken(incoming)`.
3. Query `auth_refresh_tokens` WHERE `token_hash = hash AND revoked_at IS NULL AND expires_at > NOW()`.
4. If not found → 401.
5. Generate new refresh token: `generateRefreshToken()`.
6. Hash new token: `hashRefreshToken(newToken)`.
7. Update the existing row:
   - `token_hash` = new hash (rotation — old token is now invalid)
   - `rotated_at` = `new Date()`
   - `expires_at` = `new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)` (rolling 60-day window)
   - `updated_at` = `new Date()`
8. Fetch the associated user from `users` table via `userId` on the token row.
9. Fetch the `auth` row to get `provider`.
10. Sign new access token with the user's current data.
11. Return new access token + new raw refresh token.

### Why rolling expiry?

Setting `expires_at = now + 60 days` on every refresh means an active user never gets logged out. A user who doesn't open the app for 60 days will need to re-authenticate via Firebase.

## Implementation Checklist

- [ ] Add `POST /refresh` handler to `packages/api/src/routes/auth.ts` (no `authMiddleware`).
- [ ] Import `authRefreshTokens`, `users`, `auth` from `@repo/db`.
- [ ] Import `hashRefreshToken`, `generateRefreshToken`, `signAccessToken` from `../lib/jwt`.
- [ ] Query: use Drizzle `db.select().from(authRefreshTokens).where(and(eq(authRefreshTokens.tokenHash, hash), isNull(authRefreshTokens.revokedAt), gt(authRefreshTokens.expiresAt, new Date())))`.
  - `isNull` and `gt` are from `drizzle-orm` — check existing imports in `auth.ts` for the import pattern.
- [ ] Update the token row atomically (single `db.update().set(...).where(eq(authRefreshTokens.id, row.id))`).
- [ ] Fetch user by `row.userId` from `users` table.
- [ ] Fetch `auth` row by `userId` to get `provider`.
- [ ] Sign new access token — set `admin` claim from the existing JWT or re-derive from user (for simplicity, re-derive from `auth` table: provider is available; for `admin`, query the Firebase custom claim OR store it in the `users` table).
  - **Simplification for v1**: add a boolean `isAdmin` column to the `users` table in `packages/db/src/schema.ts`. Default `false`. This avoids a Firebase Admin SDK call during refresh.
  - Update `packages/db/src/schema.ts` to add `isAdmin: boolean("is_admin").notNull().default(false)` to the `users` table.
  - Run `bun run db:generate && bun run db:push` after the schema change.
- [ ] Write a test in `packages/api/src/routes/__tests__/auth.test.ts` for the refresh happy path and for an invalid/expired token.

## Files Touched

- `packages/api/src/routes/auth.ts` — add `/refresh` handler
- `packages/db/src/schema.ts` — add `isAdmin` to users table
- `packages/api/src/routes/__tests__/auth.test.ts` — add refresh tests

## Verification

- [ ] `bun run check` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `bun run test` — refresh tests pass
- [ ] DB migration for `is_admin` column runs cleanly
- [ ] Valid refresh token → returns new `accessToken` + `refreshToken`; old refresh token is now invalid
- [ ] Invalid refresh token → 401
- [ ] Expired refresh token → 401

## Commit

```
feat(auth): add POST /api/auth/refresh with token rotation [01-auth-redesign/03]
```
