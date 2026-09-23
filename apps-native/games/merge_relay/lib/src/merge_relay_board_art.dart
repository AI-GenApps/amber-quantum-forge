import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_theme.dart';

final class MergeRelayBoardArt {
  const MergeRelayBoardArt._();

  static void paint(
    Canvas canvas,
    MergeBoard board, {
    required Size size,
    MergeRelayTheme theme = signalRelayTheme,
    Set<int> changedCells = const {},
    Set<int> mergedCells = const {},
    int? spawnedCell,
    double pulse = 0,
  }) {
    final bounds = Offset.zero & size;
    canvas.save();
    canvas.clipRect(bounds);
    final side = bounds.shortestSide;
    final boardRect = Rect.fromLTWH(0, 0, side, side);
    final paint = Paint()..style = PaintingStyle.fill;
    paint.color = theme.board;
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
      paint.color = value == 0 ? theme.slot : _tileColor(theme, value);
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(18)),
        paint,
      );
      if (value == 0) {
        paint
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2
          ..color = theme.blue.withValues(alpha: 0.45);
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
      if (changedCells.contains(index)) {
        paint
          ..style = PaintingStyle.stroke
          ..strokeWidth = cell * (0.018 + pulse * 0.012)
          ..color = mergedCells.contains(index) ? theme.coral : theme.sky;
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            rect.deflate(cell * 0.03),
            const Radius.circular(16),
          ),
          paint,
        );
        paint.style = PaintingStyle.fill;
      }
      if (spawnedCell == index) {
        paint
          ..style = PaintingStyle.stroke
          ..strokeWidth = cell * (0.014 + pulse * 0.02)
          ..color = theme.paper.withValues(alpha: 0.65);
        canvas.drawCircle(rect.center, cell * (0.3 + pulse * 0.06), paint);
        paint.style = PaintingStyle.fill;
      }
      paint.color = theme.paper.withValues(alpha: 0.2);
      canvas.drawCircle(
        Offset(rect.left + cell * 0.78, rect.top + cell * 0.22),
        cell * 0.09,
        paint,
      );
      final text = TextPainter(
        text: TextSpan(
          text: '$value',
          style: TextStyle(
            color: theme.paper,
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

  static Color _tileColor(MergeRelayTheme theme, int value) {
    return switch (value) {
      2 => theme.blue,
      4 => theme.sky,
      8 => theme.coral,
      16 => theme.warm,
      32 => Color.alphaBlend(theme.coral, theme.board),
      _ => Color.alphaBlend(theme.warm, theme.board),
    };
  }
}
