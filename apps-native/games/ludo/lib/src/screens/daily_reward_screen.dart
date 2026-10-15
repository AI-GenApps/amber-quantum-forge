/// The daily reward calendar and free rewarded ads (task 26h).
///
/// The 7-day calendar, the streak day, the day-7 diamond bonus and any
/// Vortex Pass bonus all come from the server (`GET daily-reward` and
/// `POST daily-reward/claim`); this screen only renders them. The "watch ad"
/// rows show a rewarded ad and then wait for the server to credit it, so the
/// client never grants currency itself.
library;

import 'dart:async';

import 'package:flutter/material.dart';

import '../net/ludo_gateway.dart' show LudoDailyRewardClaimResult;
import '../net/ludo_rewards_models.dart';
import '../state/ludo_daily_reward_state.dart';
import '../state/ludo_inventory_state.dart' show LudoCurrency;
import '../state/ludo_rewarded_ads_state.dart';
import '../state/ludo_wallet_state.dart';
import '../state/reduced_motion_setting.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_3d_button.dart';
import '../widgets/ludo_daily_reward_widgets.dart';
import '../widgets/ludo_panel.dart';
import '../widgets/ludo_store_cards.dart' show groupedNumber;
import '../widgets/ludo_wallet_hud.dart';

const _minTapTarget = 48.0;

class DailyRewardScreen extends StatefulWidget {
  const DailyRewardScreen({
    super.key,
    required this.dailyReward,
    this.ads,
    this.walletState,
    this.reducedMotion,
    this.autoLoad = true,
  });

  final LudoDailyRewardState dailyReward;

  /// `null` hides the free-rewards section.
  final LudoRewardedAdsState? ads;

  /// The wallet whose balances the HUD row shows; `null` hides the row.
  final LudoWalletState? walletState;
  final ReducedMotionSetting? reducedMotion;

  /// Test seam: skip the initial `load()` calls on pre-loaded states.
  final bool autoLoad;

  @override
  State<DailyRewardScreen> createState() => _DailyRewardScreenState();
}

class _DailyRewardScreenState extends State<DailyRewardScreen> {
  String? _message;
  bool _messageIsError = false;

  @override
  void initState() {
    super.initState();
    if (widget.autoLoad) {
      unawaited(widget.dailyReward.load());
      unawaited(widget.ads?.load());
    }
  }

  void _say(String message, {bool error = false}) {
    if (!mounted) return;
    setState(() {
      _message = message;
      _messageIsError = error;
    });
  }

  Future<void> _claim() async {
    final ok = await widget.dailyReward.claim();
    if (ok) {
      final claim = widget.dailyReward.lastClaim;
      if (claim != null) _say(_claimSummary(claim));
    } else {
      final error = widget.dailyReward.errorMessage;
      if (error != null) _say(error, error: true);
    }
  }

  String _claimSummary(LudoDailyRewardClaimResult claim) {
    final parts = <String>[
      '+${groupedNumber(claim.coinsGranted)} coins',
      if (claim.diamondsGranted > 0) '+${claim.diamondsGranted} diamonds',
    ];
    final bonus = claim.passBonusApplied
        ? ' (includes your Vortex Pass bonus)'
        : '';
    return 'Day ${claim.streakDay} reward claimed: ${parts.join(' and ')}'
        '$bonus.';
  }

