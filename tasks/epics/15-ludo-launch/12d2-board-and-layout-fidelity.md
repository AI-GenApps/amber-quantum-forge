---
epic: 15-ludo-launch
task: 12d2-board-and-layout-fidelity
status: completed
commit_scope: ludo
depends_on: [15-ludo-launch/12d-game-hud]
estimate: L
---

# Bring the board and screen layout to Ludo King fidelity

## Goal

The board and screen produced by tasks 12c/12d are "nowhere close" to
Ludo King's board (user feedback, see
`.agents/resources/2026-09-24/ludo-visual-qa/user-feedback-board-1902.png`
captured on-device at 19:02). This task corrects the concrete visual and
layout gaps against the reference — center finish triangles, yard/token
proportions, board framing, background visibility, and screen layout —
without changing gameplay logic, still with original code-drawn art only
(no copied/traced assets).

## Context/Decisions

- Reference images (view with Read before starting):
  - `.agents/resources/2026-09-19/ludo-reference/16-roll-settled.png` (and
    `14-board-before-roll.png`, `20-turn-progress.png`) — Ludo King board,
    the primary fidelity target.
  - `.agents/resources/2026-09-24/ludo-visual-reference/ludo-king-reference.png`
    — Play Store reference, corner-card HUD language.
  - `.agents/resources/2026-09-24/ludo-visual-qa/user-feedback-board-1902.png`
    — current on-device state (19:02 capture) showing the gaps this task
    closes: a grey dice-glyph square sits in the board center instead of
    four colored triangles, yards have rounded corners and a glow instead
    of a flush saturated fill, the board carries a thick gold/orange frame
    with a glow, the background is flat navy (the tile pattern from 12b is
    present in code but not visually reading), a "Ludo" title bar occupies
    the top of the screen, and the board does not fill the screen width.
- Current code: `apps-native/games/ludo/lib/src/game/ludo_board_component.dart`,
  `ludo_board_geometry.dart`, `ludo_token_component.dart`, `ludo_game.dart`,
  `lib/src/screens/game_board_screen.dart`, `lib/src/theme/*.dart`. Read all
  of these before editing — `ludo_board_geometry.dart` is the single source
  of truth for the 15x15 grid math (track cells, home-stretch cells, yard
  corners/slots) and must stay the source every rect below derives from.
- All specs below are in board-cell units on the existing 15x15 grid
  (`ludoGridSize` in `ludo_board_geometry.dart`); "cell" means one
  `size.x / 15` square.
- This task is paint/layout only — no change to `ludo_rules`, move
  validation, turn logic, or animation timing/curves from tasks 04/05/12c.

## Implementation Checklist

- [x] **Center 3x3 finish triangles** (`LudoBoardComponent._paintCenter` in
  `ludo_board_component.dart`): remove any grey/dice glyph or non-color
  fill in the 3x3 center rect (cells `6,6` to `9,9`); render exactly four
  solid triangles meeting at the exact center point, each spanning its
  quadrant of the 3x3 square, colored to match that color's home-stretch
  (red on the left third, green on top, yellow on the right, blue on the
  bottom — i.e. each color's triangle sits on the same side as that
  color's home-stretch lane entry). No dice face, icon, or grey square may
  render in this rect at any time (idle, mid-roll, or settled).
- [x] **Yards (6x6 corners)** (`LudoYardComponent.render`): fill the full
  6x6 corner with a *flush, solid-saturated* color rect (square corners,
  no rounding, no drop shadow/glow around the yard itself — the existing
  `RRect.fromRectAndRadius(rect, Radius.circular(size.x * 0.08))` outer
  fill and any blur/glow on the outer or inner rect must go). Inside it, a
  white inner square of ~4x4 cells (square corners or a radius no larger
  than ~2% of the yard width) centered in the 6x6, containing four large
  solid colored circles at the token spots, each circle ~1.1 cell in
  diameter (up from the current `cellSize * 0.34` radius, i.e. ~0.68 cell
  diameter — roughly 60% larger). Tokens stand on top of these circles.
- [x] **Tokens** (`ludo_token_component.dart` — `LudoTokenPainter`/
  `pinPath`): scale the pin/map-marker silhouette to ~0.9-1.0 cell width
  and ~1.3 cells tall (check current sizing against `ludoTokenCellFraction
  = 0.78` and the pin's height-to-width ratio; both likely need to grow).
  Keep the white glossy body with colored head, and add/confirm a colored
  base ring at the token's anchor point on the cell (matching the target's
  ring-under-the-pin look). Must stay clearly readable at 1080x2400 —
  verify via device screenshot, not just simulator scale.
- [x] **Board frame and cell styling** (`ludo_board_component.dart`):
  remove `LudoBoardFrameComponent`'s thick gold/orange bevel and any glow
  around the board or around the active-yard highlight; the board must
  read as perfectly square, flat, and crisp with at most a thin, subtle
  edge (no gold double-stroke frame, no blur/glow). Track cells: keep
  white background, thin light-grey grid lines (`ludo_board_component.dart`
  already draws `Color(0xFFCFCFCF)` 1px strokes — verify this still reads
  correctly once the frame glow is removed); render each color's start
  cell on the track filled with that color; safe-cell stars must be
  outlined (stroke), not filled gold discs — change
  `LudoSafeCellStarComponent.render` to a stroked star on a plain
  background, removing the solid gold fill. Home stretches: keep the 5
  colored cells (stretch indices 1-5; index 0 is the entry arrow cell) and
  the directional entry arrow, confirm arrow rendering is unaffected by
  other changes.
- [x] **Geometry tiling test**: add a test (e.g.
  `test/game/ludo_board_geometry_tiling_test.dart`) that computes every
  yard rect, every track-cell rect, and the center 3x3 rect from
  `ludo_board_geometry.dart`'s grid math for a fixed board size, and
  asserts: no two rects overlap, the union of all rects plus the
  unused grid cells accounts for the full 15x15 board with no gap, and
  every rect stays within the board's outer bounds (`0,0` to
  `boardSize,boardSize`).
