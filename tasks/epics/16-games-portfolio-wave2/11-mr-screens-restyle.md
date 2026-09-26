---
epic: 16-games-portfolio-wave2
task: 11-mr-screens-restyle
status: completed
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/10-mr-audio]
estimate: L
owner: agent
---

# Merge Relay: home, chapter map, results, settings, and pause restyle

## Goal

Rebuild every non-board screen with the task 07 design system so the app
reads as a finished game: a composed home screen with no empty lower half,
an illustrated chapter map for the 60-board campaign, celebratory results,
and a polished pause screen and settings.

## Context / Decisions

- Audit failures to fix: the home screen's bottom ~45% is empty (see
  `.agents/resources/2026-09-25/games-portfolio-audit/renders/merge_relay-01-home.png`),
  the result screen is plain text over an empty background, and the pause
  and settings screens use stock tiles.
- **Home**: a header with a wordmark slot (`logoWide`, text fallback), a hero
  scene slot (`homeScene`, with a code-drawn fallback of stacked character
  tiles), primary **Continue** (when there's a saved run) or **Play**, then
  **Rescue** (chapter progress), **Daily** (with today's state), and
  **Endless** (best score). Settings is a secondary icon. Nothing relay-
  related appears (task 05's gate).
- **Chapter map**: 6 chapter cards, each with 10 board nodes showing
  cleared, current, and locked states and an unlock rule hint (7 of 10).
  The map scrolls vertically, the current chapter is centred, and locked
  chapters are dimmed with a lock icon.
- **Result**: a win shows a tile character celebrating, score/best tile/
  moves in `MrPill`s, and **Next board** / **Replay** / **Home**. A loss
  shows an encouraging line plus **Retry**. Endless results show the new
  best when it's beaten.
- **Pause** is an `MrDialog` with Resume / Restart (confirmation) / Home /
  Settings. **Settings** has Sound, Music, Vibration, Reduced motion,
  High contrast, Replay tutorial, and a version line.
- **Play screen composition** (added 2026-09-26 after the task 08 review):
  the play screen currently leaves ~20% empty bands above and below the
  board (`test/goldens/screens/play_rescue.png`). Compose it the way
  Threes! does: a compact HUD (goal + score/best/moves), the board as the
  vertical focal point, and a useful lower area (e.g. the next-tile/goal
  hint and a pause/undo strip). No horizontal band over 20% may be flat
  empty background.
- Copy stays short, original, and game-voiced; the solo scope has no
  "relay"/"friend" wording.
- Layout works from 360×640 to 430×932 logical px, and with text scale 1.3,
  with no overflow.

## Implementation Checklist

- [x] Restyle Home, add the chapter map, and restyle Result, Pause, and
      Settings; recompose the Play screen (rescue and endless).
- [x] Add small-screen and large-text widget tests (no overflow
      exceptions) for every screen.
- [x] Update the screen goldens and add `chapter_map.png`,
      `result_win.png`, `result_loss.png`, and `home_small.png` (360×640).
- [x] Copy the goldens and a before/after contact sheet (audit renders vs.
      new) to `.agents/resources/2026-09-25/games-wave2-qa/11/`, and VIEW them.

## Files Touched

- `apps-native/games/merge_relay/lib/src/{merge_relay_home*,merge_relay_result_screen,merge_relay_pause_panel,merge_relay_overlays,merge_relay_ui}.dart`
- `apps-native/games/merge_relay/lib/src/screens/**` (new, if split out)
- `apps-native/games/merge_relay/test/**`

## Acceptance Criteria

- In the Home golden, no horizontal band taller than 25% of the screen is flat
  empty background; in the Play goldens no band is taller than 20%. The
  verifier measures both on the images.
- The chapter-map golden shows 6 chapters and the correct
  cleared/current/locked states for a seeded save.
- The small-screen and large-text tests pass with no `RenderFlex overflow`.
- No Material-default widgets are visible in any golden.
- The test count is ≥ task 10's.

## Verification Commands

- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`
- Device check: NOT RUN.

## Out of Scope

- Tutorial (task 12). Bitmap art (task 23). The final name (task 18); use the current title text for now.

## Commit message

`feat(merge-relay): restyle home, chapter map, results, pause, and settings [16-games-portfolio-wave2/11]`
