// Shared harness for the task 26h rewards tests: the real LudoGateway /
// LudoAuthController / LudoWalletState stack over a scripted transport (the
// 26g StoreHarness), plus the daily reward and rewarded-ad states over a fake
// ad SDK double. Never the network or a plugin channel.
import 'package:ludo/src/net/ludo_ads_config.dart';
import 'package:ludo/src/net/ludo_ads_service.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:ludo/src/state/ludo_daily_reward_state.dart';
import 'package:ludo/src/state/ludo_rewarded_ads_state.dart';

import '../net/ludo_ads_test_support.dart';
import '../net/ludo_test_support.dart';
import 'ludo_store_test_support.dart';

const _calendar = [
  (1, 200, 0),
  (2, 250, 0),
  (3, 300, 0),
  (4, 350, 0),
  (5, 400, 0),
  (6, 500, 0),
  (7, 750, 5),
];

/// `GET daily-reward` body.
Map<String, Object?> dailyStatusBody({
  bool claimedToday = false,
  int streakDay = 2,
  int nextDay = 3,
  bool passActive = false,
}) => {
  'claimedToday': claimedToday,
  'streakDay': streakDay,
  'nextDay': nextDay,
  'calendar': [
    for (final (day, coins, diamonds) in _calendar)
      {'day': day, 'coins': coins, 'diamonds': diamonds},
  ],
  'passActive': passActive,
  'passBonusPercent': 50,
};

/// `POST daily-reward/claim` body (what the server returns).
Map<String, Object?> dailyClaimBody({
  int streakDay = 3,
  int coinsGranted = 300,
  int diamondsGranted = 0,
  int bonusCoins = 0,
  int bonusDiamonds = 0,
  bool passBonusApplied = false,
  int coins = 2300,
  int diamonds = 40,
}) => {
  'streakDay': streakDay,
  'coinsGranted': coinsGranted,
  'diamondsGranted': diamondsGranted,
  'bonusCoins': bonusCoins,
  'bonusDiamonds': bonusDiamonds,
  'passBonusApplied': passBonusApplied,
  'coins': coins,
  'diamonds': diamonds,
};

/// `GET ads/rewarded/status` body.
Map<String, Object?> adsStatusBody({
  int coinsClaimed = 0,
  int diamondsClaimed = 0,
}) => {
  'ssvUserId': 'uid-1',
  'coins': {
    'rewardAmount': 100,
    'dailyCap': 5,
    'claimedToday': coinsClaimed,
    'remaining': 5 - coinsClaimed,
  },
  'diamonds': {
    'rewardAmount': 5,
    'dailyCap': 2,
    'claimedToday': diamondsClaimed,
    'remaining': 2 - diamondsClaimed,
  },
};

LudoHttpResponse jsonOk(Object? body) => jsonResponse(body);

final class RewardsHarness {
  RewardsHarness._({
    required this.base,
    required this.sdk,
    required this.adsService,
    required this.daily,
    required this.ads,
  });

  final StoreHarness base;
  final FakeRewardedAdSdk sdk;
  final LudoAdsService adsService;
  final LudoDailyRewardState daily;
  final LudoRewardedAdsState ads;

  StoreScriptTransport get transport => base.transport;

  static RewardsHarness create({
    Map<String, List<LudoHttpResponse>> script = const {},
    FakeRewardedAdSdk? sdk,
    LudoAdsConfig? config,
    int pollAttempts = 3,
  }) {
    final base = StoreHarness.create(
      script: {
        'GET daily-reward': [jsonOk(dailyStatusBody())],
        'GET ads/rewarded/status': [jsonOk(adsStatusBody())],
        ...script,
      },
    );
    final fakeSdk = sdk ?? FakeRewardedAdSdk();
    final adsService = LudoAdsService(
      sdk: fakeSdk,
      config: config ?? LudoAdsConfig.resolve(isAndroid: true),
    );
    return RewardsHarness._(
      base: base,
      sdk: fakeSdk,
      adsService: adsService,
      daily: LudoDailyRewardState(
        gateway: base.gateway,
        authController: base.auth,
        walletState: base.wallet,
      ),
      ads: LudoRewardedAdsState(
        gateway: base.gateway,
        authController: base.auth,
        walletState: base.wallet,
        ads: adsService,
        pollAttempts: pollAttempts,
        delay: (_) async {},
      ),
    );
  }
}
