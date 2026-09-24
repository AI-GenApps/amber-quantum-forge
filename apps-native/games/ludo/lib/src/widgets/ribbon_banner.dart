/// An angled/pennant ribbon banner for callouts and result ranks
/// (task 12b).
library;

import 'package:flutter/material.dart';

import '../theme/ludo_theme_tokens.dart';

/// A gold ribbon banner with notched ends, used for callouts (e.g. "New!")
/// and result-screen rank labels (e.g. "1st Place").
class RibbonBanner extends StatelessWidget {
  const RibbonBanner({
    super.key,
    required this.label,
    this.color = LudoThemeTokens.gold,
    this.textColor = LudoThemeTokens.textOutline,
  });

  final String label;
  final Color color;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _RibbonPainter(color: color),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: LudoThemeTokens.spaceXl,
          vertical: LudoThemeTokens.spaceSm,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: LudoThemeTokens.fontDisplay,
            fontSize: 16,
            color: textColor,
          ),
        ),
      ),
    );
  }
}

class _RibbonPainter extends CustomPainter {
  const _RibbonPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final notch = size.height * 0.35;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width - notch, size.height / 2)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..lineTo(notch, size.height / 2)
      ..close();
    canvas.drawShadow(path, LudoThemeTokens.textOutline, 3, false);
    canvas.drawPath(path, Paint()..color = color);
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..color = LudoThemeTokens.goldDeep,
    );
  }

  @override
  bool shouldRepaint(covariant _RibbonPainter oldDelegate) =>
      oldDelegate.color != color;
}
