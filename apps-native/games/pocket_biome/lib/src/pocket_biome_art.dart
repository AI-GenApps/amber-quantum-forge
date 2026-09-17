import 'package:biome_rules/biome_rules.dart';
import 'package:flutter/material.dart';

final class PocketBiomeArt {
  const PocketBiomeArt._();

  static void paint(
    Canvas canvas, {
    required Size size,
    required BiomeState state,
    required DateTime now,
    required int? selectedSlot,
    required Map<String, SpeciesDefinition> species,
  }) {
    final bounds = Offset.zero & size;
    canvas.save();
    canvas.clipRect(bounds);
    final paint = Paint()..style = PaintingStyle.fill;
    paint.color = const Color(0xffd6e3d2);
    canvas.drawRRect(
      RRect.fromRectAndRadius(bounds, const Radius.circular(28)),
      paint,
    );
    paint.color = const Color(0xffb2c9aa);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          12,
          bounds.height * 0.58,
          bounds.width - 24,
          bounds.height * 0.34,
        ),
        const Radius.circular(26),
      ),
      paint,
    );
    final gap = bounds.width * 0.035;
    final cellWidth = (bounds.width - 48 - gap * 2) / 3;
    final cellHeight = (bounds.height * 0.72 - gap) / 2;
    for (var index = 0; index < state.slots.length; index += 1) {
      final row = index ~/ 3;
      final column = index % 3;
      final rect = Rect.fromLTWH(
        16 + column * (cellWidth + gap),
        18 + row * (cellHeight + gap),
        cellWidth,
        cellHeight,
      );
      _paintPot(
        canvas,
        rect,
        state.slots[index],
        now,
        species,
        selectedSlot == index,
      );
    }
    _paintGlass(canvas, bounds);
    canvas.restore();
  }

  static void _paintPot(
    Canvas canvas,
    Rect rect,
    BiomeSlot? slot,
    DateTime now,
    Map<String, SpeciesDefinition> species,
    bool selected,
  ) {
    final paint = Paint()..style = PaintingStyle.fill;
    paint.color = slot == null
        ? const Color(0xffeef0dd)
        : const Color(0xfff5e1b3);
    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, const Radius.circular(20)),
      paint,
    );
    paint
      ..style = PaintingStyle.stroke
      ..strokeWidth = selected ? 4 : 1.5
      ..color = selected ? const Color(0xffdf8054) : const Color(0x558a9c7c);
    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, const Radius.circular(20)),
      paint,
    );
    paint.style = PaintingStyle.fill;
    if (slot == null) {
      paint.color = const Color(0xffb7c8b1);
      canvas.drawCircle(rect.center, rect.shortestSide * 0.12, paint);
      paint.color = const Color(0xff8ca883);
      canvas.drawOval(
        Rect.fromCenter(
          center: rect.center.translate(-rect.shortestSide * 0.1, 0),
          width: rect.shortestSide * 0.2,
          height: rect.shortestSide * 0.1,
        ),
        paint,
      );
      return;
    }
    final progress = _progress(slot, now);
    final center = rect.center.translate(0, -rect.height * 0.02);
    final color = _speciesColor(slot.speciesId);
    paint.color = const Color(0xffbe855e);
    canvas.drawOval(
      Rect.fromCenter(
        center: center.translate(0, rect.height * 0.2),
        width: rect.width * 0.52,
        height: rect.height * 0.18,
      ),
      paint,
    );
    paint.color = color;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: center.translate(0, rect.height * 0.16),
          width: rect.width * 0.43,
          height: rect.height * 0.24,
        ),
        const Radius.circular(16),
      ),
      paint,
    );
    paint
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round
      ..color = color;
    canvas.drawLine(
      center.translate(0, rect.height * 0.13),
      center.translate(0, -rect.height * 0.23),
      paint,
    );
    paint.style = PaintingStyle.fill;
    canvas.drawOval(
      Rect.fromCenter(
        center: center.translate(-rect.width * 0.12, -rect.height * 0.1),
        width: rect.width * 0.24,
        height: rect.height * 0.13,
      ),
      paint,
    );
    canvas.drawOval(
      Rect.fromCenter(
        center: center.translate(rect.width * 0.12, -rect.height * 0.18),
        width: rect.width * 0.24,
        height: rect.height * 0.13,
      ),
      paint,
    );
    paint
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..color = const Color(0x55ffffff);
    canvas.drawArc(
      Rect.fromCenter(
        center: center,
        width: rect.width * 0.72,
        height: rect.width * 0.72,
      ),
      -1.57,
      progress * 6.28,
      false,
      paint,
    );
    paint.style = PaintingStyle.fill;
    final name = species[slot.speciesId]?.name ?? slot.speciesId;
    final text = TextPainter(
      text: TextSpan(
        text: name,
        style: const TextStyle(
          color: Color(0xff355347),
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: rect.width - 12);
    text.paint(
      canvas,
      Offset(rect.center.dx - text.width / 2, rect.bottom - text.height - 9),
    );
  }

  static double _progress(BiomeSlot slot, DateTime now) {
    final total = slot.readyAt.difference(slot.plantedAt).inMilliseconds;
    if (total <= 0) return 1;
    final elapsed = now.difference(slot.plantedAt).inMilliseconds;
    return (elapsed / total).clamp(0, 1).toDouble();
  }

  static Color _speciesColor(String id) {
    return switch (id) {
      'moss' => const Color(0xff4f8d64),
      'sunbud' => const Color(0xffe3a33d),
      'tidebell' => const Color(0xff4f8fb1),
      'emberfern' => const Color(0xffd76d4f),
      'dewcap' => const Color(0xff4eaaa2),
      _ => const Color(0xff8a70ae),
    };
  }

  static void _paintGlass(Canvas canvas, Rect bounds) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = const Color(0x7797b89a);
    canvas.drawRRect(
      RRect.fromRectAndRadius(bounds.deflate(7), const Radius.circular(24)),
      paint,
    );
    paint
      ..strokeWidth = 3
      ..color = const Color(0x55ffffff);
    canvas.drawLine(
      Offset(bounds.width * 0.16, bounds.height * 0.1),
      Offset(bounds.width * 0.34, bounds.height * 0.1),
      paint,
    );
  }
}
