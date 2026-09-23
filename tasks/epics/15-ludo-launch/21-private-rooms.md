---
epic: 15-ludo-launch
task: 21-private-rooms
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/20-matchmaking-botfill]
estimate: M
---

# Add private rooms with shareable invite codes

## Goal

Implement private rooms on top of the `ludo_rooms` table (task 16) and the
match engine/service (tasks 17/18): create-by-code, join-by-code, and a
shareable deep-link invite string, with room-originated matches keeping the
existing forfeit-on-disconnect behavior (task 19) rather than the bot-fill
behavior task 20 adds for matchmaking.

## Context/Decisions

- `POST /:environment/rooms` creates a `ludo_rooms` row with a short,
  human-shareable `room_code` (e.g. 6 uppercase alphanumeric characters,
  collision-checked against existing unexpired rooms in scope),
  `owner_subject`, `mode`, `seat_target`. `POST
  /:environment/rooms/:roomCode/join` lets another player join by code;
  when `seat_target` players have joined, the room creates a match via task
  18's `createMatch`, passing `matchOrigin: "room"` (the column already
  exists from task 16 — no schema change here), and sets
  `ludo_rooms.match_id`. Rooms expire (`expires_at`) if not filled within a
  configured window (default 24h) — swept the same way as matchmaking
  tickets (task 20).
- Share invite: the room-create response includes a deep-link-shaped string
  using the registry's `deepLink` namespace (`w3dev-ludo://room/<code>`,
  from `namespaces("ludo").deepLink` in task 00's registry entry) for the
  client (task 26) to hand to the OS share sheet — this task only returns
  the string, it does not implement app-side deep link handling.
- Room-originated matches use task 19's existing three-miss forfeit
  behavior unchanged — task 20's matchmaking-only bot-fill branch explicitly
  checks `match_origin === "matchmaking"`, so a room-originated match
  (`match_origin === "room"`) falls through to the pre-existing forfeit
  path with no code change required here. This task adds a regression test
  proving that, not new forfeit logic.

## Implementation Checklist

- [ ] Add `LudoRoom` DTOs to `packages/api/src/games/ludo/contracts.ts`
  (the stub from task 15), wire codecs in `wire.ts`, and validators in
  `validation.ts`.
- [ ] Add `packages/api/src/games/ludo/room-service.ts`: `createRoom`,
  `joinRoom`, `sweepExpiredRooms(now)`, with collision-safe room-code
  generation, calling task 18's `createMatch` with `matchOrigin: "room"`.
- [ ] Wire `POST /:environment/rooms` and `POST
  /:environment/rooms/:roomCode/join` into `routes.ts`, each requiring a
  verified Ludo game token.
- [ ] Extend task 20's sweeper integration to also call
  `sweepExpiredRooms`, bounded per invocation.
- [ ] Add `packages/api/src/games/ludo/room-service.test.ts` covering room
  creation, join-to-full triggers match creation, code collision retry, and
  expiry sweep.
- [ ] Add a `packages/api/src/games/ludo/service.test.ts` case (extend)
  proving a room-originated match's disconnecting seat is forfeited after
  three misses (task 19's existing behavior), not bot-filled.
- [ ] Add `packages/api/src/games/ludo/routes.test.ts` cases (extend) for
  the two new routes' auth/validation paths.

## Files Touched

- `packages/api/src/games/ludo/contracts.ts`
- `packages/api/src/games/ludo/wire.ts`
- `packages/api/src/games/ludo/validation.ts`
- `packages/api/src/games/ludo/room-service.ts`
- `packages/api/src/games/ludo/routes.ts`
- `packages/api/src/games/ludo/room-service.test.ts`
- `packages/api/src/games/ludo/service.test.ts`
- `packages/api/src/games/ludo/routes.test.ts`

## Acceptance Criteria

- A room's join-to-full transition creates exactly one match and is
  idempotent against a duplicate join request with the same idempotency
  key.
- A disconnecting player in a room-originated match is forfeited after
  three misses, not bot-filled (verified by a test), confirming task 20's
  branch did not change this path.
- No migration file is added by this task.

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test`
- `bun run check`

## Out of Scope

- Random matchmaking and bot-fill (task 20).
- Client-side room create/join UI and share-sheet integration (task 26).
- Realtime push of match state to matched players (task 22).
- Real Vercel Cron scheduling verification (task 29).

## Commit message

`feat(ludo): add private rooms with shareable invite codes [15-ludo-launch/21]`
