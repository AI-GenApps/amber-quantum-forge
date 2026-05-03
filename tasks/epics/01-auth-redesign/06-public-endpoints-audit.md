---
epic: 01-auth-redesign
task: 06-public-endpoints-audit
status: pending
depends_on:
  - 01-auth-redesign/05-swap-auth-middleware
estimate: S
commit_scope: auth
---

# 06 — Public Endpoints Audit

## Goal

Audit every Hono route in `packages/api` and ensure the public/protected boundary is correct. Document the public endpoints so clients know what to call without auth.

## Context

### Public endpoints (no auth required)

| Method | Path | Description |
|---|---|---|
| GET | /api/health | Health check |
| GET | /api/config/app-metadata | App config (version, maintenance, flags) |
| POST | /api/auth/exchange | Firebase token → API JWT |
| POST | /api/auth/refresh | Rotate refresh token |
| POST | /api/auth/revoke | Revoke refresh token |

### Protected endpoints (require `Authorization: Bearer <apiJwt>`)

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register-device | Register FCM token |
| DELETE | /api/auth/device/:fcmToken | Unregister device |
| GET | /api/auth/me | Get current user profile |
| GET | /api/profile/* | Profile routes |
| PUT | /api/config/:key | Update config (admin only) |
| POST | /api/ai/chat | AI chat (added in epic 02) |
| POST | /api/chat/sync | Chat sync (added in epic 02) |

### Where routes are mounted

`packages/api/src/index.ts` — check how routes are mounted to confirm no public routes are accidentally behind `authMiddleware`.

### What to fix

In `packages/api/src/routes/auth.ts`, the current `/register-device`, `/me`, and `/device/:fcmToken` routes all have `authMiddleware` applied individually. The new `/exchange`, `/refresh`, `/revoke` endpoints must NOT have `authMiddleware`.

Verify this is correct after the swap in task 05.

Also check `packages/api/src/routes/config.ts` — `GET /config/app-metadata` should have NO auth middleware. `PUT /config/:key` should have both `authMiddleware` AND `requireAdmin`.

## Implementation Checklist

- [ ] Open `packages/api/src/index.ts` — read the full route mounting.
- [ ] Open `packages/api/src/routes/config.ts` — verify `GET /app-metadata` has no `authMiddleware`.
- [ ] Open `packages/api/src/routes/auth.ts` — verify `/exchange`, `/refresh`, `/revoke` have no `authMiddleware` and that `/me`, `/register-device`, `/device/:fcmToken` do have `authMiddleware`.
- [ ] Check if a `GET /api/health` route exists. If not, add it to `packages/api/src/index.ts`:
  ```typescript
  app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));
  ```
- [ ] Create or update `docs/architecture/auth.md` with a table of public vs protected endpoints (this file is created as a full doc in a separate task but add a ## Public Endpoints section here).
- [ ] Update `docs/setup/02-env-vars.md` to add `API_JWT_SECRET` if it was missed.

## Files Touched

- `packages/api/src/index.ts` — add health endpoint if missing
- `packages/api/src/routes/auth.ts` — verify correctness (no changes expected if previous tasks done correctly)
- `packages/api/src/routes/config.ts` — verify auth boundaries
- `docs/architecture/auth.md` — add public/protected endpoint table

## Verification

- [ ] `bun run check` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `curl http://localhost:4001/api/health` → 200 with `{ status: "ok" }`
- [ ] `curl http://localhost:4001/api/config/app-metadata` → 200 (no auth header needed)
- [ ] `curl http://localhost:4001/api/auth/me` (no auth header) → 401
- [ ] `curl http://localhost:4001/api/auth/exchange` (no body) → 400

## Commit

```
chore(auth): audit public/protected endpoints and add health route [01-auth-redesign/06]
```
