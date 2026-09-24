/// The bottom dice zone on the game board screen (task 09): a tap-to-roll
/// control, disabled whenever it isn't the local player's turn or roll
/// phase. This widget never calls `ludo_rules` itself — [onRoll] is
/// supplied by the caller (`GameBoardScreen`), which owns the match state
/// and decides when a roll is legal.
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

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final label = lastRoll == null ? 'Tap to roll' : 'Rolled $lastRoll';
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
              borderRadius: BorderRadius.circular(16),
            ),
            child: InkWell(
              // Disabled dice zones get no tap handler at all (not merely
              // dimmed) so no roll can ever be triggered out of turn.
              onTap: enabled ? onRoll : null,
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 14,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.casino_outlined,
                      color: enabled
                          ? colorScheme.onPrimaryContainer
                          : colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      label,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: enabled
                            ? colorScheme.onPrimaryContainer
                            : colorScheme.onSurfaceVariant,
                      ),
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
