---
epic: 15-ludo-launch
task: 09-setup-and-board-screen
status: complete
commit_scope: ludo
depends_on: [15-ludo-launch/08-home-lobby]
estimate: L
---

# Build the mode/setup sheet, game board screen, and pause/quit dialog

## Goal

Build the mode/setup bottom sheet (Classic/Quick, 2/4 players, color pick,
bot difficulty), the game board screen chrome (player panels with
avatar/name/timer ring, bottom dice zone, menu button), and the pause/quit
dialog with sound/music/vibration toggles, all driven by local
`ludo_rules` state for now (server/online wiring is tasks 24-26; bot-turn
automation against this screen is task 12).

## Context/Decisions

- Mode/setup sheet (`ModeSetupSheet`, a modal bottom sheet launched from any
  home-lobby entry card): ruleset toggle (Classic/Quick, from task 01's
  `LudoRuleset`), player-count toggle (2 or 4), per-seat color assignment
  (drag or tap-to-assign among the fixed seat colors from task 01), and — 
  only when launched from the Computer entry — a bot-difficulty picker
  (easy/medium/hard, task 02's tiers) per non-human seat. The sheet returns
  a fully-specified local match configuration; it does not itself start
  networking.
- Game board screen (`GameBoardScreen`): composes task 05's `ludo_game.dart`
  Flame widget with surrounding chrome — one player panel per seat
  (avatar, name, a circular timer ring counting down the ~30s turn phase
  visually, using the deadline value from state), a bottom dice zone
  (tap-to-roll, disabled when it isn't the local player's turn or roll
  phase), and a menu button opening the pause/quit dialog. The timer ring
  is purely presentational in this task — it reads whatever deadline the
  current match-state source provides (local `ludo_rules` clock for now);
  task 25 swaps in the server-provided deadline for online play without
  this screen needing to change its rendering logic.
- Pause/quit dialog (`PauseQuitDialog`): sound/music/vibration toggles bound
  to task 06's `ludo_sound_settings.dart`, a Resume action, and a Quit
  action. Quitting a local (Computer/Pass N Play) match ends it immediately
  with no penalty; quitting an online match is task 25's concern (forfeit
  semantics) — this task's dialog exposes a single `onQuit` callback the
  caller supplies, it does not hardcode forfeit logic itself.
- Turn indication and legal-move affordance: when it's the local player's
  move phase, tappable tokens (from task 04) highlight to show which moves
  are legal, sourced from `ludo_rules`' `legalMoves(state)` — this screen
  wires taps to `applyMove`, it does not reimplement move legality.

## Implementation Checklist

- [x] Create `lib/src/screens/mode_setup_sheet.dart` with ruleset,
  player-count, color, and (conditional) bot-difficulty controls, returning
  a `LudoLocalMatchConfig` value object.
- [x] Create `lib/src/screens/game_board_screen.dart` composing
  `ludo_game.dart` with player panels, timer ring, dice zone, and menu
  button.
- [x] Create `lib/src/widgets/player_panel.dart` (avatar/name/timer ring)
  and `lib/src/widgets/dice_zone.dart` (tap-to-roll, disabled states).
- [x] Create `lib/src/screens/pause_quit_dialog.dart` bound to
  `ludo_sound_settings.dart`.
- [x] Wire `home_lobby_screen.dart` (task 08) to open `mode_setup_sheet.dart`
  from each entry card and, on completion, navigate to
  `game_board_screen.dart` with the resulting local config.
- [x] Add `test/screens/mode_setup_sheet_test.dart` covering: 2 vs 4 player
  toggling changes available color slots, bot-difficulty picker only shows
  for non-human seats, and the returned config matches the selected
  options.
- [x] Add `test/screens/game_board_screen_test.dart` covering: dice zone is
  disabled outside the local player's roll phase, tappable-token highlight
  matches `legalMoves(state)` for a constructed state, and the timer ring
  renders the correct remaining-time fraction for a given deadline.
- [x] Add `test/screens/pause_quit_dialog_test.dart` covering: toggles
  mutate `ludo_sound_settings`, Resume closes the dialog without side
  effects, Quit invokes the supplied callback exactly once.

## Files Touched

- `apps-native/games/ludo/lib/src/screens/mode_setup_sheet.dart`
- `apps-native/games/ludo/lib/src/screens/game_board_screen.dart`
- `apps-native/games/ludo/lib/src/screens/pause_quit_dialog.dart`
- `apps-native/games/ludo/lib/src/widgets/player_panel.dart`
- `apps-native/games/ludo/lib/src/widgets/dice_zone.dart`
- `apps-native/games/ludo/lib/src/screens/home_lobby_screen.dart` (wired)
- `apps-native/games/ludo/test/screens/mode_setup_sheet_test.dart`
- `apps-native/games/ludo/test/screens/game_board_screen_test.dart`
- `apps-native/games/ludo/test/screens/pause_quit_dialog_test.dart`

## Acceptance Criteria

- A full local Classic 4-player match can be configured via the setup sheet
  and played to a legal move on the board screen using only widgets built
  in tasks 11-15 (no online dependency).
- The dice zone never allows rolling out of turn/phase, verified by a test
  attempting an out-of-turn tap and asserting no state change occurs.
- The pause dialog's toggles visibly change `ludo_sound_settings` state.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`

## Out of Scope

- Server/online match-state wiring (tasks 24-26).
- Bot move execution against these screens (task 12 wires the actual bot
  turn-taking; this task only needs the difficulty picker to exist).
- Results/rematch screen (task 10).

## Commit message

`feat(ludo): add mode setup sheet, game board screen, and pause dialog [15-ludo-launch/09]`
