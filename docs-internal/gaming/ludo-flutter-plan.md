---
title: Ludo Flutter Plan
description: Architecture of the Ludo Vortex Flutter and Flame client, the ludo_rules package, the server-authoritative backend and the economy, written for the next owner.
---

# Ludo Flutter Plan

Architecture reference for **Ludo Vortex** (registry id `ludo`, bundle
`app.w3dev.ludo` and `app.w3dev.ludo.debug`), the sixth Flutter client in the
`apps-native/games` workspace. It is the document to read first when you pick
the project up. It was started as a contract stub by task `15-ludo-launch/15`,
extended with the identity design by task 23, and completed by task 28.

This is a **different document for a different stack** from
[`ludo-implementation-plan.md`](ludo-implementation-plan) and
[`ludo-mobile-ui-plan.md`](ludo-mobile-ui-plan). Those describe the earlier
Unity 3D project at `apps-native/unity/ludo/`, which is frozen, includes
blockades, and is superseded by this epic. Nothing here updates them.

Companion documents:

| Need | Read |
|---|---|
| Who owns what, and which requirements are verified by which test | [Ludo handoff](handoffs/ludo) |
| What a human must provision and verify before launch (task 29) | [Ludo release checklist](ludo-release-checklist) |
| Economy numbers and policy | [Ludo economy](ludo-economy) |
| RevenueCat, AdMob and Play product setup | [runbook](ludo-revenuecat-admob-runbook), [product ids](ludo-store-product-ids) |
| Store compliance drafts | [privacy policy](ludo-privacy-policy), [data safety](ludo-data-safety), [content rating](ludo-content-rating), [store listing](ludo-store-listing) |
| Frame and size budgets | [performance budgets](ludo-performance-budgets) |
| Product answers, decisions, open questions | `.agents/games/ludo-vortex/` (knowledge base) |
| Task-by-task history | `tasks/epics/15-ludo-launch/` and its `STATUS.md` |

## Shape of the system

```text
Flutter + Flame client (apps-native/games/ludo)
  |  local modes: pure Dart ludo_rules, no network needed
  |  online modes: HTTPS to the Hono API, Firestore listener, polling fallback
  v
apps/web (Next.js) hosts the Hono API at /api/*  --> packages/api/src/games/ludo
  |  game token (HS256, per environment) guards every match route
  |  pure TS authority engine (a port of ludo_rules, proven equal by parity tests)
  v
Postgres via Drizzle (packages/db)          Firestore (optional read mirror)
  ludo_* tables                               games/ludo/<environment>/matches/<matchId>
```

Design rules that hold across the whole system:

- **Local play never needs a server.** Computer and Pass N Play run entirely on
  `ludo_rules`. A build without `LUDO_API_BASE_URL` or Firebase config degrades
  to a lobby with the online tiles disabled, never to an error.
- **The server is the only dice authority online.** Dice are drawn by a CSPRNG
  on the server and recorded as events; a client can never influence a roll.
- **Postgres is the source of truth; Firestore is a mirror.** The polling route
  returns the same view the Firestore document holds.
- **Every external dependency has a graceful absent state:** Firebase, Firestore,
  RevenueCat keys, AdMob units, the database. Absent config is a no-op or a
  disabled feature, never a crash. This is what let tasks 00 to 28 finish without
  any real credentials.
- **Coins and diamonds are virtual and never cashable.** No code path may
  contradict the policy in [Ludo economy](ludo-economy).

## Path map

Task numbers refer to `tasks/epics/15-ludo-launch/`. Paths are relative to the
repository root. Every path in this table was checked against the working tree
by task 28.

### Registry, CI and tooling (task 00)

| Path | Role |
|---|---|
| `scripts/games/registry-types.ts`, `registry-games.ts`, `registry.ts` | Registry entry for `ludo` (stable id, bundle ids, capabilities) |
| `scripts/games/generate.ts` | Generates `game.config.json` and the Dart registry |
| `apps-native/games/ludo/game.config.json` | Generated per-game config |
| `apps-native/games/packages/platform_core/lib/src/generated/game_app_registry.dart` | Generated Dart registry |
| `.github/workflows/games-ci.yml`, `games-build.yml`, `games-android-release.yml` | CI allowlists that include `ludo` |
| `docs-internal/gaming/sources.json`, `docs-internal/gaming/sources/ludo.json` | Source provenance record |
| `scripts/games/ludo-parity.ts` | Three-way parity runner (task 17), invoked as `bun run games:ludo:parity` |

### Rules package `ludo_rules` (tasks 01, 02, 12g)

Root: `apps-native/games/packages/ludo_rules/`. Pure Dart, no Flutter, Flame or
device imports (enforced by grep in task 01 and by the package pubspec).