  Future<void> _watch(LudoCurrency type) async {
    final ads = widget.ads;
    if (ads == null) return;
    final noun = type.wire;
    final outcome = await ads.watch(type);
    switch (outcome) {
      case LudoAdWatchOutcome.credited:
        _say('Reward received! Your $noun balance is updated.');
      case LudoAdWatchOutcome.rewardPending:
        _say(
          'Thanks for watching! Your reward is on its way and will appear '
          'shortly.',
        );
      case LudoAdWatchOutcome.dismissedNoReward:
        _say('Watch the whole ad to earn the reward.', error: true);
      case LudoAdWatchOutcome.noAdAvailable:
        _say('No ad is available right now. Try again soon.', error: true);
      case LudoAdWatchOutcome.consentRequired:
        _say('Ads need your privacy choice before they can show.', error: true);
      case LudoAdWatchOutcome.dailyLimitReached:
        _say('Daily limit reached. Come back tomorrow.', error: true);
      case LudoAdWatchOutcome.unavailable:
        _say('Rewarded ads are not available in this build.', error: true);
      case LudoAdWatchOutcome.offline:
        _say('You are offline. Connect to watch ads.', error: true);
      case LudoAdWatchOutcome.busy:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Daily Rewards')),
      body: LudoBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(LudoThemeTokens.spaceMd),
            children: [
              if (widget.walletState != null)
                Align(
                  alignment: Alignment.centerRight,
                  child: LudoWalletHud(
                    wallet: widget.walletState!,
                    reducedMotion: widget.reducedMotion,
                  ),
                ),
              if (_message != null) _messageBanner(),
              const SizedBox(height: LudoThemeTokens.spaceSm),
              AnimatedBuilder(
                animation: widget.dailyReward,
                builder: (context, _) => _calendarPanel(),
              ),
              if (widget.ads != null) ...[
                const SizedBox(height: LudoThemeTokens.spaceMd),
                AnimatedBuilder(
                  animation: widget.ads!,
                  builder: (context, _) => _adsPanel(widget.ads!),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _calendarPanel() {
    final state = widget.dailyReward;
    final status = state.status;
    if (status == null) {
      return LudoPanel(
        child: Center(
          child: state.isOffline
              ? Column(
                  children: [
                    Text(
                      'Rewards need an online connection.',
                      textAlign: TextAlign.center,
                      style: LudoTextStyles.body,
                    ),
                    const SizedBox(height: LudoThemeTokens.spaceSm),
                    _retryButton(state.load),
                  ],
                )
              : const Padding(
                  padding: EdgeInsets.all(LudoThemeTokens.spaceMd),
                  child: CircularProgressIndicator(),
                ),
        ),
      );
    }
    return LudoPanel(
      key: const Key('daily-reward-calendar'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Daily reward',
            style: LudoTextStyles.displaySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: LudoThemeTokens.spaceXs),
          Text(
            status.claimedToday
                ? 'Claimed for today. Come back tomorrow for day '
                      '${status.nextDay}.'
                : 'Day ${status.nextDay} is ready to claim.',
            textAlign: TextAlign.center,
            style: LudoTextStyles.body,
          ),
          const SizedBox(height: LudoThemeTokens.spaceMd),
          LayoutBuilder(
            builder: (context, constraints) {
              const gap = LudoThemeTokens.spaceSm;
              final tileWidth = ((constraints.maxWidth - gap * 3) / 4)
                  .floorToDouble();
              return Wrap(
                alignment: WrapAlignment.center,
                spacing: gap,
                runSpacing: gap,
                children: [
                  for (final day in status.calendar)
                    LudoDailyRewardTile(
                      day: day,
                      width: tileWidth,
                      state: _tileState(status, day.day),
                      bonusPercent: status.passActive
                          ? status.passBonusPercent
                          : 0,
                    ),
                ],
              );
            },
          ),
          const SizedBox(height: LudoThemeTokens.spaceMd),
          _passNote(status),
          const SizedBox(height: LudoThemeTokens.spaceMd),
          _claimButton(state, status),
        ],
      ),
    );
  }

  LudoDayTileState _tileState(LudoDailyRewardStatus status, int day) {
    if (status.claimedToday) {
      return day <= status.streakDay
          ? LudoDayTileState.claimed
          : LudoDayTileState.upcoming;
    }
    if (day == status.nextDay) return LudoDayTileState.today;
    return day < status.nextDay && status.streakDay > 0
        ? LudoDayTileState.claimed
        : LudoDayTileState.upcoming;
  }

  Widget _passNote(LudoDailyRewardStatus status) {
    final text = status.passActive
        ? 'Vortex Pass active: +${status.passBonusPercent}% on every '
              'daily reward.'
        : 'Vortex Pass members get +${status.passBonusPercent}% on every '
              'daily reward.';
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.workspace_premium,
          size: 20,
          color: status.passActive
              ? LudoThemeTokens.gold
              : LudoThemeTokens.textOnDark,
        ),
        const SizedBox(width: LudoThemeTokens.spaceXs),
        Flexible(
          child: Text(
            text,
            key: const Key('daily-reward-pass-note'),
            style: LudoTextStyles.caption,
          ),
        ),
      ],
    );
  }

