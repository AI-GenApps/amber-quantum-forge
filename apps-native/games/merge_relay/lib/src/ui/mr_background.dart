import 'package:flutter/material.dart';

import '../merge_relay_theme.dart';
import 'mr_tokens.dart';

/// A warm, dotted paper-texture background with a soft vignette, painted
/// once per frame with a handful of primitive draw calls — cheap enough to
/// sit behind every screen (task 07). Composes the large open regions the
/// visual reference calls out ("generous whitespace that is composed, not
/// empty") instead of leaving a flat, unfilled band.
final class MrBackground extends StatelessWidget {
  const MrBackground({required this.theme, this.child, super.key});

  final MergeRelayTheme theme;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(color: theme.paper),
      child: CustomPaint(
        painter: _MrBackgroundPainter(theme: theme),
        child: child,
      ),
    );
  }
}

final class _MrBackgroundPainter extends CustomPainter {
  const _MrBackgroundPainter({required this.theme});

  final MergeRelayTheme theme;

  static const double _dotSpacing = 34;
  static const double _dotRadius = 2.4;

  @override
  void paint(Canvas canvas, Size size) {
    final dot = Paint()..color = theme.ink.withValues(alpha: 0.09);
    for (double y = _dotSpacing / 2; y < size.height; y += _dotSpacing) {
      for (double x = _dotSpacing / 2; x < size.width; x += _dotSpacing) {
        canvas.drawCircle(Offset(x, y), _dotRadius, dot);
      }
    }
    final vignette = Paint()
      ..shader = RadialGradient(
        center: Alignment.topCenter,
        radius: 1.15,
        colors: [
          MrTokens.paper.withValues(alpha: 0),
          theme.ink.withValues(alpha: 0.08),
        ],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, vignette);
  }

  @override
  bool shouldRepaint(_MrBackgroundPainter oldDelegate) =>
      oldDelegate.theme != theme;
}
