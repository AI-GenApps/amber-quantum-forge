/// A single player's panel on the game board screen (task 09):
/// avatar/name, and — while it's their turn — a circular timer ring
/// counting down the turn deadline.
///
/// Purely presentational: it reads whatever [deadline] its caller supplies
/// (the local `ludo_rules` clock for now; task 25 swaps in the
/// server-provided deadline for online play without this widget changing).
library;

import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

import '../game/ludo_board_geometry.dart' show ludoColorPalette;
import 'ludo_avatar.dart' show LudoAvatarView;

/// One player panel: avatar, name, seat color accent, and (when [isActive]
/// and [deadline] is non-null) a timer ring.
class PlayerPanel extends StatelessWidget {
  const PlayerPanel({
    super.key,
    required this.name,
    required this.avatarId,
    required this.color,
    required this.isActive,
    this.deadline,
    this.turnDuration = const Duration(seconds: 30),
    this.now,
  });

  final String name;
  final String avatarId;
  final LudoColor color;

  /// Whether it is currently this player's turn (drives the highlighted
  /// border and whether the timer ring is shown at all).
  final bool isActive;

  /// The instant this player's current turn phase expires, or `null` when
  /// no deadline is being tracked (e.g. not this player's turn, or the
  /// match-state source doesn't supply one).
  final DateTime? deadline;

  /// The full length of a turn phase, used to compute the ring's
  /// remaining-time fraction.
  final Duration turnDuration;

  /// Test seam for "now"; defaults to [DateTime.now].
  final DateTime? now;

  /// The fraction of [turnDuration] remaining until [deadline], clamped to
  /// `0..1`. `1.0` when [deadline] or [isActive] is unset (nothing to
  /// count down).
  double get remainingFraction {
    if (!isActive || deadline == null) return 1.0;
    final currentNow = now ?? DateTime.now();
    final remaining = deadline!.difference(currentNow);
    if (turnDuration.inMicroseconds <= 0) return 0.0;
    final fraction = remaining.inMicroseconds / turnDuration.inMicroseconds;
    return fraction.clamp(0.0, 1.0);
  }

  @override
  Widget build(BuildContext context) {
    final accent = ludoColorPalette[color]!;
    final showTimer = isActive && deadline != null;
    return Semantics(
      label: isActive ? '$name, your move' : name,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isActive ? accent.withValues(alpha: 0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isActive ? accent : Colors.transparent,
            width: 2,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 44,
              height: 44,
              child: showTimer
                  ? Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 44,
                          height: 44,
                          child: CircularProgressIndicator(
                            value: remainingFraction,
                            strokeWidth: 3,
                            color: accent,
                            backgroundColor: accent.withValues(alpha: 0.2),
                          ),
                        ),
                        LudoAvatarView(avatarId: avatarId, size: 34),
                      ],
                    )
                  : LudoAvatarView(avatarId: avatarId, size: 40),
            ),
            const SizedBox(width: 8),
            Text(
              name,
              style: Theme.of(context).textTheme.labelMedium,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
