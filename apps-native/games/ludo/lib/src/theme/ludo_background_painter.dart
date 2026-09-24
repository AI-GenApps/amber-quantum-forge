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

import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'ludo_theme_tokens.dart';

/// The pattern's tilt, matching the reference's large tilted repeating
/// dice/board motif rather than an axis-aligned grid (task 12d2).
const _patternTiltRadians = -10 * math.pi / 180;

/// Paints the deep-blue background with a large, tilted, repeating
/// dice-face tile pattern and a radial vignette.
class LudoBackgroundPainter extends CustomPainter {
  const LudoBackgroundPainter({this.tileSize = 84});

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

  /// Task 12d2: previously a flat navy fill with a barely-visible pip tile
  /// (alpha 0.35, no outline, no tilt) — the user feedback called this out
  /// as "flat navy" even though the pattern existed in code. This tiles a
  /// bolder, outlined die-face motif (a rounded square "die" outline plus
  /// its pips), rotated as one block so it reads as a large tilted
  /// repeating dice/board pattern, matching
  /// `.agents/resources/2026-09-19/ludo-reference/16-roll-settled.png`'s
  /// background.
  void _paintPattern(Canvas canvas, Size size) {
    final dotPaint = Paint()
      ..color = LudoThemeTokens.backgroundMidBlue.withValues(alpha: 0.55);
    final outlinePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = tileSize * 0.05
      ..color = LudoThemeTokens.backgroundMidBlue.withValues(alpha: 0.45);
    final pipRadius = tileSize * 0.06;
    final tileInset = tileSize * 0.14;

    canvas.save();
    final center = Offset(size.width / 2, size.height / 2);
    canvas.translate(center.dx, center.dy);
    canvas.rotate(_patternTiltRadians);
    canvas.translate(-center.dx, -center.dy);

    // Tile a generously oversized square (rather than just `size`) before
    // rotating, so no corner of the rotated canvas is left unpatterned.
    final span = size.longestSide * 1.6;
    final origin = Offset(center.dx - span / 2, center.dy - span / 2);
    final cols = (span / tileSize).ceil() + 1;
    final rows = (span / tileSize).ceil() + 1;
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        final tileOrigin = origin.translate(col * tileSize, row * tileSize);
        final tileRect = Rect.fromLTWH(
          tileOrigin.dx,
          tileOrigin.dy,
          tileSize,
          tileSize,
        ).deflate(tileInset);
        canvas.drawRRect(
          RRect.fromRectAndRadius(tileRect, Radius.circular(tileSize * 0.12)),
          outlinePaint,
        );

        final tileCenter = tileRect.center;
        final offset = tileSize * 0.18;
        final pips = <Offset>[
          tileCenter,
          tileCenter.translate(-offset, -offset),
          tileCenter.translate(offset, -offset),
          tileCenter.translate(-offset, offset),
          tileCenter.translate(offset, offset),
        ];
        for (final pip in pips) {
          canvas.drawCircle(pip, pipRadius, dotPaint);
        }
      }
    }
    canvas.restore();
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
