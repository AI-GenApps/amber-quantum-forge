// Task 26h: the guarded ad unit config (debug never requests a live ad) and
// the rewarded-ad service flow over a fake SDK. No ad network call is made.
import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_ads_config.dart';
import 'package:ludo/src/net/ludo_ads_service.dart';

import 'ludo_ads_test_support.dart';

const _realCoin = 'ca-app-pub-1234567890123456/1234567890';
const _realDiamond = 'ca-app-pub-1234567890123456/0987654321';

LudoAdsConfig _debug({bool android = true}) =>
    LudoAdsConfig.resolve(isDebug: true, isAndroid: android);

void main() {
  group('LudoAdsConfig guard', () {
    test('a debug build resolves only Google test ad units', () {
      final config = _debug();
      expect(config.usesTestAds, isTrue);
      expect(config.coinAdUnitId, ludoAdMobTestRewardedAndroid);
      expect(config.diamondAdUnitId, ludoAdMobTestRewardedAndroid);
      expect(_debug(android: false).coinAdUnitId, ludoAdMobTestRewardedIos);
      expect(config.coinAdUnitId, startsWith('$ludoAdMobTestPublisher/'));
    });

    test('a debug build ignores real ad unit ids even when supplied', () {
      final config = LudoAdsConfig.resolve(
        isDebug: true,
        isAndroid: true,
        coinAdUnit: _realCoin,
        diamondAdUnit: _realDiamond,
      );
      expect(config.coinAdUnitId, ludoAdMobTestRewardedAndroid);
      expect(config.diamondAdUnitId, ludoAdMobTestRewardedAndroid);
      expect(config.coinAdUnitId, isNot(_realCoin));
    });

    test(
      'this test run is a debug build, whose default config is test-only',
      () {
        final config = LudoAdsConfig.resolve(isAndroid: true);
        expect(config.usesTestAds, isTrue);
        expect(config.adUnitFor('coins'), ludoAdMobTestRewardedAndroid);
      },
    );

    test('a release build uses the supplied real ad units', () {
      final config = LudoAdsConfig.resolve(
        isDebug: false,
        isAndroid: true,
        coinAdUnit: _realCoin,
        diamondAdUnit: _realDiamond,
      );
      expect(config.enabled, isTrue);
      expect(config.usesTestAds, isFalse);
      expect(config.adUnitFor('coins'), _realCoin);
      expect(config.adUnitFor('diamonds'), _realDiamond);
      expect(config.adUnitFor('gems'), isNull);
    });

    test('a release build without real ad units has ads disabled, never test '
        'ads', () {
      for (final (coin, diamond) in [
        ('', ''),
        (_realCoin, ''),
        ('', _realDiamond),
        ('not-an-ad-unit', _realDiamond),
        (ludoAdMobTestRewardedAndroid, _realDiamond),
        (_realCoin, ludoAdMobTestRewardedIos),
      ]) {
        final config = LudoAdsConfig.resolve(
          isDebug: false,
          isAndroid: true,
          coinAdUnit: coin,
          diamondAdUnit: diamond,
        );
        expect(config.enabled, isFalse, reason: '$coin / $diamond');
        expect(config.adUnitFor('coins'), isNull);
        expect(config.usesTestAds, isFalse);
      }
    });
  });

  group('LudoAdsService', () {
    LudoAdsService service(FakeRewardedAdSdk sdk, {LudoAdsConfig? config}) =>
        LudoAdsService(sdk: sdk, config: config ?? _debug());

    test('shows consent before the first ad request, then initializes and '
        'loads with the SSV user id and reward type', () async {
      final sdk = FakeRewardedAdSdk();
      final result = await service(sdk)
          .watch(rewardType: 'coins', ssvUserId: 'subject-1');

      expect(result.status, LudoAdWatchStatus.earnedReward);
      expect(sdk.calls, [
        'consent(form)',
        'initialize',
        'load:$ludoAdMobTestRewardedAndroid|subject-1|coins',
      ]);
      expect(sdk.ad.showCalls, 1);
      expect(sdk.ad.disposed, isTrue);
    });

    test('the SDK is initialized once across several ads', () async {
      final sdk = FakeRewardedAdSdk();
      final ads = service(sdk);
      await ads.watch(rewardType: 'coins', ssvUserId: 's');
      await ads.watch(rewardType: 'diamonds', ssvUserId: 's');
      expect(sdk.calls.where((c) => c == 'initialize'), hasLength(1));
      expect(sdk.calls.where((c) => c.startsWith('load:')), hasLength(2));
      expect(sdk.calls.last, endsWith('|diamonds'));
    });

    test('a user who declines consent never triggers an ad request', () async {
      final sdk = FakeRewardedAdSdk(
        consent: LudoConsentOutcome.consentDeclined,
      );
      final result = await service(sdk)
          .watch(rewardType: 'coins', ssvUserId: 's');
      expect(result.status, LudoAdWatchStatus.consentRequired);
      expect(sdk.calls, ['consent(form)']);
    });

    test('unknown consent state does not request an ad', () async {
      final sdk = FakeRewardedAdSdk(consent: LudoConsentOutcome.unavailable);
      final result = await service(sdk)
          .watch(rewardType: 'coins', ssvUserId: 's');
      expect(result.status, LudoAdWatchStatus.loadFailed);
      expect(sdk.calls, ['consent(form)']);
    });

    test('a closed ad without a reward reports dismissedNoReward', () async {
      final sdk = FakeRewardedAdSdk(ad: FakeRewardedAd(earnsReward: false));
      final result = await service(sdk)
          .watch(rewardType: 'coins', ssvUserId: 's');
      expect(result.status, LudoAdWatchStatus.dismissedNoReward);
      expect(result.earned, isFalse);
    });

    test('no fill reports loadFailed', () async {
      final sdk = FakeRewardedAdSdk(hasAd: false);
      final result = await service(sdk)
          .watch(rewardType: 'coins', ssvUserId: 's');
      expect(result.status, LudoAdWatchStatus.loadFailed);
    });

    test('a failed load reports the SDK code and what kind of failure it '
        'was, and logs it', () async {
      final lines = <String>[];
      LudoAdsService serviceWith(FakeRewardedAdSdk sdk) =>
          LudoAdsService(sdk: sdk, config: _debug(), log: lines.add);

      final network = FakeRewardedAdSdk()
        ..loadFailure = const LudoAdLoadException(
          code: 2,
          domain: 'com.google.android.gms.ads',
          message: 'Unable to obtain a JavascriptEngine.',
        );
      final r = await serviceWith(network)
          .watch(rewardType: 'coins', ssvUserId: 's');
      expect(r.status, LudoAdWatchStatus.loadFailed);
      expect(r.failureKind, LudoAdFailureKind.network);
      expect(
        r.message,
        'code=2 domain=com.google.android.gms.ads '
        'message=Unable to obtain a JavascriptEngine.',
      );
      // The two lines the device flow greps for (task 26h, defect: the log had
      // no [LudoAds] line at all, so the failure was undiagnosable).
      expect(
        lines,
        contains(
          '[LudoAds] request reward=coins unit=$ludoAdMobTestRewardedAndroid',
        ),
      );
      expect(
        lines.any((l) => l.startsWith('[LudoAds] load failed code=2')),
        isTrue,
      );
      expect(lines.join(), isNot(contains('s|')));

      final noFill = FakeRewardedAdSdk()
        ..loadFailure = const LudoAdLoadException(
          code: 3,
          domain: 'com.google.android.gms.ads',
          message: 'No fill',
        );
      final r2 = await serviceWith(noFill)
          .watch(rewardType: 'coins', ssvUserId: 's');
      expect(r2.failureKind, LudoAdFailureKind.noFill);

      final internal = FakeRewardedAdSdk()
        ..loadFailure = const LudoAdLoadException(
          code: 0,
          domain: 'x',
          message: 'boom',
        );
      expect(
        (await serviceWith(
          internal,
        ).watch(rewardType: 'coins', ssvUserId: 's')).failureKind,
        LudoAdFailureKind.other,
      );
    });

    test(
      'the device log line "code=0 ... Unable to obtain a JavascriptEngine." '
      'is an engine failure, not a generic one (device 26h)',
      () async {
        final lines = <String>[];
        final sdk = FakeRewardedAdSdk()
          ..loadFailure = const LudoAdLoadException(
            code: 0,
            domain: 'com.google.android.gms.ads',
            message: 'Unable to obtain a JavascriptEngine.',
          );
        final r = await LudoAdsService(
          sdk: sdk,
          config: _debug(),
          log: lines.add,
        ).watch(rewardType: 'coins', ssvUserId: 's');
        expect(r.status, LudoAdWatchStatus.loadFailed);
        expect(r.failureKind, LudoAdFailureKind.engineUnavailable);
        expect(
          r.message,
          'code=0 domain=com.google.android.gms.ads '
          'message=Unable to obtain a JavascriptEngine.',
        );
        expect(lines.any((l) => l.contains('load failed code=0')), isTrue);
        // Same text under another code is not an engine failure.
        expect(
          const LudoAdLoadException(
            code: 2,
            domain: 'd',
            message: 'Unable to obtain a JavascriptEngine.',
          ).kind,
          LudoAdFailureKind.network,
        );
      },
    );

    test('a load that never answers times out as a network failure and '
        'frees the service', () async {
      final sdk = FakeRewardedAdSdk()..loadHold = Completer<void>();
      final ads = LudoAdsService(
        sdk: sdk,
        config: _debug(),
        loadTimeout: const Duration(milliseconds: 20),
        log: (_) {},
      );
      final r = await ads.watch(rewardType: 'coins', ssvUserId: 's');
      expect(r.status, LudoAdWatchStatus.loadFailed);
      expect(r.failureKind, LudoAdFailureKind.network);
      expect(ads.isBusy, isFalse);
    });

    test('SDK exceptions never escape and the ad is still disposed', () async {
      final loadThrows = FakeRewardedAdSdk()..throwsOnLoad = true;
      expect(
        (await service(
          loadThrows,
        ).watch(rewardType: 'coins', ssvUserId: 's')).status,
        LudoAdWatchStatus.loadFailed,
      );

      final showThrows = FakeRewardedAdSdk(
        ad: FakeRewardedAd(throwsOnShow: true),
      );
      final ads = service(showThrows);
      expect(
        (await ads.watch(rewardType: 'coins', ssvUserId: 's')).status,
        LudoAdWatchStatus.loadFailed,
      );
      expect(showThrows.ad.disposed, isTrue);
      expect(ads.isBusy, isFalse);
    });

    test('a second request while one is showing is busy', () async {
      final ad = FakeRewardedAd()..hold = Completer<void>();
      final sdk = FakeRewardedAdSdk(ad: ad);
      final ads = service(sdk);
      final first = ads.watch(rewardType: 'coins', ssvUserId: 's');
      await Future<void>.delayed(Duration.zero);
      expect(ads.isBusy, isTrue);

      final second = await ads.watch(rewardType: 'coins', ssvUserId: 's');
      expect(second.status, LudoAdWatchStatus.busy);

      ad.hold!.complete();
      expect((await first).status, LudoAdWatchStatus.earnedReward);
      expect(sdk.ad.showCalls, 1);
    });

    test('a disabled config never touches the SDK', () async {
      final sdk = FakeRewardedAdSdk();
      final ads = service(sdk, config: LudoAdsConfig.disabled);
      expect(ads.isAvailable, isFalse);
      expect(
        (await ads.watch(rewardType: 'coins', ssvUserId: 's')).status,
        LudoAdWatchStatus.unavailable,
      );
      await ads.prepareConsent();
      expect(sdk.calls, isEmpty);
    });

    test('an unknown reward type is unavailable', () async {
      final sdk = FakeRewardedAdSdk();
      final result = await service(sdk)
          .watch(rewardType: 'gems', ssvUserId: 's');
      expect(result.status, LudoAdWatchStatus.unavailable);
      expect(sdk.calls, isEmpty);
    });

    test('prepareConsent refreshes consent without showing the form', () async {
      final sdk = FakeRewardedAdSdk();
      await service(sdk).prepareConsent();
      expect(sdk.calls, ['consent(no form)']);
    });
  });
}
