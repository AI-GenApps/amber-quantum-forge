---
epic: 15-ludo-launch
task: 24-online-gateway-auth
status: complete
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

- [x] Add Firebase/Firestore/Google Sign-In dependencies to `pubspec.yaml`
  with guarded initialization in `main.dart`.
- [x] Create `lib/src/net/ludo_gateway.dart` with typed methods for every
  backend route needed by this and the following two tasks, plus DTOs
  mirroring the server wire shape.
- [x] Create `lib/src/net/ludo_auth_controller.dart`: guest sign-in, token
  exchange/caching/refresh, Google linking.
- [x] Extend `settings_screen.dart` (task 10) with a "Link Google account"
  action calling the auth controller.
- [x] Add `test/net/ludo_gateway_test.dart` (fixture-based, no real network)
  covering request shaping and response decoding for every route.
- [x] Add `test/net/ludo_auth_controller_test.dart` covering guest sign-in,
  token caching/refresh, and Google linking against a mocked
  `firebase_auth`.
- [x] Add a `test/screens/online_flow_test.dart` case: Firebase-config-absent
  shows the graceful "unavailable" state on the (still-disabled, task 08)
  online tiles without crashing.

## Files Touched

- `apps-native/games/ludo/pubspec.yaml` (`firebase_core`, `firebase_auth`,
  `google_sign_in`, `cloud_firestore`)
- `apps-native/games/ludo/lib/main.dart`
- `apps-native/games/ludo/lib/src/net/ludo_gateway.dart`
- `apps-native/games/ludo/lib/src/net/ludo_auth_controller.dart`
- `apps-native/games/ludo/lib/src/screens/settings_screen.dart` (Google link)
- `apps-native/games/ludo/test/net/ludo_gateway_test.dart`
- `apps-native/games/ludo/test/net/ludo_auth_controller_test.dart`
- `apps-native/games/ludo/test/screens/online_flow_test.dart`
- Small necessary additions beyond the list above, split out for size and
  reuse rather than one oversized `ludo_gateway.dart`:
  - `apps-native/games/ludo/lib/src/net/ludo_http.dart` (transport +
    per-environment network config, mirroring `merge_relay`'s
    `DartIoMergeRelayHttpTransport` pattern — no `package:http` dependency)
  - `apps-native/games/ludo/lib/src/net/ludo_wire_json.dart` (shared JSON
    decode helpers + `LudoApiException`/`LudoProtocolException`)
  - `apps-native/games/ludo/lib/src/net/ludo_match_models.dart`,
    `ludo_event_models.dart`, `ludo_command_models.dart`,
    `ludo_session_models.dart` (the DTOs `ludo_gateway.dart` depends on,
    mirroring `contracts.ts`/`wire.ts` field-for-field)
  - `apps-native/games/ludo/lib/src/net/ludo_firebase_gateway.dart` (the
    guarded `firebase_core`/`firebase_auth`/`google_sign_in` abstraction —
    `ensureLudoFirebaseInitialized()`, `LudoFirebaseAuthGateway`,
    `LudoGoogleSignInGateway` — that `main.dart`, `ludo_auth_controller
    .dart` and `settings_screen.dart` depend on instead of the real plugin
    types directly, so tests inject fakes)
  - `apps-native/games/ludo/test/net/ludo_test_support.dart` (fixture/queue
    fake `LudoHttpTransport`s shared by both net test files)
  - `apps-native/games/ludo/test/fixtures/ludo_route_fixture.json` (the
    "fixture captured from the real server response shape" the Acceptance
    Criteria calls for — a field-for-field copy of the fixture data in
    `packages/api/src/games/ludo/contract-regressions.test.ts`)
  - `apps-native/games/ludo/test/screens/settings_screen_test.dart`
    (extended with Google-link panel coverage)

## Implementation Note (filled in during execution)

- `LudoAuthController` caches the API access/refresh token pair and the
  short-lived Ludo game token in memory (per app session — no persistence
  across restarts in this task; task 25/26 wire it into a screen-level
  singleton). `ensureGameToken()` reuses a cached game token until 30s
  before its server-declared `expires_in`, then re-runs the session
  exchange; if that 401s (the API access token itself expired) it rolls
  the access token forward via `/api/auth/refresh` and retries once before
  falling back to a full Firebase-ID-token re-exchange.
- `POST /api/auth/refresh`'s response has no `user` object (only
  `/exchange`'s does) — confirmed by reading `packages/api/src/routes/
  auth-tokens.ts` directly rather than assuming symmetry; `LudoApiAuthTokens`
  has separate `fromExchangeWire`/`fromRefreshWire` constructors for this.
- `main.dart` calls `ensureLudoFirebaseInitialized()` fire-and-forget
  (`unawaited`, never blocking `runApp`) — the guarantee task 24 protects is
  that *nothing* about booting to local modes depends on its result, not
  merely that it doesn't throw.
- No device build/install was required by this task's Verification
  Commands (format/analyze/test/validate only); `flutter pub get` resolved
  `firebase_core`/`firebase_auth`/`google_sign_in`/`cloud_firestore`
  successfully with live network access, so the new dependencies are known
  to resolve, but no APK was built or installed on the attached device for
  this task — task 26 is the first to add real new on-device screens this
  epic's device QA sweep applies to.

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
