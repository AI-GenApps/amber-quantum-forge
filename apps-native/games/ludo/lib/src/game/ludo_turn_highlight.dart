/// Turn highlight: the active seat's yard region renders a distinct
/// border-glow treatment in that seat's color, so the current turn is
/// legible without reading the (later, task 09) player panel. Drawn
/// entirely with `Canvas`/`Paint` calls.
library;

import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

import 'ludo_board_geometry.dart';

/// Renders a glowing border around the active seat's yard region.
class LudoTurnHighlightComponent extends PositionComponent {
  LudoTurnHighlightComponent({required Vector2 boardSize})
    : super(size: boardSize, anchor: Anchor.topLeft);

  LudoColor? _activeColor;

  /// The color currently highlighted, or `null` when nothing is
  /// highlighted. Exposed for tests.
  LudoColor? get activeColor => _activeColor;

  /// Sets which color's yard should render the turn-highlight border.
  /// Pass `null` to clear it (e.g. between matches).
  void updateActiveColor(LudoColor? color) {
    _activeColor = color;
  }

  @override
  void render(Canvas canvas) {
    final color = _activeColor;
    if (color == null) return;

    final cellSize = size.x / ludoGridSize;
    final corner = ludoYardCorner[color]!;
    final yardRect = Rect.fromLTWH(
      corner.$2 * cellSize,
      corner.$1 * cellSize,
      cellSize * 6,
      cellSize * 6,
    );
    final glowRect = RRect.fromRectAndRadius(
      yardRect.deflate(cellSize * 0.08),
      Radius.circular(cellSize * 0.6),
    );

    // A soft outer glow behind a crisp, fully-opaque colored ring: the glow
    // alone (as used previously) blurs away too much of its own opacity to
    // stay legible against a pale yard fill, so the solid ring underneath
    // carries the actual signal.
    canvas.drawRRect(
      glowRect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = cellSize * 0.5
        ..color = ludoColorPalette[color]!.withValues(alpha: 0.55)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10),
    );
    canvas.drawRRect(
      glowRect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = cellSize * 0.22
        ..color = ludoColorPalette[color]!,
    );
    canvas.drawRRect(
      glowRect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = cellSize * 0.06
        ..color = Colors.white,
    );
  }
}
