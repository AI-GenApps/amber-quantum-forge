/// Glossy, code-drawn Ludo token: a filled circle with a radial gradient, a
/// drop shadow and a glossy highlight, plus hop-by-hop move animation.
///
/// No bitmap asset is used or referenced anywhere in this file — every
/// pixel is drawn with `Canvas`/`Paint` calls, per task 04's Context/
/// Decisions. [LudoTokenPainter.paint] is the single place that draws a
/// token's art, shared by [LudoTokenComponent.render] and the manifest
/// slots in `ludo_art_manifest.dart` so both draw identical art.
library;

import 'dart:async';

import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

import '../state/reduced_motion_setting.dart';
import 'ludo_board_geometry.dart';

/// Fraction of a board cell a token's circle occupies, leaving a small gap
/// so adjacent tokens and the cell grid stay visible.
const ludoTokenCellFraction = 0.78;

/// Duration of a single-cell hop.
const ludoTokenHopDuration = Duration(milliseconds: 120);

/// How far a token's y-position bulges upward mid-hop, as a fraction of the
/// cell size.
const ludoTokenHopArcHeight = 0.35;

/// Draws one Ludo token's art into [rect] on [canvas].
///
/// Concrete requirements (checked by golden test, not opinion — see task
/// 04's acceptance criteria): (1) a radial gradient from a lighter
/// highlight at the top-left to the base color, (2) a drop shadow offset
/// down-right, and (3) a small glossy ellipse highlight near the top. A
/// flat single-color circle with none of these fails the golden.
abstract final class LudoTokenPainter {
  static void paint(Canvas canvas, Rect rect, Color baseColor) {
    final center = rect.center;
    final radius = rect.shortestSide / 2;

    final shadowCenter = center.translate(radius * 0.18, radius * 0.22);
    canvas.drawCircle(
      shadowCenter,
      radius * 0.96,
      Paint()
        ..color = const Color(0x66000000)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
    );

    final fillRect = Rect.fromCircle(center: center, radius: radius);
    final fillPaint = Paint()
      ..shader = RadialGradient(
        center: const Alignment(-0.35, -0.35),
        radius: 0.85,
        colors: [_lighten(baseColor, 0.5), baseColor, _darken(baseColor, 0.2)],
        stops: const [0.0, 0.55, 1.0],
      ).createShader(fillRect);
    canvas.drawCircle(center, radius, fillPaint);

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = radius * 0.06
        ..color = _darken(baseColor, 0.35),
    );

    final highlightRect = Rect.fromCenter(
      center: center.translate(-radius * 0.22, -radius * 0.45),
      width: radius * 0.9,
      height: radius * 0.5,
    );
    canvas.drawOval(highlightRect, Paint()..color = const Color(0x99FFFFFF));
  }

  static Color _lighten(Color color, double amount) {
    final hsl = HSLColor.fromColor(color);
    return hsl
        .withLightness((hsl.lightness + amount).clamp(0.0, 1.0))
        .toColor();
  }

  static Color _darken(Color color, double amount) {
    final hsl = HSLColor.fromColor(color);
    return hsl
        .withLightness((hsl.lightness - amount).clamp(0.0, 1.0))
        .toColor();
  }
}

/// A single Ludo token on the board, driven by grid cells rather than raw
/// pixels: callers move it with [hopTo], never by setting [position]
/// directly.
class LudoTokenComponent extends PositionComponent {
  LudoTokenComponent({
    required LudoColor color,
    required int tokenId,
    required Vector2 boardSize,
    required (int, int) initialCell,
    ReducedMotionSetting? reducedMotion,
  }) : this._(
         color: color,
         tokenId: tokenId,
         boardSize: boardSize,
         initialCell: initialCell,
         reducedMotion: reducedMotion ?? ReducedMotionSetting(),
       );

  LudoTokenComponent._({
    required this.color,
    required this.tokenId,
    required Vector2 boardSize,
    required (int, int) initialCell,
    required this.reducedMotion,
  }) : _boardSize = boardSize,
       _cell = initialCell,
       super(anchor: Anchor.center) {
    _layoutForBoardSize();
    position = _centerOf(_cell);
  }

