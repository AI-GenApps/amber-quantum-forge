# Task 09 evidence — Merge Relay motion, juice, haptics

## merge_strip.png

Copy of `apps-native/games/merge_relay/test/goldens/motion/merge_strip.png`,
produced by `test/goldens/motion/merge_strip_test.dart` (a headless
`flutter test` golden — no device, no emulator).

5 frames sampled across the merge **squash-and-stretch** window driven by
`mergeRelayMoveFrameAt`/`_mergeSquashScaleAt` in
`lib/src/merge_relay_motion.dart` (t = 0.44 through 1.0, the pop's whole
span once the slide-in has settled). The scale is **non-uniform**
(`scaleX` != `scaleY`) during the early squash, converging to a uniform
stretch-to-peak and settle — not a single uniform `scale()`:

| Frame | Pop progress | sx | sy | Shape |
|---|---|---|---|---|
| 1 | 0% | 1.00 | 1.00 | at rest |
| 2 | 25% | 1.11 | 0.90 | early squash — wider, shorter |
| 3 | 50% (peak) | 1.18 | 1.18 | uniform stretch peak |
| 4 | 75% | 1.12 | 1.12 | uniform settle |
| 5 | 100% | 1.00 | 1.00 | settled at rest |

Every frame renders through the **same production paint path** the live
board uses — `MergeRelayBoardArt.paint` (not a duplicated painter) — on a
one-tile board with that cell marked merged, so the exact transform that
ships in the game (anchored at the tile's **bottom** edge, so it reads as
landing, using the real bundled Fredoka/Nunito Sans fonts loaded via
`test/flutter_test_config.dart`) is what the golden captures. Each panel
is a display-only zoom (`ClipRect`/`OverflowBox`, not a repainted or
rescaled tile) into cell 0's corner of that same paint call, and a
caption underneath prints the exact `sx`/`sy` values.

The strip visibly shows: frame 2's tile is noticeably wider and shorter
than frame 1 (compare the coral highlight ring's proportions — same
bottom edge, shorter top), frame 3 is the largest, uniformly-scaled peak,
frame 4 is a smaller uniform size on the way down, and frame 5 matches
frame 1's rest size. Squash-and-stretch is visible across frames, not
just a size pulse.

Rendered at 3912x1020 physical pixels (1304x340 logical, DPR 3) via the
task 07/08 physical-capture helper (`test/goldens/screens/physical_golden.dart`).

## Verification

`bun run games:test -- --app merge_relay` (full suite, run from repo root)
and the standalone golden run are both recorded in the task's final
report (see the coordinator's task 09 completion message / commit for
exact timings and pass counts). The full merge_relay suite stays well
under the 3-minute budget.

## Reduced motion (fix round 1)

Reduced motion now follows *either* the Settings toggle *or* the
platform's own `MediaQuery.disableAnimations` signal (e.g. OS-level
"Reduce motion"), in the board widget (`_reducedMotion` getter in
`merge_relay_board_widget.dart`, covering the move/celebration/shake
animations) and the score pop (`MergeRelayScoreStrip` in
`merge_relay_play_widgets.dart`). Covered by a widget test that sets
`MediaQueryData(disableAnimations: true)` with the Settings toggle left
off and asserts the fully-settled, zero-duration behavior.

## Transient changed/merged-cell ring (fix round 2)

The re-verifier found that `merge_strip.png` (fix round 1) exposed a real
production bug: the coral/sky ring stroked around every cell in
`presentation.changedCells`/`mergedCells` was gated only by set
membership, and `presentation` is never cleared once a move settles (it's
only replaced by the *next* move's presentation, in
`MergeRelayGame.move`) — so after a session's first move, that ring stayed
on the last-moved tiles for the rest of the session. The spawn-tile
"just arrived" halo circle had the identical bug.

Fix: `MergeRelayBoardArt.paint` gained a `highlightAlpha` parameter (1 by
default, for static previews like the tutorial/relay-board screens that
never animate and want a persistent hint) that both the ring and the
spawn halo are drawn with, and skipped entirely once it reaches 0. The
live `MergeRelayBoard` widget passes the same t-derived value it already
computed as `pulse` (`1 - moveAnimationValue`: 1 at a move's start, 0 once
it settles, and already 0 immediately under reduced motion) as
`highlightAlpha`, so the highlight fades out over the move's own
animation instead of sticking around.

Covered by:
- `test/merge_relay_board_art_test.dart` (new) — pure `MergeRelayBoardArt.paint`
  image-comparison tests via `PictureRecorder`: `highlightAlpha: 0` paints
  pixel-identical to no presentation at all; `highlightAlpha: 1` provably
  differs (a sanity check that the comparison can detect the ring); `0.5`
  differs from both extremes.
- `test/merge_relay_board_widget_test.dart` (extended) — a real swipe on
  the live widget shows `0 < highlightAlpha < 1` partway through the
  250ms move animation, and a few frames after it settles
  (`changedCells` still non-empty — it's never cleared) the live
  painter's rendered image is pixel-identical to a fresh painter with no
  presentation at all.

`merge_strip.png` itself is unaffected: it always passes the default
`highlightAlpha: 1` (a static demonstration of the squash-and-stretch, not
of the ring's transience), so it did not need to change and its bytes are
identical after this fix.

## Orchestrator follow-up (2026-09-26)

`merge_strip_test.dart` now passes the same per-frame highlight alpha as the
live board (`1 - t`, where t is overall move progress). The strip therefore shows the
changed/merged-cell ring fading across the pop, and the last (settled) frame
has no ring. That matches the fix-round-2 behaviour instead of showing the ring
at full strength on every frame. The golden was regenerated, and all 195 tests pass.
