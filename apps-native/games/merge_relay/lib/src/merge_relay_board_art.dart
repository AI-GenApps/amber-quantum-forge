import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

final class MergeRelayBoardArt {
  const MergeRelayBoardArt._();

  static void paint(Canvas canvas, MergeBoard board, {required Size size}) {
    final bounds = Offset.zero & size;
    canvas.save();
    canvas.clipRect(bounds);
    final side = bounds.shortestSide;
    final boardRect = Rect.fromLTWH(0, 0, side, side);
    final paint = Paint()..style = PaintingStyle.fill;
    paint.color = const Color(0xff10243e);
    canvas.drawRRect(
      RRect.fromRectAndRadius(boardRect, const Radius.circular(28)),
      paint,
    );
    final padding = side * 0.045;
    final gap = side * 0.024;
    final cell = (side - (padding * 2) - (gap * 3)) / 4;
    for (var index = 0; index < board.cells.length; index += 1) {
      final row = index ~/ 4;
      final column = index % 4;
      final left = padding + column * (cell + gap);
      final top = padding + row * (cell + gap);
      final rect = Rect.fromLTWH(left, top, cell, cell);
      final value = board.cells[index];
      paint.color = value == 0 ? const Color(0xff203754) : _tileColor(value);
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(18)),
        paint,
      );
      if (value == 0) {
        paint
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2
          ..color = const Color(0xff35516f);
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            rect.deflate(cell * 0.16),
            const Radius.circular(12),
          ),
          paint,
        );
        paint.style = PaintingStyle.fill;
        continue;
      }
      paint.color = const Color(0x33ffffff);
      canvas.drawCircle(
        Offset(rect.left + cell * 0.78, rect.top + cell * 0.22),
        cell * 0.09,
        paint,
      );
      final text = TextPainter(
        text: TextSpan(
          text: '$value',
          style: TextStyle(
            color: const Color(0xfff8fbff),
            fontSize: cell * (value >= 100 ? 0.22 : 0.28),
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout(maxWidth: cell * 0.8);
      text.paint(
        canvas,
        Offset(
          rect.center.dx - text.width / 2,
          rect.center.dy - text.height / 2,
        ),
      );
    }
    canvas.restore();
  }

  static Color _tileColor(int value) {
    return switch (value) {
      2 => const Color(0xff3e75b6),
      4 => const Color(0xff4e93d3),
      8 => const Color(0xfff26f5b),
      16 => const Color(0xffe5534b),
      32 => const Color(0xffd44258),
      _ => const Color(0xffa33d73),
    };
  }
}
