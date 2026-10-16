// Task 26h: the rewarded-ad flow. The client shows the ad but never credits
// itself: it waits for the server's SSV credit to appear in the ad status and
// then refreshes the wallet. Fake ad SDK, scripted transport, no network.
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_ads_config.dart';
import 'package:ludo/src/net/ludo_ads_service.dart';
import 'package:ludo/src/state/ludo_inventory_state.dart' show LudoCurrency;
import 'package:ludo/src/state/ludo_rewarded_ads_state.dart';

import '../net/ludo_ads_test_support.dart';
import 'ludo_rewards_test_support.dart';

void main() {
  test('load reads the per-type allowance and the SSV user id', () async {
    final harness = RewardsHarness.create();
    await harness.ads.load();

    final status = harness.ads.status!;
    expect(status.ssvUserId, 'uid-1');
    expect(harness.ads.unit(LudoCurrency.coins)!.remaining, 5);
    expect(harness.ads.unit(LudoCurrency.diamonds)!.dailyCap, 2);
    expect(harness.ads.isAvailable, isTrue);
  });

  test('a watched ad is credited by the server, then the wallet refreshes '
      'from the server (the client never credits itself)', () async {
    final harness = RewardsHarness.create(
      script: {
        // load() at the start of watch, then polls: the credit lands on the
        // second poll.
        'GET ads/rewarded/status': [
          jsonOk(adsStatusBody()),
          jsonOk(adsStatusBody()),
          jsonOk(adsStatusBody(coinsClaimed: 1)),
        ],
        'GET wallet': [
          jsonOk({'coins': 2000, 'diamonds': 40}),
          jsonOk({'coins': 2100, 'diamonds': 40}),
        ],
      },
    );
    await harness.base.wallet.refresh();
    expect(harness.base.wallet.coins, 2000);

    final outcome = await harness.ads.watch(LudoCurrency.coins);

    expect(outcome, LudoAdWatchOutcome.credited);
    // The only source of the new balance is the server's wallet response.
    expect(harness.base.wallet.coins, 2100);
    expect(harness.sdk.calls, contains('consent(form)'));
    expect(
      harness.sdk.calls.last,
      'load:$ludoAdMobTestRewardedAndroid|uid-1|coins',
    );
    expect(harness.transport.requestsFor('POST daily-reward/claim'), isEmpty);
    expect(harness.ads.watching, isNull);
  });

  test('an ad whose credit has not landed reports rewardPending', () async {
    final harness = RewardsHarness.create(pollAttempts: 2);
    final outcome = await harness.ads.watch(LudoCurrency.diamonds);

    expect(outcome, LudoAdWatchOutcome.rewardPending);
    expect(harness.sdk.calls.last, endsWith('|diamonds'));
  });

  test('a network load failure is its own outcome and keeps the SDK detail, '
      'while no fill stays noAdAvailable', () async {
    final network = RewardsHarness.create(
      sdk: FakeRewardedAdSdk()
        ..loadFailure = const LudoAdLoadException(
          code: 2,
          domain: 'com.google.android.gms.ads',
          message: 'Network error',
        ),
    );
    expect(
      await network.ads.watch(LudoCurrency.coins),
      LudoAdWatchOutcome.adNetworkError,
    );
    expect(network.ads.lastFailureDetail, contains('code=2'));
    expect(network.ads.watching, isNull);

    final noFill = RewardsHarness.create(
      sdk: FakeRewardedAdSdk()
        ..loadFailure = const LudoAdLoadException(
          code: 3,
          domain: 'com.google.android.gms.ads',
          message: 'No fill',
        ),
    );
    expect(
      await noFill.ads.watch(LudoCurrency.coins),
      LudoAdWatchOutcome.noAdAvailable,
    );
  });

  test('the device JavascriptEngine failure is adEngineUnavailable and '
      'keeps the SDK detail', () async {
    final harness = RewardsHarness.create(
      sdk: FakeRewardedAdSdk()
        ..loadFailure = const LudoAdLoadException(
          code: 0,
          domain: 'com.google.android.gms.ads',
          message: 'Unable to obtain a JavascriptEngine.',
        ),
    );
    expect(
      await harness.ads.watch(LudoCurrency.coins),
      LudoAdWatchOutcome.adEngineUnavailable,
    );
    expect(harness.ads.lastFailureDetail, contains('JavascriptEngine'));
    expect(harness.ads.watching, isNull);
    // A later success clears the stale detail.
    harness.sdk.loadFailure = null;
    await harness.ads.watch(LudoCurrency.coins);
    expect(harness.ads.lastFailureDetail, isNull);
  });

  test('closing the ad early earns nothing and does not poll for a '
      'credit', () async {
    final harness = RewardsHarness.create(
      sdk: FakeRewardedAdSdk(ad: FakeRewardedAd(earnsReward: false)),
    );
    final outcome = await harness.ads.watch(LudoCurrency.coins);

    expect(outcome, LudoAdWatchOutcome.dismissedNoReward);
    // Only the initial status load, no polling.
    expect(
      harness.transport.requestsFor('GET ads/rewarded/status'),
      hasLength(1),
    );
  });

  test(
    'no fill, declined consent and disabled ads map to their outcomes',
    () async {
      final noFill = RewardsHarness.create(
        sdk: FakeRewardedAdSdk(hasAd: false),
      );
      expect(
        await noFill.ads.watch(LudoCurrency.coins),
        LudoAdWatchOutcome.noAdAvailable,
      );

      final declined = RewardsHarness.create(
        sdk: FakeRewardedAdSdk(consent: LudoConsentOutcome.consentDeclined),
      );
      expect(
        await declined.ads.watch(LudoCurrency.coins),
        LudoAdWatchOutcome.consentRequired,
      );

      final disabled = RewardsHarness.create(config: LudoAdsConfig.disabled);
      expect(disabled.ads.isAvailable, isFalse);
      expect(
        await disabled.ads.watch(LudoCurrency.coins),
        LudoAdWatchOutcome.unavailable,
      );
      expect(disabled.sdk.calls, isEmpty);
    },
  );

  test('at the daily limit no ad is requested', () async {
    final harness = RewardsHarness.create(
      script: {
        'GET ads/rewarded/status': [jsonOk(adsStatusBody(diamondsClaimed: 2))],
      },
    );
    final outcome = await harness.ads.watch(LudoCurrency.diamonds);

    expect(outcome, LudoAdWatchOutcome.dailyLimitReached);
    expect(harness.sdk.calls, isEmpty);
  });

  test(
    'offline (status unreachable) reports offline without an ad request',
    () async {
      final harness = RewardsHarness.create();
      harness.transport.failingKeys.add('GET ads/rewarded/status');

      expect(
        await harness.ads.watch(LudoCurrency.coins),
        LudoAdWatchOutcome.offline,
      );
      expect(harness.sdk.calls, isEmpty);
      expect(harness.ads.isOffline, isTrue);
    },
  );
}
