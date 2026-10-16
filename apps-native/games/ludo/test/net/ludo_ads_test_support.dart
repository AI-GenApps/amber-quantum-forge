// Fake ad SDK double for the task 26h tests: records every call in order and
// never touches the ad network or a platform channel.
import 'dart:async';

import 'package:ludo/src/net/ludo_ads_service.dart';

final class FakeRewardedAd implements LudoRewardedAdHandle {
  FakeRewardedAd({this.earnsReward = true, this.throwsOnShow = false});

  final bool earnsReward;
  final bool throwsOnShow;
  int showCalls = 0;
  bool disposed = false;

  /// Complete this to hold the ad "on screen" until a test releases it.
  Completer<void>? hold;

  @override
  Future<bool> show() async {
    showCalls += 1;
    if (throwsOnShow) throw StateError('show failed');
    await hold?.future;
    return earnsReward;
  }

  @override
  void dispose() => disposed = true;
}

final class FakeRewardedAdSdk implements LudoRewardedAdSdk {
  FakeRewardedAdSdk({
    this.consent = LudoConsentOutcome.canRequestAds,
    FakeRewardedAd? ad,
    this.hasAd = true,
  }) : ad = ad ?? FakeRewardedAd();

  LudoConsentOutcome consent;
  final FakeRewardedAd ad;
  bool hasAd;
  bool throwsOnLoad = false;

  /// When set, `load` throws it (the SDK's onAdFailedToLoad).
  LudoAdLoadException? loadFailure;

  /// When set, `load` never answers until this completes.
  Completer<void>? loadHold;

  /// Ordered log: `consent(form)`, `consent(no form)`, `initialize`,
  /// `load:<adUnit>|<userId>|<customData>`.
  final calls = <String>[];

  @override
  Future<LudoConsentOutcome> gatherConsent({
    required bool showFormIfRequired,
  }) async {
    calls.add(showFormIfRequired ? 'consent(form)' : 'consent(no form)');
    return consent;
  }

  @override
  Future<void> initialize() async => calls.add('initialize');

  @override
  Future<LudoRewardedAdHandle?> load({
    required String adUnitId,
    required String ssvUserId,
    required String customData,
  }) async {
    calls.add('load:$adUnitId|$ssvUserId|$customData');
    if (throwsOnLoad) throw StateError('load failed');
    await loadHold?.future;
    final failure = loadFailure;
    if (failure != null) throw failure;
    return hasAd ? ad : null;
  }
}
