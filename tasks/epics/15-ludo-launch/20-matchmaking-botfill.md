---
epic: 15-ludo-launch
task: 20-matchmaking-botfill
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/19-turn-timeouts]
estimate: L
---

# Add random matchmaking with bot-fill

## Goal

Implement online random matchmaking (2p/4p tickets) on top of the
`ludo_matchmaking_tickets` table (task 16) and the match engine/service
(tasks 17/18), with bot-fill both for a stalled ticket and for a
disconnecting seat mid-match.

## Context/Decisions

- Random matchmaking: a player submits a ticket (`mode`, `seat_target`: 2 or
  4). The service does a FIFO scan of `searching` tickets with the same
  `(app_id, environment, mode, seat_target)` ordered by `created_at`. When
  enough tickets are found, a match is created (task 18's `createMatch`,
  passing `matchOrigin: "matchmaking"` — this column already exists on
  `ludo_matches` from task 16, no schema change needed here) and every
  matched ticket transitions to `matched` with `matched_match_id` set.
- Bot-fill on a stalled ticket: if a ticket has been `searching` for longer
  than a configured `LUDO_MATCHMAKING_BOT_FILL_SECONDS` (default 20s), the
  sweep fills the remaining seats with bot players (reusing
  `ludo_players.is_bot`/`bot_difficulty`, defaulting to `medium`) and starts
  the match immediately rather than leaving the human waiting indefinitely.
- Bot-fill mid-match: extend the disconnect/miss-count handling in
  `service.ts` (tasks 18/19) so that when a seat's `match_origin` is
  `"matchmaking"`, three consecutive misses replace that seat with a bot
  instead of forfeiting it, for the remainder of that match — reusing the
  timeout/miss-count machinery from task 19 as the disconnect signal. Room-
  originated matches (task 21) keep task 19's existing forfeit-on-three-misses
  behavior unchanged; this task must not alter that path, only add a branch
  for the matchmaking case, explicit in code (an `if (match.matchOrigin ===
  "matchmaking")` branch, not an implicit default).
- Matchmaking sweeping runs on the same Cron cadence as task 19's sweeper —
  extend the sweeper route to also scan `ludo_matchmaking_tickets` where
  `status = 'searching' AND created_at < now() - bot_fill_window`, bounded
  the same way (cap rows per invocation).

## Implementation Checklist

- [ ] Add `LudoMatchmakingTicket` DTOs to
  `packages/api/src/games/ludo/contracts.ts` (the stub from task 15), wire
  codecs in `wire.ts`, and validators in `validation.ts`.
- [ ] Add `packages/api/src/games/ludo/matchmaking-service.ts`:
  `createTicket`, `cancelTicket`, `sweepMatchmaking(now)` implementing the
  FIFO match + bot-fill logic above, transactionally via `LudoStore`, calling
  task 18's `createMatch` with `matchOrigin: "matchmaking"`.
- [ ] Extend disconnect/miss-count handling in `service.ts` (tasks 18/19) to
  bot-fill a matchmaking-origin seat instead of forfeiting it, explicitly
  branching on `match_origin`.
- [ ] Wire `POST /:environment/matchmaking/tickets` and `DELETE
  /:environment/matchmaking/tickets/:ticketId` into `routes.ts`, each
  requiring a verified Ludo game token.
- [ ] Extend task 19's sweeper route to also call `sweepMatchmaking`,
  bounded per invocation.
- [ ] Add `packages/api/src/games/ludo/matchmaking-service.test.ts` covering
  2p and 4p FIFO matching, bot-fill after the configured window, and no
  premature match with too few tickets.
- [ ] Add `packages/api/src/games/ludo/routes.test.ts` cases (extend) for
  the two new routes' auth/validation paths.
- [ ] Add a `service.test.ts` case (extend task 18's file) proving a
  matchmaking-origin seat is bot-filled after three misses while a
  direct-origin match (task 18's default) is unaffected by this branch.

## Files Touched

- `packages/api/src/games/ludo/contracts.ts`
- `packages/api/src/games/ludo/wire.ts`
- `packages/api/src/games/ludo/validation.ts`
- `packages/api/src/games/ludo/matchmaking-service.ts`
- `packages/api/src/games/ludo/service.ts`
- `packages/api/src/games/ludo/routes.ts`
- `packages/api/src/games/ludo/matchmaking-service.test.ts`
- `packages/api/src/games/ludo/service.test.ts`
- `packages/api/src/games/ludo/routes.test.ts`

## Acceptance Criteria

- Two 2p tickets for the same mode match into one match within one sweep;
  four 4p tickets match into one 4-seat match; mismatched `seat_target`
  never cross-match.
- A ticket older than `LUDO_MATCHMAKING_BOT_FILL_SECONDS` is filled with
  bots and starts a match without further human input.
- A disconnecting player in a matchmaking-origin match is replaced by a bot
  after three misses; a direct-origin match's three-miss forfeit behavior
  (task 19) is unchanged (both covered by tests).
- No migration file is added by this task — `match_origin` already existed
  from task 16.

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test`
- `bun run check`

## Out of Scope

- Private rooms (task 21).
- Client-side matchmaking UI (task 26).
- Realtime push of match state to matched players (task 22).
- Real Vercel Cron scheduling verification (task 29).

## Commit message

`feat(ludo): add random matchmaking with bot-fill [15-ludo-launch/20]`