| Path | Role |
|---|---|
| `lib/ludo_rules.dart` | Public API barrel |
| `lib/src/ludo_config.dart` | `LudoRuleset.classic` and `LudoRuleset.quick`, `LudoWinCondition`, `ludoRulesVersion` |
| `lib/src/ludo_board.dart` | 52-cell track, start and star cells, safe-cell test, per-color geometry |
| `lib/src/ludo_models.dart` | `LudoToken`, `LudoPlayerState`, `LudoMatchState`, phases |
| `lib/src/ludo_engine.dart` | `rollDice`, `legalMoves`, `applyMove`, `isTerminal`, injectable `LudoDiceSource` |
| `lib/src/ludo_replay.dart` | Append-only event log and `replay(events, ruleset)` |
| `lib/src/ludo_bot.dart` | `EasyBotStrategy`, `MediumBotStrategy`, `HardBotStrategy` |
| `bin/replay_fixture.dart`, `bin/parity_runner.dart` | Fixture CLI and the entry point the parity runner compiles to JS |
| `test/*.dart`, `test/fixtures/*.json` | Engine, board, bot, replay, Quick-mode and Classic-regression tests plus eight fixtures |

### Client app `ludo` (tasks 03 to 13, 24 to 26x, 26e, 26g, 26h, 27)

Root: `apps-native/games/ludo/`. Layout convention fixed by task 03.

| Directory under `lib/src/` | Contents | Tasks |
|---|---|---|
| `app.dart`, `../main.dart` | App shell, routing, guarded startup, crash-handler install | 03, 24, 27 |
| `assets/` | `ludo_art_manifest.dart`, the named art and audio slot registry | 03, 12b |
| `game/` | Flame scene: board, geometry, tokens, dice, capture particles, confetti, arrival burst, highlights, bot turn runner | 04, 05, 12a to 12d2 |
| `audio/` | `ludo_audio_service.dart`, `ludo_haptics.dart` | 06 |
| `theme/` | Theme tokens, `ThemeData`, text styles, background painter | 12b |
| `widgets/` | Reusable chrome (panels, 3D buttons, badges, avatars, corner cards, wallet HUD, store cards, daily-reward widgets, reconnect banner) | 12b, 12d, 26e, 26g, 26h, 26x |
| `screens/` | Splash, onboarding (welcome, profile, tutorial), home lobby, mode setup sheet, game board, pause and quit, results, settings, how to play, matchmaking search, store, daily reward, pass-and-play interstitial | 07 to 10, 12e, 26, 26g, 26h |
| `state/` | Local save and resume, profile and sound settings, reduced motion, wallet, inventory, equip, IAP, rewarded ads, daily reward, offline XP queue | 11, 26e, 26g, 26h |
| `net/` | HTTP transport, typed gateway, auth controller, Firebase abstraction, match-state source (Firestore plus polling), online controller and client, deep links, wire models, preview mode, ads and purchases adapters | 24, 25, 26, 26x, 26g, 26h |
| `telemetry/` | `ludo_telemetry.dart`, `ludo_crash_reporter.dart` | 12, 26, 27 |

Tests live under `apps-native/games/ludo/test/` mirroring this layout, with
goldens in `test/goldens/`. Runtime assets are in `apps-native/games/ludo/assets/`
(`art`, `audio`, `branding`, `fonts`) and the content manifest in
`apps-native/games/ludo/content/manifest.json`.

### Backend `packages/api/src/games/ludo/` (tasks 14 to 23, 26a to 26d, 26h)

Mounted in `packages/api/src/index.ts` as `app.route("/games/ludo", ...)` and
`app.route("/games/ludo/cron", ...)`, so every public URL starts with `/api`.

| Path | Role | Task |
|---|---|---|
| `contracts.ts`, `wire.ts`, `validation.ts`, `errors.ts` | DTOs, snake_case wire codecs, inbound validation, typed errors | 15 |
| `routes.ts`, `routes-types.ts` | Hono routes, game-token auth, store selection | 15, 18, 20, 21, 22 |
| `store.ts`, `memory-store.ts`, `drizzle-store.ts` | `LudoStore` interface, in-memory and Drizzle implementations | 16 |
| `engine.ts`, `engine-model.ts`, `dice.ts` | TS authority engine, models, injectable dice | 17 |
| `service.ts`, `service-types.ts`, `match-view.ts` | Transactional command service, view assembly | 18, 22 |
| `timeout.ts`, `sweep.ts`, `cron-routes.ts` | Turn deadlines, forfeit and bot-fill rules, Cron sweeper | 19 |
| `matchmaking-service.ts` | Tickets, FIFO matching, bot-fill sweep | 20 |
| `room-service.ts` | Private rooms and invite codes | 21 |
| `match-view-publisher.ts`, `firestore-match-view-publisher.ts`, `dependencies.ts` | Fanout interface, Firestore adapter, selection factory | 22 |
| `economy-config.ts`, `economy-store*.ts`, `economy-drizzle-store*.ts` | Versioned economy numbers, wallet store, atomic capped claims | 26a to 26h |
| `wallet-routes.ts`, `progression-service.ts`, `vortex-pass.ts` | Wallet, profile, inventory, XP, starter grant, daily reward | 26b, 26h |
| `coin-stake.ts` | Coin-table escrow, payout and refund | 26c |
| `revenuecat-routes.ts`, `revenuecat-client.ts`, `iap-catalog.ts` | Webhook, sync, product grants | 26d |
| `rewarded-ads-routes.ts`, `admob-ssv.ts`, `free-play-reward.ts` | AdMob server-side verification callback and caps | 26h |

