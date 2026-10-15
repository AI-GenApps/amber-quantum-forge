/// Code-drawn art for the store's dice/token/board theme items (task 26g).
///
/// Task 26f (the economy art session) is skipped, so no bitmap exists for
/// any theme item. Every item therefore renders through
/// [LudoStoreThemeArt], which resolves the manifest slot
/// `store_<itemId>` (`assets/art/store_<itemId>.png`) first and falls back
/// to the painters below — dropping a bitmap into `assets/art/` later
/// upgrades an item with no code change. Slots currently awaiting 26f art:
/// every `store_<itemId>` listed in [ludoStoreThemeSlots].
library;

import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../assets/ludo_art_manifest.dart';
import '../game/ludo_dice_component.dart' show LudoDicePainter;
import '../game/ludo_token_component.dart' show LudoTokenPainter;
import '../state/ludo_equip_store.dart' show LudoThemeCategory;
import '../theme/ludo_theme_tokens.dart';

/// The manifest slot name for a theme item's bitmap override.
String ludoStoreArtSlot(String itemId) => 'store_$itemId';

/// Every theme item id this file can draw with a distinct style, i.e. every
/// slot that awaits real 26f art.
const ludoStoreThemeSlots = <String>[
  'dice_classic_wood',
  'dice_neon_vortex',
  'dice_marble',
  'dice_galaxy',
  'dice_gold',
  'token_gem',
  'token_robot',
  'token_animal',
  'board_cosmic',
  'board_royal',
];

const _tokenColors = [
  LudoThemeTokens.seatRed,
  LudoThemeTokens.seatGreen,
  LudoThemeTokens.seatYellow,
  LudoThemeTokens.seatBlue,
];

class _DiceStyle {
  const _DiceStyle(this.top, this.bottom, this.pip, this.border);

  final Color top;
  final Color bottom;
  final Color pip;
  final Color border;
}

const _diceStyles = <String, _DiceStyle>{
  'dice_classic_wood': _DiceStyle(
    Color(0xFFD59A5B),
    Color(0xFF8B5A2B),
    Color(0xFF2B1B0E),
    Color(0xFF5A3714),
  ),
  'dice_neon_vortex': _DiceStyle(
    Color(0xFF2A1160),
    Color(0xFF0B1E4A),
    Color(0xFF18F0FF),
    Color(0xFFFF2BD6),
  ),
  'dice_marble': _DiceStyle(
    Color(0xFFF4F4F8),
    Color(0xFFB4B8C6),
    Color(0xFF2E3140),
    Color(0xFF8A8FA3),
  ),
  'dice_galaxy': _DiceStyle(
    Color(0xFF3B1A8C),
    Color(0xFF0B0830),
    Color(0xFFFFE9A8),
    Color(0xFF8E6BFF),
  ),
  'dice_gold': _DiceStyle(
    Color(0xFFFFE08A),
    Color(0xFFC9860B),
    Color(0xFF5A3A00),
    Color(0xFF8A5A00),
  ),
};

const _pipLayouts = <int, List<Offset>>{
  1: [Offset(0.5, 0.5)],
  2: [Offset(0.25, 0.25), Offset(0.75, 0.75)],
  3: [Offset(0.25, 0.25), Offset(0.5, 0.5), Offset(0.75, 0.75)],
  4: [
    Offset(0.25, 0.25),
    Offset(0.75, 0.25),
    Offset(0.25, 0.75),
    Offset(0.75, 0.75),
  ],
  5: [
    Offset(0.25, 0.25),
    Offset(0.75, 0.25),
    Offset(0.5, 0.5),
    Offset(0.25, 0.75),
    Offset(0.75, 0.75),
  ],
  6: [
    Offset(0.25, 0.22),
    Offset(0.75, 0.22),
    Offset(0.25, 0.5),
    Offset(0.75, 0.5),
    Offset(0.25, 0.78),
    Offset(0.75, 0.78),
  ],
};

/// Paints die [face] (1-6) in the theme [itemId]'s style into [rect].
void paintLudoDiceTheme(Canvas canvas, Rect rect, String itemId, int face) {
  final style = _diceStyles[itemId];
  if (style == null) {
    LudoDicePainter.paintFace(canvas, rect, face);
    return;
  }
  final rrect = RRect.fromRectAndRadius(
    rect,
    Radius.circular(rect.shortestSide * 0.18),
  );
  canvas.drawRRect(
    rrect.shift(Offset(rect.width * 0.04, rect.height * 0.07)),
    Paint()
      ..color = const Color(0x55000000)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
  );
  canvas.drawRRect(
    rrect,
    Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [style.top, style.bottom],
      ).createShader(rect),
  );
  canvas.drawRRect(
    rrect,
    Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = rect.shortestSide * 0.045
      ..color = style.border,
  );
  final pipRadius = rect.shortestSide * 0.085;
  for (final pip in _pipLayouts[face.clamp(1, 6)]!) {
    final center = Offset(
      rect.left + rect.width * pip.dx,
      rect.top + rect.height * pip.dy,
    );
    if (itemId == 'dice_neon_vortex' || itemId == 'dice_galaxy') {
      canvas.drawCircle(
        center,
        pipRadius * 1.7,
        Paint()
          ..color = style.pip.withValues(alpha: 0.35)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
      );
    }
    canvas.drawCircle(center, pipRadius, Paint()..color = style.pip);
  }
}

