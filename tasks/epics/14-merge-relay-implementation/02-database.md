---
epic: 14-merge-relay-implementation
task: 02-database
status: in-progress
commit_scope: merge-relay
depends_on: [14-merge-relay-implementation/00-contracts]
estimate: L
---

# Add durable Merge Relay storage

## Implementation Checklist

- [x] Add app/environment-scoped Drizzle schema for Merge Relay state.
- [x] Add a transaction-safe PostgreSQL normalized-record adapter compatible with the
  existing Vercel Hono deployment.
- [x] Generate an unapplied migration and document the local/test-only path.
- [x] Test optimistic revisions, rollback, scope binding, and concurrent
  transaction behavior with an injected database seam.
- [x] Replace the current whole-scope read-and-rewrite transaction path with
  targeted per-artifact upserts/deletes and a read-only store path.
- [x] Run the adapter against an isolated PostgreSQL test database with
  concurrency, rollback, and bounded-retention evidence before production traffic.

## Verification

- `cd packages/db && bun run typecheck`
- `cd packages/db && DATABASE_URL=postgresql://migration-generator.invalid/merge_relay bun run db:generate`
- `cd packages/api && bun run test`
- `cd packages/api && bun run test -- drizzle-store.test.ts`
- `MERGE_RELAY_TEST_DATABASE_URL=... cd packages/api && bun run test -- drizzle-postgres.test.ts` (skips explicitly when unset)

## Acceptance

The isolated PostgreSQL 16.15 run passed the four adapter tests against a fresh
temporary database after all checked-in migrations were applied. Production
deployment fails closed without an approved database configuration, and no
production migration was run by this task.
The accepted adapter must use one lock row per app/environment and indexed
artifact rows without replacing an unbounded application-wide scope on every
operation. The generated migration is checked in but unapplied; no production
database operation is performed by this task.
