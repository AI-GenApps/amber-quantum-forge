import 'package:flutter/material.dart';

import '../merge_relay_content.dart';
import '../merge_relay_theme.dart';
import '../ui/mr_tokens.dart';
import '../ui/tiles/mr_tile_card_painter.dart';
import '../ui/tiles/mr_tile_expression.dart';
import '../ui/tiles/mr_tile_face_painter.dart';

/// One board node on the Rescue chapter map (task 11): a tile-styled square
/// (reusing the same card/face painters as the board's tile characters)
/// carrying the board's position-in-chapter number, in one of three
/// states — locked (flat, dimmed, lock icon, no tap), current (an ink ring
/// plus a play badge — the suggested next board), or cleared (a check
/// badge) — with a plain unlocked/uncleared node as the base look.
final class MergeRelayChapterNode extends StatelessWidget {
  const MergeRelayChapterNode({
    required this.theme,
    required this.rescue,
    required this.unlocked,
    required this.cleared,
    required this.current,
    required this.onTap,
    super.key,
  });

  final MergeRelayTheme theme;
  final MergeRescueBoard rescue;
  final bool unlocked;
  final bool cleared;
  final bool current;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final label = !unlocked
        ? 'Board ${rescue.indexInChapter}, locked'
        : cleared
        ? 'Board ${rescue.indexInChapter}, ${rescue.title}, cleared'
        : current
        ? 'Board ${rescue.indexInChapter}, ${rescue.title}, next up'
        : 'Board ${rescue.indexInChapter}, ${rescue.title}';
    return Semantics(
      button: unlocked,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        child: Stack(
          alignment: Alignment.center,
          children: [
            CustomPaint(
              painter: _NodePainter(
                index: rescue.indexInChapter,
                locked: !unlocked,
              ),
              child: const SizedBox.expand(),
            ),
            if (current)
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: theme.coral, width: 3),
                  ),
                ),
              ),
            if (!unlocked)
              Icon(Icons.lock_rounded, color: theme.muted, size: 20),
            if (cleared)
              const Align(
                alignment: Alignment.topRight,
                child: _StateBadge(icon: Icons.check_rounded, color: null),
              ),
            if (current && !cleared)
              Align(
                alignment: Alignment.topRight,
                child: _StateBadge(
                  icon: Icons.play_arrow_rounded,
                  color: theme.coral,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

final class _StateBadge extends StatelessWidget {
  const _StateBadge({required this.icon, required this.color});

  final IconData icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color ?? MrTokens.ink,
        shape: BoxShape.circle,
        border: Border.all(color: MrTokens.paper, width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(3),
        child: Icon(icon, size: 12, color: MrTokens.paper),
      ),
    );
  }
}

final class _NodePainter extends CustomPainter {
  const _NodePainter({required this.index, required this.locked});

  final int index;
  final bool locked;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    if (locked) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(14)),
        Paint()..color = MrTokens.paperMuted,
      );
      return;
    }
    final tierIndex = (index - 1) % MrTokens.tileTierColors.length;
    final fill = MrTokens.tileTierColors[tierIndex];
    final numeralColor = MrTokens.tileTierNumeralColors[tierIndex];
    paintTileCard(
      canvas,
      rect,
      fill: fill,
      edgeColor: MrTokens.tileEdgeShadeOf(fill),
      radius: 14,
    );
    paintTileFace(
      canvas,
      Rect.fromLTWH(
        rect.left + rect.width * 0.16,
        rect.top + rect.height * 0.1,
        rect.width * 0.68,
        rect.height * 0.32,
      ),
      expression: mrExpressionForTierIndex(tierIndex),
      color: numeralColor,
    );
    final text = TextPainter(
      text: TextSpan(
        text: '$index',
        style: TextStyle(
          fontFamily: 'Fredoka',
          color: numeralColor,
          fontWeight: FontWeight.w800,
          fontSize: size.height * 0.28,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    text.paint(
      canvas,
      Offset(
        rect.center.dx - text.width / 2,
        rect.top + rect.height * 0.62 - text.height / 2,
      ),
    );
  }

  @override
  bool shouldRepaint(covariant _NodePainter oldDelegate) =>
      oldDelegate.index != index || oldDelegate.locked != locked;
}
