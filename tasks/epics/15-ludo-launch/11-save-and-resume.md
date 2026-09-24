---
epic: 15-ludo-launch
task: 11-save-and-resume
status: completed
commit_scope: ludo
depends_on: [15-ludo-launch/10-results-and-settings]
estimate: M
---

# Add durable local match persistence and resume after restart

## Goal

Persist an in-progress local (Computer or Pass N Play) match durably so it
survives an app restart, and wire the home lobby's "Resume" affordance
(task 08's integration point) to it.

## Context/Decisions

- Resume-in-progress local match after app restart: persist the in-progress
  `LudoMatchState` (Computer or Pass N Play only — online matches resume via
  tasks 24-26's server state, not local persistence) to local storage
  (`path_provider`-backed file or the same mechanism `merge_relay` uses for
  its local save/reconnect path — check `merge_relay`'s save implementation
  for the established pattern in this workspace and reuse it rather than
  inventing a new one) after every applied move, and load it on app start to
  populate the home lobby's "Resume" affordance (task 08's integration
  point). A finished match is cleared from this local save slot immediately.
- This task depends on task 10 because the save must also capture enough
  context (ruleset, seat colors, bot difficulties from task 09's setup
  config) to resume directly onto the board screen with the same chrome —
  not just the raw engine state.

## Implementation Checklist

- [x] Create `lib/src/state/ludo_local_save.dart`: save/load/clear for an
  in-progress local `LudoMatchState` plus its originating
  `LudoLocalMatchConfig` (task 09), following `merge_relay`'s established
  local-save pattern.
- [x] Wire `game_board_screen.dart` (task 09) to call
  `ludo_local_save.dart` after every applied move, and clear it on match
  finish before navigating to `results_screen.dart` (task 10).
- [x] Wire `home_lobby_screen.dart`'s resume affordance (task 08's
  integration point) to `ludo_local_save.dart`'s loaded state.
- [x] Add `test/state/ludo_local_save_test.dart` covering: save-then-load
  round-trips a match state and its config exactly, a finished match is
  cleared, and loading with no saved state returns `null` cleanly.
- [x] Add a full-app integration test (`test/app_resume_test.dart`)
  simulating: start a local match, apply a move, "restart" the app (rebuild
  the widget tree fresh), and assert the home lobby offers Resume and
  resuming lands back on the board at the saved state.

## Files Touched

- `apps-native/games/ludo/lib/src/state/ludo_local_save.dart`
- `apps-native/games/ludo/lib/src/screens/game_board_screen.dart` (wired)
- `apps-native/games/ludo/lib/src/screens/home_lobby_screen.dart` (wired)
- `apps-native/games/ludo/test/state/ludo_local_save_test.dart`
- `apps-native/games/ludo/test/app_resume_test.dart`

## Acceptance Criteria

- Simulated app restart mid-match offers Resume and restores the exact
  saved state, including the original setup config (ruleset, seat colors,
  bot difficulties).
- A finished match leaves no stale resumable save behind.
- Loading with no saved state returns `null` and the lobby shows no resume
  affordance.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`

## Out of Scope

- Online match resume (task 25).
- Cloud save sync (task 25's `save_sync` capability work, if any beyond
  match state fanout).

## Commit message

`feat(ludo): add durable local match persistence and resume [15-ludo-launch/11]`
