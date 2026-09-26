import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_board_art.dart';
import 'package:merge_relay/src/merge_relay_motion.dart';
import 'package:merge_relay/src/merge_relay_theme.dart';
import 'package:merge_rules/merge_rules.dart';

import '../screens/physical_golden.dart';

/// Task 09's frame-sequence golden: 5 frames sampled across
/// `mergeRelayMoveFrameAt`'s merge-pop window (t = 0.44 through 1.0, the
/// pop's whole span once the slide-in has settled). Every frame renders
/// through the SAME production paint path the live board uses —
/// `MergeRelayBoardArt.paint`, not a duplicated painter — on a one-tile
/// board with that cell marked merged, so the exact same squash-and-
/// stretch transform (non-uniform `scaleX`/`scaleY`, anchored at the
/// tile's bottom) that ships in the game is what the golden captures.
/// A caption under each frame prints the exact `sx`/`sy` the frame used.
void main() {
  testWidgets('merge strip shows the squash-and-stretch across five frames', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(3912, 1020);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    final key = UniqueKey();
    await tester.pumpWidget(
      RepaintBoundary(
        key: key,
        child: const MaterialApp(
          debugShowCheckedModeBanner: false,
          home: Scaffold(body: Center(child: _MergeStrip())),
        ),
      ),
    );
    await tester.pump();

    await expectLater(
      capturePhysicalGolden(tester, find.byKey(key)),
      matchesGoldenFile('merge_strip.png'),
    );
  });
}

/// Evenly spans the pop window: 0 (its start — the early squash begins),
/// 0.25 (still inside the wider/shorter squash), 0.5 (the uniform peak,
/// ~1.18x), 0.75 (settling back down), and 1.0 (settled at rest).
const _popFrameTimes = <double>[0, 0.25, 0.5, 0.75, 1.0];
const _slideFraction = 110 / 250;
const _popFraction = 140 / 250;

/// A 16-cell board with a single value-4 tile at cell 0 — everything
/// else empty — so `MergeRelayBoardArt.paint` renders one real merged
/// tile per frame through its normal 4x4 grid layout.
final _mergeStripBoard = MergeBoard([4, ...List<int>.filled(15, 0)]);

final class _MergeStrip extends StatelessWidget {
  const _MergeStrip();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: signalRelayTheme.paper,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: SizedBox(
          height: 300,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final popFraction in _popFrameTimes) ...[
                _MergeStripFrame(
                  frame: mergeRelayMoveFrameAt(
                    _slideFraction + popFraction * _popFraction,
                  ),
                  // Same value the live board passes: the highlight ring
                  // fades with overall move progress and is gone once the
                  // move settles (last frame).
                  highlightAlpha:
                      1 - (_slideFraction + popFraction * _popFraction),
                ),
                if (popFraction != _popFrameTimes.last)
                  const SizedBox(width: 16),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// The full board canvas `MergeRelayBoardArt.paint` lays out cell 0
/// against — large enough that the merged tile's squash is many pixels
/// tall, not a handful.
const _paintCanvasSize = 900.0;

/// The visible crop: just past cell 0's tray padding and cell, so the
/// merged tile fills most of the frame at real production proportions.
const _cropSize = 240.0;

final class _MergeStripFrame extends StatelessWidget {
  const _MergeStripFrame({required this.frame, required this.highlightAlpha});

  final MergeRelayMoveFrame frame;
  final double highlightAlpha;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: _cropSize,
          height: _cropSize,
          // Zooms into cell 0's corner of the SAME production paint call
          // (`MergeRelayBoardArt.paint` painted at its normal 900x900
          // layout below) by clipping to a small window aligned at the
          // canvas's top-left — a display-only crop, not a change to how
          // the tile itself is painted or scaled.
          child: ClipRect(
            child: OverflowBox(
              minWidth: _paintCanvasSize,
              maxWidth: _paintCanvasSize,
              minHeight: _paintCanvasSize,
              maxHeight: _paintCanvasSize,
              alignment: Alignment.topLeft,
              child: CustomPaint(
                size: const Size(_paintCanvasSize, _paintCanvasSize),
                painter: _ProductionPaintFrame(
                  frame: frame,
                  highlightAlpha: highlightAlpha,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'sx ${frame.scaleX.toStringAsFixed(2)}  '
          'sy ${frame.scaleY.toStringAsFixed(2)}',
          style: TextStyle(
            fontFamily: 'Fredoka',
            color: signalRelayTheme.ink,
            fontWeight: FontWeight.w700,
            fontSize: 17,
          ),
        ),
      ],
    );
  }
}

final class _ProductionPaintFrame extends CustomPainter {
  const _ProductionPaintFrame({
    required this.frame,
    required this.highlightAlpha,
  });

  final MergeRelayMoveFrame frame;
  final double highlightAlpha;

  @override
  void paint(Canvas canvas, Size size) {
    MergeRelayBoardArt.paint(
      canvas,
      _mergeStripBoard,
      size: size,
      theme: signalRelayTheme,
      changedCells: const {0},
      mergedCells: const {0},
      frame: frame,
      highContrast: false,
      highlightAlpha: highlightAlpha,
    );
  }

  @override
  bool shouldRepaint(covariant _ProductionPaintFrame oldDelegate) =>
      oldDelegate.frame != frame ||
      oldDelegate.highlightAlpha != highlightAlpha;
}
