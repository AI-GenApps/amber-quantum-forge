---
epic: 15-ludo-launch
task: 12d-game-hud
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/12c-board-tokens-restyle]
estimate: M
---

# Restyle the game HUD: corner player cards, dice slot, timer ring, top bar

## Goal

Replace the old top-of-screen player list and plain dice zone with four
corner player cards (two above the board, two below) matching the target
look, each showing the active player's dice inside their own card, a
timer ring, and a name label, plus a restyled top bar and pause button —
with no layout overflow from a small phone (360x640) up to the baseline
device (1080x2400).

## Context/Decisions

- See `.agents/resources/2026-09-24/ludo-visual-reference/README.md` and
  `ludo-king-reference.png` for the corner-card layout target: glossy blue
  rounded cards with a gold border, a framed square avatar, a dice slot
  (the active player's die renders inside *their* card, not in a shared
  bottom zone), a name label, and a circular timer ring — built from
  task 12b's `LudoPanel`/`Ludo3dButton`/`Badge` widgets, not raw
  `Container`/`Card`.
- **Remove** the old top player list entirely (`player_panel.dart`'s
  current top-of-screen row layout from task 09) — it is superseded by the
  four corner cards, not kept alongside them.
- **Layout**: 2-player games use two of the four corner slots (diagonal or
  top/bottom, whichever reads more like the reference — document the
  choice); 4-player games use all four. The board (12c) sits centered
  between the cards. Card sizing must be responsive: no `RenderFlex`
  overflow or clipped text at 360x640 through 1080x2400 — verify with
  parameterized widget tests at multiple `tester.view.physicalSize`
  values, not just the baseline device size.
- **Dice-in-card**: when it's a seat's turn, that seat's card shows the
  dice component (from 12c) inline; other seats' cards show no dice (or a
  dimmed placeholder). Wire this through the same match-state source
  `game_board_screen.dart` already reads — no new state plumbing beyond
  "which seat is active" and "what did they roll," both already available.
- **Timer ring**: keep the existing timer-ring math from task 09
  (`player_panel.dart`'s countdown-fraction rendering); this task only
  moves it into the new corner-card widget and restyles its paint (gold/
  color-coded ring per the target look).
- **Top bar / pause button**: restyle using 12b's `Ludo3dButton`/`LudoPanel`
  — remove any remaining Material `AppBar` default styling.

## Implementation Checklist

- [ ] Create `lib/src/widgets/player_corner_card.dart`: avatar, name, dice
  slot, timer ring, built from `LudoPanel`/`Badge` (12b).
- [ ] Rework `lib/src/screens/game_board_screen.dart`'s layout: four corner
  slots (two above, two below the board), 2p vs 4p slot selection, board
  centered between them.
- [ ] Remove the old top player list from `lib/src/widgets/player_panel.dart`
  (or delete the file if fully superseded — check for other call sites
  first) and its call site in `game_board_screen.dart`.
- [ ] Wire the active seat's dice (12c's `ludo_dice_component.dart`/
  `dice_zone.dart`) to render inside that seat's `player_corner_card.dart`
  instead of a separate shared bottom zone.
- [ ] Restyle the top bar and pause button in `game_board_screen.dart`
  using `Ludo3dButton`/`LudoPanel` (12b).
- [ ] Add `test/widgets/player_corner_card_test.dart` covering: dice slot
  shows only for the active seat, timer ring reflects the given deadline
  fraction, avatar/name render correctly.
- [ ] Update `test/screens/game_board_screen_test.dart` for the new
  corner-card layout (dice-zone-disabled-out-of-turn assertion moves to
  the active card's dice slot; legal-move highlight assertions unchanged).
- [ ] Add a parameterized overflow test (e.g.
  `test/screens/game_board_screen_responsive_test.dart`) asserting no
  `RenderFlex` overflow/clipping at physical sizes from 360x640 to
  1080x2400.

## Files Touched

- `apps-native/games/ludo/lib/src/widgets/player_corner_card.dart`
- `apps-native/games/ludo/lib/src/screens/game_board_screen.dart`
- `apps-native/games/ludo/lib/src/widgets/player_panel.dart` (removed or
  reduced)
- `apps-native/games/ludo/lib/src/widgets/dice_zone.dart` (relocated
  usage)
- `apps-native/games/ludo/test/widgets/player_corner_card_test.dart`
- `apps-native/games/ludo/test/screens/game_board_screen_test.dart`
- `apps-native/games/ludo/test/screens/game_board_screen_responsive_test.dart`
- `apps-native/games/ludo/test/goldens/*.png` (game board screen goldens,
  regenerated)

## Acceptance Criteria

- The game board screen shows four corner player-card slots (2 used for
  2p games, 4 for 4p games), no separate top player list remains.
- The active seat's dice renders inside that seat's own corner card.
- No overflow/clipping at any tested physical size from 360x640 to
  1080x2400, verified by `game_board_screen_responsive_test.dart`.
- The old top-of-screen player-list widget is no longer referenced from
  `game_board_screen.dart` (grep confirms no import/usage remains, or
  confirms the file was deleted).

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- Device verification (physical device, serial `RZ8R32EAB7T`):
  1. `bun run games:build -- --app ludo --platform android --mode debug --environment debug`
  2. `adb -s RZ8R32EAB7T install -r apps-native/games/ludo/build/app/outputs/flutter-apk/app-debug.apk`
  3. `adb -s RZ8R32EAB7T shell monkey -p app.w3dev.ludo.debug -c android.intent.category.LAUNCHER 1`
  4. Navigate to a 2-player and a 4-player game board; capture each with
     `adb -s RZ8R32EAB7T exec-out screencap -p > <file>.png`.
  5. View both screenshots (Read tool); confirm corner cards render fully
     on-screen with no clipped text/overflow and compare against the
     reference image.
  - If the device is not attached, report NOT RUN.

## Out of Scope

- Board/token/dice paint (12c, already landed).
- Menu/screen restyle beyond the game board screen itself (12e).
- Online-mode HUD differences (tasks 24-26).

## Commit message

`feat(ludo): restyle game HUD with corner player cards and timer rings [15-ludo-launch/12d]`
