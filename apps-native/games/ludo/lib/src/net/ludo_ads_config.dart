/// Which AdMob rewarded ad units the app may request (task 26h).
///
/// The guard is deliberately a pure function of its inputs so a test can
/// inspect it: a debug build resolves Google's sample test ad units and
/// nothing else, whatever `--dart-define` values are present, so a debug
/// build can never request or show a live ad. Only a non-debug build reads
/// real ad unit ids, from `--dart-define=LUDO_ADMOB_COIN_AD_UNIT_ID=...` and
/// `--dart-define=LUDO_ADMOB_DIAMOND_AD_UNIT_ID=...`, and an absent,
/// malformed or Google-test-publisher id disables ads instead of falling
/// back to anything (so a release build without console provisioning shows
/// no ads rather than test ads).
library;

import 'package:flutter/foundation.dart' show kDebugMode;

/// Google's published sample rewarded ad unit for Android.
const ludoAdMobTestRewardedAndroid = 'ca-app-pub-3940256099942544/5224354917';

/// Google's published sample rewarded ad unit for iOS.
const ludoAdMobTestRewardedIos = 'ca-app-pub-3940256099942544/1712485313';

/// Google's sample publisher id; no real ad unit ever uses it.
const ludoAdMobTestPublisher = 'ca-app-pub-3940256099942544';

const _coinAdUnitDefine = String.fromEnvironment('LUDO_ADMOB_COIN_AD_UNIT_ID');
const _diamondAdUnitDefine = String.fromEnvironment(
  'LUDO_ADMOB_DIAMOND_AD_UNIT_ID',
);

final _adUnitPattern = RegExp(r'^ca-app-pub-\d{16}/\d{10}$');

/// The resolved ad units. [enabled] is `false` when no ad may be requested.
final class LudoAdsConfig {
  const LudoAdsConfig._({
    required this.coinAdUnitId,
    required this.diamondAdUnitId,
    required this.usesTestAds,
  });

  /// No ad unit is usable: every ad request reports `unavailable`.
  static const disabled = LudoAdsConfig._(
    coinAdUnitId: null,
    diamondAdUnitId: null,
    usesTestAds: false,
  );

  /// Resolves the config for the current build. [isDebug] defaults to
  /// [kDebugMode]; [isAndroid] picks the matching sample unit. The
  /// `coinAdUnit`/`diamondAdUnit` strings default to the build-time defines
  /// and are only consulted when [isDebug] is `false`.
  factory LudoAdsConfig.resolve({
    bool isDebug = kDebugMode,
    required bool isAndroid,
    String coinAdUnit = _coinAdUnitDefine,
    String diamondAdUnit = _diamondAdUnitDefine,
  }) {
    if (isDebug) {
      final test = isAndroid
          ? ludoAdMobTestRewardedAndroid
          : ludoAdMobTestRewardedIos;
      return LudoAdsConfig._(
        coinAdUnitId: test,
        diamondAdUnitId: test,
        usesTestAds: true,
      );
    }
    final coin = _validRealUnit(coinAdUnit);
    final diamond = _validRealUnit(diamondAdUnit);
    if (coin == null || diamond == null) return disabled;
    return LudoAdsConfig._(
      coinAdUnitId: coin,
      diamondAdUnitId: diamond,
      usesTestAds: false,
    );
  }

  static String? _validRealUnit(String value) {
    final trimmed = value.trim();
    if (!_adUnitPattern.hasMatch(trimmed)) return null;
    if (trimmed.startsWith('$ludoAdMobTestPublisher/')) return null;
    return trimmed;
  }

  final String? coinAdUnitId;
  final String? diamondAdUnitId;

  /// `true` when these are Google's sample units (every debug build).
  final bool usesTestAds;

  bool get enabled => coinAdUnitId != null && diamondAdUnitId != null;

  /// The ad unit for a reward type's wire name (`coins` or `diamonds`).
  String? adUnitFor(String rewardType) => switch (rewardType) {
    'coins' => coinAdUnitId,
    'diamonds' => diamondAdUnitId,
    _ => null,
  };
}