/// Paints one themed token of [color] into [rect].
void paintLudoTokenTheme(Canvas canvas, Rect rect, String itemId, Color color) {
  switch (itemId) {
    case 'token_gem':
      _paintGem(canvas, rect, color);
    case 'token_robot':
      _paintRobot(canvas, rect, color);
    case 'token_animal':
      _paintAnimal(canvas, rect, color);
    default:
      LudoTokenPainter.paint(canvas, rect, color);
  }
}

Color _shade(Color color, double amount) {
  final hsl = HSLColor.fromColor(color);
  return hsl.withLightness((hsl.lightness + amount).clamp(0.0, 1.0)).toColor();
}

void _paintGem(Canvas canvas, Rect rect, Color color) {
  final c = rect.center;
  final w = rect.width * 0.42;
  final h = rect.height * 0.42;
  final top = Offset(c.dx, c.dy - h);
  final left = Offset(c.dx - w, c.dy - h * 0.2);
  final right = Offset(c.dx + w, c.dy - h * 0.2);
  final bottom = Offset(c.dx, c.dy + h);
  void facet(List<Offset> points, Color fill) {
    final path = Path()..addPolygon(points, true);
    canvas.drawPath(path, Paint()..color = fill);
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = rect.width * 0.03
        ..color = _shade(color, -0.3),
    );
  }

  facet([top, left, c], _shade(color, 0.25));
  facet([top, right, c], _shade(color, 0.1));
  facet([left, c, bottom], color);
  facet([right, c, bottom], _shade(color, -0.12));
}

void _paintRobot(Canvas canvas, Rect rect, Color color) {
  final body = RRect.fromRectAndRadius(
    Rect.fromCenter(
      center: rect.center,
      width: rect.width * 0.72,
      height: rect.height * 0.62,
    ),
    Radius.circular(rect.width * 0.14),
  );
  canvas.drawRRect(body, Paint()..color = color);
  canvas.drawRRect(
    body,
    Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = rect.width * 0.045
      ..color = _shade(color, -0.3),
  );
  final visor = RRect.fromRectAndRadius(
    Rect.fromCenter(
      center: rect.center.translate(0, -rect.height * 0.04),
      width: rect.width * 0.5,
      height: rect.height * 0.2,
    ),
    Radius.circular(rect.width * 0.08),
  );
  canvas.drawRRect(visor, Paint()..color = const Color(0xFF14306E));
  for (final dx in [-0.1, 0.1]) {
    canvas.drawCircle(
      rect.center.translate(rect.width * dx, -rect.height * 0.04),
      rect.width * 0.04,
      Paint()..color = const Color(0xFF9CF3FF),
    );
  }
  canvas.drawLine(
    Offset(rect.center.dx, body.top),
    Offset(rect.center.dx, body.top - rect.height * 0.12),
    Paint()
      ..strokeWidth = rect.width * 0.04
      ..color = _shade(color, -0.3),
  );
  canvas.drawCircle(
    Offset(rect.center.dx, body.top - rect.height * 0.13),
    rect.width * 0.05,
    Paint()..color = LudoThemeTokens.gold,
  );
}

void _paintAnimal(Canvas canvas, Rect rect, Color color) {
  final c = rect.center.translate(0, rect.height * 0.04);
  final r = rect.width * 0.32;
  for (final dx in [-1.0, 1.0]) {
    final ear = Path()
      ..moveTo(c.dx + dx * r * 0.95, c.dy - r * 0.55)
      ..lineTo(c.dx + dx * r * 0.45, c.dy - r * 1.35)
      ..lineTo(c.dx + dx * r * 0.1, c.dy - r * 0.8)
      ..close();
    canvas.drawPath(ear, Paint()..color = _shade(color, -0.1));
  }
  canvas.drawCircle(c, r, Paint()..color = color);
  canvas.drawCircle(
    c,
    r,
    Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = rect.width * 0.04
      ..color = _shade(color, -0.3),
  );
  for (final dx in [-0.4, 0.4]) {
    canvas.drawCircle(
      c.translate(r * dx, -r * 0.1),
      r * 0.11,
      Paint()..color = const Color(0xFF1A1030),
    );
  }
  canvas.drawOval(
    Rect.fromCenter(
      center: c.translate(0, r * 0.35),
      width: r * 0.4,
      height: r * 0.26,
    ),
    Paint()..color = const Color(0xFF1A1030),
  );
}

class _BoardStyle {
  const _BoardStyle(
    this.top,
    this.bottom,
    this.lane,
    this.edge,
    this.yardAlpha,
  );

  final Color top;
  final Color bottom;
  final Color lane;
  final Color edge;
  final double yardAlpha;
}