  Widget _claimButton(
    LudoDailyRewardState state,
    LudoDailyRewardStatus status,
  ) {
    final enabled = !status.claimedToday && !state.isClaiming;
    final label = status.claimedToday
        ? 'Claimed today'
        : 'Claim day ${status.nextDay} reward';
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _minTapTarget),
      child: Ludo3dButton(
        key: const Key('daily-reward-claim'),
        semanticLabel: status.claimedToday
            ? 'Daily reward already claimed today'
            : 'Claim daily reward',
        color: enabled
            ? LudoThemeTokens.gold
            : LudoThemeTokens.backgroundMidBlue,
        onPressed: enabled ? () => unawaited(_claim()) : null,
        child: Center(
          child: state.isClaiming
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 3),
                )
              : Text(
                  label,
                  style: LudoTextStyles.bodyStrong.copyWith(
                    color: enabled
                        ? LudoThemeTokens.textOutline
                        : LudoThemeTokens.textOnDark,
                  ),
                ),
        ),
      ),
    );
  }

  Widget _adsPanel(LudoRewardedAdsState ads) {
    final enabled = ads.isAvailable && ads.watching == null;
    return LudoPanel(
      key: const Key('free-rewards-panel'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Free rewards',
            style: LudoTextStyles.displaySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: LudoThemeTokens.spaceXs),
          Text(
            ads.isAvailable
                ? 'Watch a short video to earn currency.'
                : 'Rewarded ads are not available in this build.',
            textAlign: TextAlign.center,
            style: LudoTextStyles.caption,
          ),
          const SizedBox(height: LudoThemeTokens.spaceMd),
          for (final type in LudoCurrency.values) ...[
            LudoWatchAdRow(
              currency: type,
              unit: ads.unit(type),
              watching: ads.watching == type,
              enabled: enabled,
              onWatch: () => unawaited(_watch(type)),
            ),
            if (type != LudoCurrency.values.last)
              const SizedBox(height: LudoThemeTokens.spaceSm),
          ],
        ],
      ),
    );
  }

  Widget _retryButton(Future<void> Function() onRetry) {
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _minTapTarget),
      child: Ludo3dButton(
        key: const Key('daily-reward-retry'),
        semanticLabel: 'Retry loading rewards',
        onPressed: () => unawaited(onRetry()),
        child: Text(
          'Retry',
          style: LudoTextStyles.bodyStrong.copyWith(
            color: LudoThemeTokens.textOutline,
          ),
        ),
      ),
    );
  }

  Widget _messageBanner() {
    return Padding(
      padding: const EdgeInsets.only(top: LudoThemeTokens.spaceSm),
      child: Semantics(
        liveRegion: true,
        label: _message,
        excludeSemantics: true,
        child: Container(
          key: const Key('daily-reward-message'),
          width: double.infinity,
          padding: const EdgeInsets.all(LudoThemeTokens.spaceSm),
          decoration: BoxDecoration(
            color:
                (_messageIsError
                        ? LudoThemeTokens.seatRed
                        : LudoThemeTokens.seatGreen)
                    .withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(LudoThemeTokens.radiusMd),
            border: Border.all(
              color: _messageIsError
                  ? LudoThemeTokens.seatRed
                  : LudoThemeTokens.seatGreen,
              width: 2,
            ),
          ),
          child: Text(
            _message!,
            textAlign: TextAlign.center,
            style: LudoTextStyles.body,
          ),
        ),
      ),
    );
  }
}