Supporting files outside that folder: `packages/api/src/games/contracts.ts`
(shared game environments, task 00), `packages/api/src/games/tokens.ts` (game token
issue and verify), `packages/api/src/firebase/admin.ts` (lazy Firebase Admin and
Firestore accessors, task 22), `packages/api/src/routes/auth-tokens.ts` (API JWT
exchange, fixed in task 14), `apps/web/vercel.json` (Cron schedule, task 19).

### Database `packages/db` (tasks 16, 26a, 26c, 26d, 26h)

Schema in `packages/db/src/schema.ts`; generated migrations in
`packages/db/migrations/` (task 16's file list says `packages/db/drizzle/*`,
but this repo's output directory is `migrations`).

| Migration | Creates |
|---|---|
| `0005_yummy_warbound.sql` | `ludo_matches`, `ludo_players`, `ludo_events`, `ludo_commands`, `ludo_matchmaking_tickets`, `ludo_rooms` |
| `0006_eager_lenny_balinger.sql` | `ludo_wallet_transactions`, `ludo_balances`, `ludo_inventory`, `ludo_catalog`, `ludo_progression`, `ludo_daily_reward_state`, `ludo_ad_reward_claims`, `ludo_coin_table_escrow` |
| `0007_lyrical_scalphunter.sql` | `ludo_xp_claims` |
| `0008_boring_omega_sentinel.sql` | adds `coin_tier` (checked to `low`, `mid`, `high`) to `ludo_matchmaking_tickets` and `ludo_rooms`; no new table |
| `0009_deep_patriot.sql` | `ludo_revenuecat_events`, `ludo_subscriptions` |
| `0010_silly_joystick.sql` | `ludo_free_play_win_claims` |

All six must be applied, in order, to a real database before online play works.
Task 29's original text said no later task added a migration; that is wrong, and
the [release checklist](ludo-release-checklist) lists all six.

## Rulesets (frozen)

The source of truth is code: `LudoRuleset.classic` and `LudoRuleset.quick` in
`apps-native/games/packages/ludo_rules/lib/src/ludo_config.dart`, mirrored by
`LUDO_RULESETS_BY_ID` in `packages/api/src/games/ludo/engine-model.ts`. The text
below is copied from the task that froze each decision, not paraphrased.

### Shared board (task 01)

Re-derived from Ludo King's standard board; not taken from the Unity fixture
(`apps-native/unity/ludo/Assets/Content/ludo_v1.json`), which is marked "not
assumed to be universal Ludo rules" and includes blockades. Constants live in
`ludo_board.dart`.

- 52 shared track squares, indices `0..51`, plus a private 6-square home stretch
  per color.
- Four colors, start squares spaced 13 apart: red 0, green 13, yellow 26, blue 39.
- Eight safe squares: each color's start square plus one star square 8 ahead of
  each start (8, 21, 34, 47). No capture happens on a safe square.

### Classic (task 01, product-decided, final)

2-4 players, 52-cell track + 6-cell home stretch per color, 4 tokens per player,
a 6 is required to leave the yard, rolling a 6 grants an extra roll, a third
consecutive 6 forfeits the turn without applying that roll, capturing an
opponent on a non-safe cell sends it to the yard and grants the capturing player
a bonus roll, a token reaching home grants a bonus roll, start squares and star
squares are safe (no capture there), there are **no blockades** (any number of
tokens, same or different color, may occupy a cell), and finishing requires an
exact roll (overshooting is an illegal move for that token). No legal move means
the turn passes automatically. The winner is the first player with all four
tokens finished.

Config values: `stepsToHomeEntry` 51, `homeLength` 6, `requiresYardExitRoll`
true, `preReleasedTokensPerPlayer` 0, `winCondition` `allTokensHome`,
`rulesVersion` `LUDO-1`.

### Quick (task 12g, which supersedes task 01's original guess)

Task 01 had to invent Quick mode because no source defined it, and shipped a
shortened 25-step track with no yard. That guess was wrong. Task 12g recorded the
product decision of 2026-09-25, sourced from Gametion's own announcement of Ludo
King Quick Mode (`.agents/resources/2026-09-25/ludo-king-points/README.md`):

Quick uses the **full-length Classic track** and differs from Classic in exactly
two ways.

1. Each player starts with 2 of their 4 tokens already released onto their start
   square. The other 2 start in the yard, and a 6 is still required to release a
   yard token.
2. The win condition is objective-based. A player wins the instant they satisfy
   **both** "has at least one token home" and "has captured at least one
   opponent token during the match", evaluated at every point either condition
   becomes newly true (after a `tokenFinished` and after a `tokenCaptured`), not
   at end of turn. A token reaching home with no capture yet does not win; play
   continues.

Everything else is unchanged from Classic. The match ends at the first winner.
Remaining players are ranked by (1) more tokens finished, (2) more captures made,
(3) more total path progress with the yard counting as 0, and (4) lower seat
number. There is no points system.

Config values: `stepsToHomeEntry` 51, `homeLength` 6, `requiresYardExitRoll`
true, `preReleasedTokensPerPlayer` 2, `winCondition` `oneHomeAndOneCapture`,
`rulesVersion` `LUDO-2`. Classic stayed at `LUDO-1` and its fixtures stayed
byte-identical (guarded by `test/ludo_classic_regression_test.dart`).

### Determinism and parity

Dice are injected (`LudoDiceSource` in Dart, `LudoDiceSource` in `dice.ts`); the
engines never call a global random generator. Three runtimes must agree on the
same fixture: the Dart VM, Dart compiled to JavaScript, and the TypeScript
authority engine. `bun run games:ludo:parity` runs all three;
`packages/api/src/games/ludo/parity.test.ts` runs the TS leg inside the API test
suite. Any change to rules must bump the rules version, regenerate fixtures with
`bin/replay_fixture.dart`, and keep Classic's committed fixtures unchanged.

## HTTP contracts

Contract version `ludo.v1` (`LUDO_CONTRACT_VERSION` in
`packages/api/src/games/ludo/contracts.ts`). All paths are under `/api`.
`:environment` is `debug`, `staging` or `production` and selects the token secret
and the data partition. Wire shapes are in `contracts.ts` (types) and `wire.ts`
(snake_case codecs); inbound checks are in `validation.ts`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/games/ludo/:environment/session` | API JWT (`Authorization: Bearer`) | Exchanges the API access token for a 300 s Ludo game token, `role: "player"`. Fails closed with `ludo_token_configuration_unavailable` (503) when `GAME_TOKEN_SECRET_LUDO_<ENV>`, `GAME_TOKEN_ISSUER` or `GAME_TOKEN_AUDIENCE` is unset. |
| `POST` | `/games/ludo/:environment/matches` | game token | Create a match (mode, seats, optional coin tier) |
| `GET` | `/games/ludo/:environment/matches/:matchId` | game token, seat checked | Match summary |
| `GET` | `/games/ludo/:environment/matches/:matchId/state` | game token, seat checked | Polling fallback; same `LudoMatchView` the Firestore document holds |
| `POST` | `/games/ludo/:environment/matches/:matchId/commands` | game token, seat checked | Roll or move, idempotent by key |
| `POST` | `/games/ludo/:environment/matchmaking/tickets` | game token | Join the random matchmaking queue |
| `GET`, `DELETE` | `/games/ludo/:environment/matchmaking/tickets/:ticketId` | game token, owner only | Poll or cancel a ticket |
| `POST` | `/games/ludo/:environment/rooms` | game token | Create a private room and invite code |
| `GET` | `/games/ludo/:environment/rooms/:roomCode` | game token | Look up a room |
| `POST` | `/games/ludo/:environment/rooms/:roomCode/join` | game token | Join by code |
| `GET`, `POST` | `/games/ludo/cron/sweep-timeouts` | `Authorization: Bearer CRON_SECRET` | Timeout, matchmaking and room-expiry sweeper |
| `GET` | `/games/ludo/:environment/wallet`, `/profile`, `/inventory` | game token | Balances, level and XP, owned items |
| `POST` | `/games/ludo/:environment/inventory/purchase` | game token | Spend coins or diamonds on a catalog item |
| `POST` | `/games/ludo/:environment/xp/claim` | game token | Claim match XP, capped per day |
| `POST` | `/games/ludo/:environment/starter-grant` | game token | One-time starting balance |
| `GET`, `POST` | `/games/ludo/:environment/daily-reward`, `/daily-reward/claim` | game token | Daily calendar and claim |
| `GET` | `/games/ludo/:environment/ads/rewarded/status` | game token | Remaining rewarded-ad grants |
| `GET`, `POST` | `/games/ludo/:environment/ads/rewarded/callback` | Google signature (SSV) | AdMob reward callback, verified against Google's published keys |
| `POST` | `/games/ludo/:environment/revenuecat/webhook` | shared secret in `Authorization` | Purchase, renewal, refund events |
| `POST` | `/games/ludo/:environment/revenuecat/sync` | game token | Pull entitlement state through RevenueCat's REST API |

Match and economy errors are typed `LudoError` subclasses (`errors.ts`) rendered
as `{contract_version, error: {code, message, diagnostic_id}}` bodies with
stable codes the client maps to copy.

## Server authority and the command service (tasks 17, 18)

`service.ts` runs every state change inside one `LudoStore.transact()`: load the
match, players and events; return early on a repeated idempotency key; check seat
ownership, phase and turn; rebuild the engine state by replaying `ludo_events`
(the match and player rows cache only a few scalar fields); apply the engine
transition with the server's CSPRNG dice; append events at the next `sequence`;
record the command result. A thrown error (illegal move, wrong turn) leaves
nothing committed. `ludo_commands` holds idempotency results so a retried request
after a dropped connection returns the original outcome instead of rolling twice.

## Turn timeouts, forfeits and the sweeper (task 19)

- A seat has `LUDO_TURN_TIMEOUT_MS` = 30,000 ms to roll or move
  (`timeout.ts`). On expiry the server appends a `turnTimedOut` event, passes the
  turn to the next unskipped seat (it does not auto-play a move) and increments
  the seat's `miss_count`. `LUDO_FORFEIT_MISS_THRESHOLD` = 3 misses forfeits the
  seat. If one active seat remains it wins; if none remain the match is
  abandoned. Clients may also send the `claim_timeout` command, which drives the
  same idempotent function as the lazy check.
- **Lazy enforcement is primary.** Any read or command against a match first
  applies an elapsed deadline. The Vercel Cron job is only a backstop for matches
  nobody is polling.
- `apps/web/vercel.json` schedules `GET /api/games/ludo/cron/sweep-timeouts` every
  minute. The route requires `Authorization: Bearer <CRON_SECRET>` and answers 401
  when the secret is unset or does not match. One invocation also runs the
  matchmaking sweep (task 20) and the expired-room sweep (task 21) for every
  environment, each bounded per call.
- A swept timeout on a coin-stake match refunds the escrow (task 26c).

## Matchmaking and bot-fill (task 20)

`matchmaking-service.ts`. A client posts a ticket (mode, seat target 2 or 4,
optional coin tier). `sweepMatchmaking` groups `searching` tickets by mode and
seat target, matches the oldest first, and forms full matches. If the oldest
ticket in a group has waited longer than `LUDO_MATCHMAKING_BOT_FILL_SECONDS`
(default 20), it fills the open seats with `medium` bots and starts the match.
Bot seats are marked in the view so the client can label them. A seat in a
matchmaking-origin match that crosses the three-miss threshold is **bot-filled
instead of forfeited** (its miss count resets), while a room-origin match keeps
the forfeit behavior of task 19. `LUDO_MATCHMAKING_SWEEP_LIMIT` (200) bounds one
invocation.

## Private rooms (task 21)

`room-service.ts`. A room has a 6-character code from `A-Z0-9`, generated with
`crypto.randomInt`, and a shareable invite link (`w3dev-ludo://room/<code>`, built by `ludoRoomInviteLink` in
`contracts.ts`) that the client parses in `net/ludo_deep_link.dart` and routes in
`ludo_deep_link_router.dart`. The underlying match is created on the first join
and `ludo_rooms.match_id` is set once; later joins reuse it and the last seat
flips the match from `waiting` to `active`. Unfilled rooms expire after
`LUDO_ROOM_EXPIRY_HOURS` (default 24) and are removed by the sweeper.

