/// Level-up celebration (task 26e): shown once an `xp/claim` crosses a
/// level boundary, displaying the coin/diamond/theme bonus granted.
///
/// Reuses `ludo_confetti.dart`'s palette (task 05's win-confetti) for the
/// burst rather than inventing a new one — this is a widget-tree overlay
/// (shown as a dialog over any screen, including non-Flame ones like the
/// lobby/settings), so it paints its own bounded, self-contained burst
/// with a plain [CustomPainter] instead of embedding a second `FlameGame`.
/// Respects [ReducedMotionSetting] (task 05's precedent): reduced motion
/// renders a single static scattered-dot frame with no
/// [AnimationController] running at all, matching
/// `buildLudoConfettiParticle`'s reduced-motion substitute.
library;

import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../game/ludo_confetti.dart' show ludoConfettiPalette;
import '../state/reduced_motion_setting.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import 'ludo_3d_button.dart';
import 'ludo_dialog_frame.dart';

/// The coin/diamond/theme bonus a level-up granted, per task 26b's
/// `applyXpAndLevelRewards`.
final class LudoLevelUpReward {
  const LudoLevelUpReward({
    this.coins = 0,
    this.diamonds = 0,
    this.themeUnlockName,
  });

  final int coins;
  final int diamonds;

  /// Display name of a theme unlocked by this level-up, if any.
  final String? themeUnlockName;
}

final class _ConfettiSeed {
  const _ConfettiSeed({
    required this.color,
    required this.startXFraction,
    required this.driftX,
    required this.fallSpeedFactor,
    required this.rotationSpeed,
  });

  final Color color;
  final double startXFraction;
  final double driftX;
  final double fallSpeedFactor;
  final double rotationSpeed;
}

List<_ConfettiSeed> _buildSeeds(math.Random rng, int count) => [
  for (var i = 0; i < count; i++)
    _ConfettiSeed(
      color: ludoConfettiPalette[i % ludoConfettiPalette.length],
      startXFraction: rng.nextDouble(),
      driftX: (rng.nextDouble() - 0.5) * 60,
      fallSpeedFactor: 0.85 + rng.nextDouble() * 0.3,
      rotationSpeed: (rng.nextDouble() - 0.5) * 6,
    ),
];

class _ConfettiBurstPainter extends CustomPainter {
  const _ConfettiBurstPainter({required this.progress, required this.seeds});

  /// 0.0 (just spawned) to 1.0 (fully fallen). A fixed mid-flight value
  /// under reduced motion (the "static equivalent" frame).
  final double progress;
  final List<_ConfettiSeed> seeds;

  @override
  void paint(Canvas canvas, Size size) {
    for (final seed in seeds) {
      final dx = size.width * seed.startXFraction + seed.driftX * progress;
      final dy = -20 + (size.height + 40) * progress * seed.fallSpeedFactor;
      if (dy > size.height || dy < -20) continue;
      canvas.save();
      canvas.translate(dx, dy);
      canvas.rotate(seed.rotationSpeed * progress);
      canvas.drawCircle(Offset.zero, 4, Paint()..color = seed.color);
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiBurstPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.seeds != seeds;
}

/// The level-up celebration dialog content: an animated (or, under
/// reduced motion, static) confetti burst behind the new level and its
/// reward summary.
class LudoLevelUpCelebration extends StatefulWidget {
  const LudoLevelUpCelebration({
    super.key,
    required this.newLevel,
    required this.reward,
    this.reducedMotion,
    this.onDismiss,
    math.Random? random,
  }) : _random = random;

  final int newLevel;
  final LudoLevelUpReward reward;
  final ReducedMotionSetting? reducedMotion;
  final VoidCallback? onDismiss;
  final math.Random? _random;

  @override
  State<LudoLevelUpCelebration> createState() => _LudoLevelUpCelebrationState();
}

class _LudoLevelUpCelebrationState extends State<LudoLevelUpCelebration>
    with SingleTickerProviderStateMixin {
  AnimationController? _controller;
  late final List<_ConfettiSeed> _seeds = _buildSeeds(
    widget._random ?? math.Random(),
    30,
  );

  bool get _reduced => widget.reducedMotion?.value ?? false;

  @override
  void initState() {
    super.initState();
    if (!_reduced) {
      _controller = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 1400),
      )..forward();
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final burst = _reduced
        ? CustomPaint(
            painter: _ConfettiBurstPainter(progress: 0.4, seeds: _seeds),
          )
        : AnimatedBuilder(
            animation: _controller!,
            builder: (context, _) => CustomPaint(
              painter: _ConfettiBurstPainter(
                progress: _controller!.value,
                seeds: _seeds,
              ),
            ),
          );
    return LudoDialogFrame(
      child: SizedBox(
        height: 320,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned.fill(child: burst),
            Padding(
              padding: const EdgeInsets.all(LudoThemeTokens.spaceLg),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('LEVEL UP!', style: LudoTextStyles.displayMedium),
                  const SizedBox(height: LudoThemeTokens.spaceXs),
                  Text(
                    'Level ${widget.newLevel}',
                    style: LudoTextStyles.displaySmall,
                  ),
                  const SizedBox(height: LudoThemeTokens.spaceMd),
                  if (widget.reward.coins > 0)
                    Text(
                      '+${widget.reward.coins} coins',
                      style: LudoTextStyles.body,
                    ),
                  if (widget.reward.diamonds > 0)
                    Text(
                      '+${widget.reward.diamonds} diamonds',
                      style: LudoTextStyles.body,
                    ),
                  if (widget.reward.themeUnlockName != null)
                    Text(
                      'Unlocked: ${widget.reward.themeUnlockName}',
                      style: LudoTextStyles.body,
                    ),
                  const SizedBox(height: LudoThemeTokens.spaceMd),
                  Ludo3dButton(
                    semanticLabel: 'Dismiss level-up celebration',
                    onPressed: widget.onDismiss,
                    child: const Text('Nice!'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shows [LudoLevelUpCelebration] as a dialog. Fired exactly once per
/// level crossing by the caller (`game_board_screen.dart` guards this the
/// same way it already guards `ludo_match_finished` recording).
Future<void> showLudoLevelUpCelebration(
  BuildContext context, {
  required int newLevel,
  required LudoLevelUpReward reward,
  ReducedMotionSetting? reducedMotion,
}) {
  return showDialog<void>(
    context: context,
    barrierDismissible: true,
    builder: (dialogContext) => LudoLevelUpCelebration(
      newLevel: newLevel,
      reward: reward,
      reducedMotion: reducedMotion,
      onDismiss: () => Navigator.of(dialogContext).maybePop(),
    ),
  );
}
