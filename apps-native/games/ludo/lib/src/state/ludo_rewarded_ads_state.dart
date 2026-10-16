/// Rewarded-ad flow state (task 26h): the per-type daily allowance from the
/// server, and the watch action that shows an ad through [LudoAdsService].
///
/// The client never credits itself. After the user earns the reward the
/// server credits it when AdMob's signed callback lands, so this class polls
/// the server's ad status (and refreshes the wallet) until the claim shows up,
/// reporting [LudoAdWatchOutcome.rewardPending] if it has not yet.
library;

import 'package:flutter/foundation.dart';

import '../net/ludo_ads_service.dart';
import '../net/ludo_auth_controller.dart';
import '../net/ludo_gateway.dart';
import '../net/ludo_rewards_models.dart';
import 'ludo_inventory_state.dart' show LudoCurrency;
import 'ludo_wallet_state.dart';

/// What happened after a "watch ad" tap.
enum LudoAdWatchOutcome {
  /// The server credited the reward and the wallet shows it.
  credited,

  /// The ad was watched but the server has not credited it yet.
  rewardPending,
  dismissedNoReward,
  noAdAvailable,

  /// The ad network could not be reached (no connection to Google's ad
  /// servers, or the load never answered), as opposed to no fill.
  adNetworkError,

  /// The device's ad runtime (Android System WebView / Google Play services)
  /// could not start, so no ad can load until the player updates them.
  adEngineUnavailable,
  consentRequired,
  dailyLimitReached,
  unavailable,
  offline,
  busy,
}

typedef LudoPollDelay = Future<void> Function(Duration duration);

class LudoRewardedAdsState extends ChangeNotifier {
  LudoRewardedAdsState({
    required this.gateway,
    required this.authController,
    required this.walletState,
    required this.ads,
    this.pollAttempts = 6,
    this.pollInterval = const Duration(milliseconds: 1500),
    LudoPollDelay? delay,
  }) : _delay = delay ?? Future<void>.delayed;

  final LudoGateway gateway;
  final LudoAuthController authController;
  final LudoWalletState walletState;
  final LudoAdsService ads;

  /// How many times to ask the server whether the SSV credit has landed.
  final int pollAttempts;
  final Duration pollInterval;
  final LudoPollDelay _delay;

  LudoRewardedAdsStatus? _status;
  LudoCurrency? _watching;
  bool _isOffline = false;
  String? _lastFailureDetail;

  LudoRewardedAdsStatus? get status => _status;

  /// The reward type whose ad is loading/showing or awaiting its credit.
  LudoCurrency? get watching => _watching;
  bool get isOffline => _isOffline;

  /// The SDK's error code, domain and message from the last failed ad load,
  /// or `null`. Shown only in debug builds.
  String? get lastFailureDetail => _lastFailureDetail;

  /// `true` when ads can be requested in this build at all.
  bool get isAvailable => ads.isAvailable;

  LudoAdUnitStatus? unit(LudoCurrency type) {
    final status = _status;
    if (status == null) return null;
    return type == LudoCurrency.coins ? status.coins : status.diamonds;
  }

  Future<void> load() async {
    try {
      final token = await authController.ensureGameToken();
      _status = await gateway.getRewardedAdsStatus(gameToken: token);
      _isOffline = false;
    } on Object {
      _isOffline = true;
    }
    notifyListeners();
  }

  Future<LudoAdWatchOutcome> watch(LudoCurrency type) async {
    if (_watching != null) return LudoAdWatchOutcome.busy;
    if (!ads.isAvailable) return LudoAdWatchOutcome.unavailable;
    _watching = type;
    notifyListeners();
    try {
      await load();
      final status = _status;
      if (status == null) return LudoAdWatchOutcome.offline;
      final before = unit(type)!;
      if (before.remaining <= 0) return LudoAdWatchOutcome.dailyLimitReached;

      _lastFailureDetail = null;
      final result = await ads.watch(
        rewardType: type.wire,
        ssvUserId: status.ssvUserId,
      );
      switch (result.status) {
        case LudoAdWatchStatus.unavailable:
          return LudoAdWatchOutcome.unavailable;
        case LudoAdWatchStatus.consentRequired:
          return LudoAdWatchOutcome.consentRequired;
        case LudoAdWatchStatus.busy:
          return LudoAdWatchOutcome.busy;
        case LudoAdWatchStatus.loadFailed:
          _lastFailureDetail = result.message;
          return switch (result.failureKind) {
            LudoAdFailureKind.network => LudoAdWatchOutcome.adNetworkError,
            LudoAdFailureKind.engineUnavailable =>
              LudoAdWatchOutcome.adEngineUnavailable,
            LudoAdFailureKind.noFill ||
            LudoAdFailureKind.other => LudoAdWatchOutcome.noAdAvailable,
          };
        case LudoAdWatchStatus.dismissedNoReward:
          return LudoAdWatchOutcome.dismissedNoReward;
        case LudoAdWatchStatus.earnedReward:
          return await _awaitServerCredit(type, before.claimedToday);
      }
    } finally {
      _watching = null;
      notifyListeners();
    }
  }

  Future<LudoAdWatchOutcome> _awaitServerCredit(
    LudoCurrency type,
    int claimedBefore,
  ) async {
    for (var attempt = 0; attempt < pollAttempts; attempt++) {
      if (attempt > 0) await _delay(pollInterval);
      await load();
      final now = unit(type);
      if (now != null && now.claimedToday > claimedBefore) {
        await walletState.refresh();
        return LudoAdWatchOutcome.credited;
      }
    }
    await walletState.refresh();
    return LudoAdWatchOutcome.rewardPending;
  }
}
