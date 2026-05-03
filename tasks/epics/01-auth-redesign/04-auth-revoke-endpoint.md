---
epic: 01-auth-redesign
task: 04-auth-revoke-endpoint
status: pending
depends_on:
  - 01-auth-redesign/03-auth-refresh-endpoint
estimate: S
commit_scope: auth
---

# 04 — Auth Revoke Endpoint

## Goal

Implement `POST /api/auth/revoke`. Called on logout. Sets `revoked_at` on the refresh token row, making it permanently invalid. After this, `/api/auth/refresh` will return 401 for the revoked token.

## Context

### Request / Response

**Request** (no auth header — public endpoint, since the access token may already be expired):
```json
POST /api/auth/revoke
Content-Type: application/json

{
  "refreshToken": "<64-char opaque hex>"
}
```

**Response 200**:
```json
{ "success": true }
```

**Response 200** (even if token not found — don't leak existence):
```json
{ "success": true }
```

Always return 200. Revoking a non-existent or already-revoked token is a no-op. This prevents information leakage.

### Internal flow

1. Parse `refreshToken` from body.
2. Hash it: `hashRefreshToken(incoming)`.
3. Update `auth_refresh_tokens` SET `revoked_at = now()` WHERE `token_hash = hash AND revoked_at IS NULL`.
4. Return `{ success: true }` regardless of whether a row was updated.

### Optional: revoke all tokens for a user

Consider adding a query param `?all=true` that revokes all refresh tokens for the user identified by the access token. This is useful for "log out all devices". However, this requires an auth header for the current access token. For v1, implement the single-token revoke only. Mark "revoke all" as a future enhancement in a code comment... actually, mark it in a `## Future Enhancements` section in this task file.

## Implementation Checklist

- [ ] Add `POST /revoke` handler to `packages/api/src/routes/auth.ts` (no `authMiddleware`).
- [ ] Import `hashRefreshToken` from `../lib/jwt`.
- [ ] Import `authRefreshTokens` and `isNull` from `@repo/db`.
- [ ] Run:
  ```typescript
  await db
    .update(authRefreshTokens)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(authRefreshTokens.tokenHash, hash), isNull(authRefreshTokens.revokedAt)));
  ```
- [ ] Always return `{ success: true }` (200), even if 0 rows were updated.
- [ ] Handle missing `refreshToken` body field → still return `{ success: true }` (graceful no-op).
- [ ] Add a `## Future Enhancements` section at the bottom of this task file noting "revoke all tokens for user via `POST /api/auth/revoke?all=true` with Bearer auth".
- [ ] Write a test in `packages/api/src/routes/__tests__/auth.test.ts` for the revoke endpoint.

## Files Touched

- `packages/api/src/routes/auth.ts` — add `/revoke` handler
- `packages/api/src/routes/__tests__/auth.test.ts` — add revoke tests

## Verification

- [ ] `bun run check` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `bun run test` — revoke tests pass
- [ ] Valid refresh token → revoked → subsequent `/refresh` call returns 401
- [ ] Non-existent token → still returns `{ success: true }`
- [ ] Already-revoked token → still returns `{ success: true }`

## Future Enhancements

- `POST /api/auth/revoke?all=true` — revoke all refresh tokens for the authenticated user (requires `Authorization: Bearer <accessToken>`). Useful for "log out all devices" feature.

## Commit

```
feat(auth): add POST /api/auth/revoke endpoint [01-auth-redesign/04]
```
