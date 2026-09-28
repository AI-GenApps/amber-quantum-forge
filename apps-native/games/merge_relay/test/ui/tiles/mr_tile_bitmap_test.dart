import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/assets/mr_bitmap_art_cache.dart';
import 'package:merge_relay/src/merge_relay_board_art.dart';
import 'package:merge_relay/src/merge_relay_theme.dart';

/// Task 23: `MergeRelayBoardArt.paintTile` draws the bundled tile-tier
/// bitmap (via `MrBitmapArtCache`) covering the whole card in place of the
/// procedural card+face, except under `highContrast` (which always keeps
/// the procedural card so its firm ink outline — the mode's whole point —
/// still shows). This injects a synthetic solid-colour `ui.Image` directly
/// into the cache (`MrBitmapArtCache.putForTest`, skipping any real
/// asset/codec round trip) and samples the rendered pixel to prove which
/// path actually ran, rather than depending on the real generated art's
/// own colours.
void main() {
  const artColor = Color(0xffff0000);
  const tileRect = Rect.fromLTWH(0, 0, 100, 100);

  setUp(MrBitmapArtCache.instance.resetForTest);
  tearDown(MrBitmapArtCache.instance.resetForTest);

  testWidgets('a cached bitmap paints over the whole tile card', (
    tester,
  ) async {
    late ui.Image rendered;
    await tester.runAsync(() async {
      MrBitmapArtCache.instance.putForTest(
        'assets/art/tileFace_2.png',
        await _solidImage(artColor),
      );
      rendered = await _renderTile(tileRect, highContrast: false);
    });

    final pixel = await tester.runAsync(() => _pixelAt(rendered, 50, 20));
    expect(pixel, artColor);
  });

  testWidgets('highContrast keeps the procedural card even with a bitmap '
      'cached', (tester) async {
    late ui.Image rendered;
    await tester.runAsync(() async {
      MrBitmapArtCache.instance.putForTest(
        'assets/art/tileFace_2.png',
        await _solidImage(artColor),
      );
      rendered = await _renderTile(tileRect, highContrast: true);
    });

    final pixel = await tester.runAsync(() => _pixelAt(rendered, 50, 20));
    expect(pixel, isNot(artColor));
  });

  testWidgets('no cached bitmap falls back to the procedural card', (
    tester,
  ) async {
    late ui.Image rendered;
    await tester.runAsync(() async {
      rendered = await _renderTile(tileRect, highContrast: false);
    });

    final pixel = await tester.runAsync(() => _pixelAt(rendered, 50, 20));
    expect(pixel, isNot(artColor));
  });
}

Future<ui.Image> _solidImage(Color color, {int size = 8}) async {
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  canvas.drawRect(
    Rect.fromLTWH(0, 0, size.toDouble(), size.toDouble()),
    Paint()..color = color,
  );
  final picture = recorder.endRecording();
  return picture.toImage(size, size);
}

Future<ui.Image> _renderTile(
  Rect tileRect, {
  required bool highContrast,
}) async {
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  MergeRelayBoardArt.paintTile(
    canvas,
    tileRect,
    value: 2,
    theme: signalRelayTheme,
    highContrast: highContrast,
  );
  final picture = recorder.endRecording();
  return picture.toImage(tileRect.width.round(), tileRect.height.round());
}

Future<Color> _pixelAt(ui.Image image, int x, int y) async {
  final data = await image.toByteData(format: ui.ImageByteFormat.rawRgba);
  final bytes = data!.buffer.asUint8List();
  final index = (y * image.width + x) * 4;
  return Color.fromARGB(
    bytes[index + 3],
    bytes[index],
    bytes[index + 1],
    bytes[index + 2],
  );
}
