---
epic: 15-ludo-launch
task: 12c-board-tokens-restyle
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/12b-design-system]
estimate: L
---

# Restyle the board, tokens, dice, and effects to the target look

## Goal

Re-skin the board, yard, track, home stretches, arrows, star safe cells,
tokens, dice, and particle/confetti effects built in tasks 04-05 to match
the target look (saturated quadrants, white inner yards, pin/map-marker
3D tokens, glossy dice, board frame), using the design-system tokens and
palette from task 12b, and regenerate every affected golden.

## Context/Decisions

- See `.agents/resources/2026-09-24/ludo-visual-reference/README.md` and
  `ludo-king-reference.png` for the look-and-feel target — original
  code-drawn art only, never copied/traced from the reference.
- **Board/yard/track**: `lib/src/game/ludo_board_component.dart` — saturated
  red/green/blue/yellow quadrant fills (from `ludo_theme_tokens.dart`'s
  per-seat palette, not ad hoc colors), white inner yard panels holding the
  waiting tokens, white track cells with clear grid lines, colored
  home-stretch lanes with a directional entry arrow drawn at the lane's
  entry cell, and a distinct star icon (not just a color swap) on every
  safe cell. Add a board frame (a bordered/beveled edge around the whole
  board, matching the gold-accent language from 12b) so the board reads as
  a distinct object against the new background painter (12b), not as a
  flush rectangle.
- **Tokens**: `lib/src/game/ludo_token_component.dart` — upgrade the
  existing gradient+shadow+highlight circle to a pin/map-marker silhouette
  (a rounded teardrop shape with a circular head, per-seat colored, still
  gradient+shadow+glossy-highlight) so tokens read as distinct 3D pieces
  rather than flat discs, matching the "glossy 3D pin tokens" requirement.
  Keep the existing hop animation timing/curve (task 04) — this task only
  changes the paint, not the motion.
- **Dice**: `lib/src/game/ludo_dice_component.dart` — polish the pip
  rendering with the new palette (white die body, gold or dark pip dots,
  a subtle bevel/shadow) matching the target's glossy look; keep the
  existing tumble animation (task 05) — paint only.
- **Board sizing**: this task assumes 12a already fixed the black-canvas/
  square-fit bug; if the board-frame addition here changes the aspect
  ratio or padding, re-verify square fitting on device (see Verification
  Commands) rather than reintroducing the bug.
- **Golden regeneration**: every golden under `test/goldens/` that captures
  board/token/dice/particle/confetti art (from tasks 04, 05, and 12) must
  be regenerated to reflect the new look — a stale placeholder-look golden
  passing unchanged after this task is a bug in this task, not a pass.

## Implementation Checklist

- [ ] Restyle `lib/src/game/ludo_board_component.dart`: quadrant fills,
  white yards, white track cells, home-stretch entry arrows, star safe
  cells, board frame.
- [ ] Restyle `lib/src/game/ludo_token_component.dart`: pin/map-marker
  token silhouette with gradient/shadow/glossy highlight, per-seat palette
  from `ludo_theme_tokens.dart`.
- [ ] Restyle `lib/src/game/ludo_dice_component.dart`: polished pip/body
  rendering matching the new palette.
- [ ] Restyle `lib/src/game/ludo_capture_particles.dart`,
  `ludo_home_arrival_burst.dart`, `ludo_confetti.dart` to use the new
  palette (`ludo_theme_tokens.dart`) instead of any leftover ad hoc colors.
- [ ] Update `lib/src/assets/ludo_art_manifest.dart`'s visual-slot painters
  that delegate to the components above (no manifest contract change, just
  confirm delegation still matches the restyled paint code).
- [ ] Regenerate every board/token/dice/particle/confetti golden under
  `apps-native/games/ludo/test/goldens/` (empty board, populated board,
  legal-move/turn highlight, token, dice faces, capture, home-arrival,
  confetti).
- [ ] Update/extend `test/game/ludo_board_component_test.dart` and
  `ludo_token_component_test.dart` for the new star-icon and pin-shape
  assertions (e.g. safe cells render a star child component, tokens render
  a teardrop path rather than a plain circle).

## Files Touched

- `apps-native/games/ludo/lib/src/game/ludo_board_component.dart`
- `apps-native/games/ludo/lib/src/game/ludo_token_component.dart`
- `apps-native/games/ludo/lib/src/game/ludo_dice_component.dart`
- `apps-native/games/ludo/lib/src/game/ludo_capture_particles.dart`
- `apps-native/games/ludo/lib/src/game/ludo_home_arrival_burst.dart`
- `apps-native/games/ludo/lib/src/game/ludo_confetti.dart`
- `apps-native/games/ludo/lib/src/assets/ludo_art_manifest.dart`
- `apps-native/games/ludo/test/game/*.dart`
- `apps-native/games/ludo/test/goldens/*.png`

## Acceptance Criteria

- Every safe cell renders a distinct star icon (not merely a fill-color
  change), verified by a component test asserting a star child/marker
  exists at each safe-cell index from `ludo_rules`' geometry constants.
- Every token renders as a pin/map-marker silhouette (not a plain circle),
  verified by a golden and a shape-assertion test.
- The board has a visible frame/border distinguishing it from the
  background, verified by a golden showing the board against the new
  background painter (12b).
- All regenerated goldens are committed and reviewed to genuinely show the
  new look (not the prior placeholder look re-saved unchanged) — the task
  author diffs old vs. new golden PNGs before committing.
- Board still renders as a perfect square with no unpainted/black area on
  the physical device (regression check on 12a's fix).

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- Device verification (physical device, serial `RZ8R32EAB7T`):
  1. `bun run games:build -- --app ludo --platform android --mode debug --environment debug`
  2. `adb -s RZ8R32EAB7T install -r apps-native/games/ludo/build/app/outputs/flutter-apk/app-debug.apk`
  3. `adb -s RZ8R32EAB7T shell monkey -p app.w3dev.ludo.debug -c android.intent.category.LAUNCHER 1`
  4. Navigate to the game board screen; capture with
     `adb -s RZ8R32EAB7T exec-out screencap -p > <file>.png`.
  5. View the screenshot (Read tool) and compare against
     `.agents/resources/2026-09-24/ludo-visual-reference/ludo-king-reference.png`
     — confirm square board fit, quadrant colors, star cells, pin tokens,
     dice placement.
  - If the device is not attached, report NOT RUN.

## Out of Scope

- HUD/player-card restyle (12d).
- Menu/screen restyle (12e).
- Any bitmap art asset content (human art session between 12f and 13).
- Gameplay logic changes (12a already landed; this task is paint-only).

## Commit message

`feat(ludo): restyle board, pin tokens, dice, and effects to target look [15-ludo-launch/12c]`