## Identity: guest-first with optional Google linking (task 23)

Ludo does not add a new auth mechanism. It reuses the repo's existing
two-stage Firebase → API JWT flow (see
`docs-internal/architecture/auth.md`) end to end, including for anonymous
("guest") players. There is no server-side special-casing of the anonymous
provider anywhere in this path — confirmed by reading
`packages/api/src/routes/auth-tokens.ts`,
`packages/api/src/firebase/admin.ts`, and
`packages/api/src/games/ludo/routes.ts`, and by regression tests in
`packages/api/src/routes/__tests__/auth.test.ts` and
`packages/api/src/games/ludo/routes.test.ts` (task 24 does the Flutter-side
wiring of the client half of this flow).

### Sequence: guest play, no account

1. Client (Flutter, task 24) calls Firebase Auth's `signInAnonymously()`.
   Firebase creates a new anonymous user and returns a Firebase ID token
   whose decoded claims have `firebase.sign_in_provider: "anonymous"` and no
   `email`.
2. Client calls `POST /api/auth/exchange` with that ID token.
3. Server (`authTokenRoutes` in `auth-tokens.ts`) calls `verifyIdToken()`
   (Firebase Admin SDK), which succeeds identically for an anonymous token
   as for any other provider. It reads `decoded.uid` (the Firebase UID) and
   `decoded.firebase?.sign_in_provider` (`"anonymous"`), upserts a `users` /
   `auth` row, and mints an API JWT whose `sub` and `uid` claims are the
   Firebase UID and whose `provider` claim is `"anonymous"`.
