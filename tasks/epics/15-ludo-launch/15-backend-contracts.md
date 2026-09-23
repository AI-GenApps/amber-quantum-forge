---
epic: 15-ludo-launch
task: 15-backend-contracts
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/14-auth-refresh-fix]
estimate: L
---

# Freeze the Ludo HTTP contract and game-token issuance

## Goal

Define the versioned Ludo HTTP DTOs, snake_case wire codecs, and validation
under `packages/api/src/games/ludo/`, plus a game-token issuance route that
reuses `packages/api/src/games/tokens.ts`'s signing/verification pattern —
mirroring how `packages/api/src/games/merge-relay/{contracts,wire,
validation}.ts` and the generic `GAME_TOKEN_SECRET_<APP>_<ENV>` scheme work —
so tasks 05-09 all build against one frozen shape.

## Context/Decisions

- Follow the Merge Relay layering exactly: `contracts.ts` (pure TS
  interfaces + `LUDO_CONTRACT_VERSION`/`LUDO_SCHEMA_VERSION` constants),
  `wire.ts` (snake_case <-> camelCase codec functions, matching
  `merge-relay/wire.ts`'s style), `validation.ts` (input guards for every
  route body). Session/role/environment types come from the existing generic
  `packages/api/src/games/contracts.ts` (`GameSession`, `GameRole`,
  `GameEnvironment`) — do not redefine them.
- Contract version string: `"ludo.v1"`.
- Core DTOs to define now (bodies come later; this task freezes shape and
  validation only):
  - `LudoMatchSummary` (matchId, mode: `classic`/`quick`, status:
    `waiting`/`active`/`finished`/`abandoned`, playerCount, seats, createdAt,
    updatedAt).
  - `LudoMatchState` (mirrors `ludo_rules`' `LudoMatchState` shape from task
    01/02 but as a wire DTO — tokens per player, current turn, current phase,
    dice streak, deadlineAt for the active turn).
  - `LudoCommand` union: `create_match`, `join_match`, `roll_dice`,
    `move_token`, `claim_timeout`, `surrender`, `rematch` — each with an
    idempotency key field, matching Merge Relay's idempotency convention
    (`packages/api/src/games/merge-relay/data-validation.ts` and the unique
    `(match_id, sequence)`-style guard described for `ludo_events` in task
    05).
  - `LudoEvent` union mirroring `ludo_rules`' replay event kinds
    (`dice_rolled`, `token_moved`, `token_captured`, `token_finished`,
    `turn_forfeited`, `match_finished`) plus server-only events
    (`player_joined`, `player_left`, `bot_filled`, `turn_timed_out`).
  - `LudoDailyMatchmakingTicket`/`LudoRoom` DTOs deferred to tasks 20/21 (only
    stub the type names here so tasks 20/21 do not need to touch this file's
    exports list twice).
- Add `"ludo"` to `packages/api/src/games/tokens.ts`'s consumers implicitly
  by using the existing generic `GameTokenConfig`/`signGameToken`/
  `EnvironmentGameTokenVerifier` — no changes needed to `tokens.ts` itself
  since it is already generic over `GameAppId` (which now includes `"ludo"`
  after task 00). This task adds the route that calls `signGameToken` for
  Ludo specifically: `POST /games/ludo/:environment/session`, which accepts
  an already-verified API JWT (via `verifyApiToken` from
  `packages/api/src/routes/auth-tokens.ts`) and returns a short-lived
  `GAME_TOKEN_SECRET_LUDO_<ENV>`-signed game token with `role: "player"` and
  `subject` set to the API JWT's `sub` (the Firebase UID, correct as of task
  03's fix).
- Do not implement match/matchmaking/room logic in this task — only the
  contract types, wire codecs, validation, and the session/token route.
  Route mounting into `packages/api/src/index.ts` under `/games/ludo` happens
  here for the session route only; tasks 17/18/20/21/22 add further routes to the
  same mounted Hono instance.

