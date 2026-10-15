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

final class LudoAdWatchResult {
  const LudoAdWatchResult(this.status, {this.message});

  final LudoAdWatchStatus status;

  /// A short diagnostic, never shown as a stack trace.
  final String? message;

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
  /// [ssvUserId] and [customData]. Returns `null` when no ad could be loaded.
  Future<LudoRewardedAdHandle?> load({
    required String adUnitId,
    required String ssvUserId,
    required String customData,
  });
}

/// Shows rewarded ads one at a time.
class LudoAdsService {
  LudoAdsService({required this.sdk, required this.config});

  final LudoRewardedAdSdk sdk;
  final LudoAdsConfig config;

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
        return const LudoAdWatchResult(
          LudoAdWatchStatus.loadFailed,
          message: 'Consent status unavailable',
        );
      }
      if (!_sdkInitialized) {
        await sdk.initialize();
        _sdkInitialized = true;
      }
      ad = await sdk.load(
        adUnitId: adUnitId,
        ssvUserId: ssvUserId,
        customData: rewardType,
      );
      if (ad == null) {
        return const LudoAdWatchResult(LudoAdWatchStatus.loadFailed);
      }
      final earned = await ad.show();
      return LudoAdWatchResult(
        earned
            ? LudoAdWatchStatus.earnedReward
            : LudoAdWatchStatus.dismissedNoReward,
      );
    } on Object catch (error) {
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
