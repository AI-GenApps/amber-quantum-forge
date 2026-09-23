---
epic: 15-ludo-launch
task: 24-online-gateway-auth
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/13-human-local-checkpoint, 15-ludo-launch/23-identity-exchange]
estimate: L
---

# Wire Firebase identity and the typed Ludo gateway client

## Goal

Add guarded Firebase initialization (graceful degrade when
`google-services.json` is absent), a typed HTTP gateway client covering
every backend route from tasks 15-22, and an auth controller for guest-first
sign-in with optional Google linking.

## Context/Decisions

- Add `firebase_auth`, `google_sign_in`, and `cloud_firestore` to
  `pubspec.yaml` now (task 03 deferred this deliberately). Firebase
  initialization must be guarded: if `google-services.json` is absent (no
  Firebase config at build time), the app must still launch and all local
  modes (Computer, Pass N Play from task 12) must keep working — only the
  Online/Play-with-Friends entry cards (task 08's disabled tiles) stay
  disabled instead of crashing, until task 26 enables them. Confirm this by
  testing the app both with and without a fake Firebase config file
  present.
- `lib/src/net/ludo_gateway.dart`: a typed HTTP client wrapping every
  backend route from tasks 15-22 (`session`, `matches`, `commands`,
  `matches/:id/state`, `matchmaking/tickets`, `rooms`), consuming the same
  wire codecs' shape as the server (do not hand-roll parallel JSON parsing —
  generate or hand-port DTOs that mirror `packages/api/src/games/ludo/
  contracts.ts`/`wire.ts` field-for-field, and add a contract test that
  decodes a fixture captured from the real server response shape).
- Auth flow: on first Online/Play-with-Friends entry, sign in anonymously
  via `firebase_auth` if not already signed in, exchange via the existing
  `/api/auth/exchange` + task 15's `/games/ludo/:environment/session`,
  cache the resulting short-lived game token and refresh it before expiry.
  Offer "Link Google account" from the settings screen (task 10, extended
  here) using `google_sign_in` + `linkWithCredential`, per task 23's
  documented flow.

## Implementation Checklist

- [ ] Add Firebase/Firestore/Google Sign-In dependencies to `pubspec.yaml`
  with guarded initialization in `main.dart`.
- [ ] Create `lib/src/net/ludo_gateway.dart` with typed methods for every
  backend route needed by this and the following two tasks, plus DTOs
  mirroring the server wire shape.
- [ ] Create `lib/src/net/ludo_auth_controller.dart`: guest sign-in, token
  exchange/caching/refresh, Google linking.
- [ ] Extend `settings_screen.dart` (task 10) with a "Link Google account"
  action calling the auth controller.
- [ ] Add `test/net/ludo_gateway_test.dart` (fixture-based, no real network)
  covering request shaping and response decoding for every route.
- [ ] Add `test/net/ludo_auth_controller_test.dart` covering guest sign-in,
  token caching/refresh, and Google linking against a mocked
  `firebase_auth`.
- [ ] Add a `test/screens/online_flow_test.dart` case: Firebase-config-absent
  shows the graceful "unavailable" state on the (still-disabled, task 08)
  online tiles without crashing.

## Files Touched

- `apps-native/games/ludo/pubspec.yaml`
- `apps-native/games/ludo/lib/main.dart`
- `apps-native/games/ludo/lib/src/net/ludo_gateway.dart`
- `apps-native/games/ludo/lib/src/net/ludo_auth_controller.dart`
- `apps-native/games/ludo/lib/src/screens/settings_screen.dart` (Google link)
- `apps-native/games/ludo/test/net/ludo_gateway_test.dart`
- `apps-native/games/ludo/test/net/ludo_auth_controller_test.dart`
- `apps-native/games/ludo/test/screens/online_flow_test.dart`

## Acceptance Criteria

- With no Firebase config present, the app boots and all local modes work
  (verified by a test run with the config file absent).
- The gateway's DTOs decode a captured real-server-shaped fixture from task
  15/22's contract tests without error.
- Guest sign-in, token caching/refresh, and Google linking are each covered
  by a passing test against a mocked `firebase_auth`.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`

## Out of Scope

- Firestore match-view listener, polling fallback, and online board wiring
  (task 25).
- Rooms/matchmaking UI and enabling the lobby's online tiles (task 26).
- Real Firebase project provisioning and live two-device verification (task
  29).

## Commit message

`feat(ludo): wire guarded firebase init, gateway client, and guest/google auth [15-ludo-launch/24]`
