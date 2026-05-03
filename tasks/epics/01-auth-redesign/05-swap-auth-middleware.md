---
epic: 01-auth-redesign
task: 05-swap-auth-middleware
status: pending
depends_on:
  - 01-auth-redesign/02-auth-exchange-endpoint
  - 01-auth-redesign/01-jwt-utils-package
estimate: M
commit_scope: auth
---

# 05 — Swap Auth Middleware

## Goal

Replace the existing `authMiddleware` (which verifies a Firebase ID token on every request) with a new version that verifies the API JWT instead. Also update `requireAdmin` to trust the `admin` claim in the JWT without a DB re-check.

This is the single most impactful change in the auth redesign. After this task, all mobile API calls must send the API JWT (not a Firebase ID token).

## Context

### Current middleware (`packages/api/src/middleware/auth.ts`)

```typescript
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  const idToken = authHeader.substring(7);
  const decodedToken = await verifyIdToken(idToken);  // Firebase Admin SDK call
  c.set("user", { uid, email, emailVerified, provider, isAdmin });
  await next();
};
```

### New middleware

```typescript
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader.substring(7);
  const payload = await verifyAccessToken(token);     // local JWT verify — no network call
  c.set("user", { uid: payload.uid, email: payload.email, emailVerified: payload.emailVerified, provider: payload.provider, isAdmin: payload.admin });
  await next();
};
```

### `requireAdmin` — unchanged interface, simpler implementation

```typescript
export const requireAdmin = async (c: Context, next: Next) => {
  const user = c.get("user");
  if (!user?.isAdmin) return c.json({ error: "Forbidden" }, 403);
  await next();
};
```

This already works correctly — the `isAdmin` field on `c.get("user")` now comes from the JWT `admin` claim (which was set from Firebase custom claim at exchange time).

### `AuthUser` interface update

The `AuthUser` interface stays the same shape; internally it's now populated from JWT claims instead of Firebase decoded token.

### Breaking change warning

After this task:
- Any existing client sending a Firebase ID token to `/api/auth/me`, `/api/auth/register-device`, etc. will receive 401.
- This is intentional — clients must first call `/api/auth/exchange` to get an API JWT.
- The Expo app context (`AuthContext.tsx`) will be updated in epic 04 to do this automatically.
- The iOS app (epics 05-06) will also implement this flow natively.

### Do NOT break the web admin

The web admin session flow in `apps/web` uses cookie-based sessions and does NOT go through `authMiddleware`. It has its own auth in `apps/web/lib/admin-session.ts` and `apps/web/proxy.ts`. This middleware change does NOT affect it.

## Implementation Checklist

- [ ] Open `packages/api/src/middleware/auth.ts`.
- [ ] Replace the Firebase `verifyIdToken` import with `verifyAccessToken` from `../lib/jwt`.
- [ ] Update `authMiddleware` body to use `verifyAccessToken(token)` instead of `verifyIdToken(idToken)`.
- [ ] Update `c.set("user", ...)` to read from JWT payload fields (see new middleware above).
- [ ] Remove the `import { verifyIdToken } from "../firebase/admin"` line from the middleware file (it's no longer needed in this file; it's still used in `routes/auth.ts` for the exchange endpoint).
- [ ] Keep the `requireAdmin` function exactly as-is (it already works with the new `isAdmin` source).
- [ ] Keep the `AuthUser` interface and `ContextVariableMap` declaration exactly as-is.
- [ ] Update the error messages to be accurate:
  - Old: `"Unauthorized: Invalid token"` (could be Firebase verification error)
  - New: `"Unauthorized: Invalid or expired API token"` (JWT verification error)
- [ ] Add `packages/api/src/middleware/__tests__/auth.test.ts` with tests for:
  - Valid JWT → calls `next()`, sets `user` on context
  - Expired JWT → 401
  - Missing header → 401
  - Malformed token → 401

## Files Touched

- `packages/api/src/middleware/auth.ts` — replace Firebase verify with JWT verify
- `packages/api/src/middleware/__tests__/auth.test.ts` — create

## Verification

- [ ] `bun run check` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `bun run test` — middleware tests pass
- [ ] Manual: send a Firebase ID token to `GET /api/auth/me` → 401 (JWT verification fails on Firebase token format)
- [ ] Manual: exchange a Firebase token for an API JWT, then send it to `GET /api/auth/me` → 200

## Commit

```
feat(auth): swap authMiddleware to verify API JWT instead of Firebase token [01-auth-redesign/05]
```
