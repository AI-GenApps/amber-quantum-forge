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

import '../theme/ludo_theme_tokens.dart';
import 'ludo_board_geometry.dart';

const _homeStretchCellsPerColor = 6;

/// A star-marker component: rendered as its own child so a component test
/// can assert its existence at every safe-cell index (per this task's
/// acceptance criteria — "not merely a fill-color change").
class LudoSafeCellStarComponent extends PositionComponent {
  LudoSafeCellStarComponent() : super(anchor: Anchor.center);

  @override
  void render(Canvas canvas) {
    final rect = Rect.fromLTWH(0, 0, size.x, size.y);
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
    canvas.drawPath(
      path,
      Paint()
        ..color = LudoThemeTokens.gold
        ..style = PaintingStyle.fill,
    );
    canvas.drawPath(
      path,
      Paint()
        ..color = LudoThemeTokens.goldDeep
        ..style = PaintingStyle.stroke
        ..strokeWidth = rect.shortestSide * 0.03,
    );
  }
}

/// One shared-track square, index `0..51`. Safe cells get a child
/// [LudoSafeCellStarComponent] so their marker is testable/inspectable as
/// its own component, not merely a fill-color difference.
class LudoTrackCellComponent extends PositionComponent {
  LudoTrackCellComponent({required this.cellIndex, required this.isSafe})
    : super(anchor: Anchor.center) {
    if (isSafe) {
      star = LudoSafeCellStarComponent();
      add(star!);
    }
  }

  final int cellIndex;
  final bool isSafe;

  /// The star marker child for a safe cell, `null` for a plain track cell.
  LudoSafeCellStarComponent? star;

  @override
  Future<void> onLoad() async {
    await super.onLoad();
    // `size`/`position` are cascaded onto this component by the caller
    // right after construction (see `LudoBoardComponent._layout`), so by
    // the time this component loads, `size` reflects its final cell size.
    star
      ?..size = size * 0.9
      ..position = size / 2;
  }

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
        ..color = const Color(0xFFCFCFCF),
    );
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
    canvas.drawRect(rect, Paint()..color = base.withValues(alpha: 0.82));
    canvas.drawRect(
      rect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..color = Colors.white.withValues(alpha: 0.5),
    );
    // Only the lane's entry cell (nearest the shared track) carries the
    // directional arrow, pointing toward the center along the lane.
    if (stretchIndex == 0) _paintEntryArrow(canvas, rect);
  }

  void _paintEntryArrow(Canvas canvas, Rect rect) {
    final direction = ludoHomeStretchEntryDirection(color);
    final center = rect.center;
    final forward = Offset(direction.dx, direction.dy);
    // A perpendicular unit vector, for the arrowhead's two back corners.
    final perpendicular = Offset(-forward.dy, forward.dx);
    final reach = rect.shortestSide * 0.32;
    final spread = rect.shortestSide * 0.24;
    final tip = center + forward * reach;
    final backCenter = center - forward * (reach * 0.4);
    final path = Path()
      ..moveTo(tip.dx, tip.dy)
      ..lineTo(
        backCenter.dx + perpendicular.dx * spread,
        backCenter.dy + perpendicular.dy * spread,
      )
      ..lineTo(
        backCenter.dx - perpendicular.dx * spread,
        backCenter.dy - perpendicular.dy * spread,
      )
      ..close();
    canvas.drawPath(path, Paint()..color = Colors.white.withValues(alpha: 0.9));
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = rect.shortestSide * 0.04
        ..color = LudoThemeTokens.textOutline.withValues(alpha: 0.35),
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

    // Saturated quadrant fill behind the white inner yard panel, matching
    // the target's "saturated quadrants, white inner yards" look.
    final outerRRect = RRect.fromRectAndRadius(
      rect,
      Radius.circular(size.x * 0.08),
    );
    canvas.drawRRect(outerRRect, Paint()..color = base);

    // White inner yard panel, inset from the quadrant edge, holding the
    // waiting-token slots.
    final inset = size.x * 0.1;
    final innerRect = rect.deflate(inset);
    final innerRRect = RRect.fromRectAndRadius(
      innerRect,
      Radius.circular(size.x * 0.06),
    );
    canvas.drawRRect(
      innerRRect,
      Paint()
        ..color = const Color(0x66000000)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
    );
    canvas.drawRRect(innerRRect, Paint()..color = Colors.white);

    final cellSize = size.x / 6;
    for (var slot = 0; slot < 4; slot++) {
      final (row, col) = ludoYardSlotGrid(color, slot);
      final corner = ludoYardCorner[color]!;
      final localCenter = Offset(
        (col - corner.$2 + 0.5) * cellSize,
        (row - corner.$1 + 0.5) * cellSize,
      );
      final slotRadius = cellSize * 0.34;
      canvas.drawCircle(
        localCenter,
        slotRadius,
        Paint()
          ..color = const Color(0x33000000)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2),
      );
      canvas.drawCircle(localCenter, slotRadius, Paint()..color = base);
      canvas.drawCircle(
        localCenter,
        slotRadius,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = slotRadius * 0.16
          ..color = Colors.white,
      );
    }
  }
}

/// A decorative gold-bevel border drawn around the whole board, on top of
/// every cell/yard child (added last in `LudoBoardComponent._layout`), so
/// the board reads as a distinct framed object against the background
/// painter rather than a flush rectangle (task 12c).
class LudoBoardFrameComponent extends PositionComponent {
  LudoBoardFrameComponent() : super(anchor: Anchor.topLeft);

  @override
  void render(Canvas canvas) {
    final outerRect = Rect.fromLTWH(0, 0, size.x, size.y);
    final frameWidth = size.x * 0.018;
    // Deep-gold outer stroke, drawn straddling the board's own edge so it
    // reads as a bevelled frame without adding to the board's footprint.
    canvas.drawRect(
      outerRect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = frameWidth
        ..color = LudoThemeTokens.goldDeep,
    );
    // Brighter gold inner stroke, inset by roughly the outer stroke's
    // width, giving the frame a beveled, two-tone edge.
    canvas.drawRect(
      outerRect.deflate(frameWidth),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = frameWidth * 0.6
        ..color = LudoThemeTokens.gold,
    );
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
  LudoBoardFrameComponent? frame;

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
    frame = null;

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

    frame = LudoBoardFrameComponent()..size = size.clone();

    addAll([...trackCells, ...homeStretchCells, ...yards, frame!]);
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
