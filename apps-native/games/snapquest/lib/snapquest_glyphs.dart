import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Peeklings' desk/target symbols (●, ◇, ✦) are drawn as vector shapes
/// instead of rendered as `Text` glyphs (task 04): neither Baloo 2 nor
/// Andika — the app's two bundled fonts — contain the Unicode
/// Miscellaneous Symbols codepoints U+25CF (●), U+25C7 (◇), or U+2726 (✦)
/// (verified against each font's `cmap` table with `fontTools`). Rendering
/// them as `Text` would silently fall back to the platform default font,
/// which the custom-fonts requirement forbids. `SnapGlyph` paints the same
/// three shapes directly with `CustomPaint` so no font lookup is involved.
enum SnapGlyphShape { filledCircle, hollowDiamond, sparkle }

/// Maps a desk-object/target symbol character to the shape that replaces
/// it. Keying off the character (rather than plumbing a separate shape
/// enum through `SnapDeskObject`) keeps this a pure rendering swap with no
/// change to game data, save format, or copy.
SnapGlyphShape snapGlyphShapeFor(String symbol) => switch (symbol) {
  '●' => SnapGlyphShape.filledCircle,
  '◇' => SnapGlyphShape.hollowDiamond,
  _ => SnapGlyphShape.sparkle,
};

String snapGlyphSemanticLabel(String symbol) => switch (symbol) {
  '●' => 'circle',
  '◇' => 'diamond',
  _ => 'star',
};

/// Drop-in replacement for `Text(symbol, style: TextStyle(color: ...,
/// fontSize: ...))` wherever a desk-object or target symbol was rendered.
class SnapGlyph extends StatelessWidget {
  const SnapGlyph({
    required this.symbol,
    required this.color,
    required this.size,
    super.key,
  });

  final String symbol;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: snapGlyphSemanticLabel(symbol),
      child: SizedBox(
        width: size,
        height: size,
        child: CustomPaint(
          painter: _SnapGlyphPainter(
            shape: snapGlyphShapeFor(symbol),
            color: color,
          ),
        ),
      ),
    );
  }
}

class _SnapGlyphPainter extends CustomPainter {
  const _SnapGlyphPainter({required this.shape, required this.color});

  final SnapGlyphShape shape;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.shortestSide / 2;
    switch (shape) {
      case SnapGlyphShape.filledCircle:
        canvas.drawCircle(center, radius, Paint()..color = color);
      case SnapGlyphShape.hollowDiamond:
        final path = Path()
          ..moveTo(center.dx, center.dy - radius)
          ..lineTo(center.dx + radius, center.dy)
          ..lineTo(center.dx, center.dy + radius)
          ..lineTo(center.dx - radius, center.dy)
          ..close();
        canvas.drawPath(
          path,
          Paint()
            ..color = color
            ..style = PaintingStyle.stroke
            ..strokeWidth = radius * 0.28,
        );
      case SnapGlyphShape.sparkle:
        canvas.drawPath(_sparklePath(center, radius), Paint()..color = color);
    }
  }

  /// A 4-point sparkle (✦-like) silhouette: alternating outer/inner
  /// vertices every 45 degrees, starting straight up.
  Path _sparklePath(Offset center, double outerRadius) {
    final innerRadius = outerRadius * 0.35;
    final path = Path();
    for (var i = 0; i < 8; i++) {
      final angle = i * math.pi / 4 - math.pi / 2;
      final r = i.isEven ? outerRadius : innerRadius;
      final point = center + Offset(r * math.cos(angle), r * math.sin(angle));
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
  bool shouldRepaint(covariant _SnapGlyphPainter oldDelegate) =>
      oldDelegate.shape != shape || oldDelegate.color != color;
}
