---
epic: 10-polish-release
task: 01-sample-seed
status: pending
depends_on:
  - 01-auth-redesign/00
estimate: S
commit_scope: db
---

# 01 — Seed script for app_config table

## Goal
Create `packages/db/scripts/seed-app-config.ts` that populates the `app_config` table with default values for every `ConfigKey`, so a fresh deployment has working defaults.

## Context
- `ConfigKey` values are defined in `packages/api/src/types/config.ts`
- `app_config` table uses Drizzle ORM (see `packages/db/src/schema.ts`)
- Seed script uses `bun` — add as `db:seed` script in `packages/db/package.json`
- Use upsert (`onConflictDoNothing`) so re-running is safe
- Default values:
  - `app-metadata`: `{ "version": "1.0.0", "minSupportedVersion": "1.0.0", "maintenanceMode": false }`
  - Any future keys: add here

## Implementation Checklist
- [ ] Create `packages/db/scripts/seed-app-config.ts`:
  - Import `db` from `../src/db`
  - Import `appConfig` table from `../src/schema`
  - Import `ConfigKey` from `@repo/api/src/types/config` (or inline the keys to avoid circular dep)
  - Array of seed rows: `[{ key: 'app-metadata', value: { ... } }]`
  - `await db.insert(appConfig).values(rows).onConflictDoNothing()`
  - Log: `Seeded X app_config rows`
- [ ] Add to `packages/db/package.json` scripts: `"db:seed": "bun scripts/seed-app-config.ts"`
- [ ] Run `bun run db:seed` against a local DB — verify rows inserted
- [ ] Run again — verify no error (idempotent)

## Files Touched
- `packages/db/scripts/seed-app-config.ts` — create
- `packages/db/package.json` — add `db:seed` script

## Verification
- [ ] `bun run db:seed` exits 0
- [ ] Re-running produces no error
- [ ] `bun run check` exits 0

## Commit
```
feat(db): add seed script for app_config default values [10-polish-release/01]
```