const _boardStyles = <String, _BoardStyle>{
  'board_default': _BoardStyle(
    Color(0xFFFAFAF5),
    Color(0xFFEDEDE4),
    Color(0xFFFFFFFF),
    LudoThemeTokens.goldDeep,
    0.85,
  ),
  'board_cosmic': _BoardStyle(
    Color(0xFF2A1272),
    Color(0xFF05021A),
    Color(0xFF3A2A8C),
    Color(0xFF8E6BFF),
    0.7,
  ),
  'board_royal': _BoardStyle(
    Color(0xFF7A1630),
    Color(0xFF2B0612),
    Color(0xFFF5E6B8),
    LudoThemeTokens.gold,
    0.8,
  ),
};

/// Paints a miniature 15x15-style board in the theme [itemId]'s palette.
void paintLudoBoardTheme(Canvas canvas, Rect rect, String itemId) {
  final style = _boardStyles[itemId] ?? _boardStyles['board_default']!;
  final rrect = RRect.fromRectAndRadius(
    rect,
    Radius.circular(rect.shortestSide * 0.06),
  );
  canvas.drawRRect(
    rrect,
    Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [style.top, style.bottom],
      ).createShader(rect),
  );
  final cell = rect.width / 15;
  final yards = [
    (Offset(0, 0), LudoThemeTokens.seatRed),
    (Offset(9, 0), LudoThemeTokens.seatGreen),
    (Offset(9, 9), LudoThemeTokens.seatYellow),
    (Offset(0, 9), LudoThemeTokens.seatBlue),
  ];
  for (final yard in yards) {
    final yardRect = Rect.fromLTWH(
      rect.left + yard.$1.dx * cell,
      rect.top + yard.$1.dy * cell,
      6 * cell,
      6 * cell,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        yardRect.deflate(cell * 0.2),
        Radius.circular(cell * 0.6),
      ),
      Paint()..color = yard.$2.withValues(alpha: style.yardAlpha),
    );
  }
  final lanePaint = Paint()..color = style.lane.withValues(alpha: 0.9);
  canvas.drawRect(
    Rect.fromLTWH(rect.left + 6 * cell, rect.top, 3 * cell, rect.height),
    lanePaint,
  );
  canvas.drawRect(
    Rect.fromLTWH(rect.left, rect.top + 6 * cell, rect.width, 3 * cell),
    lanePaint,
  );
  canvas.drawCircle(rect.center, cell * 1.2, Paint()..color = style.edge);
  if (itemId == 'board_cosmic') {
    final random = math.Random(7);
    for (var i = 0; i < 22; i++) {
      canvas.drawCircle(
        Offset(
          rect.left + random.nextDouble() * rect.width,
          rect.top + random.nextDouble() * rect.height,
        ),
        0.6 + random.nextDouble() * 1.2,
        Paint()..color = const Color(0xCCFFFFFF),
      );
    }
  }
  canvas.drawRRect(
    rrect,
    Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = rect.shortestSide * 0.025
      ..color = style.edge,
  );
}

LudoVisualSlot _slotFor(
  LudoThemeCategory category,
  String itemId, {
  String boardItemId = 'board_default',
  int diceFace = 5,
}) {
  switch (category) {
    case LudoThemeCategory.dice:
      return (canvas, rect) =>
          paintLudoDiceTheme(canvas, rect, itemId, diceFace);
    case LudoThemeCategory.board:
      return (canvas, rect) => paintLudoBoardTheme(canvas, rect, itemId);
    case LudoThemeCategory.token:
      return (canvas, rect) {
        paintLudoBoardTheme(canvas, rect, boardItemId);
        final size = rect.width * 0.34;
        final spots = [
          Offset(rect.left + rect.width * 0.1, rect.top + rect.height * 0.1),
          Offset(rect.left + rect.width * 0.56, rect.top + rect.height * 0.1),
          Offset(rect.left + rect.width * 0.56, rect.top + rect.height * 0.56),
          Offset(rect.left + rect.width * 0.1, rect.top + rect.height * 0.56),
        ];
        for (var i = 0; i < spots.length; i++) {
          paintLudoTokenTheme(
            canvas,
            Rect.fromLTWH(spots[i].dx, spots[i].dy, size, size),
            itemId,
            _tokenColors[i],
          );
        }
      };
  }
}

/// A theme item's art: its manifest bitmap slot when bundled, otherwise the
/// code-drawn fallback above. [boardItemId] sets the board a token preview
/// sits on; [diceFace] picks the die face shown.
class LudoStoreThemeArt extends StatelessWidget {
  const LudoStoreThemeArt({
    super.key,
    required this.itemId,
    required this.category,
    this.size = const Size.square(112),
    this.boardItemId = 'board_default',
    this.diceFace = 5,
  });

  final String itemId;
  final LudoThemeCategory category;
  final Size size;
  final String boardItemId;
  final int diceFace;

  @override
  Widget build(BuildContext context) {
    return LudoArtSlot(
      slot: ludoStoreArtSlot(itemId),
      size: size,
      fallbackPainter: _slotFor(
        category,
        itemId,
        boardItemId: boardItemId,
        diceFace: diceFace,
      ),
    );
  }
}
