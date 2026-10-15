/// The process-wide [LudoAdsService] (task 26h), mirroring the
/// `LudoDeepLinkRouter.instance` precedent: screens read [ludoAds] instead of
/// threading a service through the whole navigation chain, and tests swap it
/// with [setLudoAdsForTesting].
library;

import 'package:flutter/foundation.dart' show visibleForTesting;

import 'ludo_ads_config.dart';
import 'ludo_ads_service.dart';
import 'ludo_google_ads_sdk.dart';

/// Reports "no ad" for everything; used where the plugin is unsupported.
final class _NoAdsSdk implements LudoRewardedAdSdk {
  const _NoAdsSdk();

  @override
  Future<LudoConsentOutcome> gatherConsent({
    required bool showFormIfRequired,
  }) async => LudoConsentOutcome.unavailable;

  @override
  Future<void> initialize() async {}

  @override
  Future<LudoRewardedAdHandle?> load({
    required String adUnitId,
    required String ssvUserId,
    required String customData,
  }) async => null;
}

LudoAdsService? _override;
LudoAdsService? _production;

/// The ads service for this process. Production: the Google SDK with the
/// guarded [LudoAdsConfig] on Android/iOS, and a service with ads disabled on
/// every other platform (desktop runs, unit tests).
LudoAdsService get ludoAds {
  final override = _override;
  if (override != null) return override;
  return _production ??= _createProduction();
}

LudoAdsService _createProduction() {
  if (!isSupportedPlatform) {
    return LudoAdsService(
      sdk: const _NoAdsSdk(),
      config: LudoAdsConfig.disabled,
    );
  }
  return LudoAdsService(
    sdk: const GoogleLudoRewardedAdSdk(),
    config: LudoAdsConfig.resolve(isAndroid: isAndroidPlatform),
  );
}

@visibleForTesting
void setLudoAdsForTesting(LudoAdsService? service) => _override = service;

/// Startup hook (called from `main`): refreshes UMP consent info in the
/// background without showing a form. Never throws, never blocks `runApp`.
Future<void> prepareLudoAdsConsent() => ludoAds.prepareConsent();