  /// The color this token belongs to (used both for its paint color and
  /// for `ludo_rules` geometry lookups).
  final LudoColor color;

  /// This token's index within its owning player (`0..tokensPerPlayer-1`).
  final int tokenId;

  /// Consulted by [hopTo]: when `true`, moves jump straight to the final
  /// cell instead of animating.
  final ReducedMotionSetting reducedMotion;

  Vector2 _boardSize;
  (int, int) _cell;
  final List<(int, int)> _pendingHops = [];
  double _hopProgress = 0;
  Completer<void>? _moveCompleter;

  /// The grid cell this token currently occupies, or is animating away
  /// from mid-hop.
  (int, int) get currentCell => _cell;

  /// Whether a hop animation is in progress.
  bool get isAnimating => _pendingHops.isNotEmpty;

  double get _cellSize => _boardSize.x / ludoGridSize;

  Rect get _boardRect => Rect.fromLTWH(0, 0, _boardSize.x, _boardSize.y);

  Vector2 _centerOf((int, int) cell) {
    final offset = ludoCellCenterAt(cell, _boardRect);
    return Vector2(offset.dx, offset.dy);
  }

  void _layoutForBoardSize() {
    size = Vector2.all(_cellSize * ludoTokenCellFraction);
  }

  /// Called whenever the board is resized/laid out, so this token's pixel
  /// size and position stay in sync with the new board pixel size.
  void updateBoardSize(Vector2 boardSize) {
    _boardSize = boardSize;
    _layoutForBoardSize();
    if (!isAnimating) {
      position = _centerOf(_cell);
    }
  }

  /// Jumps instantly to [cell], cancelling any in-flight hop animation.
  void snapTo((int, int) cell) {
    _cell = cell;
    _pendingHops.clear();
    _hopProgress = 0;
    position = _centerOf(cell);
    _moveCompleter?.complete();
    _moveCompleter = null;
  }

  /// Animates a hop-by-hop move through [path] (each entry one cell
  /// further along the route), landing on the last cell. Each hop takes
  /// [ludoTokenHopDuration] with an `easeOut` curve and a small vertical
  /// arc. When [ReducedMotionSetting.value] is `true`, jumps straight to
  /// the final cell with no intermediate animation frames.
  Future<void> hopTo(List<(int, int)> path) {
    if (path.isEmpty) return Future.value();
    if (reducedMotion.value) {
      snapTo(path.last);
      return Future.value();
    }
    _pendingHops
      ..clear()
      ..addAll(path);
    _hopProgress = 0;
    final completer = Completer<void>();
    _moveCompleter = completer;
    return completer.future;
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (_pendingHops.isEmpty) return;

    final hopSeconds = ludoTokenHopDuration.inMilliseconds / 1000;
    _hopProgress += dt / hopSeconds;
    final rawT = _hopProgress.clamp(0.0, 1.0);
    final easedT = Curves.easeOut.transform(rawT);

    final from = _centerOf(_cell);
    final to = _centerOf(_pendingHops.first);
    final arcBulge = 4 * rawT * (1 - rawT) * ludoTokenHopArcHeight * _cellSize;
    position = Vector2(
      from.x + (to.x - from.x) * easedT,
      from.y + (to.y - from.y) * easedT - arcBulge,
    );

    if (_hopProgress >= 1.0) {
      _cell = _pendingHops.removeAt(0);
      _hopProgress = 0;
      position = _centerOf(_cell);
      if (_pendingHops.isEmpty) {
        final completer = _moveCompleter;
        _moveCompleter = null;
        completer?.complete();
      }
    }
  }

  @override
  void render(Canvas canvas) {
    LudoTokenPainter.paint(
      canvas,
      Rect.fromLTWH(0, 0, size.x, size.y),
      ludoColorPalette[color]!,
    );
  }
}
