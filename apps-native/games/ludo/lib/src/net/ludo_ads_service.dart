/// Rewarded-ad orchestration (task 26h): UMP consent, SDK initialization and
/// one rewarded ad per call, behind a small SDK seam ([LudoRewardedAdSdk]) so
/// every flow is testable with a double and CI never makes an ad-network call.
///
/// The service only shows ads. It never credits anything: the reward is
/// granted by the server when AdMob's signed server-side-verification
/// callback lands (`POST/GET .../ads/rewarded/callback`), and the client
/// merely refreshes its wallet afterwards (`LudoRewardedAdsState`).
///
/// Age signal: onboarding (task 07) collects only a name and an avatar, no
/// age, so underage tagging is not applicable in v1 and consent is requested
/// with `tagForUnderAgeOfConsent: false`. This is documented in the task's
/// decisions log, not worked around with an invented age gate.
library;

import 'dart:async';

import 'package:flutter/foundation.dart' show debugPrint;

import 'ludo_ads_config.dart';

/// Outcome of the UMP consent step.
enum LudoConsentOutcome {
  /// Ads may be requested (consent obtained or not required).
  canRequestAds,

  /// The user must consent first and has not, so no ad may be requested.
  consentDeclined,

  /// Consent could not be determined (offline, SDK error).
  unavailable,
}

/// How a single ad attempt ended.
enum LudoAdWatchStatus {
  /// The user earned the reward; the server now credits it asynchronously.
  earnedReward,

  /// The ad was closed before the reward was earned.
  dismissedNoReward,

  /// No fill, network error or a failure to show.
  loadFailed,

  /// Ads are not configured in this build.
  unavailable,

  /// The user has not given the consent required to request ads.
  consentRequired,

  /// Another ad is already loading or showing.
  busy,
}

/// Why an ad load failed, so the UI can tell "no network" from "no fill".
enum LudoAdFailureKind {
  /// The ad network could not be reached (AdMob error code 2, a consent
  /// refresh that could not connect, or a load that never answered).
  network,

  /// The network answered but had no ad to serve (AdMob error code 3).
  noFill,

  /// The device's own ad runtime is broken: the SDK could not start its
  /// JavaScript engine (Android System WebView or Google Play services is
  /// missing, outdated or disabled). Device 26h: every load failed with
  /// `code=0 ... Unable to obtain a JavascriptEngine.`; the player can fix it
  /// by updating those two apps, so it must not read as "no ad right now".
  engineUnavailable,

  /// Any other SDK failure (internal error, invalid request, show failure).
  other,
}

/// A rewarded-ad load that failed, as reported by the SDK. Carries the SDK's
/// own error code, domain and message so the failure is diagnosable from the
/// device log and the screen (device evidence 26h: every load failed with a
/// generic "no ad" message and the cause was undiagnosable).
final class LudoAdLoadException implements Exception {
  const LudoAdLoadException({
    required this.code,
    required this.domain,
    required this.message,
  });

  final int code;
  final String domain;
  final String message;

  /// AdMob codes: 0 internal, 1 invalid request, 2 network error, 3 no fill.
  LudoAdFailureKind get kind {
    if (code == 0 && message.toLowerCase().contains('javascriptengine')) {
      return LudoAdFailureKind.engineUnavailable;
    }
    return switch (code) {
      2 => LudoAdFailureKind.network,
      3 => LudoAdFailureKind.noFill,
      _ => LudoAdFailureKind.other,
    };
  }

  /// `code=2 domain=com.google.android.gms.ads message=...`
  String get detail => 'code=$code domain=$domain message=$message';

  @override
  String toString() => 'LudoAdLoadException($detail)';
}

final class LudoAdWatchResult {
  const LudoAdWatchResult(
    this.status, {
    this.message,
    this.failureKind = LudoAdFailureKind.other,
  });

  final LudoAdWatchStatus status;

  /// A short diagnostic (the SDK error code, domain and message for a failed
  /// load), never shown as a stack trace.
  final String? message;

  /// Meaningful only when [status] is [LudoAdWatchStatus.loadFailed].
  final LudoAdFailureKind failureKind;

  bool get earned => status == LudoAdWatchStatus.earnedReward;
}

/// A loaded rewarded ad, ready to show once.
abstract interface class LudoRewardedAdHandle {
  /// Shows the ad and completes when it is dismissed (or failed to show).
  /// Completes `true` when the user earned the reward before dismissing.
  Future<bool> show();

  void dispose();
}

/// The seam over `google_mobile_ads` (see `ludo_google_ads_sdk.dart`).
abstract interface class LudoRewardedAdSdk {
  /// Refreshes UMP consent info and, only when the user's region requires it
  /// and they have not answered, shows the consent form.
  Future<LudoConsentOutcome> gatherConsent({required bool showFormIfRequired});

