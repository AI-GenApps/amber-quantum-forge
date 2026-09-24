/// The code-drawn Ludo board: 52 shared-track cells, 24 home-stretch cells
/// (6 per color), and 4 yards, laid out from `ludo_board_geometry.dart`'s
/// grid math. Every safe cell (a start square or "star" square, per
/// `ludo_rules`' [ludoIsSafeCell]) renders a distinct star marker so
/// safety is visible at a glance, per task 04's Context/Decisions.
///
/// Everything here is drawn with `Canvas`/`Paint` calls (rectangles, star
/// paths, rounded yard regions) — no bitmap asset is loaded.
library;

import 'dart:math' as math;

import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor, ludoTrackLength;

import 'ludo_board_geometry.dart';

const _homeStretchCellsPerColor = 6;

/// One shared-track square, index `0..51`.
class LudoTrackCellComponent extends PositionComponent {
  LudoTrackCellComponent({required this.cellIndex, required this.isSafe})
    : super(anchor: Anchor.center);

  final int cellIndex;
  final bool isSafe;

  @override
  void render(Canvas canvas) {
    final rect = Rect.fromLTWH(0, 0, size.x, size.y);
    canvas.drawRect(
      rect,
      Paint()..color = isSafe ? const Color(0xFFFFF3C4) : Colors.white,
    );
    canvas.drawRect(
      rect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..color = const Color(0xFFBDBDBD),
    );
    if (isSafe) _paintStar(canvas, rect);
  }

  void _paintStar(Canvas canvas, Rect rect) {
    final center = rect.center;
    final outerRadius = rect.shortestSide * 0.34;
    final innerRadius = outerRadius * 0.45;
    final path = Path();
    for (var i = 0; i < 10; i++) {
      final radius = i.isEven ? outerRadius : innerRadius;
      final angle = -math.pi / 2 + i * math.pi / 5;
      final point = Offset(
        center.dx + radius * math.cos(angle),
        center.dy + radius * math.sin(angle),
      );
      if (i == 0) {
        path.moveTo(point.dx, point.dy);
      } else {
        path.lineTo(point.dx, point.dy);
      }
    }
    path.close();
    canvas.drawPath(path, Paint()..color = const Color(0xFFFFC107));
  }
}

/// One private home-stretch square for [color], index `0..5` (edge to
/// center).
class LudoHomeStretchCellComponent extends PositionComponent {
  LudoHomeStretchCellComponent({
    required this.color,
    required this.stretchIndex,
  }) : super(anchor: Anchor.center);

  final LudoColor color;
  final int stretchIndex;

  @override
  void render(Canvas canvas) {
    final rect = Rect.fromLTWH(0, 0, size.x, size.y);
    final base = ludoColorPalette[color]!;
    canvas.drawRect(rect, Paint()..color = base.withValues(alpha: 0.55));
    canvas.drawRect(
      rect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..color = base,
    );
  }
}

/// One color's yard region (a 6x6 corner holding that color's tokens
/// before they enter play), drawn as a single component per task 04's
/// acceptance criteria ("4 yards").
class LudoYardComponent extends PositionComponent {
  LudoYardComponent({required this.color}) : super(anchor: Anchor.topLeft);

  final LudoColor color;

  @override
  void render(Canvas canvas) {
    final rect = Rect.fromLTWH(0, 0, size.x, size.y);
    final base = ludoColorPalette[color]!;
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(size.x * 0.1));
    canvas.drawRRect(rrect, Paint()..color = base.withValues(alpha: 0.16));
    canvas.drawRRect(
      rrect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = size.x * 0.015
        ..color = base,
    );

    final cellSize = size.x / 6;
    for (var slot = 0; slot < 4; slot++) {
      final (row, col) = ludoYardSlotGrid(color, slot);
      final corner = ludoYardCorner[color]!;
      final localCenter = Offset(
        (col - corner.$2 + 0.5) * cellSize,
        (row - corner.$1 + 0.5) * cellSize,
      );
      canvas.drawCircle(
        localCenter,
        cellSize * 0.32,
        Paint()..color = base.withValues(alpha: 0.28),
      );
    }
  }
}

/// The full Ludo board: track, home stretches, yards, laid out to fill a
/// square area of `boardSize`. Composes the cell components above as
/// children so their count/positions are independently testable (per task
/// 04's acceptance criteria), and paints a subtle center finish decoration
/// and overall backdrop itself.
class LudoBoardComponent extends PositionComponent {
  LudoBoardComponent({required Vector2 boardSize})
    : super(size: boardSize, anchor: Anchor.topLeft) {
    _layout();
  }

  final List<LudoTrackCellComponent> trackCells = [];
  final List<LudoHomeStretchCellComponent> homeStretchCells = [];
  final List<LudoYardComponent> yards = [];

  /// Recomputes every child cell's position/size for the current [size].
  /// Call after changing [size] (e.g. on a game resize).
  void relayout(Vector2 boardSize) {
    size = boardSize;
    _layout();
  }

  void _layout() {
    removeAll(children.toList());
    trackCells.clear();
    homeStretchCells.clear();
    yards.clear();

    final cellSize = size.x / ludoGridSize;
    final boardRect = Rect.fromLTWH(0, 0, size.x, size.y);
    Vector2 vectorOf(Offset offset) => Vector2(offset.dx, offset.dy);

    for (var i = 0; i < ludoTrackLength; i++) {
      final grid = ludoTrackCellGrid[i];
      trackCells.add(
        LudoTrackCellComponent(cellIndex: i, isSafe: ludoIsSafeCell(i))
          ..size = Vector2.all(cellSize)
          ..position = vectorOf(ludoCellCenterAt(grid, boardRect)),
      );
    }

    for (final color in LudoColor.values) {
      for (var i = 0; i < _homeStretchCellsPerColor; i++) {
        final grid = ludoHomeStretchCellGrid(color, i);
        homeStretchCells.add(
          LudoHomeStretchCellComponent(color: color, stretchIndex: i)
            ..size = Vector2.all(cellSize)
            ..position = vectorOf(ludoCellCenterAt(grid, boardRect)),
        );
      }
      final corner = ludoYardCorner[color]!;
      yards.add(
        LudoYardComponent(color: color)
          ..size = Vector2.all(cellSize * 6)
          ..position = Vector2(corner.$2 * cellSize, corner.$1 * cellSize),
      );
    }

    addAll([...trackCells, ...homeStretchCells, ...yards]);
  }

  @override
  void render(Canvas canvas) {
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.x, size.y),
      Paint()..color = const Color(0xFFF5F5F0),
    );
    _paintCenter(canvas);
  }

  void _paintCenter(Canvas canvas) {
    final cellSize = size.x / ludoGridSize;
    final centerRect = Rect.fromLTWH(
      cellSize * 6,
      cellSize * 6,
      cellSize * 3,
      cellSize * 3,
    );
    final center = centerRect.center;
    for (final color in LudoColor.values) {
      final corner = ludoYardCorner[color]!;
      final towardCenter = Offset(
        corner.$2 < 7 ? centerRect.left : centerRect.right,
        corner.$1 < 7 ? centerRect.top : centerRect.bottom,
      );
      final path = Path()
        ..moveTo(center.dx, center.dy)
        ..lineTo(towardCenter.dx, center.dy)
        ..lineTo(center.dx, towardCenter.dy)
        ..close();
      canvas.drawPath(
        path,
        Paint()..color = ludoColorPalette[color]!.withValues(alpha: 0.85),
      );
    }
  }
}
