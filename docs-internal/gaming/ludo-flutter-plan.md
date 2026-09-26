---
title: Ludo Flutter Plan
---

# Ludo Flutter Plan

This document is a stub, created by task `15-ludo-launch/15` to record the
frozen HTTP contract surface as backend tasks land. Task 28
(`15-ludo-launch/28`) fills in the rest of this document (architecture,
handoff, release checklist).

## Contracts

Contract version: `ludo.v1` (`LUDO_CONTRACT_VERSION` in
`packages/api/src/games/ludo/contracts.ts`).

Frozen endpoint matrix so far:

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/games/ludo/:environment/session` | `Authorization: Bearer <API JWT>` | Exchanges an already-verified API access token (from `POST /api/auth/exchange`, Firebase UID as `sub`) for a short-lived `GAME_TOKEN_SECRET_LUDO_<ENV>`-signed game token with `role: "player"`. `:environment` must be one of `debug`, `staging`, `production`. Fails closed with `ludo_token_configuration_unavailable` (503) when the environment's game token secret, `GAME_TOKEN_ISSUER`, or `GAME_TOKEN_AUDIENCE` is not configured. |

Further routes (match create/join/command, matchmaking, rooms) are added by
tasks 17, 18, 20, and 21 to the same mounted Hono instance
(`createConfiguredLudoRoutes()` in `packages/api/src/games/ludo/routes.ts`).

See `packages/api/src/games/ludo/contracts.ts` for the full DTO and event
shapes (`LudoMatchSummary`, `LudoMatchState`, `LudoCommand`, `LudoEvent`),
`wire.ts` for the snake_case wire codecs, and `validation.ts` for inbound
validation.

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
