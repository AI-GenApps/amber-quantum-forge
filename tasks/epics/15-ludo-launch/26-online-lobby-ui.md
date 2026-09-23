---
epic: 15-ludo-launch
task: 26-online-lobby-ui
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/25-online-match-source]
estimate: L
---

# Enable online lobby tiles: rooms, matchmaking, and online telemetry

## Goal

Enable the home lobby's Play-with-Friends and Online tiles (disabled since
task 08) with real room create/join-by-code + share invite and random
matchmaking flows, deep-link handling for shared invites, and the `ludo`
telemetry namespace's ONLINE events.

## Context/Decisions

- Private rooms: extend `mode_setup_sheet.dart`'s (task 09) "Play with
  Friends" path with room create (shows the room code + a native
  share-sheet invite using the deep-link string from task 21) and room join
  (paste/enter a code), via task 24's gateway.
- Random matchmaking: extend the "Online" path with a searching state
  (submits a ticket via task 24's gateway, shows a cancelable "Finding
  players..." screen, transitions to the board — using task 25's match
  state source — once matched or bot-filled).
- Enable the lobby tiles: flip task 08's Play-with-Friends/Online entry
  cards from disabled to active, routing into the flows built here, but
  only when task 24's Firebase init actually succeeded (graceful degrade
  stays intact for a config-absent build).
- Deep link handling: register the `w3dev-ludo://room/<code>` scheme (task
  21's namespace) so tapping a shared invite opens the app directly into
  the join-room flow with the code pre-filled.
- Telemetry: check `apps-native/games/packages/platform_core/lib/
  src/telemetry.dart` for the existing event-emission API (used by the
  other five games) and add the `ludo` analytics namespace's ONLINE events
  to `lib/src/telemetry/ludo_telemetry.dart` (task 12 creates this file for
  LOCAL events; this task extends it, it does not create a second
  telemetry wrapper): `ludo_room_created`, `ludo_room_joined`,
  `ludo_matchmaking_started`, `ludo_matchmaking_matched`,
  `ludo_bot_fill_triggered`, and the online-mode variants of
  `ludo_match_started`/`ludo_match_finished` (mode: `online`/`room`).
  Follow the exact event-naming and payload-shape conventions already
  established by another game's telemetry usage (e.g. `merge_relay`). No
  telemetry event may include PII beyond what `platform_core`'s existing
  usage already permits (seat/subject hashes, not raw display names).

## Implementation Checklist

- [ ] Extend `mode_setup_sheet.dart`/`home_lobby_screen.dart` with
  room-create/join and matchmaking-search flows, using task 24's gateway
  and task 25's match state source.
- [ ] Flip task 08's Play-with-Friends/Online cards to enabled when
  Firebase init succeeded.
- [ ] Add deep-link handling for `w3dev-ludo://room/<code>`.
- [ ] Extend `lib/src/telemetry/ludo_telemetry.dart` (task 12) with the
  ONLINE events listed above, called from their respective call sites in
  this task's new flows.
- [ ] Add `test/screens/online_flow_test.dart` cases (extend task 24's
  file): room create/join reaches the board, matchmaking search can be
  canceled with no orphaned ticket state (assert the cancel gateway call is
  made), and the lobby tiles are enabled once Firebase init succeeds.
- [ ] Add `test/telemetry/ludo_telemetry_test.dart` cases (extend task 12's
  file, using `platform_core`'s existing test double/fake telemetry sink)
  asserting each ONLINE event fires with the expected name/payload for a
  representative scenario.

## Files Touched

- `apps-native/games/ludo/lib/src/screens/mode_setup_sheet.dart` (wired)
- `apps-native/games/ludo/lib/src/screens/home_lobby_screen.dart` (wired)
- `apps-native/games/ludo/lib/src/telemetry/ludo_telemetry.dart` (extended)
- `apps-native/games/ludo/test/screens/online_flow_test.dart`
- `apps-native/games/ludo/test/telemetry/ludo_telemetry_test.dart`

## Acceptance Criteria

- A canceled matchmaking search leaves no orphaned ticket state on the
  client (verified by asserting the cancel gateway call is made).
- Room create/join and matchmaking search each reach the board screen via
  task 25's online match state source.
- Every named ONLINE telemetry event fires at its documented call site with
  no PII beyond what `platform_core`'s existing usage already permits.
- The Online/Play-with-Friends tiles are enabled only when Firebase init
  succeeded; a config-absent build keeps them disabled per task 08/24.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`

## Out of Scope

- Firebase/gateway/auth wiring (task 24).
- Firestore listener/polling fallback/reconnect (task 25).
- LOCAL telemetry events (task 12).
- Real Firebase project provisioning and live two-device verification (task
  29).
- Push notifications for turn alerts (not in v1 scope).

## Commit message

`feat(ludo): enable online lobby, rooms, matchmaking, and online telemetry [15-ludo-launch/26]`