- [x] **Background** (`lib/src/theme/ludo_background_painter.dart` and its
  call site): confirm `LudoBackground`/`LudoBackgroundPainter` from 12b is
  actually wired into `game_board_screen.dart`'s `Scaffold` (grep for
  `LudoBackground` usage — if it is not wired in, wire it in as the
  screen's base layer, behind the board and HUD). Make the pattern clearly
  visible per the reference: increase `dotPaint` alpha and/or `tileSize`,
  add the tilted die-face/board motif look (a `Transform.rotate` on the
  tile pattern, or drawing tilted die-outline squares in addition to the
  pip dots) so the background reads as a large tilted repeating dice/board
  motif in blue tones with a vignette, filling the entire screen — not a
  flat navy fill. Compare against `16-roll-settled.png`'s background.
- [x] **Screen layout** (`lib/src/screens/game_board_screen.dart`): remove
  the "Ludo" title-bar `LudoPanel` (lines ~515-560, the themed top bar
  described in its own doc comment) entirely; replace it with a small
  menu/pause icon button in a corner (e.g. top-left, like Ludo King's list
  button in the reference), not a full-width bar. Resize the board to fill
  the screen width with only small side margins (~2-3% of screen width),
  vertically centered in the remaining vertical space after accounting for
  the corner player cards (12d) above/below it. Remove any large empty
  vertical bands between the board and the corner cards/screen edges.
