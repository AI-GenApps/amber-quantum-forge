---
epic: 16-games-portfolio-wave2
task: 08-mr-tiles-and-board
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/07-mr-design-system-and-fonts]
estimate: L
owner: agent
---

# Merge Relay: character tiles and board skin (code-drawn, art-ready)

## Goal

Make the board the hero: tiles with an original **face per tier**, a
physical card feel, and a warm board frame. All of it is drawn in code
behind the art-manifest slots, so final art from task 23 can drop in.

## Context / Decisions

- Target: the Threes! style anchors (task 01). Each tile tier gets an
  original expression: eyes and mouth drawn as simple vector shapes, varied
  by tier (sleepy at low tiers, delighted at high tiers). Faces sit
  **above** the numeral and never cover it. Do not use Threes!'s character
  designs.
- Tile anatomy: a rounded card, a bottom "thickness" edge (2–4 px at DPR 3)
  in a darker shade of the tier colour, and a numeral in Fredoka at
  ≥40% of tile height (≥28% for 4+ digits).
- The board frame is a soft inset tray on cream with subtle grid wells.
  Empty wells read as slots, not dark holes. The current dark-navy board is
  replaced.
- The rendering path stays in the existing Flame/`CustomPainter` board
  (`lib/src/merge_relay_board_painter.dart`, `merge_relay_board_art.dart`,
  `merge_relay_board_widget.dart`). Per slot, draw the manifest bitmap if it
  is present, otherwise the code-drawn tile.
- Accessibility: tier colour is never the only cue (the numeral is always
  present), there is a high-contrast mode in Settings, and semantics labels
  stay unchanged.

## Implementation Checklist

- [ ] Add a tile-face painter per tier (≥12 tiers) plus a generic fallback
      for higher tiers.
- [ ] Draw the tile card with its thickness edge and shadow.
- [ ] Add the board tray and wells.
- [ ] Add a high-contrast toggle, wired through the existing preferences.
- [ ] Add a golden `test/goldens/tiles/tier_sheet.png` showing every tier at
      the real tile size, and update the screen goldens.
- [ ] Add a test asserting the numeral text size ratio and that face bounds
      don't intersect numeral bounds.
- [ ] Copy the tier sheet and the updated play golden to
      `.agents/resources/2026-09-25/games-wave2-qa/08/`, together with a side-by-side
      contact sheet against the Threes! anchors, and VIEW them.

## Files Touched

- `apps-native/games/merge_relay/lib/src/{merge_relay_board_painter,merge_relay_board_art,merge_relay_board_widget}.dart`
- `apps-native/games/merge_relay/lib/src/ui/tiles/**` (new)
- `apps-native/games/merge_relay/test/**`

## Acceptance Criteria

- The tier-sheet golden shows ≥12 distinct faces and colours with readable
  numerals; the verifier views it.
- The play golden shows no dark empty holes, and the board fills 80–92% of
  screen width.
- The numeral-ratio and face-overlap tests pass.
- The suite passes, and the test count is ≥ task 07's.

## Verification Commands

- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`
- Device check: NOT RUN.

## Out of Scope

- Animation (task 09). Bitmap art (task 23).

## Commit message

`feat(merge-relay): add character tiles and warm board skin [16-games-portfolio-wave2/08]`
