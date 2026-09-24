---
epic: 15-ludo-launch
task: 10-results-and-settings
status: completed
commit_scope: ludo
depends_on: [15-ludo-launch/09-setup-and-board-screen]
estimate: M
---

# Build results/rematch, settings, and how-to-play screens

## Goal

Build the results screen with final ranks and a rematch action, a settings
screen, and a how-to-play/rules screen, including the reduced-motion toggle
wired to task 04's setting. Durable local match persistence and
resume-after-restart are task 11, built on top of this task's settings
plumbing.

## Context/Decisions

- Results screen (`ResultsScreen`): shows final finish order for all seats
  (from `ludo_rules`' terminal `LudoMatchState`), a Rematch action (same
  config, new local match instance) and a Home action. No monetized
  "watch an ad to continue" or coin reward UI.
- Settings screen (`SettingsScreen`): sound/music/vibration toggles (same
  state as the pause dialog, task 09 — this screen and the pause dialog
  must bind to the *same* `ludo_sound_settings` instance, not two
  independently-initialized copies), plus the reduced-motion toggle wired
  to task 04's `reduced_motion_setting.dart`, plus a link to the
  how-to-play screen. Persist every toggle here to local storage using the
  same mechanism chosen in task 06/07 (do not introduce a third persistence
  approach).
- How-to-play screen (`HowToPlayScreen`): a static rules explainer covering
  the Classic ruleset from task 01's Context section (yard exit on six,
  extra roll on six, three-sixes forfeit, capture + bonus roll, home-arrival
  bonus roll, no blockades, exact finish) plus a short Quick-mode
  explainer, written for a player, not copied from this epic's internal
  task language.
- Reduced motion default: off, matching the platform's
  `MediaQuery.disableAnimations` accessibility signal as an initial
  suggested value if available, but always overridable by the explicit
  settings toggle.
- Accessibility: every interactive control (toggles, Rematch/Home buttons,
  how-to-play link) carries a `Semantics` label and a minimum 48dp tap
  target.

## Implementation Checklist

- [x] Create `lib/src/screens/results_screen.dart` with final ranks,
  Rematch, and Home actions.
- [x] Create `lib/src/screens/settings_screen.dart` binding to the shared
  `ludo_sound_settings.dart` instance and `reduced_motion_setting.dart`,
  with local persistence.
- [x] Create `lib/src/screens/how_to_play_screen.dart` with the Classic and
  Quick rules explainer text.
- [x] Wire `pause_quit_dialog.dart` (task 09) and `settings_screen.dart` to
  the same `ludo_sound_settings` instance (verify via a shared
  provider/singleton, not two constructions).
- [x] Wire `game_board_screen.dart` (task 09) to navigate to
  `results_screen.dart` on match finish.
- [x] Add `test/screens/results_screen_test.dart`,
  `settings_screen_test.dart`, `how_to_play_screen_test.dart`, each
  asserting `Semantics` labels and 48dp+ tap targets on every interactive
  control.
- [x] Add a follow-up assertion in a board-screen test proving toggling
  reduced motion in Settings measurably changes tasks 04/05's component
  behavior (no multi-frame animation observed).

## Files Touched

- `apps-native/games/ludo/lib/src/screens/results_screen.dart`
- `apps-native/games/ludo/lib/src/screens/settings_screen.dart`
- `apps-native/games/ludo/lib/src/screens/how_to_play_screen.dart`
- `apps-native/games/ludo/lib/src/screens/game_board_screen.dart` (wired)
- `apps-native/games/ludo/lib/src/screens/pause_quit_dialog.dart` (wired)
- `apps-native/games/ludo/test/screens/results_screen_test.dart`
- `apps-native/games/ludo/test/screens/settings_screen_test.dart`
- `apps-native/games/ludo/test/screens/how_to_play_screen_test.dart`

## Acceptance Criteria

- A full local match (setup -> board -> a finish) reaches the results
  screen with the correct finish order and a working Rematch action.
- Toggling reduced motion in Settings measurably changes tasks 04/05's
  component behavior (no multi-frame animation observed in a follow-up
  board-screen test).
- Sound/music/vibration toggles are consistent between the pause dialog and
  the settings screen (changing one is reflected in the other within the
  same app session).
- Every interactive control in this task's screens has a `Semantics` label
  and a 48dp+ tap target, verified by test.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`

## Out of Scope

- Durable local match persistence and resume-after-restart (task 11).
- Online match resume (task 25).
- Cloud save sync (task 25's `save_sync` capability work, if any beyond
  match state fanout).

## Commit message

`feat(ludo): add results, settings, and how-to-play screens [15-ludo-launch/10]`
