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
///
/// Task 12d2: outlined only — a stroked star on the plain cell background,
/// not a filled gold disc, matching the reference's thin star outline
/// rather than a solid marker.
class LudoSafeCellStarComponent extends PositionComponent {
  LudoSafeCellStarComponent() : super(anchor: Anchor.center);

  /// Builds the 5-point star path centered in [rect], shared by [render]
  /// and tests that need to assert on the outline's geometry directly.
  static Path starPath(Rect rect) {
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
    return path;
  }

  @override
  void render(Canvas canvas) {
    final rect = Rect.fromLTWH(0, 0, size.x, size.y);
    canvas.drawPath(
      starPath(rect),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = rect.shortestSide * 0.07
        ..color = LudoThemeTokens.goldDeep,
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

/// The fraction of a yard's side a single yard-slot circle spans in
/// diameter (task 12d2: ~1.1 board cells, up from the previous ~0.68-cell
/// diameter) — exposed so a geometry test can assert on the exact radius
/// without duplicating the constant.
const ludoYardSlotDiameterFraction = 1.1;

/// The pixel radius of one yard-slot circle, given the board's per-cell
/// pixel size (a yard's side is always 6 cells).
double ludoYardSlotCircleRadius(double cellSize) =>
    cellSize * ludoYardSlotDiameterFraction / 2;

/// One color's yard region (a 6x6 corner holding that color's tokens
/// before they enter play), drawn as a single component per task 04's
/// acceptance criteria ("4 yards").
///
/// Task 12d2: a flush, solid-saturated 6x6 fill (square corners, no
/// rounding, no drop shadow/glow around the yard itself) with a white
/// ~4x4-cell inner square (one cell of inset per side) holding four
/// enlarged token-slot circles, matching the reference's crisp corner
/// quadrants rather than the previous rounded/blurred panel.
class LudoYardComponent extends PositionComponent {
  LudoYardComponent({required this.color}) : super(anchor: Anchor.topLeft);

  final LudoColor color;

  @override
  void render(Canvas canvas) {
    final rect = Rect.fromLTWH(0, 0, size.x, size.y);
    final base = ludoColorPalette[color]!;

    // Flush, solid-saturated quadrant fill — square corners, no rounding.
    canvas.drawRect(rect, Paint()..color = base);

    // White inner yard panel: a ~4x4-cell square (one cell inset on every
    // side of the 6x6 yard), holding the waiting-token slots. A small
    // corner radius (<=2% of the yard width) softens the corners without
    // reading as "rounded" the way the previous ~10%-radius panel did, and
    // carries no drop shadow/blur.
    final inset = size.x / 6;
    final innerRect = rect.deflate(inset);
    final innerRRect = RRect.fromRectAndRadius(
      innerRect,
      Radius.circular(size.x * 0.02),
    );
    canvas.drawRRect(innerRRect, Paint()..color = Colors.white);

    final cellSize = size.x / 6;
    final slotRadius = ludoYardSlotCircleRadius(cellSize);
    for (var slot = 0; slot < 4; slot++) {
      final (row, col) = ludoYardSlotGrid(color, slot);
      final corner = ludoYardCorner[color]!;
      final localCenter = Offset(
        (col - corner.$2 + 0.5) * cellSize,
        (row - corner.$1 + 0.5) * cellSize,
      );
      canvas.drawCircle(localCenter, slotRadius, Paint()..color = base);
      canvas.drawCircle(
        localCenter,
        slotRadius,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = slotRadius * 0.14
          ..color = Colors.white,
      );
    }
  }
}

/// A thin, subtle edge drawn around the whole board, on top of every
/// cell/yard child (added last in `LudoBoardComponent._layout`), so the
/// board reads as a crisp, square, flat object against the background
/// painter.
///
/// Task 12d2: the previous thick gold/orange double-stroke bevel with a
/// glow read as an over-styled frame the user feedback called out by name
/// (`.agents/resources/2026-09-24/ludo-visual-qa/user-feedback-board-1902.png`)
/// — replaced with a single hairline stroke and no blur/glow, matching the
/// reference board's flush, unframed edge.
class LudoBoardFrameComponent extends PositionComponent {
  LudoBoardFrameComponent() : super(anchor: Anchor.topLeft);

  @override
  void render(Canvas canvas) {
    final outerRect = Rect.fromLTWH(0, 0, size.x, size.y);
    canvas.drawRect(
      outerRect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = size.x * 0.003
        ..color = const Color(0x33000000),
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
    for (final color in LudoColor.values) {
      canvas.drawPath(
        ludoCenterTrianglePath(color, centerRect),
        Paint()..color = ludoColorPalette[color]!,
      );
    }
  }
}

/// The side of the center 3x3 finish square [color]'s triangle occupies —
/// the same side that color's home-stretch lane enters the center from
/// (see `ludo_board_geometry.dart`'s `_homeStretchByColor`): red's lane
/// runs along row 7 from the left, so red's triangle is the left wedge;
/// green's runs down column 7 from the top, so green's is the top wedge;
/// yellow enters from the right, blue from the bottom.
const _centerTriangleSideByColor = {
  LudoColor.red: _CenterTriangleSide.left,
  LudoColor.green: _CenterTriangleSide.top,
  LudoColor.yellow: _CenterTriangleSide.right,
  LudoColor.blue: _CenterTriangleSide.bottom,
};

enum _CenterTriangleSide { left, top, right, bottom }

/// Builds [color]'s finish triangle within [centerRect] (the board's
/// center 3x3 square): a wedge spanning the full width of one side of the
/// square and tapering to the exact center point, per task 12d2's
/// acceptance criteria ("four solid triangles meeting at the exact center
/// point, each spanning its quadrant"). Exposed (not private to
/// [LudoBoardComponent._paintCenter]) so a geometry/placement test can
/// assert directly on each color's wedge without rendering a frame.
Path ludoCenterTrianglePath(LudoColor color, Rect centerRect) {
  final center = centerRect.center;
  final path = Path()..moveTo(center.dx, center.dy);
  switch (_centerTriangleSideByColor[color]!) {
    case _CenterTriangleSide.left:
      path
        ..lineTo(centerRect.left, centerRect.top)
        ..lineTo(centerRect.left, centerRect.bottom);
    case _CenterTriangleSide.top:
      path
        ..lineTo(centerRect.left, centerRect.top)
        ..lineTo(centerRect.right, centerRect.top);
    case _CenterTriangleSide.right:
      path
        ..lineTo(centerRect.right, centerRect.top)
        ..lineTo(centerRect.right, centerRect.bottom);
    case _CenterTriangleSide.bottom:
      path
        ..lineTo(centerRect.left, centerRect.bottom)
        ..lineTo(centerRect.right, centerRect.bottom);
  }
  path.close();
  return path;
}
