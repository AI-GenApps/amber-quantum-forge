/// The dice zone: a tap-to-roll control, disabled whenever it isn't the
/// local player's turn or roll phase. This widget never calls
/// `ludo_rules` itself — [onRoll] is supplied by the caller
/// (`GameBoardScreen`), which owns the match state and decides when a
/// roll is legal.
///
/// Task 09 placed this in a shared bottom zone below the board; task 12d
/// relocates it into whichever seat's [PlayerCornerCard][pcc] is
/// currently active, using [compact] so it fits that card's tight
/// footprint instead of the original full-width row. Task 12d2 replaces
/// the placeholder dice icon with the same glossy 3D die art
/// [LudoDicePainter] draws on the board's animated die (task 05), inside
/// a gold-framed box — matching the target's "single active dice in a
/// gold-framed box beside the corner card" look and confirming the die
/// never floats on the board itself.
///
/// [pcc]: player_corner_card.dart
library;

import 'package:flutter/material.dart';

import '../game/ludo_dice_component.dart' show LudoDicePainter;
import '../theme/ludo_theme_tokens.dart';

/// A tap-to-roll button showing the last-rolled value (if any) and an
/// explicit enabled/disabled visual + semantic state.
class DiceZone extends StatelessWidget {
  const DiceZone({
    super.key,
    required this.enabled,
    required this.onRoll,
    this.lastRoll,
    this.compact = false,
  });

  /// Whether tapping should roll the dice: `true` only when it is the
  /// local player's turn and the match is awaiting a roll.
  final bool enabled;

  /// Invoked on tap when [enabled] is `true`. Never invoked otherwise —
  /// the button has no tap handler at all while disabled, mirroring the
  /// home lobby's "no silent no-op tap" convention.
  final VoidCallback onRoll;

  /// The most recently rolled face, for display; `null` before any roll.
  final int? lastRoll;

  /// When `true`, renders as a small square icon-only control sized to
  /// fit inside a [PlayerCornerCard]'s dice slot, still meeting the 48dp
  /// minimum tap target, instead of the original full-width labeled row.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final label = lastRoll == null ? 'Tap to roll' : 'Rolled $lastRoll';
    final dieSize = compact ? 32.0 : 44.0;
    final die = _GlossyDie(face: lastRoll ?? 1, size: dieSize);

    return Semantics(
      button: enabled,
      enabled: enabled,
      label: enabled ? 'Roll dice' : 'Roll dice, not your turn',
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
        child: Opacity(
          opacity: enabled ? 1.0 : 0.4,
          child: Material(
            type: MaterialType.transparency,
            child: InkWell(
              // Disabled dice zones get no tap handler at all (not merely
              // dimmed) so no roll can ever be triggered out of turn.
              onTap: enabled ? onRoll : null,
              borderRadius: BorderRadius.circular(compact ? 12 : 16),
              child: compact
                  ? Padding(
                      padding: const EdgeInsets.all(4),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          die,
                          if (lastRoll != null)
                            Text(
                              '$lastRoll',
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(
                                    color: LudoThemeTokens.textOnDark,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                        ],
                      ),
                    )
                  : Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          die,
                          const SizedBox(width: 12),
                          Text(
                            label,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(color: LudoThemeTokens.textOnDark),
                          ),
                        ],
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The same glossy 3D die art the board's animated die (task 05) paints,
/// shown statically at [face] inside a gold-framed box — the HUD's single
/// visible die, never floating on the board itself.
class _GlossyDie extends StatelessWidget {
  const _GlossyDie({required this.face, required this.size});

  final int face;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.22),
        border: Border.all(color: LudoThemeTokens.gold, width: size * 0.09),
      ),
      child: CustomPaint(painter: _DieFacePainter(face)),
    );
  }
}

class _DieFacePainter extends CustomPainter {
  const _DieFacePainter(this.face);

  final int face;

  @override
  void paint(Canvas canvas, Size size) {
    LudoDicePainter.paintFace(canvas, Offset.zero & size, face);
  }

  @override
  bool shouldRepaint(covariant _DieFacePainter oldDelegate) =>
      oldDelegate.face != face;
}