  /// Initializes the Mobile Ads SDK. Called only after consent allows ads.
  Future<void> initialize();

  /// Loads a rewarded ad whose server-side-verification options carry
  /// [ssvUserId] and [customData]. Returns `null` when no ad could be loaded
  /// and throws a [LudoAdLoadException] when the SDK reports why it failed.
  Future<LudoRewardedAdHandle?> load({
    required String adUnitId,
    required String ssvUserId,
    required String customData,
  });
}

/// Shows rewarded ads one at a time.
class LudoAdsService {
  LudoAdsService({
    required this.sdk,
    required this.config,
    this.loadTimeout = const Duration(seconds: 45),
    void Function(String line)? log,
  }) : _log = log ?? debugPrint;

  final LudoRewardedAdSdk sdk;
  final LudoAdsConfig config;

  /// How long one ad load may take before it is reported as a network
  /// failure instead of leaving the Watch button spinning.
  final Duration loadTimeout;
  final void Function(String line) _log;

  bool _sdkInitialized = false;
  bool _busy = false;

  /// `true` when an ad could be requested in this build at all.
  bool get isAvailable => config.enabled;

  /// `true` while an ad is loading or showing.
  bool get isBusy => _busy;

  /// Startup hook: refreshes consent info without showing any form (the form
  /// waits until the first ad is requested). Never throws.
  Future<void> prepareConsent() async {
    if (!config.enabled) return;
    try {
      await sdk.gatherConsent(showFormIfRequired: false);
    } on Object {
      // Consent is re-checked, with the form, before the first ad request.
    }
  }

  /// Loads and shows one rewarded ad of [rewardType] (`coins` or `diamonds`)
  /// for [ssvUserId]. Shows the UMP consent form first when required, before
  /// any ad request. Never throws.
  Future<LudoAdWatchResult> watch({
    required String rewardType,
    required String ssvUserId,
  }) async {
    final adUnitId = config.adUnitFor(rewardType);
    if (!config.enabled || adUnitId == null) {
      return const LudoAdWatchResult(LudoAdWatchStatus.unavailable);
    }
    if (_busy) return const LudoAdWatchResult(LudoAdWatchStatus.busy);
    _busy = true;
    LudoRewardedAdHandle? ad;
    try {
      final consent = await sdk.gatherConsent(showFormIfRequired: true);
      if (consent == LudoConsentOutcome.consentDeclined) {
        return const LudoAdWatchResult(LudoAdWatchStatus.consentRequired);
      }
      if (consent == LudoConsentOutcome.unavailable) {
        _log('[LudoAds] consent status unavailable (offline or SDK error)');
        return const LudoAdWatchResult(
          LudoAdWatchStatus.loadFailed,
          message: 'Consent status unavailable',
          failureKind: LudoAdFailureKind.network,
        );
      }
      if (!_sdkInitialized) {
        await sdk.initialize();
        _sdkInitialized = true;
      }
      // Only the requested ad unit id is logged (never a user id): the device
      // check is that it is Google's sample publisher in a debug build.
      _log('[LudoAds] request reward=$rewardType unit=$adUnitId');
      try {
        ad = await sdk
            .load(
              adUnitId: adUnitId,
              ssvUserId: ssvUserId,
              customData: rewardType,
            )
            .timeout(loadTimeout);
      } on LudoAdLoadException catch (error) {
        _log('[LudoAds] load failed ${error.detail}');
        return LudoAdWatchResult(
          LudoAdWatchStatus.loadFailed,
          message: error.detail,
          failureKind: error.kind,
        );
      } on TimeoutException {
        _log('[LudoAds] load timed out after ${loadTimeout.inSeconds}s');
        return LudoAdWatchResult(
          LudoAdWatchStatus.loadFailed,
          message: 'timeout after ${loadTimeout.inSeconds}s',
          failureKind: LudoAdFailureKind.network,
        );
      }
      if (ad == null) {
        _log('[LudoAds] load returned no ad');
        return const LudoAdWatchResult(
          LudoAdWatchStatus.loadFailed,
          message: 'no ad returned',
          failureKind: LudoAdFailureKind.noFill,
        );
      }
      _log('[LudoAds] ad loaded, showing');
      final earned = await ad.show();
      return LudoAdWatchResult(
        earned
            ? LudoAdWatchStatus.earnedReward
            : LudoAdWatchStatus.dismissedNoReward,
      );
    } on Object catch (error) {
      _log('[LudoAds] failed ${error.runtimeType}');
      return LudoAdWatchResult(
        LudoAdWatchStatus.loadFailed,
        message: error.runtimeType.toString(),
      );
    } finally {
      ad?.dispose();
      _busy = false;
    }
  }
}
