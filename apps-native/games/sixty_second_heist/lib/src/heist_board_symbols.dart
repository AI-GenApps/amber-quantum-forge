import 'package:flutter/material.dart';
import 'package:heist_rules/heist_rules.dart';

import 'heist_typography.dart';

final class HeistBoardSymbols {
  const HeistBoardSymbols._();

  static void paintGoal(
    Canvas canvas,
    HeistPoint point,
    Rect board,
    double cell,
    Paint paint,
    Color color,
    String label,
  ) {
    final center = centerFor(board, cell, point);
    paint.color = color;
    final diamond = Path()
      ..moveTo(center.dx, center.dy - cell * 0.2)
      ..lineTo(center.dx + cell * 0.2, center.dy)
      ..lineTo(center.dx, center.dy + cell * 0.2)
      ..lineTo(center.dx - cell * 0.2, center.dy)
      ..close();
    canvas.drawPath(diamond, paint);
    drawLabel(
      canvas,
      label,
      center.translate(0, cell * 0.29),
      cell * 0.13,
      fontFamily: HeistTypography.displayFamily,
    );
  }

  static void paintPlayer(
    Canvas canvas,
    HeistPoint point,
    Rect board,
    double cell,
    Paint paint,
  ) {
    final center = centerFor(board, cell, point);
    paint.color = const Color(0xff9be3d5);
    canvas.drawCircle(center, cell * 0.21, paint);
    paint.color = const Color(0xff0d2238);
    canvas.drawCircle(center, cell * 0.08, paint);
  }

  static Offset centerFor(Rect board, double cell, HeistPoint point) {
    return Offset(
      board.left + point.x * cell + cell / 2,
      board.top + point.y * cell + cell / 2,
    );
  }

  static void drawNumber(
    Canvas canvas,
    String value,
    Offset center,
    double size,
  ) {
    drawLabel(
      canvas,
      value,
      center.translate(0, -size * 0.2),
      size * 0.9,
      color: const Color(0xff0d2238),
      fontFamily: HeistTypography.bodyFamily,
    );
  }

  static void drawLabel(
    Canvas canvas,
    String value,
    Offset center,
    double size, {
    Color color = const Color(0xffd8f2ed),
    String fontFamily = HeistTypography.displayFamily,
  }) {
    final text = TextPainter(
      text: TextSpan(
        text: value,
        style: TextStyle(
          color: color,
          fontSize: size,
          fontWeight: FontWeight.w900,
          fontFamily: fontFamily,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    text.paint(
      canvas,
      Offset(center.dx - text.width / 2, center.dy - text.height / 2),
    );
  }
}
