/// Debug-only rewards scripting for the online preview mode (task 26h).
///
/// `PreviewLudoTransport` delegates the daily-reward and rewarded-ad status
/// routes here, so a physical device can walk the calendar claim and a full
/// rewarded-ad watch with no deployed backend, through the exact production
/// `LudoGateway` / `LudoDailyRewardState` / `LudoRewardedAdsState` code path.
/// The real server credits an ad when AdMob's signed callback arrives;
/// [PreviewServerCreditAdSdk] stands in for that callback after a genuinely
/// watched (test) ad, queueing a credit this backend applies on the next
/// wallet or ad-status read, just as the real server's credit lands
/// asynchronously. None of this ships outside a debug build: it is only
/// reachable while the preview mode is armed.
library;

import 'dart:convert';

import 'ludo_ads_service.dart';
import 'ludo_http.dart';
import 'ludo_wire_json.dart' show ludoContractVersion;

const _calendar = <({int day, int coins, int diamonds})>[
  (day: 1, coins: 200, diamonds: 0),
  (day: 2, coins: 250, diamonds: 0),
  (day: 3, coins: 300, diamonds: 0),
  (day: 4, coins: 350, diamonds: 0),
  (day: 5, coins: 400, diamonds: 0),
  (day: 6, coins: 500, diamonds: 0),
  (day: 7, coins: 750, diamonds: 5),
];

const _coinAdAmount = 100;
const _coinAdCap = 5;
const _diamondAdAmount = 5;
const _diamondAdCap = 2;

/// Scripted rewards routes for the preview transport.
final class PreviewRewardsBackend {
  /// The backend the running preview transport uses, so the ad decorator can
  /// reach it. Replaced by every new transport.
  static PreviewRewardsBackend current = PreviewRewardsBackend();

  // The preview starts with days 1 and 2 already claimed, so the calendar
  // shows claimed, today and upcoming tiles at once.
  bool _claimedToday = false;
  int _streakDay = 2;
  int _coinAds = 0;
  int _diamondAds = 0;
  final _pendingAdCredits = <String>[];

  /// Called by [PreviewServerCreditAdSdk] after the user earned a reward.
  void queueAdCredit(String rewardType) => _pendingAdCredits.add(rewardType);

  /// Applies queued ad credits within the daily caps and returns the new
  /// balances.
  ({int coins, int diamonds}) applyPendingAdCredits(int coins, int diamonds) {
    var newCoins = coins;
    var newDiamonds = diamonds;
    for (final type in _pendingAdCredits) {
      if (type == 'coins' && _coinAds < _coinAdCap) {
        _coinAds += 1;
        newCoins += _coinAdAmount;
      } else if (type == 'diamonds' && _diamondAds < _diamondAdCap) {
        _diamondAds += 1;
        newDiamonds += _diamondAdAmount;
      }
    }
    _pendingAdCredits.clear();
    return (coins: newCoins, diamonds: newDiamonds);
  }

  LudoHttpResponse? handle({
    required String method,
    required String path,
    required int coins,
    required int diamonds,
    required void Function(int coins, int diamonds) apply,
  }) {
    if (method == 'GET' && path == 'daily-reward') return _status();
    if (method == 'POST' && path == 'daily-reward/claim') {
      return _claim(coins, diamonds, apply);
    }
    if (method == 'GET' && path == 'ads/rewarded/status') return _adsStatus();
    return null;
  }

  /// The calendar day the next claim grants (tomorrow's once today is
  /// claimed, today's otherwise): always the day after the last claimed one.
  int get _nextDay => _streakDay >= 7 ? 1 : _streakDay + 1;

  LudoHttpResponse _status() => _json({
    'claimedToday': _claimedToday,
    'streakDay': _streakDay,
    'nextDay': _nextDay,
    'calendar': [
      for (final day in _calendar)
        {'day': day.day, 'coins': day.coins, 'diamonds': day.diamonds},
    ],
    'passActive': false,
    'passBonusPercent': 50,
  });

  LudoHttpResponse _claim(
    int coins,
    int diamonds,
    void Function(int coins, int diamonds) apply,
  ) {
    if (_claimedToday) return _error(409, 'ludo_daily_reward_already_claimed');
    final day = _calendar.firstWhere((entry) => entry.day == _nextDay);
    final newCoins = coins + day.coins;
    final newDiamonds = diamonds + day.diamonds;
    apply(newCoins, newDiamonds);
    _claimedToday = true;
    _streakDay = day.day;
    return _json({
      'streakDay': day.day,
      'coinsGranted': day.coins,
      'diamondsGranted': day.diamonds,
      'bonusCoins': 0,
      'bonusDiamonds': 0,
      'passBonusApplied': false,
      'coins': newCoins,
      'diamonds': newDiamonds,
    });
  }

  LudoHttpResponse _adsStatus() => _json({
    'ssvUserId': 'preview-guest',
    'coins': _unit(_coinAdAmount, _coinAdCap, _coinAds),
    'diamonds': _unit(_diamondAdAmount, _diamondAdCap, _diamondAds),
  });

  Map<String, Object?> _unit(int amount, int cap, int claimed) => {
    'rewardAmount': amount,
    'dailyCap': cap,
    'claimedToday': claimed,
    'remaining': cap - claimed,
  };

  LudoHttpResponse _json(Object? body) =>
      LudoHttpResponse(statusCode: 200, body: jsonEncode(body));

  LudoHttpResponse _error(int statusCode, String code) => LudoHttpResponse(
    statusCode: statusCode,
    body: jsonEncode({
      'contract_version': ludoContractVersion,
      'error': {
        'code': code,
        'message': 'preview error: $code',
        'diagnostic_id': 'preview',
      },
    }),
  );
}

/// Wraps the real ad SDK for the debug preview: the ad is real (a Google test
/// ad), and once the user earns its reward the preview backend is told to
/// credit it, standing in for AdMob's server-side-verification callback.
final class PreviewServerCreditAdSdk implements LudoRewardedAdSdk {
  const PreviewServerCreditAdSdk(this.inner);

  final LudoRewardedAdSdk inner;

  @override
  Future<LudoConsentOutcome> gatherConsent({
    required bool showFormIfRequired,
  }) => inner.gatherConsent(showFormIfRequired: showFormIfRequired);

  @override
  Future<void> initialize() => inner.initialize();

  @override
  Future<LudoRewardedAdHandle?> load({
    required String adUnitId,
    required String ssvUserId,
    required String customData,
  }) async {
    final ad = await inner.load(
      adUnitId: adUnitId,
      ssvUserId: ssvUserId,
      customData: customData,
    );
    if (ad == null) return null;
    return _CreditingHandle(ad, customData);
  }
}

final class _CreditingHandle implements LudoRewardedAdHandle {
  _CreditingHandle(this._inner, this._rewardType);

  final LudoRewardedAdHandle _inner;
  final String _rewardType;

  @override
  Future<bool> show() async {
    final earned = await _inner.show();
    if (earned) PreviewRewardsBackend.current.queueAdCredit(_rewardType);
    return earned;
  }

  @override
  void dispose() => _inner.dispose();
}
