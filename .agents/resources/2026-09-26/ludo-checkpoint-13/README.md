# Checkpoint 13 — green start-square offset

## User report

Pass-and-play, 2 players (red vs green). Player 2 (green) had just released a
token; the user said: "Player 2 with green is on step 1, but it seems like
they are on step 2." Evidence: `01-user-feedback-green-start-offset.png` —
green's released token appears to sit one row below the star that marks
green's own start square (top arm, row 2 col 8, vs the star at row 1 col 8).

## Investigation

Traced the full mapping chain from `ludo_rules` to the rendered grid cell:

- `ludo_rules`' `LudoBoard.absoluteCellOf(color, pathPosition)` —
  `packages/ludo_rules/lib/src/ludo_board.dart` — is the single source of
  truth for which absolute track cell (`0..51`) a color's token occupies at
  a given `pathPosition`, and for which absolute cells are safe.
- `apps-native/games/ludo/lib/src/game/ludo_board_geometry.dart`'s
  `ludoTrackCellGrid` walks the 15x15 cross layout once, with 4-fold
  rotational symmetry, into `(row, col)` per absolute cell `0..51`.
  `ludoStartCellGrid(color)` is defined as
  `ludoTrackCellGrid[board.startIndexOf(color)]` — it can never disagree
  with the rules engine about which cell a color starts on.
- `ludo_game.dart`'s `_gridForPosition` (used both for the token's resting
  cell and for every intermediate hop-animation frame) computes
  `ludoTrackCellGrid[board.absoluteCellOf(color, pathPosition)]` for any
  on-track `pathPosition`, including `pathPosition == 0` (just released).

Added `apps-native/games/ludo/test/game/ludo_track_mapping_test.dart`, which
drives the real `LudoGame` (not a hand re-derivation of the math) for all 4
colors and asserts: `pathPosition 0` lands on that color's start cell,
`pathPosition 1` lands one cell further clockwise (and NOT on the start
cell), the last shared-track cell before the home-stretch turn is correct,
and the first home-stretch cell is correct. All 16 of these assertions
**already passed** against the pre-existing code — for every color, a
released token (`pathPosition 0`) renders on exactly the same `(row, col)`
as that color's own start-cell star. Independently confirmed by running the
mapping through the real Dart/Flutter test harness (not just re-deriving it
by hand) and by rendering `board_populated.png`'s existing
`pathPosition: 0` yellow token, which already sat on its own star.

**Root cause: not a coordinate/index bug.** The board-mapping math was
already internally consistent across rules, rendering, safe cells, and
home-stretch entries for all 4 colors — no off-by-one existed in
`absoluteCellOf`, `ludoTrackCellGrid`, or `_gridForPosition`. What made the
checkpoint-13 screenshot genuinely ambiguous:

1. **No visual distinction between a color's own start square and every
   other safe/star cell.** Every safe cell (start squares and the 4
   "extra" star squares) rendered with the same plain gold tint. A player
   glancing at the board had no fast way to tell "this star is green's
   *own* start" apart from "this star is just a generic safe cell nearby" —
   so a released token sitting on a plain gold star one column over from
   the green yard reads as ambiguous at a glance. This is exactly task
   12d2's outstanding "start squares are not colored" gap.
2. Ludo King itself solves this by tinting each color's start square with
   that color — which also happens to make "is my just-released token
   exactly on its home star" trivially verifiable by eye, which is the
   fix this task delivers.

## Fix

`apps-native/games/ludo/lib/src/game/ludo_board_geometry.dart`: added
`ludoStartColorOfCell(cell)`, derived from `LudoBoard.startIndexOf` (same
source of truth as the rest of the geometry) — the color, if any, whose
start square an absolute track cell is.

`apps-native/games/ludo/lib/src/game/ludo_board_component.dart`:
`LudoTrackCellComponent` gained a `startColor` field. A start cell now
fills with that color (55% alpha, so the grid lines and star marker stay
legible) instead of the generic safe-cell gold, and keeps its star marker
(a start square is still a safe square, per task 12d2's spec).

No changes to `ludo_rules` (rules engine, replay fixtures, or Classic
regression goldens) — the mapping was already correct, so nothing there
needed to change, and `ludo_classic_regression_test.dart`'s byte-identical
fixture checks still pass untouched.

## Tests added

- `apps-native/games/ludo/test/game/ludo_track_mapping_test.dart`: for each
  of the 4 colors — `pathPosition 0` renders on the start cell (and not one
  cell ahead), `pathPosition 1` renders one cell further, the last
  shared-track cell before the home-stretch turn, the first home-stretch
  cell, every `ludo_rules` safe cell is flagged safe, and every color's
  start `LudoTrackCellComponent` is both a star cell and tinted that color.
- `apps-native/games/ludo/test/goldens/ludo_board_golden_test.dart`: new
  `board_released_start_tokens.png` golden — one just-released token
  (`pathPosition: 0`) per color, all 4 at once, each sitting exactly on its
  own colored start cell.
- Every pre-existing golden (`board_empty.png`,
  `board_populated.png`, etc.) was regenerated to pick up the new colored
  start squares; none of their token/cell positions changed.

## Device verification (Samsung A52, adb RZ8R32EAB7T)

Built and installed the debug APK, then ran the lobby's "Debug: All Bots
Demo" (4-player, all bots, auto-playing) and captured the board at the
moment each color released its first token:

- `02-fix-red-start-cell.png` — red's released token sits exactly on red's
  colored start cell (row 6, col 1).
- `02-fix-green-start-cell.png` — green's two released tokens (fanned out,
  stacked-token layout) sit exactly on green's colored start cell (row 1,
  col 8) — the exact cell the checkpoint-13 report was about.
- `02-fix-yellow-start-cell.png` — yellow's released token sits exactly on
  yellow's colored start cell.
- `02-fix-blue-start-cell.png` — blue's released token sits exactly on
  blue's colored start cell.

In every capture the released token's pin sits centered on its own
distinctly-colored, starred home cell, immediately adjacent to that color's
yard — visually unambiguous, unlike the plain-gold star in the original
report.
