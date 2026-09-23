---
epic: 15-ludo-launch
task: 18-command-service
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/17-match-engine-parity]
estimate: L
---

# Build the transactional command service and match routes

## Goal

Add a transactional command service that applies `LudoCommand`s against
`LudoStore` (task 16) using task 17's pure TS engine, and wire the
create-match / process-command HTTP routes on top of it.

## Context/Decisions

- Commands are processed transactionally via `LudoStore.transact()`: load
  match + player rows for the scope, validate the command against current
  phase/turn/seat ownership, apply the engine transition (task 17's pure
  functions), append the resulting event(s) to `ludo_events` with the next
  `sequence` number, upsert `ludo_matches`/`ludo_players` rows, and record
  the command's idempotency result in `ludo_commands` — all inside one
  transaction. A repeated command with a seen idempotency key must
  short-circuit before any engine logic runs.
- Match creation/joining is included here (a match needs to exist before
  commands can target it) as the direct known-match-id path only — used by
  private rooms (task 21) and by vs-computer/local modes' server-authoritative
  fallback, if any (vs-computer/pass-and-play are otherwise fully
  client-local per task 12). Matchmaking ticket-to-match promotion is task
  20; that task calls this task's `createMatch` rather than duplicating its
  transaction logic.
- Every state-changing transaction sets `ludo_matches.match_origin` (task
  16's column) explicitly — `"direct"` for this task's plain create/join
  path; tasks 20/21 pass `"matchmaking"`/`"room"` through the same
  `createMatch` call rather than writing the column separately.

## Implementation Checklist

- [ ] Create `packages/api/src/games/ludo/service.ts`: `createMatch(...,
  matchOrigin)`, `joinMatch`, `processCommand(command)` implementing the
  transactional flow above against `LudoStore`, using task 17's engine.
- [ ] Add `LudoCommandError`/`LudoMatchNotFoundError`/etc. to
  `packages/api/src/games/ludo/errors.ts` (extend the file from task 15) for
  every rejection path (wrong turn, wrong phase, unknown match, illegal
  move, duplicate idempotency key with mismatched payload).
- [ ] Add `packages/api/src/games/ludo/service.test.ts` covering: idempotent
  duplicate command short-circuit, transactional rollback leaves no partial
  event, wrong-turn rejection, `match_origin` is recorded correctly for a
  direct-created match, and a full match played end-to-end through
  `processCommand` reaching `finished` with a winner recorded.
- [ ] Wire `POST /:environment/matches` (create) and `POST
  /:environment/matches/:matchId/commands` (process command) into
  `packages/api/src/games/ludo/routes.ts` (extends task 15's
  `createConfiguredLudoRoutes()`), requiring a verified Ludo game token
  (task 15's session token) and enforcing seat ownership from the token's
  `subject`.
- [ ] Add `packages/api/src/games/ludo/routes.test.ts` cases (extend task
  15's file) for the two new routes: unauthenticated rejection, wrong-seat
  rejection, and a successful roll-then-move round trip.

## Files Touched

- `packages/api/src/games/ludo/service.ts`
- `packages/api/src/games/ludo/errors.ts`
- `packages/api/src/games/ludo/routes.ts`
- `packages/api/src/games/ludo/service.test.ts`
- `packages/api/src/games/ludo/routes.test.ts`

## Acceptance Criteria

- A full 2-player and a full 4-player match can be played end-to-end through
  `processCommand` and reaches `finished` with a single winner.
- Duplicate commands (same idempotency key) never double-apply a move or
  double-append an event.
- A match created via `createMatch` records `match_origin: "direct"`
  without a follow-up migration or schema change.

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test`
- `bun run check`

## Out of Scope

- The TS engine port and Dart/TS parity mechanism (task 17).
- Turn timeout enforcement and the Cron sweeper (task 19).
- Matchmaking tickets, bot-fill, and private rooms (tasks 20/21).
- Realtime fanout (task 22).
- Client consumption (tasks 24-26).

## Commit message

`feat(ludo): add transactional command service and match routes [15-ludo-launch/18]`
