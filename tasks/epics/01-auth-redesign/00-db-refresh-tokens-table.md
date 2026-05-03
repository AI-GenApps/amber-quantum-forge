---
epic: 01-auth-redesign
task: 00-db-refresh-tokens-table
status: pending
depends_on:
  - 00-foundations/00-husky-lintstaged
estimate: S
commit_scope: auth
---

# 00 — DB Refresh Tokens Table

## Goal

Add the `auth_refresh_tokens` table to the Drizzle schema. This table stores opaque refresh tokens so they can be validated, rotated, and revoked.

## Context

### Existing schema location

`packages/db/src/schema.ts`

Current tables: `users`, `auth`, `deviceRegistrations`, `appConfig`.

### New table design

```sql
CREATE TABLE auth_refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,      -- SHA-256 hash of the opaque token
  device_id   TEXT,                      -- optional: FCM token or device UUID for tracking
  expires_at  TIMESTAMP NOT NULL,        -- now() + 60 days
  rotated_at  TIMESTAMP,                 -- last rotation timestamp (= last active day for DAU)
  revoked_at  TIMESTAMP,                 -- set on logout/revoke
  created_at  TIMESTAMP NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP NOT NULL DEFAULT now()
);
```

**Why `token_hash`?** Never store the raw token. Store SHA-256(token). The raw token is only ever returned to the client once. On validation, SHA-256(incoming token) is compared to DB.

**DAU signal**: `rotated_at` is updated on every refresh. Query `COUNT(DISTINCT user_id) WHERE rotated_at >= today` for DAU.

### Export requirement

The new table and its type must be exported from `packages/db/src/index.ts` so `packages/api` can import it.

## Implementation Checklist

- [ ] Open `packages/db/src/schema.ts` and add the `authRefreshTokens` table:
  ```typescript
  import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

  export const authRefreshTokens = pgTable("auth_refresh_tokens", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    deviceId: text("device_id"),
    expiresAt: timestamp("expires_at").notNull(),
    rotatedAt: timestamp("rotated_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  });
  ```
- [ ] Add the Drizzle relation for `authRefreshTokens` (belongs to `users`, user has many refresh tokens):
  ```typescript
  export const authRefreshTokensRelations = relations(authRefreshTokens, ({ one }) => ({
    user: one(users, {
      fields: [authRefreshTokens.userId],
      references: [users.id],
    }),
  }));
  ```
- [ ] Update `usersRelations` to add `refreshTokens: many(authRefreshTokens)`.
- [ ] Confirm `packages/db/src/index.ts` re-exports everything from `schema.ts` (it likely uses `export * from "./schema"`; verify).
- [ ] Run migration:
  ```bash
  cd packages/db
  bun run db:generate
  bun run db:push
  ```
- [ ] Confirm the table exists by opening Drizzle Studio (`bun run db:studio`) or running a raw query.

## Files Touched

- `packages/db/src/schema.ts` — add `authRefreshTokens` table + relations

## Verification

- [ ] `bun run check` exits 0
- [ ] `cd packages/db && bun run db:generate` exits 0 and creates a new migration file
- [ ] `cd packages/db && bun run db:push` exits 0
- [ ] `cd packages/db && bun run db:studio` — table `auth_refresh_tokens` visible with correct columns
- [ ] TypeScript: `bun run typecheck` exits 0

## Commit

```
feat(auth): add auth_refresh_tokens table to Drizzle schema [01-auth-redesign/00]
```
