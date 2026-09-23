---
epic: 15-ludo-launch
task: 16-database
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/15-backend-contracts]
estimate: L
---

# Add durable Ludo storage

## Goal

Add app/environment-scoped Drizzle tables for Ludo matches, players, events,
command idempotency, matchmaking tickets, and rooms, plus a store interface
with in-memory and Drizzle implementations, mirroring
`packages/api/src/games/merge-relay/{store.ts,memory-store.ts,
drizzle-store.ts}` and `packages/db/src/schema.ts`'s `mergeRelayScopes`/
`mergeRelayRecords` tables.

## Context/Decisions

- Table names (all `pgTable`, snake_case): `ludo_matches`, `ludo_players`,
  `ludo_events`, `ludo_commands`, `ludo_matchmaking_tickets`, `ludo_rooms`.
  Every table carries `app_id`/`environment` scoping columns exactly like
  `mergeRelayRecords` does, so the same app can run isolated debug/staging/
  production data without cross-environment leakage (see
  `packages/api/src/games/isolation.test.ts` for the isolation test pattern
  to follow for Ludo).
- `ludo_matches`: primary key `(app_id, environment, match_id)`; columns for
  `mode` (`classic`/`quick`), `status`, `seat_count`, `rules_version`,
  `current_turn_seat`, `phase`, `six_streak`, `turn_deadline_at`, `revision`
  (optimistic concurrency, matching `mergeRelayScopes.revision`'s pattern),
  `match_origin` (`"matchmaking" | "room" | "direct"`, not nullable — records
  how the match was created so later disconnect-handling logic (task 20's
  bot-fill vs task 21's forfeit-on-disconnect) can branch without a
  follow-up migration; this column is added here, in the initial schema,
  specifically so no later task needs to alter `ludo_matches` again),
  `created_at`, `updated_at`.
- `ludo_players`: primary key `(app_id, environment, match_id, seat)`;
  columns for `subject` (owning player's stable identity, or `null` for a
  bot seat), `is_bot`, `bot_difficulty` (nullable), `display_name_cache`
  (denormalized for fast fanout — never authoritative), `connected_at`,
  `miss_count`, indexed on `(app_id, environment, subject)` for "find my
  active matches" lookups.
- `ludo_events`: append-only; primary key `(app_id, environment, match_id,
  sequence)` with a **unique index** on exactly that tuple — this is the
  idempotency backbone for event fanout (task 22) and replay (task 17).
  Columns: `event_type`, `payload` (`jsonb`), `created_at`.
- `ludo_commands`: idempotency ledger; primary key `(app_id, environment,
  match_id, idempotency_key)`, columns `command_type`, `result_summary`
  (`jsonb`, small — do not store full state here), `created_at`. A repeated
  command with the same idempotency key must short-circuit to the stored
  result rather than re-executing, matching the "duplicate create is
  idempotent" acceptance language used for Merge Relay's MR-04.
- `ludo_matchmaking_tickets`: primary key `(app_id, environment, ticket_id)`;
  columns `subject`, `mode`, `seat_target` (2 or 4), `status`
  (`searching`/`matched`/`cancelled`/`expired`), `matched_match_id`
  (nullable FK-style reference, no enforced FK across scope the way
  `mergeRelayRecords`' self-referential FK works — keep it a plain indexed
  column), `created_at`, `expires_at`; indexed on `(app_id, environment,
  status, mode, seat_target, created_at)` for FIFO matching scans.
- `ludo_rooms`: primary key `(app_id, environment, room_code)`; columns
  `owner_subject`, `mode`, `seat_target`, `match_id` (nullable until the room
  starts), `created_at`, `expires_at`.
- Every table needs `check`/`uniqueIndex` constraints analogous to
  `mergeRelayRecords`' `parent_pair_check`/`scope_idempotency_unique` where
  applicable — at minimum the `ludo_events` unique sequence index and the
  `ludo_commands` idempotency primary key above.
- Store interface `LudoStore` (in `packages/api/src/games/ludo/store.ts`)
  exposes `read`/`transact` scoped by `(appId, environment)` operating over
  an in-memory `LudoState` snapshot shape, matching `MergeRelayStore`'s
  `read`/`transact` signatures — but per task 02's Database-owner note in
  epic 14 ("replace whole-scope read-and-rewrite with targeted per-artifact
  upserts"), design the Drizzle implementation with **targeted per-row
  upserts/deletes from the start** (do not repeat Merge Relay's original
  whole-scope rewrite mistake) — write directly to `ludo_matches`/
  `ludo_players`/`ludo_events` rows keyed by their own primary keys inside a
  single transaction per command.
- Generate the migration with `bun run db:generate` but do **not** apply it
  to any real database; check in the generated SQL only, matching task
  02-database's precedent in epic 14 (`db:generate` against a documented
  fake `DATABASE_URL`, migration checked in unapplied).

## Implementation Checklist

- [ ] Add the six tables to `packages/db/src/schema.ts` with the columns,
  keys, and indexes above, following the existing `mergeRelayScopes`/
  `mergeRelayRecords` style (imports from `drizzle-orm/pg-core`, `check`,
  `uniqueIndex`, `index`, `foreignKey` as needed).
- [ ] Run `cd packages/db && DATABASE_URL=postgresql://migration-generator.invalid/ludo bun run db:generate` and check in the generated migration file. Do not run `db:push` against any real database.
- [ ] Create `packages/api/src/games/ludo/store.ts` defining `LudoStore`
  (`read`/`transact`), `LudoState` (matches/players/events/commands/tickets/
  rooms arrays), `emptyLudoState()`, `cloneLudoState()`, and a
  `LudoStorageError` class, matching `merge-relay/store.ts`'s shapes.
- [ ] Create `packages/api/src/games/ludo/memory-store.ts` implementing
  `LudoStore` over an in-process `Map` keyed by `(appId, environment)`,
  matching `merge-relay/memory-store.ts`'s concurrency-safe
  read/transact pattern (single-flight per scope).
- [ ] Create `packages/api/src/games/ludo/drizzle-store.ts` implementing
  `LudoStore` with targeted per-row upserts/deletes inside a single Drizzle
  transaction per `transact()` call, plus a read-only path for `read()` that
  never opens a write transaction.
- [ ] Create `packages/api/src/games/ludo/drizzle-store.test.ts` covering
  optimistic revision conflicts, transaction rollback on thrown error inside
  `transact`, and app/environment scope isolation, matching
  `merge-relay/drizzle-store.test.ts`'s coverage shape, using an injected
  fake Postgres client (do not require a real database for this test file).
- [ ] Create `packages/api/src/games/ludo/drizzle-postgres.test.ts` mirroring
  `merge-relay/drizzle-postgres.test.ts`: skips explicitly when
  `LUDO_TEST_DATABASE_URL` is unset, otherwise runs the adapter against a
  real isolated PostgreSQL database applying all checked-in migrations
  first.
- [ ] Add a Ludo isolation test (extend `packages/api/src/games/
  isolation.test.ts` or add `packages/api/src/games/ludo/isolation.test.ts`)
  proving a `debug`-scoped write is invisible to a `staging`-scoped read for
  the same `matchId`.

## Files Touched

- `packages/db/src/schema.ts`
- `packages/db/drizzle/*` (generated migration, new file)
- `packages/api/src/games/ludo/store.ts`
- `packages/api/src/games/ludo/memory-store.ts`
- `packages/api/src/games/ludo/drizzle-store.ts`
- `packages/api/src/games/ludo/drizzle-store.test.ts`
- `packages/api/src/games/ludo/drizzle-postgres.test.ts`
- `packages/api/src/games/ludo/isolation.test.ts` (new or extended)

## Acceptance Criteria

- `cd packages/db && bun run typecheck` passes with the six new tables typed
  and exported.
- `db:generate` produces a checked-in, unapplied migration; no `db:push` was
  run against a real database by this task.
- `drizzle-store.test.ts` passes against a fake Postgres client with no
  external database required.
- `drizzle-postgres.test.ts` explicitly skips (not fails) when
  `LUDO_TEST_DATABASE_URL` is unset, and — when run locally against a real
  throwaway PostgreSQL 16 database with the generated migration applied —
  passes concurrency, rollback, and scope-isolation assertions.
- The Drizzle adapter never rewrites an unbounded whole-scope snapshot on a
  single-row change (verified by inspecting the generated SQL/queries in the
  implementation, not just by test coverage).

## Verification Commands

- `cd packages/db && bun run typecheck`
- `cd packages/db && DATABASE_URL=postgresql://migration-generator.invalid/ludo bun run db:generate`
- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test -- drizzle-store.test.ts`
- `LUDO_TEST_DATABASE_URL=... cd packages/api && bun run test -- drizzle-postgres.test.ts` (skips explicitly when unset)
- `bun run check`

## Out of Scope

- Match engine/command processing logic (tasks 17/18).
- Applying any migration to a real production or staging database.
- Matchmaking/room business logic (tasks 20/21) — this task only adds their
  storage shape, including the `match_origin` column those tasks branch on.

## Commit message

`feat(ludo): add durable postgres storage for ludo matches and events [15-ludo-launch/16]`
