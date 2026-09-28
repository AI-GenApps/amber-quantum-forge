/// Wallet/level HUD chips (task 26e): coin count, diamond count, and a
/// level badge with an XP progress sliver, code-drawn from
/// [LudoThemeTokens]/[LudoTextStyles] per the design system rather than
/// raw Material defaults (task 12b's discipline), reused on the lobby and
/// the profile/settings surface.
library;

import 'package:flutter/material.dart';

import '../state/ludo_wallet_state.dart';
import '../state/reduced_motion_setting.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';

/// How long the XP-progress sliver animates a width change, when motion
/// is not reduced.
const ludoXpBarFillDuration = Duration(milliseconds: 400);

/// One pill-shaped currency chip (coins or diamonds).
class LudoCurrencyChip extends StatelessWidget {
  const LudoCurrencyChip({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.amount,
  });

  final IconData icon;
  final Color iconColor;
  final int amount;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: LudoThemeTokens.backgroundMidBlue,
        borderRadius: BorderRadius.circular(LudoThemeTokens.radiusPill),
        border: Border.all(color: LudoThemeTokens.gold, width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: LudoThemeTokens.spaceSm,
          vertical: 4,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: iconColor),
            const SizedBox(width: 4),
            Text(
              amount.toString(),
              style: LudoTextStyles.bodyStrong.copyWith(fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}

/// The level badge: a gold circle showing the level number, with a thin
/// XP-progress sliver beneath it toward the next level.
class LudoLevelBadge extends StatelessWidget {
  const LudoLevelBadge({
    super.key,
    required this.level,
    required this.xpProgress,
    this.width = 56,
    this.reducedMotion = false,
  });

  final int level;

  /// Fraction (0.0-1.0) of XP filled toward the next level.
  final double xpProgress;
  final double width;

  /// When `true` (task 05's precedent), the XP-progress sliver jumps
  /// straight to its final width instead of animating the fill — an
  /// [AnimatedContainer] with [Duration.zero] rather than a second widget
  /// tree, so the two states share every other pixel.
  final bool reducedMotion;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 32,
          height: 32,
          alignment: Alignment.center,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [LudoThemeTokens.gold, LudoThemeTokens.goldDeep],
            ),
            border: Border.fromBorderSide(
              BorderSide(color: LudoThemeTokens.textOutline, width: 1.5),
            ),
          ),
          child: Text(
            '$level',
            style: LudoTextStyles.bodyStrong.copyWith(
              color: LudoThemeTokens.textOutline,
              fontSize: 15,
            ),
          ),
        ),
        const SizedBox(height: 3),
        SizedBox(
          width: width,
          height: 5,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(LudoThemeTokens.radiusPill),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: LudoThemeTokens.backgroundMidBlue,
                border: Border.all(color: LudoThemeTokens.goldDeep, width: 1),
              ),
              child: Align(
                alignment: Alignment.centerLeft,
                child: AnimatedContainer(
                  duration: reducedMotion
                      ? Duration.zero
                      : ludoXpBarFillDuration,
                  width: width * xpProgress.clamp(0, 1),
                  height: 5,
                  color: LudoThemeTokens.gold,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// The full HUD row: coins, diamonds, and the level badge, reading from
/// [wallet]. Rebuilds automatically as [wallet] notifies (an
/// [AnimatedBuilder] around the [ChangeNotifier], so a `refresh()` or an
/// `applyXpClaimResult` call animates the visible numbers/bar in place).
class LudoWalletHud extends StatelessWidget {
  const LudoWalletHud({super.key, required this.wallet, this.reducedMotion});

  final LudoWalletState wallet;

  /// `null` (the default) leaves the XP-fill animation enabled.
  final ReducedMotionSetting? reducedMotion;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: wallet,
      builder: (context, _) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            LudoCurrencyChip(
              icon: Icons.monetization_on,
              iconColor: LudoThemeTokens.gold,
              amount: wallet.coins,
            ),
            const SizedBox(width: LudoThemeTokens.spaceSm),
            LudoCurrencyChip(
              icon: Icons.diamond,
              iconColor: LudoThemeTokens.seatBlue,
              amount: wallet.diamonds,
            ),
            const SizedBox(width: LudoThemeTokens.spaceSm),
            LudoLevelBadge(
              level: wallet.level,
              xpProgress: wallet.xpProgress,
              reducedMotion: reducedMotion?.value ?? false,
            ),
          ],
        );
      },
    );
  }
}
