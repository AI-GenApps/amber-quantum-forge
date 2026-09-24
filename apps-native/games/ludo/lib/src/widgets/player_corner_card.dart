/// One player's corner card on the game board screen (task 12d): a
/// gold-framed [LudoPanel] holding a square-framed avatar (with a
/// circular timer ring around it while it's this seat's turn), a name
/// label, and — only for the currently-active seat — a dice slot showing
/// [DiceZone] inline.
///
/// Replaces task 09's top-of-screen [PlayerPanel] row and the old shared
/// bottom [DiceZone]: `GameBoardScreen` now places one [PlayerCornerCard]
/// per occupied corner (two above the board, two below), and the active
/// seat's own card is where its dice control lives, matching
/// `.agents/resources/2026-09-24/ludo-visual-reference/README.md`'s
/// corner-card target look.
///
/// Purely presentational: it reads whatever [deadline] its caller supplies
/// and only rolls through [onRoll] when tapped — [GameBoardScreen] still
/// owns the match state.
library;

import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

import '../game/ludo_board_geometry.dart' show ludoColorPalette;
import '../theme/ludo_theme_tokens.dart';
import 'dice_zone.dart';
import 'ludo_avatar.dart'
    show LudoAvatarPainter, LudoAvatarSpec, ludoAvatarById;
import 'ludo_panel.dart';

/// Side (dp) of the framed avatar square inside a corner card.
const ludoCornerCardAvatarSize = 40.0;

/// One seat's corner card.
class PlayerCornerCard extends StatelessWidget {
  const PlayerCornerCard({
    super.key,
    required this.name,
    required this.avatarId,
    required this.color,
    required this.isActive,
    this.deadline,
    this.turnDuration = const Duration(seconds: 30),
    this.now,
    this.showDice = false,
    this.diceEnabled = false,
    this.lastRoll,
    this.onRoll,
  }) : assert(
         !showDice || onRoll != null,
         'a corner card with showDice must supply onRoll',
       );

  final String name;
  final String avatarId;
  final LudoColor color;

  /// Whether it is currently this seat's turn (drives the gold-accented
  /// border, the timer ring, and whether [showDice] is honored at all —
  /// callers should only ever pass `showDice: true` for the active seat,
  /// but this widget also gates on [isActive] defensively).
  final bool isActive;

  /// The instant this seat's current turn phase expires, or `null` when no
  /// deadline is being tracked.
  final DateTime? deadline;

  /// The full length of a turn phase, used to compute the ring's
  /// remaining-time fraction.
  final Duration turnDuration;

  /// Test seam for "now"; defaults to [DateTime.now].
  final DateTime? now;

  /// Whether this card should render a dice slot at all — `true` only for
  /// the currently-active seat's card (task 12d moves the dice control
  /// out of a shared bottom zone into whichever corner card is active).
  final bool showDice;

  /// Whether a tap on the dice slot should roll right now (mirrors
  /// `GameBoardScreen._canRoll`); irrelevant when [showDice] is `false`.
  final bool diceEnabled;

  /// The most recently rolled face, for display in the dice slot.
  final int? lastRoll;

  /// Invoked when the dice slot is tapped while [diceEnabled] is `true`.
  /// Required whenever [showDice] is `true`.
  final VoidCallback? onRoll;

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
    final showDiceSlot = showDice && isActive;

    return Semantics(
      label: isActive ? '$name, your move' : name,
      child: LudoPanel(
        borderWidth: isActive ? 3 : 1.5,
        padding: const EdgeInsets.symmetric(
          horizontal: LudoThemeTokens.spaceSm,
          vertical: LudoThemeTokens.spaceSm,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            _FramedAvatar(
              avatarId: avatarId,
              accent: accent,
              showTimer: showTimer,
              remainingFraction: remainingFraction,
            ),
            const SizedBox(width: LudoThemeTokens.spaceSm),
            Flexible(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: LudoThemeTokens.fontBody,
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                      color: LudoThemeTokens.textOnDark,
                    ),
                  ),
                  if (showDiceSlot) ...[
                    const SizedBox(height: LudoThemeTokens.spaceXs),
                    DiceZone(
                      compact: true,
                      enabled: diceEnabled,
                      lastRoll: lastRoll,
                      onRoll: onRoll!,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The square gold-framed avatar box, with a circular timer ring painted
/// around the avatar art while [showTimer] is true — the same
/// remaining-fraction math task 09's `PlayerPanel` used, just restyled
/// (gold ring, square frame) for the corner-card look.
///
/// Paints [LudoAvatarPainter] directly (not [LudoAvatarView]) because that
/// view enforces its own 48dp+ tap target for the onboarding picker's
/// tappable tiles — exactly what would blow out this compact, non-tappable
/// card avatar's sizing.
class _FramedAvatar extends StatelessWidget {
  const _FramedAvatar({
    required this.avatarId,
    required this.accent,
    required this.showTimer,
    required this.remainingFraction,
  });

  final String avatarId;
  final Color accent;
  final bool showTimer;
  final double remainingFraction;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: ludoCornerCardAvatarSize,
      height: ludoCornerCardAvatarSize,
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        border: Border.all(color: LudoThemeTokens.gold, width: 2),
        borderRadius: BorderRadius.circular(LudoThemeTokens.radiusSm),
        color: LudoThemeTokens.backgroundDeepBlue,
      ),
      child: showTimer
          ? Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: remainingFraction,
                  strokeWidth: 3,
                  color: accent,
                  backgroundColor: accent.withValues(alpha: 0.25),
                ),
                Padding(
                  padding: const EdgeInsets.all(6),
                  child: _AvatarArt(avatarId: avatarId),
                ),
              ],
            )
          : _AvatarArt(avatarId: avatarId),
    );
  }
}

/// The raw code-drawn avatar art, with no tap wrapper.
///
/// Self-wraps in [SizedBox.expand]: a bare [CustomPaint] defaults to
/// [Size.zero] and only grows when its incoming constraints are *tight*
/// (e.g. the non-timer branch's [Container]-with-fixed-size parent) —
/// under the timer branch's [Stack], non-positioned children get
/// *loosened* constraints, so without forcing this to expand, the art
/// would silently paint nothing there while working everywhere else.
class _AvatarArt extends StatelessWidget {
  const _AvatarArt({required this.avatarId});

  final String avatarId;

  @override
  Widget build(BuildContext context) {
    return SizedBox.expand(
      child: CustomPaint(painter: _AvatarPainter(ludoAvatarById(avatarId))),
    );
  }
}

class _AvatarPainter extends CustomPainter {
  const _AvatarPainter(this.spec);

  final LudoAvatarSpec spec;

  @override
  void paint(Canvas canvas, Size size) {
    LudoAvatarPainter.paint(canvas, Offset.zero & size, spec.color, spec.motif);
  }

  @override
  bool shouldRepaint(covariant _AvatarPainter oldDelegate) =>
      oldDelegate.spec.id != spec.id;
}
