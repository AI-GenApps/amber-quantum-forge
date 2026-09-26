---
epic: 15-ludo-launch
task: 23-identity-exchange
status: complete
commit_scope: ludo
depends_on: [15-ludo-launch/22-realtime-fanout]
estimate: M
---

# Guest-first identity with optional Google linking

## Goal

Let a player start playing Ludo immediately as a Firebase anonymous guest,
then optionally link a Google account without losing their player identity
or in-progress matches, exchanging for a Ludo game token via the session
route from task 15 (now correct, thanks to task 14's fix).

## Context/Decisions

- Flow: client signs in with Firebase anonymous auth (`firebase_auth`'s
  `signInAnonymously`), gets a Firebase ID token, calls the existing `POST
  /api/auth/exchange` (unchanged — already generic over any Firebase
  provider including anonymous), gets an API JWT, then calls task 15's
  `POST /games/ludo/:environment/session` to get a short-lived Ludo game
  token whose `subject` is the Firebase UID. This reuses the existing
  two-stage auth exactly as documented in `docs-internal/architecture/
  auth.md` — no new server auth mechanism, only a Ludo-specific
  consumption of it.
- Google linking: client calls Firebase's `linkWithCredential` to attach a
  Google credential to the existing anonymous Firebase user, which
  **preserves the same Firebase UID**. Re-running `/api/auth/exchange` with
  the now-linked ID token yields an API JWT with the same `sub` as before
  linking — no server-side migration is needed for the player's identity
  *because Firebase UID doesn't change on linking*. Confirm this
  understanding against the actual Firebase Admin SDK / Firebase Auth
  linking behavior while implementing, and if any edge case does change the
  UID (e.g. merge conflicts when the Google account was already used
  elsewhere), handle it explicitly rather than assuming.
- Ludo-side "player identity" beyond the bare Firebase UID (display name,
  avatar choice from onboarding) is **not** stored by the backend in this
  task — `ludo_players.display_name_cache` (task 16) is populated
  client-side per match from local settings, not from a server-side profile
  table. A durable cross-device Ludo profile (name/avatar persisted server
  side) is out of scope for v1 per the product decisions (only save_sync
  capability is declared, not a profile system) — note this explicitly so
  it isn't silently assumed elsewhere.
- Add a small guard: the session route (task 15) must reject a Firebase
  anonymous UID structurally the same way it accepts a linked one — i.e.
  confirm no code path in `packages/api/src/routes/auth-tokens.ts` or
  `packages/api/src/firebase/admin.ts` special-cases or rejects anonymous
  sign-in providers. If `verifyIdToken`/`/exchange` already treats an
  anonymous Firebase user identically to any other provider (it appears to,
  reading `decoded.firebase?.sign_in_provider`), this task only needs a
  regression test proving it, not a code change — implementer confirms by
  reading the current code before assuming a change is needed.

## Implementation Checklist

- [x] Add `packages/api/src/routes/auth-tokens.test.ts` (extend task 14's
  file) case: exchanging an anonymous Firebase ID token succeeds and yields
  a stable `sub`.
- [x] Add a regression test asserting that exchanging, then simulating a
  linked-credential ID token for the *same* Firebase UID, yields the same
  `sub` on the new API JWT (use a fake/mocked `verifyIdToken` returning the
  same `uid` with a different `provider`, matching however existing tests in
  this file mock Firebase verification).
- [x] Add `packages/api/src/games/ludo/routes.test.ts` case (extend task 22's
  file): the session route accepts an API JWT whose `provider` is
  `"anonymous"` identically to any other provider.
- [x] If the review in Context finds a real gap (anonymous provider is
  rejected somewhere), fix it in `packages/api/src/routes/auth-tokens.ts` or
  `packages/api/src/games/ludo/routes.ts` and note the fix in this task's
  commit body.
- [x] Document the full guest-to-linked flow, with a sequence diagram in
  prose (no image), in `docs-internal/gaming/ludo-flutter-plan.md`'s
  identity section (extend the stub from task 15; task 28 finishes the rest
  of the document).
- [x] Confirm and document (in the same doc section) that no server-side
  Ludo profile table exists in v1 and that display name/avatar are
  client-local per the product decision — cross-reference
  `packages/db/src/schema.ts`'s `ludo_players.display_name_cache` column
  from task 16.

## Files Touched

- `packages/api/src/routes/__tests__/auth.test.ts` (task 14's actual test
  file for `auth-tokens.ts`, found at this path rather than the
  `auth-tokens.test.ts` path guessed above — extended in place instead of
  creating a duplicate test file)
- `packages/api/src/games/ludo/routes.test.ts`
- `packages/api/src/routes/auth-tokens.ts`: no change needed (see
  Implementation Note below)
- `packages/api/src/games/ludo/routes.ts`: no change needed (see
  Implementation Note below)
- `docs-internal/gaming/ludo-flutter-plan.md`
- `tasks/epics/15-ludo-launch/STATUS.md` (status marker)

## Implementation Note (filled in during execution)

Reviewed `auth-tokens.ts`, `firebase/admin.ts`, and `games/ludo/routes.ts`:
none of them special-case or reject the `"anonymous"` sign-in provider.
`/exchange` reads `decoded.uid` unconditionally and mints the API JWT's
`sub`/`uid` from it regardless of `sign_in_provider`; the Ludo session route
only reads `verification.payload.sub` and never inspects `provider` at all.
No code change was needed — both checklist items above were satisfied by
adding regression tests only, as anticipated by the task's Context section.

## Acceptance Criteria

- An anonymous Firebase user can exchange for an API JWT and a Ludo game
  token with no special-casing or rejection.
- The same Firebase UID before and after Google linking produces API JWTs
  with the same `sub`, verified by a test.
- The doc explicitly states there is no server-side Ludo profile table in
  v1 and where display name/avatar actually live.

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test`
- `bun run check`

## Out of Scope

- Any Flutter-side Firebase Auth / Google Sign-In wiring (task 24).
- A server-side player profile/display-name table.
- Account deletion/data-export flows.

## Commit message

`test(ludo): verify guest-first and google-linked identity exchange [15-ludo-launch/23]`
