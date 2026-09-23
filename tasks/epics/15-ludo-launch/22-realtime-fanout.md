---
epic: 15-ludo-launch
task: 22-realtime-fanout
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/21-private-rooms]
estimate: L
---

# Add realtime fanout via Firestore match-view publishing

## Goal

Give clients low-latency updates without a bespoke WebSocket server: after
every successful command, write a denormalized match-view document to
Firestore through a `MatchViewPublisher` interface (in-memory fake for
tests, real Firestore adapter using the existing `firebase-admin` setup),
plus an HTTP polling fallback route for when Firestore is unavailable.

## Context/Decisions

- `MatchViewPublisher` interface (in
  `packages/api/src/games/ludo/match-view-publisher.ts`): `publish(appId,
  environment, matchId, view: LudoMatchView): Promise<void>`, where
  `LudoMatchView` is a client-shaped read model (current state + last N
  events, not the full internal store row) derived from `wire.ts`'s codecs.
  `service.ts` (task 18) calls `publish()` after every state-changing
  transaction commits — never inside the transaction, so a Firestore outage
  cannot block or roll back a match command.
- In-memory fake `InMemoryMatchViewPublisher` records published views for
  test assertions (what tests use); production wiring picks the real
  adapter only when Firebase Admin config is present, matching
  `packages/api/src/firebase/admin.ts`'s existing fail-loud-if-misconfigured
  pattern — but for Ludo, missing Firestore config must **not** crash the
  server the way `getFirebaseAdmin()` throws for auth; it must degrade to
  "publish is a no-op, polling fallback is the only path" so offline/local
  dev and the client's offline-first modes keep working. Implement this as
  a `NullMatchViewPublisher` selected when Firestore config is absent,
  distinct from the in-memory test fake.
- Real adapter: `FirestoreMatchViewPublisher` writes to a collection path
  `games/ludo/{environment}/matches/{matchId}` (or equivalent — implementer
  finalizes and documents the exact path in a doc comment) using
  `firebase-admin`'s Firestore client, reusing the same credential
  environment variables already defined in `packages/api/src/firebase/
  admin.ts` (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
  `FIREBASE_PRIVATE_KEY`) rather than inventing new ones. Export a Firestore
  accessor from `admin.ts` (extend it, following its existing lazy-init
  pattern) instead of re-initializing the Admin SDK elsewhere.
- HTTP polling fallback: `GET /:environment/matches/:matchId/state`
  (protected by the Ludo game token, seat-ownership checked) returns the
  same `LudoMatchView` shape synchronously from `LudoStore`, for clients
  that have no Firestore connectivity or choose not to use it. This route
  is required regardless of Firestore's real-world availability — it is
  the ground truth the Firestore doc is merely a fast mirror of.
- Do not implement the Flutter/`cloud_firestore` client listener here —
  that is task 25. This task only produces the server-side publish path and
  the polling fallback route.

## Implementation Checklist

- [ ] Add `LudoMatchView` to `packages/api/src/games/ludo/contracts.ts`
  and its wire codec to `wire.ts`.
- [ ] Create `packages/api/src/games/ludo/match-view-publisher.ts` with the
  `MatchViewPublisher` interface, `InMemoryMatchViewPublisher`, and
  `NullMatchViewPublisher`.
- [ ] Create `packages/api/src/games/ludo/firestore-match-view-publisher.ts`
  with `FirestoreMatchViewPublisher`, using a Firestore accessor exported
  from `packages/api/src/firebase/admin.ts` (extend that file with a lazy
  `getFirestore()` export following its existing `getFirebaseAdmin()`
  pattern).
- [ ] Add a factory (`resolveMatchViewPublisher()`) that picks
  `FirestoreMatchViewPublisher` when Firebase Admin env vars are present and
  `NullMatchViewPublisher` otherwise, used by `packages/api/src/games/
  ludo/dependencies.ts` (create this file mirroring `merge-relay/
  dependencies.ts`'s dependency-injection style).
- [ ] Call `publish()` from `service.ts` after every committed
  state-changing transaction (create, command, timeout, matchmaking match,
  room match) — after commit, not inside it.
- [ ] Add `GET /:environment/matches/:matchId/state` to `routes.ts` as the
  polling fallback, requiring the game token and seat ownership.
- [ ] Add `packages/api/src/games/ludo/match-view-publisher.test.ts`
  covering `InMemoryMatchViewPublisher` recording, `NullMatchViewPublisher`
  no-op safety (never throws), and `resolveMatchViewPublisher()`'s
  config-presence branching.
- [ ] Add `packages/api/src/games/ludo/firestore-match-view-publisher.test.ts`
  using a fake Firestore client (do not require real Firestore
  credentials) to verify the write payload shape and collection path.
- [ ] Add a `routes.test.ts` case for the polling fallback route (extend
  task 21's file): returns the current view, rejects a non-seated caller,
  matches the same shape a Firestore-published view would have.

## Files Touched

- `packages/api/src/games/ludo/contracts.ts`
- `packages/api/src/games/ludo/wire.ts`
- `packages/api/src/games/ludo/match-view-publisher.ts`
- `packages/api/src/games/ludo/firestore-match-view-publisher.ts`
- `packages/api/src/games/ludo/dependencies.ts`
- `packages/api/src/games/ludo/service.ts`
- `packages/api/src/games/ludo/routes.ts`
- `packages/api/src/firebase/admin.ts`
- `packages/api/src/games/ludo/match-view-publisher.test.ts`
- `packages/api/src/games/ludo/firestore-match-view-publisher.test.ts`
- `packages/api/src/games/ludo/routes.test.ts`

## Acceptance Criteria

- A successful command triggers exactly one `publish()` call with a view
  matching the store's post-commit state, verified via
  `InMemoryMatchViewPublisher` in tests.
- Missing Firebase Admin configuration never throws from the Ludo command
  path — `NullMatchViewPublisher` absorbs it silently and the polling
  fallback route still returns correct state.
- The polling route enforces seat ownership: a token for seat A cannot read
  a match it is not seated in (or is explicitly allowed to read but the
  implementer documents that choice — pick one and test it).

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test`
- `bun run check`

## Out of Scope

- Flutter `cloud_firestore` client listener wiring (task 25).
- Real Firestore project/console provisioning (task 29).
- Presence/typing indicators or any feature beyond match-state fanout.

## Commit message

`feat(ludo): add firestore match-view fanout with null-safe fallback and polling route [15-ludo-launch/22]`
