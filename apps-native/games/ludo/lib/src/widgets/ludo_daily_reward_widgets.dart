/// Daily reward calendar building blocks (task 26h): one day tile and the
/// "watch an ad" row. Every control is a [Ludo3dButton] (Semantics-labelled,
/// 48dp+), and every tile carries a full spoken label.
library;

import 'package:flutter/material.dart';

import '../net/ludo_rewards_models.dart';
import '../state/ludo_inventory_state.dart' show LudoCurrency;
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import 'ludo_3d_button.dart';
import 'ludo_store_cards.dart' show currencyColor, currencyIcon, groupedNumber;

const _minTapTarget = 48.0;

enum LudoDayTileState { claimed, today, upcoming }

/// One calendar day. [bonusPercent] > 0 means a Vortex Pass is active and the
/// server will add that percentage on claim; the tile only mentions it, it
/// never computes the bonus amount.
class LudoDailyRewardTile extends StatelessWidget {
  const LudoDailyRewardTile({
    super.key,
    required this.day,
    required this.state,
    required this.width,
    this.bonusPercent = 0,
  });

  final LudoDailyRewardDay day;
  final LudoDayTileState state;
  final double width;
  final int bonusPercent;

  String get _stateLabel => switch (state) {
    LudoDayTileState.claimed => 'claimed',
    LudoDayTileState.today => 'ready to claim',
    LudoDayTileState.upcoming => 'upcoming',
  };

  @override
  Widget build(BuildContext context) {
    final isToday = state == LudoDayTileState.today;
    final isClaimed = state == LudoDayTileState.claimed;
    final isBonusDay = day.diamonds > 0;
    final showPassBonus = bonusPercent > 0 && !isClaimed;
    final amounts = [
      '${groupedNumber(day.coins)} coins',
      if (day.diamonds > 0) '${day.diamonds} diamonds',
    ].join(' and ');
    return Semantics(
      container: true,
      label:
          'Day ${day.day}, $amounts${isBonusDay ? ', bonus day' : ''}'
          '${showPassBonus ? ', plus $bonusPercent percent Vortex Pass bonus' : ''}'
          ', $_stateLabel',
      excludeSemantics: true,
      child: Opacity(
        opacity: isClaimed ? 0.6 : 1,
        child: Container(
          key: Key('daily-reward-day-${day.day}'),
          width: width,
          padding: const EdgeInsets.symmetric(
            horizontal: LudoThemeTokens.spaceXs,
            vertical: LudoThemeTokens.spaceSm,
          ),
          decoration: BoxDecoration(
            color: isToday
                ? LudoThemeTokens.gold.withValues(alpha: 0.25)
                : LudoThemeTokens.backgroundDeepBlue,
            borderRadius: BorderRadius.circular(LudoThemeTokens.radiusSm),
            border: Border.all(
              color: isToday || isBonusDay
                  ? LudoThemeTokens.gold
                  : LudoThemeTokens.backgroundMidBlue,
              width: isToday ? 3 : 2,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                isToday ? 'Today' : 'Day ${day.day}',
                style: LudoTextStyles.caption.copyWith(
                  color: LudoThemeTokens.gold,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              _amountRow(LudoCurrency.coins, groupedNumber(day.coins)),
              if (day.diamonds > 0)
                _amountRow(LudoCurrency.diamonds, '${day.diamonds}')
              else
                const SizedBox(height: 18),
              const SizedBox(height: 2),
              Icon(
                isClaimed
                    ? Icons.check_circle
                    : (isBonusDay
                          ? Icons.card_giftcard
                          : Icons.circle_outlined),
                size: 18,
                color: isClaimed
                    ? LudoThemeTokens.seatGreen
                    : LudoThemeTokens.textOnDark,
              ),
              if (isBonusDay)
                Text(
                  'Day 7 bonus',
                  style: LudoTextStyles.caption.copyWith(fontSize: 10),
                ),
              if (showPassBonus)
                Text(
                  '+$bonusPercent% Pass',
                  key: Key('daily-reward-pass-bonus-${day.day}'),
                  style: LudoTextStyles.caption.copyWith(
                    fontSize: 10,
                    color: LudoThemeTokens.gold,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _amountRow(LudoCurrency currency, String text) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(currencyIcon(currency), size: 14, color: currencyColor(currency)),
      const SizedBox(width: 2),
      Text(text, style: LudoTextStyles.bodyStrong.copyWith(fontSize: 13)),
    ],
  );
}

/// One "watch an ad" row: what it pays, how many are left today, and a
/// button. [unit] is `null` until the server status has loaded.
class LudoWatchAdRow extends StatelessWidget {
  const LudoWatchAdRow({
    super.key,
    required this.currency,
    required this.unit,
    required this.onWatch,
    this.watching = false,
    this.enabled = true,
  });

  final LudoCurrency currency;
  final LudoAdUnitStatus? unit;
  final VoidCallback onWatch;

  /// This row's ad is loading, showing or waiting for its credit.
  final bool watching;

  /// `false` when another ad is in flight or ads are unavailable.
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final unit = this.unit;
    final amount = unit?.rewardAmount;
    final noun = currency == LudoCurrency.coins ? 'coins' : 'diamonds';
    final remaining = unit?.remaining ?? 0;
    final canWatch = enabled && !watching && unit != null && remaining > 0;
    final subtitle = unit == null
        ? 'Checking your allowance...'
        : (remaining > 0
              ? '$remaining of ${unit.dailyCap} left today'
              : 'Daily limit reached. Come back tomorrow.');
    return Row(
      children: [
        Icon(currencyIcon(currency), size: 28, color: currencyColor(currency)),
        const SizedBox(width: LudoThemeTokens.spaceSm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                amount == null
                    ? 'Free $noun'
                    : '+${groupedNumber(amount)} $noun',
                style: LudoTextStyles.bodyStrong,
              ),
              Text(subtitle, style: LudoTextStyles.caption),
            ],
          ),
        ),
        const SizedBox(width: LudoThemeTokens.spaceSm),
        ConstrainedBox(
          constraints: const BoxConstraints(
            minWidth: 96,
            minHeight: _minTapTarget,
          ),
          child: Ludo3dButton(
            key: Key('watch-ad-${currency.wire}'),
            semanticLabel: amount == null
                ? 'Watch ad for free $noun'
                : 'Watch ad for ${groupedNumber(amount)} $noun',
            color: canWatch
                ? LudoThemeTokens.gold
                : LudoThemeTokens.backgroundMidBlue,
            onPressed: canWatch ? onWatch : null,
            padding: const EdgeInsets.symmetric(
              horizontal: LudoThemeTokens.spaceMd,
              vertical: LudoThemeTokens.spaceSm,
            ),
            child: Center(
              child: watching
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 3),
                    )
                  : Text(
                      'Watch',
                      style: LudoTextStyles.bodyStrong.copyWith(
                        color: canWatch
                            ? LudoThemeTokens.textOutline
                            : LudoThemeTokens.textOnDark,
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }
}
