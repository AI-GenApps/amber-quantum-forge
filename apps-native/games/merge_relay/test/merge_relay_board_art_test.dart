import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_board_art.dart';
import 'package:merge_rules/merge_rules.dart';

/// Fix round 2: the changed/merged-cell highlight ring must be transient.
/// `presentation` (and so `changedCells`/`mergedCells`) is never cleared
/// once a move settles — see `MergeRelayGame.move` — so it's the ring's
/// own opacity (`highlightAlpha`), not set membership, that has to make it
/// disappear. These render the real `MergeRelayBoardArt.paint` to an
/// image and compare raw pixels, rather than sampling a single stroke
/// coordinate, so the check doesn't depend on exact anti-aliasing.
void main() {
  final board = MergeBoard([2, ...List<int>.filled(15, 0)]);

  Future<Uint8List> renderPixels(
    WidgetTester tester, {
    required Set<int> changedCells,
    required Set<int> mergedCells,
    required double highlightAlpha,
  }) {
    return tester
        .runAsync(() async {
          const size = Size(400, 400);
          final recorder = ui.PictureRecorder();
          final canvas = Canvas(recorder);
          MergeRelayBoardArt.paint(
            canvas,
            board,
            size: size,
            changedCells: changedCells,
            mergedCells: mergedCells,
            highlightAlpha: highlightAlpha,
          );
          final picture = recorder.endRecording();
          final image = await picture.toImage(400, 400);
          final bytes = await image.toByteData(
            format: ui.ImageByteFormat.rawRgba,
          );
          picture.dispose();
          image.dispose();
          return bytes!.buffer.asUint8List();
        })
        .then((value) => value!);
  }

  testWidgets(
    'a fully faded ring (highlightAlpha 0) paints pixel-identical to no '
    'presentation at all',
    (tester) async {
      final faded = await renderPixels(
        tester,
        changedCells: const {0},
        mergedCells: const {0},
        highlightAlpha: 0,
      );
      final noPresentation = await renderPixels(
        tester,
        changedCells: const {},
        mergedCells: const {},
        highlightAlpha: 0,
      );
      expect(faded, orderedEquals(noPresentation));
    },
  );

  testWidgets(
    'a fully visible ring (highlightAlpha 1) differs from no presentation',
    (tester) async {
      // Sanity check for the comparison above: proves `renderPixels` can
      // actually detect the ring at all, so the alpha-0 equality isn't
      // trivially true because the ring never renders in either case.
      final visible = await renderPixels(
        tester,
        changedCells: const {0},
        mergedCells: const {0},
        highlightAlpha: 1,
      );
      final noPresentation = await renderPixels(
        tester,
        changedCells: const {},
        mergedCells: const {},
        highlightAlpha: 1,
      );
      expect(visible, isNot(orderedEquals(noPresentation)));
    },
  );

  testWidgets(
    'a partially faded ring (highlightAlpha 0.5) differs from both the '
    'fully visible and fully faded ring',
    (tester) async {
      final half = await renderPixels(
        tester,
        changedCells: const {0},
        mergedCells: const {0},
        highlightAlpha: 0.5,
      );
      final full = await renderPixels(
        tester,
        changedCells: const {0},
        mergedCells: const {0},
        highlightAlpha: 1,
      );
      final none = await renderPixels(
        tester,
        changedCells: const {0},
        mergedCells: const {0},
        highlightAlpha: 0,
      );
      expect(half, isNot(orderedEquals(full)));
      expect(half, isNot(orderedEquals(none)));
    },
  );
}
