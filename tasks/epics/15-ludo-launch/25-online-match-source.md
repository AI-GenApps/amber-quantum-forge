---
epic: 15-ludo-launch
task: 25-online-match-source
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/24-online-gateway-auth]
estimate: L
---

# Wire the Firestore match listener, polling fallback, and online board state

## Goal

Give the game board screen a real online match-state source: a
`cloud_firestore` snapshot listener with an HTTP polling fallback, reconnect
handling on app resume, and the server-provided turn deadline driving the
timer ring already built in task 09.

## Context/Decisions

- `lib/src/net/ludo_match_state_source.dart` (interface) with
  `FirestoreMatchStateSource` and `PollingMatchStateSource`
  implementations. `FirestoreMatchStateSource` opens a `cloud_firestore`
  snapshot listener on the match-view document path documented by task 22,
  updating `game_board_screen.dart`'s state stream. If Firestore is
  unavailable (no config, or a stream error), fall back to polling `GET
  /matches/:id/state` (task 22, via task 24's gateway) on a fixed interval
  (e.g. every 2-3s) — implemented as one interface with two implementations
  so `game_board_screen.dart` doesn't know which is active.
- Wire `game_board_screen.dart` (task 09) to accept a
  `LudoMatchStateSource` for online matches instead of the local
  `ludo_rules` state used for Computer/Pass N Play, and to read the
  server-provided `turn_deadline_at` for the timer ring instead of a local
  clock — task 09 built the timer ring to accept whatever deadline its
  state source provides, so this task only supplies the online source, not
  new timer-ring rendering logic.
- Reconnect: on app resume/foreground after backgrounding during an online
  match, re-fetch match state via the gateway (either listener source)
  before rendering, so a stale in-memory state is never shown as current.
- Quitting an online match (task 09's `PauseQuitDialog` `onQuit` callback)
  is wired here to call the gateway's `claim_timeout`/`surrender` command
  as appropriate, implementing the forfeit semantics task 09 deferred.

## Implementation Checklist

- [ ] Create `lib/src/net/ludo_match_state_source.dart` (interface) with
  `FirestoreMatchStateSource` and `PollingMatchStateSource`
  implementations.
- [ ] Wire `game_board_screen.dart` (task 09) to accept a
  `LudoMatchStateSource` for online matches, including the server-provided
  turn deadline.
- [ ] Wire `pause_quit_dialog.dart`'s `onQuit` (task 09) for online matches
  to call the gateway's surrender/claim-timeout command.
- [ ] Add reconnect-on-resume handling (app lifecycle observer refetches
  state).
- [ ] Add `test/net/ludo_match_state_source_test.dart` covering fallback
  from a failing Firestore stream to polling.
- [ ] Add a `test/screens/game_board_screen_test.dart` case (extend task
  09's file) covering: the timer ring renders using the server-provided
  deadline when an online source is supplied.
- [ ] Add a reconnect test simulating a lifecycle resume event and
  asserting state is refetched rather than trusted from stale memory.

## Files Touched

- `apps-native/games/ludo/lib/src/net/ludo_match_state_source.dart`
- `apps-native/games/ludo/lib/src/screens/game_board_screen.dart` (wired)
- `apps-native/games/ludo/lib/src/screens/pause_quit_dialog.dart` (wired)
- `apps-native/games/ludo/test/net/ludo_match_state_source_test.dart`
- `apps-native/games/ludo/test/screens/game_board_screen_test.dart`

## Acceptance Criteria

- A failing/unavailable Firestore stream falls back to polling without the
  board screen needing to branch on which source is active.
- Reconnect-on-resume refetches state rather than trusting stale in-memory
  state (verified by a test simulating a lifecycle resume event).
- The timer ring reflects the server-provided deadline for an online match,
  reusing task 09's existing rendering logic unmodified.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`

## Out of Scope

- Rooms/matchmaking UI and enabling the lobby's online tiles (task 26).
- Firebase/gateway/auth wiring (task 24).
- Real Firebase project provisioning and live two-device verification (task
  29).

## Commit message

`feat(ludo): wire firestore listener, polling fallback, and online board state [15-ludo-launch/25]`