- [x] **Player HUD alignment** (`lib/src/widgets/player_corner_card.dart`,
  `game_board_screen.dart`): confirm/adjust corner cards to be compact
  (not full-width bars), positioned directly above the top board corners
  and directly below the bottom board corners (per the Play Store
  reference's corner-card placement), and confirm the active player's dice
  renders in a gold-framed dice box next to/within their card, with only
  one dice visible on screen at a time (never on the board itself). If
  12d's corner-card layout already satisfies this, this checklist item is
  a verification pass, not a rewrite — record which in the PR/commit
  notes.
- [x] **Dice styling** (`lib/src/game/ludo_dice_component.dart`,
  `lib/src/widgets/dice_zone.dart`): confirm the glossy rounded 3D die
  with white/ivory body and pips renders inside the HUD's gold-framed dice
  box (not floating on the board), and that the roll animation from task
  05 is unchanged.
- [x] Regenerate every golden under `apps-native/games/ludo/test/goldens/`
  affected by the center/yard/token/frame/star/background changes above
  (empty board, populated board, token, safe-cell star, board-with-
  background composite). Diff old vs. new PNGs before committing — a
  stale golden re-saved unchanged is a bug in this task, not a pass.
- [x] Update `test/game/ludo_board_component_test.dart` and
  `ludo_token_component_test.dart` for: center-triangle color/placement
  assertions, enlarged yard-slot circle radius, outlined (not filled)
  star rendering, enlarged token dimensions.
- [x] Add a 12d2 row to `tasks/epics/15-ludo-launch/STATUS.md` for this
  task (do not otherwise edit that file as part of any other task).
- [x] Update task `12e`'s frontmatter `depends_on` to point at
  `15-ludo-launch/12d2-board-and-layout-fidelity` instead of its current
  dependency.

## Files Touched

- `apps-native/games/ludo/lib/src/game/ludo_board_component.dart`
- `apps-native/games/ludo/lib/src/game/ludo_board_geometry.dart`
- `apps-native/games/ludo/lib/src/game/ludo_token_component.dart`
- `apps-native/games/ludo/lib/src/game/ludo_dice_component.dart`
- `apps-native/games/ludo/lib/src/theme/ludo_background_painter.dart`
- `apps-native/games/ludo/lib/src/screens/game_board_screen.dart`
- `apps-native/games/ludo/lib/src/widgets/player_corner_card.dart`
- `apps-native/games/ludo/lib/src/widgets/dice_zone.dart`
- `apps-native/games/ludo/test/game/*.dart`
- `apps-native/games/ludo/test/game/ludo_board_geometry_tiling_test.dart`
  (new)
- `apps-native/games/ludo/test/goldens/*.png`
- `tasks/epics/15-ludo-launch/STATUS.md`
- `tasks/epics/15-ludo-launch/12e-*.md` (`depends_on` update only)

## Acceptance Criteria

- The board center renders four solid colored triangles (red/green/
  yellow/blue) meeting at the center point, with no dice glyph or grey
  square ever visible there — verified by a component/golden test.
- Every yard is a flush, solid-saturated 6x6 fill (no rounded outer
  corners, no glow) with a white ~4x4 inner square holding four ~1.1-cell
  colored circles — verified by a golden and a geometry assertion on
  circle radius.
- Tokens render at ~0.9-1.0 cell width x ~1.3 cell height and are clearly
  legible in a 1080x2400 device screenshot.
- The board has no thick gold/orange frame or glow; safe-cell stars are
  outlined, not filled gold discs.
- `ludo_board_geometry_tiling_test.dart` passes, proving yard/track/center
  rects exactly tile the 15x15 board with no gap or overlap and stay
  within the board rect.
- The background painter is wired into the game board screen and visibly
  renders a large, tilted, repeating dice/board motif with a vignette,
  filling the full screen (not a flat navy fill) — confirmed by device
  screenshot comparison against `16-roll-settled.png`.
- The "Ludo" title bar is gone; the board fills the screen width (~2-3%
  side margins) and is vertically centered in the remaining space; no
  large empty vertical bands remain.
- Corner player cards sit at the board's corners with the active player's
  dice in a gold-framed box beside their card; only one dice is visible on
  screen at a time, never on the board.
- `STATUS.md` has a 12d2 row; task `12e`'s `depends_on` points at 12d2.
- A full all-bots debug game still reaches results on device (regression
  check — no gameplay logic was touched, but the layout/board rewrite must
  not break move rendering or win detection).

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- Device verification (physical device, serial `RZ8R32EAB7T`):
  1. `bun run games:build -- --app ludo --platform android --mode debug --environment debug`
  2. `adb -s RZ8R32EAB7T install -r apps-native/games/ludo/build/app/outputs/flutter-apk/app-debug.apk`
  3. `adb -s RZ8R32EAB7T shell monkey -p app.w3dev.ludo.debug -c android.intent.category.LAUNCHER 1`
  4. Navigate to a fresh 4-player debug game at start, capture
     `adb -s RZ8R32EAB7T exec-out screencap -p > .agents/resources/2026-09-24/ludo-visual-qa/12d2/board-4p-start.png`.
  5. Play several turns (mix of bot and human moves, at least one capture
     and one home entry if reachable) and capture
     `.agents/resources/2026-09-24/ludo-visual-qa/12d2/board-mid-game.png`.
  6. Start a 2-player debug game and capture
     `.agents/resources/2026-09-24/ludo-visual-qa/12d2/board-2p.png`.
  7. Run a full all-bots debug game to completion on device and confirm it
     reaches a results screen.
  8. View all three screenshots (Read tool) next to
     `.agents/resources/2026-09-24/ludo-reference/16-roll-settled.png` and
     complete this side-by-side comparison checklist explicitly, item by
     item, recording pass/fail for each in the commit/PR notes:
     1. Center: four colored triangles, no dice/grey square.
     2. Yards: flush saturated fill, white inner square, large colored
        circles.
     3. Tokens: pin shape, correct scale, legible at full resolution.
     4. Board: square, flat, no gold frame/glow, outlined stars, colored
        start cells, home-stretch arrows.
     5. Background: tilted repeating dice/board motif with vignette,
        fills the screen.
     6. Layout: board fills screen width, no title bar, corner HUD cards,
        single active dice in gold-framed box.
     7. Dice: glossy 3D die with pips, in the HUD box, not on the board.
  - If the device is not attached, report NOT RUN for all device steps
    (do not skip the checklist item — mark it NOT RUN explicitly).

## Out of Scope

- Menu/screen restyle beyond the game board screen itself (12e).
- Online-mode HUD differences (tasks 24-26).
- Any bitmap art asset content (human art session between 12f and 13).
- Gameplay/rules logic changes — this task is paint/layout only.
- Re-deriving the 15x15 grid math itself (home-stretch/track cell
  coordinates) beyond what's needed for the new tiling test; the existing
  cross-shaped layout in `ludo_board_geometry.dart` is correct and stays.

## Commit message

`feat(ludo): bring board and screen layout to target fidelity [15-ludo-launch/12d2]`
