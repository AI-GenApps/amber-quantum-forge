/// The dice zone: a tap-to-roll control, disabled whenever it isn't the
/// local player's turn or roll phase. This widget never calls
/// `ludo_rules` itself — [onRoll] is supplied by the caller
/// (`GameBoardScreen`), which owns the match state and decides when a
/// roll is legal.
///
/// Task 09 placed this in a shared bottom zone below the board; task 12d
/// relocates it into whichever seat's [PlayerCornerCard][pcc] is
/// currently active, using [compact] so it fits that card's tight
/// footprint instead of the original full-width row.
///
/// [pcc]: player_corner_card.dart
library;

import 'package:flutter/material.dart';

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
    final colorScheme = Theme.of(context).colorScheme;
    final label = lastRoll == null ? 'Tap to roll' : 'Rolled $lastRoll';
    final foreground = enabled
        ? colorScheme.onPrimaryContainer
        : colorScheme.onSurfaceVariant;
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
            color: enabled
                ? colorScheme.primaryContainer
                : colorScheme.surfaceContainerHighest,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(compact ? 12 : 16),
            ),
            child: InkWell(
              // Disabled dice zones get no tap handler at all (not merely
              // dimmed) so no roll can ever be triggered out of turn.
              onTap: enabled ? onRoll : null,
              borderRadius: BorderRadius.circular(compact ? 12 : 16),
              child: compact
                  ? Padding(
                      padding: const EdgeInsets.all(8),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.casino_outlined,
                            size: 20,
                            color: foreground,
                          ),
                          if (lastRoll != null)
                            Text(
                              '$lastRoll',
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(
                                    color: foreground,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                        ],
                      ),
                    )
                  : Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 14,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.casino_outlined, color: foreground),
                          const SizedBox(width: 8),
                          Text(
                            label,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(color: foreground),
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
