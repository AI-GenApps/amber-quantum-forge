# Phase 9 — Backend and multiplayer (this repo)

## Recommended architecture (turn-based games)

- **Server authoritative**: Hono routes under `packages/api/src/games/<id>/**`, mounted like
  Merge Relay (`app.route("/games/<id>", …)` in `packages/api/src/index.ts`); add the id to
  `GAME_APP_IDS` (`packages/api/src/games/contracts.ts`).
- **Commands over HTTP** (roll, move, join, surrender, claim-timeout, matchmaking
  enqueue/cancel): idempotent (command id + expected version), transactional (lock match →
  validate → pure transition → command receipt + append-only event → snapshot/version →
  outbox), server CSPRNG dice persisted before response.
- **Postgres** via Drizzle (`packages/db/src/schema.ts`, `bun run db:generate`): normalized
  `<id>_matches`, `_players`, `_events` (unique match_id+sequence), `_commands`,
  `_matchmaking_tickets`, `_rooms`. Put all schema in ONE task (no later migrations).
- **Realtime fanout**: after commit, write a small match-view doc to **Firestore** (existing
  Firebase project + `firebase-admin`); clients listen via `cloud_firestore`; HTTP polling
  fallback. `MatchViewPublisher` interface with in-memory fake. Rejected alternatives:
  Vercel WebSockets (beta, instance-pinned, still needs Redis), Durable Objects (second
  platform), hosted realtime vendors (new account; not needed for 200–500 ms turns).
- **Timers**: enforce deadlines lazily on every read/command + client "claim timeout" +
  Vercel Cron sweep (`apps/web/vercel.json` `crons`, `CRON_SECRET` — both net-new here).
- **Bot-fill**: bots are ordinary seats driven by the server's bot policy.
- **Parity**: the TS authority engine must reproduce the Dart rules package's JSON replay
  fixtures exactly (add a `games:<id>:parity` script; `scripts/games/parity.ts` is
  merge-relay-specific). Never edit fixtures to pass.
- **Store pattern**: interface with in-memory + Drizzle implementations (mirror
  `packages/api/src/games/merge-relay/memory-store.ts` / `drizzle-store.ts`) and a few
  Postgres integration tests for locking/idempotency.

## Identity

Guest-first (Firebase anonymous) + optional Google link; server exchanges for a scoped
game token (`packages/api/src/games/tokens.ts` pattern, per-app/env secrets). Check the
shared auth first: the Ludo audit found `/api/auth/refresh` signing `sub`/`uid` from the
user's email instead of the Firebase UID (`packages/api/src/routes/auth-tokens.ts`) — fix
with tests before any game-token exchange.

## Client

Firebase init must degrade gracefully when `google-services.json` is absent so offline
modes still work and tests run without credentials. Split online client work into
gateway/auth → match source + reconnect → lobby UI (rooms by code + share, matchmaking).

## Human provisioning (list in the final human task)

Enable Firestore; register the Android app (package) and download `google-services.json`;
service account with Firestore write; Vercel env vars (game token secrets, CRON_SECRET);
security rules restricting match docs to participants; two-device online test.
