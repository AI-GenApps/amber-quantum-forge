/// The code-drawn Ludo background: a deep royal-blue fill, a faint
/// repeating dice-pip pattern, and a radial vignette (task 12b).
///
/// Renders behind every screen once wired in (tasks 12d/12e). Cheap by
/// construction: the pattern is a handful of `drawCircle` calls per tile
/// repeated across the canvas plus one radial-gradient rect fill for the
/// vignette — no per-frame allocation beyond the `Paint`s built in
/// [paint], and [shouldRepaint] returns `false` unless the painted size
/// actually changes, so a `CustomPaint` using this painter only repaints
/// once per build, never once per frame.
library;

import 'package:flutter/material.dart';

import 'ludo_theme_tokens.dart';

/// Paints the deep-blue background with a faint dice-pip tile pattern and
/// a radial vignette.
class LudoBackgroundPainter extends CustomPainter {
  const LudoBackgroundPainter({this.tileSize = 56});

  /// Size (px) of one repeating pattern tile.
  final double tileSize;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;

    // Base fill.
    canvas.drawRect(rect, Paint()..color = LudoThemeTokens.backgroundDeepBlue);

    _paintPattern(canvas, size);
    _paintVignette(canvas, rect);
  }

  void _paintPattern(Canvas canvas, Size size) {
    final dotPaint = Paint()
      ..color = LudoThemeTokens.backgroundMidBlue.withValues(alpha: 0.35);
    final pipRadius = tileSize * 0.045;

    // A single die face's 5-pip ("quincunx") layout, drawn faintly and
    // tiled across the canvas — procedural, not a bitmap.
    final cols = (size.width / tileSize).ceil() + 1;
    final rows = (size.height / tileSize).ceil() + 1;
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        final origin = Offset(col * tileSize, row * tileSize);
        final center = origin.translate(tileSize / 2, tileSize / 2);
        final offset = tileSize * 0.22;
        final pips = <Offset>[
          center,
          center.translate(-offset, -offset),
          center.translate(offset, -offset),
          center.translate(-offset, offset),
          center.translate(offset, offset),
        ];
        for (final pip in pips) {
          canvas.drawCircle(pip, pipRadius, dotPaint);
        }
      }
    }
  }

  void _paintVignette(Canvas canvas, Rect rect) {
    final center = rect.center;
    final radius = rect.longestSide * 0.75;
    final vignette = Paint()
      ..shader = RadialGradient(
        colors: [
          Colors.transparent,
          LudoThemeTokens.backgroundDeepBlue.withValues(alpha: 0.75),
        ],
        stops: const [0.55, 1.0],
      ).createShader(Rect.fromCircle(center: center, radius: radius));
    canvas.drawRect(rect, vignette);
  }

  @override
  bool shouldRepaint(covariant LudoBackgroundPainter oldDelegate) {
    return oldDelegate.tileSize != tileSize;
  }
}

/// Convenience widget wrapping [LudoBackgroundPainter] in a full-bleed
/// [CustomPaint] behind [child].
class LudoBackground extends StatelessWidget {
  const LudoBackground({super.key, this.child});

  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: const LudoBackgroundPainter(),
      size: Size.infinite,
      child: child,
    );
  }
}
