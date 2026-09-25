import 'package:flutter/material.dart';

/// Paints the board's soft cream tray: a rounded panel with a faint inner
/// shadow along its top edge (so it reads as a shallow recessed tray rather
/// than a flat rectangle), replacing the old dark-navy board background.
void paintBoardTray(Canvas canvas, Rect rect, {required Color trayColor}) {
  final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(28));
  canvas.drawRRect(
    rrect,
    Paint()
      ..style = PaintingStyle.fill
      ..color = trayColor,
  );
  canvas.save();
  canvas.clipRRect(rrect);
  canvas.drawRRect(
    RRect.fromRectAndRadius(
      rect.shift(Offset(0, -rect.height * 0.02)),
      const Radius.circular(28),
    ),
    Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = rect.shortestSide * 0.05
      ..color = Colors.black.withValues(alpha: 0.05)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10),
  );
  canvas.restore();
}

/// Paints one empty well: a pale, slightly darker-than-tray slot with a
/// soft inset shadow along its top-left and a faint highlight along its
/// bottom-right, so it reads as a shallow carved slot rather than a flat or
/// dark hole. [highContrast] firms up the rim so the slot boundary never
/// depends on colour alone.
void paintWell(
  Canvas canvas,
  Rect rect, {
  required Color wellColor,
  required double radius,
  bool highContrast = false,
}) {
  final rrect = RRect.fromRectAndRadius(rect, Radius.circular(radius));
  canvas.drawRRect(
    rrect,
    Paint()
      ..style = PaintingStyle.fill
      ..color = wellColor,
  );
  canvas.save();
  canvas.clipRRect(rrect);
  canvas.drawRRect(
    RRect.fromRectAndRadius(
      rect.shift(Offset(-rect.width * 0.06, -rect.height * 0.06)),
      Radius.circular(radius),
    ),
    Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = rect.shortestSide * 0.18
      ..color = Colors.black.withValues(alpha: highContrast ? 0.16 : 0.08)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6),
  );
  canvas.restore();
  canvas.drawRRect(
    rrect,
    Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = highContrast ? 2 : 1.4
      ..color = Colors.black.withValues(alpha: highContrast ? 0.5 : 0.12),
  );
}
