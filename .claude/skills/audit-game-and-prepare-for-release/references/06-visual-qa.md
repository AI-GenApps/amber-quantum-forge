# Phase 6 — Device QA and visual overhaul

## Baseline ("before") pass

As soon as the local game is playable, a Sonnet agent walks every screen on the device
(onboarding, lobby, setup, game start, after rolls, pause, settings, how-to-play,
pass-and-play, results) and saves numbered captures to
`.agents/resources/<date>/<game>-baseline-before-overhaul/` with a README listing defects.
It also reports functional bugs (stuck turns, unreachable results) and logcat errors.
In parallel, a second agent inventories the UI code: theme location, hard-coded colors per
file, fonts bundled?, which screens are framework-default, where the palette lives, golden
tests + how fonts load in tests, HUD structure, and proposes 3–5 overhaul tasks.

## Overhaul task set (Ludo template)

- **Gameplay bugfix** first (freezes, canvas sizing) + debug-only "all bots" mode so full
  games run unattended on device + ≥50 seeded full-match controller tests.
- **Design system**: OFL display + body fonts with licences; theme tokens; background
  painter (pattern + vignette); reusable chrome (gold-framed panel, 3D button with press
  animation, ribbon banner, dialog frame, badge); `test/flutter_test_config.dart` FontLoader
  so goldens show real glyphs; art manifest supports optional bitmap per slot with
  code-drawn fallback.
- **Board/pieces fidelity** with cell-unit specs (see below).
- **HUD**: competitor-style player cards, per-player dice box, timer ring; responsive
  tests at 360x640 → 1080x2400.
- **Menus**: every remaining screen restyled; no framework defaults (grep checklist).
- **Device visual QA**: walk all screens, fix issues, re-capture; evidence committed.

## Writing a fidelity spec from feedback

When the user says "nowhere close to <competitor>", put your screenshot and the
competitor's side by side and list concrete deltas in the reference's own units. Ludo
example (board on a 15x15 grid): center 3x3 = four colored triangles; 6x6 yards = solid
color with ~4x4 white inner square and four ~1.1-cell colored circles; pin tokens ~0.95 x
1.3 cells with base ring; flat square board, thin grid lines, no thick frame/glow, outlined
safe stars, colored start cells, entry arrows; tilted dice-pattern background filling the
screen; board fills width (~2.5% margins), no empty bands; one dice box in the active
player's card, never on the board; geometry tiling test (no overlap/gap). Each item
becomes a checklist line AND a verifier side-by-side check.

## Verifier visual judgment

Verifiers must view device screenshots against the anchors and fail on: framework-default
widgets, white/empty areas, black/unfilled regions, overflow stripes, clipped text,
misaligned/off-board elements, tiny unreadable pieces, unreadable contrast. The
orchestrator also views the final set and reports gaps honestly — code-drawn art hits a
ceiling (flat lobby cards, line icons); that's the trigger for the art pipeline.

## User feedback during runs

The user watches the dev phone and will comment. Treat every comment as a spec input:
capture the current screen to `.agents/.../user-feedback-<topic>.png`, pause or amend the
run, and add a task. Thank, don't argue.
