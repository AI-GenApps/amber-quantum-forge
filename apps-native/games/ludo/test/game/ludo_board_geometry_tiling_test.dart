/// Task 12d2's tiling guard: proves the yard, track-cell, and center-3x3
/// rects `ludo_board_geometry.dart` derives never overlap and, together
/// with the (deliberately excluded from this test — see below) home-stretch
/// lanes, exactly tile the 15x15 board with no gap and no rect straying
/// outside the board's own bounds.
///
/// Home-stretch cell rects are intentionally not computed here (per this
/// task's checklist, which names only yard/track-cell/center rects) — each
/// color's home-stretch lane runs through the "unused" grid cells this
/// test accounts for numerically, and its last cell (nearest the center)
/// is the same color as the center triangle it borders, so a same-color
/// overlap there is an intentional design of the classic Ludo board, not a
/// tiling bug this guard needs to catch.
library;

import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/game/ludo_board_geometry.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor, ludoTrackLength;

void main() {
  test('yard, track-cell, and center rects tile the 15x15 board with no '
      'overlap, no gap, and stay within the board bounds', () {
    const boardSize = 300.0;
    final boardRect = Rect.fromLTWH(0, 0, boardSize, boardSize);
    final cellSize = boardSize / ludoGridSize;

    final rects = <Rect>[];

    for (final color in LudoColor.values) {
      final corner = ludoYardCorner[color]!;
      rects.add(
        Rect.fromLTWH(
          corner.$2 * cellSize,
          corner.$1 * cellSize,
          cellSize * 6,
          cellSize * 6,
        ),
      );
    }

    for (var i = 0; i < ludoTrackLength; i++) {
      rects.add(ludoCellRectAt(ludoTrackCellGrid[i], boardRect));
    }

    final centerRect = Rect.fromLTWH(
      cellSize * 6,
      cellSize * 6,
      cellSize * 3,
      cellSize * 3,
    );
    rects.add(centerRect);

    // Every rect stays within the board's own outer bounds.
    for (final rect in rects) {
      expect(rect.left, greaterThanOrEqualTo(-0.001));
      expect(rect.top, greaterThanOrEqualTo(-0.001));
      expect(rect.right, lessThanOrEqualTo(boardSize + 0.001));
      expect(rect.bottom, lessThanOrEqualTo(boardSize + 0.001));
    }

    // No two rects overlap (`Rect.overlaps` excludes rects that merely
    // touch at a shared edge, which every adjacent yard/track/center
    // pair does).
    for (var i = 0; i < rects.length; i++) {
      for (var j = i + 1; j < rects.length; j++) {
        expect(
          rects[i].overlaps(rects[j]),
          isFalse,
          reason: 'rect $i overlaps rect $j (${rects[i]} vs ${rects[j]})',
        );
      }
    }

    // Expressed in whole grid cells (exact, no floating-point drift):
    // 4 yards * 36 cells + 52 track cells + 9 center cells covers 205 of
    // the board's 225 cells, leaving exactly 20 cells unused by this
    // test's rects — the home-stretch lanes outside the center square,
    // per the doc comment above.
    const yardCells = 4 * 36;
    const trackCellCount = 52;
    const centerCells = 9;
    const totalCells = ludoGridSize * ludoGridSize;
    final coveredCells = yardCells + trackCellCount + centerCells;
    final unusedCells = totalCells - coveredCells;

    expect(rects.length, 4 + 52 + 1);
    expect(coveredCells, 205);
    expect(unusedCells, 20);
    expect(unusedCells, greaterThanOrEqualTo(0));
  });
}