4. Client calls `POST /games/ludo/:environment/session` with
   `Authorization: Bearer <API JWT>`. The route (`routes.ts`) only reads
   `verification.payload.sub` off the already-verified API JWT to mint the
   Ludo game token's `subject` — it never inspects `provider`, so a guest
   gets a game token exactly like any other player.
5. Client uses the returned Ludo game token to create/join matches. The
   player's Ludo identity, from the server's point of view, is simply that
   Firebase UID; nothing distinguishes "guest" from "linked" at the match
   layer.

### Sequence: linking a Google account mid-session

1. From the same signed-in anonymous Firebase user, client calls Firebase
   Auth's `linkWithCredential()` with a Google credential obtained via
   Google Sign-In (task 24's scope).
2. Per Firebase Auth's documented linking behavior, this **attaches** the
   Google provider to the existing anonymous user record and **preserves
   its Firebase UID** — it does not create a new user or rotate the UID.
   The one documented exception is a **merge conflict**: if that Google
   account is already linked to a *different* existing Firebase user,
   `linkWithCredential` fails with `auth/credential-already-in-use` instead
   of silently merging the two identities, and the client keeps the
   original anonymous UID (the failed link leaves the anonymous session
   untouched). Ludo's server side does not need to handle that error itself
   — it is a Firebase Auth SDK error client task 24 surfaces to the player
   (e.g. "this Google account is already linked to another profile"); no
   server code path merges two different Firebase UIDs' data, and this v1
   scope does not attempt automatic data migration between UIDs.
3. Client re-runs `POST /api/auth/exchange` with the ID token from the
   now-linked Firebase user. Firebase issues this token for the *same*
   `uid` as before linking, only with `firebase.sign_in_provider` now
   `"google.com"` (and `email`/`email_verified`/`name`/`picture` populated).
4. The server's `/exchange` handler is unchanged: it reads `decoded.uid`
   (still the same value) and mints a new API JWT with the same `sub`/`uid`
   as pre-link. `packages/api/src/routes/__tests__/auth.test.ts` has a
   regression test (`keeps the same sub across a simulated Google-link of
   an anonymous Firebase UID`) that mocks `verifyIdToken` to return the
   same `uid` with `provider: "anonymous"` then `provider: "google.com"`
   and asserts the two API JWTs' `sub`/`uid` match.
5. Client re-runs `POST /games/ludo/:environment/session` with the new API
   JWT. Because the Ludo game token's `subject` is derived solely from the
   API JWT's `sub`, it is identical to the pre-link game token's subject.
   Any match the player was in as a guest (rooms, matchmaking, in-progress
   commands — all keyed by that Firebase UID as the seat's subject) keeps
   working after linking with zero server-side migration.

### No server-side Ludo profile table in v1

This backend does **not** store a durable, cross-device Ludo player
profile (display name, avatar choice) anywhere. The `save_sync` capability
declared for this game (task 16) covers per-device local match state, not a
profile. The only per-match "identity" data on the server is
`ludo_players.display_name_cache` (added in task 16's Drizzle schema,
`packages/db/src/schema.ts`) — a display name captured from the client's
local onboarding settings *at the moment a match is created/joined*, cached
per match/seat so opponents and match summaries can show a name. It is not
looked up from, or written back to, any per-user profile table, and it does
not survive to a new match if the player's local settings change or they
reinstall — there is nothing server-side to keep it in sync with. A
durable cross-device profile system (name/avatar persisted server-side and
resolved at session/session-exchange time) is out of scope for v1 per the
product decisions and would be a new, separate schema/route addition, not
an extension of `display_name_cache`.

## Realtime fanout and the Firestore-absent degrade (tasks 22, 25)

Server side, `service.ts` calls `MatchViewPublisher.publish()` **after** every
committed state change (create, command, timeout, matchmaking match, room match),
never inside the transaction, so a Firestore outage cannot block or roll back a
move. The published `LudoMatchView` is the current state plus the last N events
(`contracts.ts`), not the internal store row.

| Publisher | Selected when | Behavior |
|---|---|---|
| `FirestoreMatchViewPublisher` | `hasFirebaseAdminConfig()` is true (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` all set) | Writes one document per match at `games/ludo/<environment>/matches/<matchId>` (`ludoMatchViewCollectionPath`) |
| `NullMatchViewPublisher` | Firebase Admin config absent | `publish()` is a no-op; clients rely on polling |
| `InMemoryMatchViewPublisher` | tests only | Records views for assertions |

`resolveMatchViewPublisher()` in `dependencies.ts` is the single call site allowed
to branch on config. Unlike `getFirebaseAdmin()` for auth, a missing Firestore
config must never crash a Ludo server: offline and local development keep working.

`GET /games/ludo/:environment/matches/:matchId/state` is the ground truth the
Firestore document merely mirrors. It requires the game token and seat ownership.

Client side, `net/ludo_match_state_source.dart` defines `LudoMatchStateSource`
with two implementations. `FirestoreMatchStateSource` listens to the match document
and permanently falls back to its own `PollingMatchStateSource` the moment
Firestore is unavailable at construction or its snapshot stream errors. The board
screen never branches on which one is active and never sees a stream error. A
separate `connected` stream drives `LudoReconnectingBanner`, and `refresh()`
re-fetches from the ground-truth route on resume from background. Online match
state is never written to `ludo_local_save.dart`; it resumes from the server.

Firestore **security rules** are not in this repository. The server writes with
Admin credentials (which bypass rules); clients only read. A real project must
set rules so a client can read `games/ludo/<environment>/matches/<matchId>` only
for matches it sits in, or lock reads and rely on polling. This is a task 29
console step and is listed in the [release checklist](ludo-release-checklist).

## Client architecture (tasks 03 to 13, 12a to 12h)

- **Flame scene plus Flutter chrome.** `game/ludo_game.dart` hosts the board, token,
  dice and particle components; widgets in `widgets/` and screens in `screens/`
  provide HUD, dialogs and navigation. Every visual and audio asset is reached
  through a named slot in `assets/ludo_art_manifest.dart`; gameplay code never
  embeds a raw asset path. Slots hold code-drawn implementations unless a bitmap
  is registered.
- **Local match controller.** `game/ludo_bot_turn_runner.dart` drives bot turns on
  `ludo_rules` with injected dice. The debug-only "All Bots Demo" and the seeded
  full-match tests (50 or more matches per mode and player count) are the
  guarantee that every game reaches results.
- **Persistence.** `state/ludo_local_save.dart` stores an in-progress local match
  through `platform_core`'s `SaveStore`; `app_resume_test.dart` covers restart and
  resume. Profile, sound and reduced-motion settings use the same mechanism.
- **Accessibility.** Semantics labels on controls, 48 dp tap targets
  (`test/accessibility/ludo_tap_targets_test.dart`), reduced motion, and a label
  plus color for the active player.
- **Design system.** Bundled fonts with licenses under `assets/fonts/`, tokens in
  `theme/ludo_theme_tokens.dart`, and reusable chrome in `widgets/`.
- **Telemetry.** `telemetry/ludo_telemetry.dart` wraps `platform_core`'s
  `TelemetryRecorder` with LOCAL and ONLINE events (`ludo_onboarding_*`,
  `ludo_match_started`, `ludo_match_finished`, `ludo_turn_timed_out`,
  `ludo_settings_changed`, `ludo_room_created`, `ludo_room_joined`,
  `ludo_matchmaking_started`, `ludo_matchmaking_matched`,
  `ludo_bot_fill_triggered`). Only the shared allow-listed field keys are sent; no
  room code or ticket id is ever recorded. Events stay in an in-memory sink: there
  is no upload pipeline yet.
- **Online client.** `net/ludo_online_client.dart` builds the gateway, auth
  controller and online controller, and returns `null` (online tiles disabled)
  when `LUDO_API_BASE_URL` is empty or `Firebase.initializeApp()` fails.
  `net/ludo_online_preview_mode.dart` and `ludo_preview_online.dart` provide a
  debug-only fake transport so the whole online flow can be walked without a
  backend (task 26x); it is compiled out of release builds.

## Economy (tasks 26a to 26i)

Numbers, currencies and policy are in [Ludo economy](ludo-economy); every number
lives once in `packages/api/src/games/ludo/economy-config.ts`
(`LUDO_ECONOMY_CONFIG_V1`). Structure:

- **Wallet and ledger** (26a, 26b). `ludo_wallet_transactions` is an append-only
  ledger; `ludo_balances` caches totals. All mutating routes use idempotency keys.
- **Coin tables** (26c). A match started with a coin tier debits an escrow row in
  `ludo_coin_table_escrow`, pays out to the winner and refunds on timeout or
  abandonment (`coin-stake.ts`). Coins are online-only; offline play grants XP but
  never coins.
- **Purchases** (26d). RevenueCat webhook and sync grant coins, diamonds, themes
  and the Vortex Pass (`iap-catalog.ts`, `vortex-pass.ts`). Product ids are in
  [store product ids](ludo-store-product-ids).
- **Store and inventory UI** (26g). `screens/store_screen.dart`, `state/ludo_iap_state.dart`
  and `net/ludo_purchases_gateway.dart` wrap `purchases_flutter`; a missing
  `REVENUECAT_API_KEY` yields "Store unavailable", never a crash.
- **Rewarded ads and daily rewards** (26h). `net/ludo_ads_service.dart` wraps
  `google_mobile_ads` behind an interface; the reward itself is granted only by the
  SSV callback (`rewarded-ads-routes.ts`, `admob-ssv.ts`).
- **Atomic caps.** Every daily cap or one-time grant uses one atomic
  check-and-write in the store, following `recordXpClaimWithCap`
  (`economy-store-types.ts`, `economy-drizzle-store-capped.ts`,
  `economy-drizzle-store-xp-claim.ts`), with concurrency tests that fire
  simultaneous claims (`economy-capped-claims.test.ts`,
  `economy-drizzle-capped-postgres.test.ts`). Never read then write.
- **Theme art (task 26f) is skipped.** The human art session was waived by the user
  on 2026-10-16. Store themes, currency icons and banners use code-drawn fallbacks
  in the existing manifest slots (`widgets/ludo_store_theme_art.dart`,
  `ludo_store_cards.dart`). Equipped themes are not yet applied inside a match
  (`.agents/games/ludo-vortex/open-questions.md`).

## Release hardening (task 27)

- **Crash reporting.** `telemetry/ludo_crash_reporter.dart` defines
  `LudoCrashReporter` with `FirebaseCrashlyticsReporter` and `NullCrashReporter`.
  Crashlytics is used only when Firebase initialized; collection is off in debug
  builds; no user id, display name or custom key is sent. Global handlers are
  installed in `main.dart`, and a failing reporter can never crash the app.
  Tested by `test/telemetry/ludo_crash_reporter_test.dart`.
- **Budgets.** [Performance budgets](ludo-performance-budgets) defines a 16 ms p90
  Dart-side frame budget (`test/perf/ludo_game_frame_budget_test.dart`), a manual
  GPU raster procedure for task 29, and a 40 MB per-ABI download budget. Measured
  2026-10-16: arm64 APK 28.4 MB, universal APK 64.9 MB (over budget, explained
  there); AAB size not measured.
- **Store drafts.** [Privacy policy](ludo-privacy-policy), [data safety](ludo-data-safety),
  [content rating](ludo-content-rating) and [store listing](ludo-store-listing) are
  drafts. None is hosted or submitted.

## Known gaps and decisions deferred to task 29

These are facts found while writing this document; none was changed by task 28
(documentation only).

1. **The Android build does not apply the `google-services` Gradle plugin.**
   `apps-native/games/ludo/android/settings.gradle.kts` and
   `android/app/build.gradle.kts` have no `com.google.gms.google-services` and no
   Crashlytics plugin. `Firebase.initializeApp()` is called without options in
   `ensureLudoFirebaseInitialized()`, so on Android a dropped-in
   `google-services.json` alone will not initialize Firebase, and online play stays
   disabled. Task 29 needs a small build change (or generated
   `firebase_options.dart`) before the first device run is meaningful. This is a
   code change, so it is recorded as a follow-up task, not made here.
2. **The API base URL cannot reach both sign-in and Ludo routes.** (Static reading;
   not tried against a live server.) `LudoGateway` resolves sign-in as
   `api/auth/exchange` and `api/auth/refresh` but Ludo routes as
   `games/ludo/<environment>/...` (`ludo_gateway.dart`, `ludo_http.dart`) against the
   same `LUDO_API_BASE_URL`, while the deployed API serves everything under `/api/`
   (`apps/web/app/api/[...route]/route.ts` strips one `/api` and there are no
   rewrites). Base `https://host/` breaks Ludo routes; base `https://host/api/`
   breaks sign-in. `test/net/ludo_gateway_test.dart` cannot catch it because its
   fixture transport is keyed by relative path. Merge Relay's gateway resolves only
   `games/...` against its base, which implies a base ending in `/api/`; the likely fix is to make the sign-in paths relative to the same base
   (`auth/exchange`). Needs a small code task before any online device run.
3. **`bun run games:build` does not pass `LUDO_API_BASE_URL`, `REVENUECAT_API_KEY` or
   the AdMob dart-defines** (`scripts/games/cli-build.ts` passes only
   `GAME_ENVIRONMENT` and `APP_VERSION`). A build from that command has the online
   tiles disabled and the store unavailable. The checklist uses a direct
   `flutter build apk` with the extra defines for the online and economy passes.
4. **`google_sign_in` has no server client id configured** (`GoogleSignIn(scopes:
   ['email'])` in `ludo_firebase_gateway.dart`); Google linking depends on the
   Android OAuth client created by registering the app's SHA-1 in Firebase.
5. **RevenueCat product id suffix.** If RevenueCat sends the Pass id with a
   `:base_plan` suffix the webhook answers 422 and grants nothing. Verify on a
   real sandbox purchase (open question in the knowledge base).
6. **No data-deletion path and no UMP "Privacy options" entry** exist in the client;
   Play Data Safety requires a deletion request URL.
7. **Equipped themes are not applied in matches**, and `ludo_starter_pack` is
   purchase-once only by store configuration.
8. **Firestore security rules** are not in the repo (see above).
9. **Quick-chat and emoji** are out of scope; Rush, 1 Kill Win and Mask modes are
   out of scope (open questions 8 and 9).
