import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'mr_tile_expression.dart';

/// Draws one tile's original face into [faceBox] — simple vector eyes and a
/// mouth, plus optional blush/sparkle accents for the higher, more delighted
/// tiers. [faceBox] must sit entirely above the tile's numeral (the caller
/// is responsible for that split); this painter never draws outside it.
void paintTileFace(
  Canvas canvas,
  Rect faceBox, {
  required MrTileExpression expression,
  required Color color,
  bool highContrast = false,
}) {
  final eyeY = faceBox.top + faceBox.height * 0.42;
  final eyeDx = faceBox.width * 0.24;
  final leftEye = Offset(faceBox.center.dx - eyeDx, eyeY);
  final rightEye = Offset(faceBox.center.dx + eyeDx, eyeY);
  final eyeRadius = faceBox.height * (highContrast ? 0.20 : 0.17);

  final linePaint = Paint()
    ..style = PaintingStyle.stroke
    ..strokeCap = StrokeCap.round
    ..strokeWidth = faceBox.height * (highContrast ? 0.10 : 0.07)
    ..color = color;
  final fillPaint = Paint()
    ..style = PaintingStyle.fill
    ..color = color;

  _paintEye(canvas, leftEye, eyeRadius, expression.eyes, linePaint, fillPaint);
  _paintEye(canvas, rightEye, eyeRadius, expression.eyes, linePaint, fillPaint);

  final mouthCenter = Offset(
    faceBox.center.dx,
    faceBox.top + faceBox.height * 0.78,
  );
  final mouthWidth = faceBox.width * 0.4;
  _paintMouth(
    canvas,
    mouthCenter,
    mouthWidth,
    faceBox.height,
    expression.mouth,
    linePaint,
    fillPaint,
  );

  if (expression.blush) {
    final blushPaint = Paint()
      ..style = PaintingStyle.fill
      ..color = color.withValues(alpha: highContrast ? 0.32 : 0.18);
    final blushRadius = faceBox.height * 0.1;
    final blushY = faceBox.top + faceBox.height * 0.62;
    canvas.drawCircle(
      Offset(faceBox.left + faceBox.width * 0.1, blushY),
      blushRadius,
      blushPaint,
    );
    canvas.drawCircle(
      Offset(faceBox.right - faceBox.width * 0.1, blushY),
      blushRadius,
      blushPaint,
    );
  }

  if (expression.sparkle) {
    _paintSparkle(
      canvas,
      Offset(faceBox.right - faceBox.width * 0.06, faceBox.top),
      faceBox.height * 0.14,
      fillPaint,
    );
  }
}

void _paintEye(
  Canvas canvas,
  Offset center,
  double radius,
  MrEyeStyle style,
  Paint linePaint,
  Paint fillPaint,
) {
  switch (style) {
    case MrEyeStyle.sleepy:
      final rect = Rect.fromCenter(
        center: center,
        width: radius * 2,
        height: radius * 1.2,
      );
      canvas.drawArc(rect, 0.15 * math.pi, 0.7 * math.pi, false, linePaint);
    case MrEyeStyle.oval:
      canvas.drawOval(
        Rect.fromCenter(
          center: center,
          width: radius * 1.3,
          height: radius * 2,
        ),
        fillPaint,
      );
    case MrEyeStyle.round:
      canvas.drawCircle(center, radius, fillPaint);
      _paintHighlight(canvas, center, radius);
    case MrEyeStyle.wide:
      canvas.drawCircle(center, radius * 1.2, fillPaint);
      _paintHighlight(canvas, center, radius * 1.2);
    case MrEyeStyle.crescentUp:
      final rect = Rect.fromCenter(
        center: center.translate(0, radius * 0.4),
        width: radius * 2.1,
        height: radius * 1.6,
      );
      canvas.drawArc(rect, math.pi * 1.15, math.pi * 0.7, false, linePaint);
    case MrEyeStyle.star:
      _paintSparkle(
        canvas,
        center,
        radius * 1.1,
        Paint()
          ..style = PaintingStyle.fill
          ..color = linePaint.color,
      );
  }
}

void _paintHighlight(Canvas canvas, Offset center, double radius) {
  final highlight = Paint()
    ..style = PaintingStyle.fill
    ..color = Colors.white.withValues(alpha: 0.85);
  canvas.drawCircle(
    center.translate(-radius * 0.32, -radius * 0.32),
    radius * 0.28,
    highlight,
  );
}

void _paintMouth(
  Canvas canvas,
  Offset center,
  double width,
  double faceHeight,
  MrMouthStyle style,
  Paint linePaint,
  Paint fillPaint,
) {
  switch (style) {
    case MrMouthStyle.line:
      canvas.drawLine(
        center.translate(-width * 0.4, 0),
        center.translate(width * 0.4, 0),
        linePaint,
      );
    case MrMouthStyle.smallSmile:
      final rect = Rect.fromCenter(
        center: center.translate(0, -faceHeight * 0.05),
        width: width * 0.75,
        height: faceHeight * 0.22,
      );
      canvas.drawArc(rect, 0.12 * math.pi, 0.76 * math.pi, false, linePaint);
    case MrMouthStyle.smile:
      final rect = Rect.fromCenter(
        center: center.translate(0, -faceHeight * 0.06),
        width: width,
        height: faceHeight * 0.3,
      );
      canvas.drawArc(rect, 0.08 * math.pi, 0.84 * math.pi, false, linePaint);
    case MrMouthStyle.openSmile:
      final rect = Rect.fromCenter(
        center: center,
        width: width,
        height: faceHeight * 0.34,
      );
      canvas.drawArc(rect, 0, math.pi, true, fillPaint);
    case MrMouthStyle.wideOpen:
      canvas.drawOval(
        Rect.fromCenter(
          center: center,
          width: width * 1.1,
          height: faceHeight * 0.4,
        ),
        fillPaint,
      );
    case MrMouthStyle.roundedO:
      canvas.drawCircle(center, width * 0.3, fillPaint);
  }
}

void _paintSparkle(Canvas canvas, Offset center, double radius, Paint paint) {
  final path = Path()
    ..moveTo(center.dx, center.dy - radius)
    ..quadraticBezierTo(center.dx, center.dy, center.dx + radius, center.dy)
    ..quadraticBezierTo(center.dx, center.dy, center.dx, center.dy + radius)
    ..quadraticBezierTo(center.dx, center.dy, center.dx - radius, center.dy)
    ..quadraticBezierTo(center.dx, center.dy, center.dx, center.dy - radius)
    ..close();
  canvas.drawPath(path, paint);
}