## Implementation Checklist

- [ ] Create `packages/api/src/games/ludo/contracts.ts` with the DTOs and
  constants above.
- [ ] Create `packages/api/src/games/ludo/wire.ts` with snake_case codec
  functions for every DTO (`toWireMatchState`, `fromWireCommand`, etc.),
  matching `merge-relay/wire.ts`'s naming convention.
- [ ] Create `packages/api/src/games/ludo/validation.ts` with a validator per
  inbound DTO (command bodies, environment/appId guards) returning a
  discriminated `{ ok: true, value } | { ok: false, error }` result, matching
  `merge-relay/validation.ts`'s style.
- [ ] Create `packages/api/src/games/ludo/errors.ts` with a small typed error
  set (`ludo_invalid_command`, `ludo_match_not_found`,
  `ludo_forbidden_role`, `ludo_token_configuration_unavailable`, etc.),
  matching `merge-relay/errors.ts`'s style.
- [ ] Create `packages/api/src/games/ludo/routes.ts` exporting a
  `createConfiguredLudoRoutes()` factory (matching
  `createConfiguredMergeRelayRoutes()`'s signature in
  `packages/api/src/games/index.ts`) that currently only mounts `POST
  /:environment/session` (the game-token issuance route described above).
- [ ] Mount it in `packages/api/src/index.ts` as `app.route("/games/ludo",
  createConfiguredLudoRoutes())`, alongside the existing Merge Relay and
  generic games mounts.
- [ ] Add `packages/api/src/games/ludo/contract-regressions.test.ts` covering
  wire round-trips (encode/decode identity for every DTO) and validation
  rejection of malformed payloads, matching
  `merge-relay/contract-regressions.test.ts`'s coverage shape.
- [ ] Add `packages/api/src/games/ludo/routes.test.ts` covering: session
  route requires a valid API JWT, rejects a mismatched `:environment`,
  returns a token whose `subject` matches the caller's Firebase UID, and
  that the issued token verifies against `EnvironmentGameTokenVerifier` for
  `appId: "ludo"`.
- [ ] Document the frozen endpoint matrix (so far: just the session route) in
  `docs-internal/gaming/ludo-flutter-plan.md`'s API section — if that file
  does not exist yet, create a minimal stub here with a "Contracts" section
  only; task 28 fills in the rest of the document.

## Files Touched

- `packages/api/src/games/ludo/contracts.ts`
- `packages/api/src/games/ludo/wire.ts`
- `packages/api/src/games/ludo/validation.ts`
- `packages/api/src/games/ludo/errors.ts`
- `packages/api/src/games/ludo/routes.ts`
- `packages/api/src/games/ludo/contract-regressions.test.ts`
- `packages/api/src/games/ludo/routes.test.ts`
- `packages/api/src/index.ts`
- `docs-internal/gaming/ludo-flutter-plan.md` (stub)

## Acceptance Criteria

- Every DTO round-trips through its wire codec byte-for-byte (parsed JSON
  equality) in the regression test.
- The session route rejects an unauthenticated caller (`401`), a caller
  whose API JWT is valid but whose requested `:environment` is not
  `debug`/`staging`/`production` (`400`), and issues a token that
  successfully verifies via `EnvironmentGameTokenVerifier` with `appId:
  "ludo"` when `GAME_TOKEN_SECRET_LUDO_<ENV>`, `GAME_TOKEN_ISSUER`, and
  `GAME_TOKEN_AUDIENCE` are configured, and fails closed with
  `ludo_token_configuration_unavailable` when they are not.

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test`
- `bun run check`

## Out of Scope

- Match, matchmaking, room, or event persistence (tasks 05-09).
- Any route other than session issuance.
- Client consumption of these contracts (tasks 24-26).

## Commit message

`feat(ludo): freeze ludo HTTP contracts and add game-token session route [15-ludo-launch/15]`
