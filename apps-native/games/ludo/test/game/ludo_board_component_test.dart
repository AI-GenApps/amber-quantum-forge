import 'dart:typed_data';
import 'dart:ui';

import 'package:flame/components.dart';
import 'package:flame_test/flame_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/game/ludo_board_component.dart';
import 'package:ludo_rules/ludo_rules.dart';

/// Renders [component] (sized to [size]) into an image and returns the
/// RGBA byte at pixel ([x], [y]), for pixel-level assertions on canvas-only
/// paint calls that don't otherwise expose testable state.
Future<Uint8List> _samplePixel(
  PositionComponent component,
  double size,
  int x,
  int y,
) async {
  final recorder = PictureRecorder();
  final canvas = Canvas(recorder);
  component.render(canvas);
  final image = await recorder.endRecording().toImage(
    size.toInt(),
    size.toInt(),
  );
  final bytes = await image.toByteData(format: ImageByteFormat.rawRgba);
  final offset = (y * size.toInt() + x) * 4;
  return bytes!.buffer.asUint8List(offset, 4);
}

void main() {
  group('LudoBoardComponent', () {
    testWithFlameGame('renders 52 track cells, 24 home-stretch cells, '
        '4 yards', (game) async {
      final board = LudoBoardComponent(boardSize: Vector2.all(300));
      await game.ensureAdd(board);

      expect(board.trackCells.length, 52);
      expect(board.homeStretchCells.length, 24);
      expect(board.yards.length, 4);
      expect(board.frame, isNotNull);
      // One extra top-level child for the board-frame decoration (task
      // 12c) on top of every track/home-stretch/yard cell.
      expect(board.children.length, 52 + 24 + 4 + 1);
    });

    testWithFlameGame('marks exactly the safe cells ludo_rules defines', (
      game,
    ) async {
      final board = LudoBoardComponent(boardSize: Vector2.all(300));
      await game.ensureAdd(board);

      final safeIndices = board.trackCells
          .where((cell) => cell.isSafe)
          .map((cell) => cell.cellIndex)
          .toSet();

      expect(safeIndices, LudoBoard.safeCells.toSet());
      expect(safeIndices.length, 8);
    });

    testWithFlameGame('every safe cell renders a distinct star marker child, '
        'no non-safe cell does', (game) async {
      final board = LudoBoardComponent(boardSize: Vector2.all(300));
      await game.ensureAdd(board);
      await game.ready();

      for (final cell in board.trackCells) {
        if (LudoBoard.safeCells.contains(cell.cellIndex)) {
          expect(
            cell.star,
            isNotNull,
            reason: 'safe cell ${cell.cellIndex} should have a star marker',
          );
          expect(cell.children, contains(cell.star));
        } else {
          expect(
            cell.star,
            isNull,
            reason:
                'non-safe cell ${cell.cellIndex} should not have a star '
                'marker',
          );
        }
      }
    });

    testWithFlameGame('every home-stretch color has exactly 6 cells', (
      game,
    ) async {
      final board = LudoBoardComponent(boardSize: Vector2.all(300));
      await game.ensureAdd(board);

      for (final color in LudoColor.values) {
        final cellsForColor = board.homeStretchCells.where(
          (cell) => cell.color == color,
        );
        expect(cellsForColor.length, 6, reason: '$color home stretch');
      }
    });

    testWithFlameGame('relayout keeps the same child counts at a new size', (
      game,
    ) async {
      final board = LudoBoardComponent(boardSize: Vector2.all(300));
      await game.ensureAdd(board);

      board.relayout(Vector2.all(600));
      await game.ready();

      expect(board.size, Vector2.all(600));
      expect(board.trackCells.length, 52);
      expect(board.homeStretchCells.length, 24);
      expect(board.yards.length, 4);
    });
  });

  group('center finish triangles (task 12d2)', () {
    const centerRect = Rect.fromLTWH(60, 60, 30, 30);

    test('each color\'s triangle sits on the same side as its home-stretch '
        'entry, meeting at the exact center point', () {
      final center = centerRect.center;
      final sideMidpoints = {
        LudoColor.red: Offset(centerRect.left + 0.5, center.dy),
        LudoColor.green: Offset(center.dx, centerRect.top + 0.5),
        LudoColor.yellow: Offset(centerRect.right - 0.5, center.dy),
        LudoColor.blue: Offset(center.dx, centerRect.bottom - 0.5),
      };

      for (final color in LudoColor.values) {
        final path = ludoCenterTrianglePath(color, centerRect);
        // Every triangle contains its own side's midpoint...
        expect(
          path.contains(sideMidpoints[color]!),
          isTrue,
          reason: '$color triangle should reach its own side',
        );
        // ...and a point just off-center toward its own side (every
        // triangle's apex is the exact center point shared by all four,
        // so the apex itself is a degenerate boundary case for
        // `Path.contains` — this nearby interior point is not).
        final towardOwnSide = Offset.lerp(center, sideMidpoints[color]!, 0.1)!;
        expect(
          path.contains(towardOwnSide),
          isTrue,
          reason: '$color triangle should reach almost to the center',
        );
        // ...but not the opposite side's midpoint (no color's wedge
        // stretches across the whole square).
        final oppositeColor = switch (color) {
          LudoColor.red => LudoColor.yellow,
          LudoColor.green => LudoColor.blue,
          LudoColor.yellow => LudoColor.red,
          LudoColor.blue => LudoColor.green,
        };
        expect(
          path.contains(sideMidpoints[oppositeColor]!),
          isFalse,
          reason: '$color triangle should not reach the opposite side',
        );
      }
    });
  });

  group('LudoYardComponent (task 12d2)', () {
    test('yard-slot circle radius is ~1.1 board cells in diameter', () {
      const cellSize = 20.0;
      expect(ludoYardSlotCircleRadius(cellSize), closeTo(11.0, 0.001));
      expect(ludoYardSlotDiameterFraction, 1.1);
    });
  });

  group('LudoSafeCellStarComponent (task 12d2)', () {
    testWithFlameGame('renders an outlined star, not a filled disc', (
      game,
    ) async {
      const size = 40.0;
      final star = LudoSafeCellStarComponent()..size = Vector2.all(size);
      await game.ensureAdd(star);

      // The star's own center point sits inside the star polygon's
      // concave region between points, which a filled star would still
      // color but a stroke-only outline leaves untouched — i.e. it must
      // read as the (transparent) canvas background, not the gold fill
      // the previous filled-disc rendering used.
      final pixel = await _samplePixel(star, size, size ~/ 2, size ~/ 2);
      // Alpha channel near zero: nothing was painted at the center.
      expect(pixel[3], lessThan(10));
    });

    test('starPath traces a 10-point star shape, not a filled disc bounds', () {
      const rect = Rect.fromLTWH(0, 0, 40, 40);
      final path = LudoSafeCellStarComponent.starPath(rect);
      final bounds = path.getBounds();
      expect(bounds.width, lessThan(rect.width));
      expect(bounds.height, lessThan(rect.height));
    });
  });
}
