/// The production [LudoRewardedAdSdk]: Google's `google_mobile_ads` plugin and
/// its UMP consent API (task 26h). Kept out of `ludo_ads_service.dart` so the
/// orchestration logic and its tests never import the platform plugin.
///
/// Only Android and iOS are supported by the plugin; on any other platform
/// (and in widget tests) [isSupportedPlatform] is `false` and callers fall
/// back to a build with no ads.
library;

import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show debugPrint;
import 'package:google_mobile_ads/google_mobile_ads.dart';

import 'ludo_ads_service.dart';

bool get isSupportedPlatform {
  try {
    return Platform.isAndroid || Platform.isIOS;
  } on Object {
    return false;
  }
}

bool get isAndroidPlatform {
  try {
    return Platform.isAndroid;
  } on Object {
    return false;
  }
}

final class GoogleLudoRewardedAdSdk implements LudoRewardedAdSdk {
  const GoogleLudoRewardedAdSdk();

  @override
  Future<LudoConsentOutcome> gatherConsent({
    required bool showFormIfRequired,
  }) async {
    final info = ConsentInformation.instance;
    final updated = Completer<bool>();
    // No age signal is collected anywhere in the app, so users are not
    // tagged as under the age of consent (see ludo_ads_service.dart).
    info.requestConsentInfoUpdate(
      ConsentRequestParameters(tagForUnderAgeOfConsent: false),
      () => updated.complete(true),
      (error) => updated.complete(false),
    );
    final ok = await updated.future;
    if (!ok) {
      // A cached "can request ads" answer still holds offline.
      return await info.canRequestAds()
          ? LudoConsentOutcome.canRequestAds
          : LudoConsentOutcome.unavailable;
    }
    if (showFormIfRequired) {
      final dismissed = Completer<void>();
      await ConsentForm.loadAndShowConsentFormIfRequired((_) {
        if (!dismissed.isCompleted) dismissed.complete();
      });
      await dismissed.future;
    }
    return await info.canRequestAds()
        ? LudoConsentOutcome.canRequestAds
        : LudoConsentOutcome.consentDeclined;
  }

  @override
  Future<void> initialize() async {
    final status = await MobileAds.instance.initialize();
    final adapters = status.adapterStatuses.entries
        .map(
          (e) =>
              '${e.key}=${e.value.state.name} '
              '(latency=${e.value.latency}ms, "${e.value.description}")',
        )
        .join(', ');
    debugPrint('[LudoAds] sdk initialized adapters: $adapters');
  }

  @override
  Future<LudoRewardedAdHandle?> load({
    required String adUnitId,
    required String ssvUserId,
    required String customData,
  }) {
    final completer = Completer<LudoRewardedAdHandle?>();
    unawaited(
      RewardedAd.load(
        adUnitId: adUnitId,
        request: const AdRequest(),
        rewardedAdLoadCallback: RewardedAdLoadCallback(
          onAdLoaded: (ad) {
            unawaited(
              ad
                  .setServerSideOptions(
                    ServerSideVerificationOptions(
                      userId: ssvUserId,
                      customData: customData,
                    ),
                  )
                  .then<void>((_) {}, onError: (Object _) {})
                  .whenComplete(() {
                    if (!completer.isCompleted) {
                      completer.complete(_GoogleRewardedAdHandle(ad));
                    }
                  }),
            );
          },
          onAdFailedToLoad: (error) {
            if (!completer.isCompleted) {
              completer.completeError(
                LudoAdLoadException(
                  code: error.code,
                  domain: error.domain,
                  message: error.message,
                ),
              );
            }
          },
        ),
      ),
    );
    return completer.future;
  }
}

final class _GoogleRewardedAdHandle implements LudoRewardedAdHandle {
  _GoogleRewardedAdHandle(this._ad);

  final RewardedAd _ad;

  @override
  Future<bool> show() {
    final done = Completer<bool>();
    var earned = false;
    _ad.fullScreenContentCallback = FullScreenContentCallback<RewardedAd>(
      onAdDismissedFullScreenContent: (_) {
        if (!done.isCompleted) done.complete(earned);
      },
      onAdFailedToShowFullScreenContent: (_, _) {
        if (!done.isCompleted) done.complete(false);
      },
    );
    unawaited(
      _ad.show(onUserEarnedReward: (_, _) => earned = true).catchError((
        Object _,
      ) {
        if (!done.isCompleted) done.complete(false);
      }),
    );
    return done.future;
  }

  @override
  void dispose() => _ad.dispose();
}
