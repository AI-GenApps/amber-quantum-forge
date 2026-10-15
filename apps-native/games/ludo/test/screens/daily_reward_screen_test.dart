// Task 26h: the daily reward calendar and free-rewards panel over the real
// gateway/state stack with a scripted transport and a fake ad SDK. The server
// supplies every amount and bonus; these tests prove the screen only renders
// them and never credits currency itself.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_ads_config.dart';
import 'package:ludo/src/screens/daily_reward_screen.dart';
import 'package:ludo/src/theme/ludo_theme.dart';

import '../net/ludo_ads_test_support.dart';
import '../state/ludo_rewards_test_support.dart';
import '../state/ludo_store_test_support.dart';

Future<RewardsHarness> _pump(
  WidgetTester tester, {
  RewardsHarness? harness,
  bool withAds = true,
}) async {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 2.75;
  addTearDown(tester.view.reset);
  final h = harness ?? RewardsHarness.create();
  await h.base.wallet.refresh();
  await tester.pumpWidget(
    MaterialApp(
      theme: buildLudoTheme(),
      home: DailyRewardScreen(
        dailyReward: h.daily,
        ads: withAds ? h.ads : null,
        walletState: h.base.wallet,
      ),
    ),
  );
  await tester.pumpAndSettle();
  return h;
}

Finder _tile(int day, String suffix) =>
    find.bySemanticsLabel(RegExp('^Day $day, .*$suffix\$'));

void main() {
  testWidgets('renders the 7-day calendar: claimed, today and upcoming, with '
      'the day-7 diamond bonus', (tester) async {
    await _pump(tester);

    expect(_tile(1, 'claimed'), findsOneWidget);
    expect(_tile(2, 'claimed'), findsOneWidget);
    expect(_tile(3, 'ready to claim'), findsOneWidget);
    expect(_tile(4, 'upcoming'), findsOneWidget);
    expect(
      find.bySemanticsLabel(
        'Day 7, 750 coins and 5 diamonds, bonus day, upcoming',
      ),
      findsOneWidget,
    );
    expect(find.text('Today'), findsOneWidget);
    expect(find.text('Day 7 bonus'), findsOneWidget);
    expect(find.text('Day 3 is ready to claim.'), findsOneWidget);
    expect(find.text('Claim day 3 reward'), findsOneWidget);
    expect(
      find.text('Vortex Pass members get +50% on every daily reward.'),
      findsOneWidget,
    );
  });

  testWidgets('claiming applies the server-confirmed balances and shows the '
      'granted amount', (tester) async {
    final harness = RewardsHarness.create(
      script: {
        'GET daily-reward': [
          jsonOk(dailyStatusBody()),
          jsonOk(dailyStatusBody(claimedToday: true, streakDay: 3, nextDay: 4)),
        ],
        'POST daily-reward/claim': [jsonOk(dailyClaimBody())],
      },
    );
    await _pump(tester, harness: harness);

    await tester.tap(find.byKey(const Key('daily-reward-claim')));
    await tester.pumpAndSettle();

    expect(
      harness.transport.requestsFor('POST daily-reward/claim'),
      hasLength(1),
    );
    // Balance comes straight from the claim response (2000 + 300), not from
    // any client-side arithmetic.
    expect(harness.base.wallet.coins, 2300);
    expect(find.text('Day 3 reward claimed: +300 coins.'), findsOneWidget);
    expect(find.text('Claimed today'), findsOneWidget);
    expect(_tile(3, 'claimed'), findsOneWidget);
    expect(
      find.text('Claimed for today. Come back tomorrow for day 4.'),
      findsOneWidget,
    );
    // The button is now disabled: a second tap sends nothing.
    await tester.tap(find.byKey(const Key('daily-reward-claim')));
    await tester.pumpAndSettle();
    expect(
      harness.transport.requestsFor('POST daily-reward/claim'),
      hasLength(1),
    );
  });

  testWidgets('an already claimed day shows a disabled claimed state', (
    tester,
  ) async {
    final harness = RewardsHarness.create(
      script: {
        'GET daily-reward': [
          jsonOk(dailyStatusBody(claimedToday: true, streakDay: 3, nextDay: 4)),
        ],
      },
    );
    await _pump(tester, harness: harness);

    expect(find.text('Claimed today'), findsOneWidget);
    await tester.tap(find.byKey(const Key('daily-reward-claim')));
    await tester.pumpAndSettle();
    expect(harness.transport.requestsFor('POST daily-reward/claim'), isEmpty);
  });

  testWidgets('with a Vortex Pass the server-applied bonus is shown and the '
      'client computes nothing', (tester) async {
    final harness = RewardsHarness.create(
      script: {
        'GET daily-reward': [
          jsonOk(dailyStatusBody(passActive: true)),
          jsonOk(
            dailyStatusBody(
              passActive: true,
              claimedToday: true,
              streakDay: 3,
              nextDay: 4,
            ),
          ),
        ],
        // 300 base + 150 bonus; the figure below is the server's, and is
        // deliberately not 300 * 1.5 so a client-side recompute would differ.
        'POST daily-reward/claim': [
          jsonOk(
            dailyClaimBody(
              coinsGranted: 451,
              bonusCoins: 151,
              passBonusApplied: true,
              coins: 2451,
            ),
          ),
        ],
      },
    );
    await _pump(tester, harness: harness);

    expect(
      find.text('Vortex Pass active: +50% on every daily reward.'),
      findsOneWidget,
    );
    expect(find.byKey(const Key('daily-reward-pass-bonus-3')), findsOneWidget);
    await tester.tap(find.byKey(const Key('daily-reward-claim')));
    await tester.pumpAndSettle();

    expect(harness.base.wallet.coins, 2451);
    expect(
      find.text(
        'Day 3 reward claimed: +451 coins (includes your Vortex Pass bonus).',
      ),
      findsOneWidget,
    );
  });

  testWidgets('a claim lost to a race (409) explains and reloads', (
    tester,
  ) async {
    final harness = RewardsHarness.create(
      script: {
        'GET daily-reward': [
          jsonOk(dailyStatusBody()),
          jsonOk(dailyStatusBody(claimedToday: true, streakDay: 3, nextDay: 4)),
        ],
        'POST daily-reward/claim': [
          apiError('ludo_daily_reward_already_claimed', 409),
        ],
      },
    );
    await _pump(tester, harness: harness);

    await tester.tap(find.byKey(const Key('daily-reward-claim')));
    await tester.pumpAndSettle();

    expect(
      find.text('You already claimed today. Come back tomorrow.'),
      findsOneWidget,
    );
    expect(find.text('Claimed today'), findsOneWidget);
    expect(harness.base.wallet.coins, 2000);
  });

  testWidgets('offline shows a retry that loads the calendar', (tester) async {
    final harness = RewardsHarness.create();
    harness.transport.failingKeys.add('GET daily-reward');
    await _pump(tester, harness: harness, withAds: false);

    expect(find.text('Rewards need an online connection.'), findsOneWidget);
    harness.transport.failingKeys.remove('GET daily-reward');
    await tester.tap(find.byKey(const Key('daily-reward-retry')));
    await tester.pumpAndSettle();
    expect(find.text('Day 3 is ready to claim.'), findsOneWidget);
  });

  group('free rewards (watch an ad)', () {
    testWidgets('shows the per-type allowance from the server', (tester) async {
      await _pump(tester);
      expect(find.text('+100 coins'), findsOneWidget);
      expect(find.text('+5 diamonds'), findsOneWidget);
      expect(find.text('5 of 5 left today'), findsOneWidget);
      expect(find.text('2 of 2 left today'), findsOneWidget);
      expect(find.bySemanticsLabel('Watch ad for 100 coins'), findsOneWidget);
    });

    testWidgets('watching a test ad shows it, then the server credit lands', (
      tester,
    ) async {
      final harness = RewardsHarness.create(
        script: {
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
      await _pump(tester, harness: harness);

      await tester.tap(find.byKey(const Key('watch-ad-coins')));
      await tester.pumpAndSettle();

      expect(
        harness.sdk.calls.last,
        'load:$ludoAdMobTestRewardedAndroid|uid-1|coins',
      );
      expect(harness.sdk.ad.showCalls, 1);
      expect(harness.base.wallet.coins, 2100);
      expect(
        find.text('Reward received! Your coins balance is updated.'),
        findsOneWidget,
      );
      expect(find.text('4 of 5 left today'), findsOneWidget);
    });

    testWidgets('closing the ad early shows a hint and credits nothing', (
      tester,
    ) async {
      final harness = RewardsHarness.create(
        sdk: FakeRewardedAdSdk(ad: FakeRewardedAd(earnsReward: false)),
      );
      await _pump(tester, harness: harness);

      await tester.tap(find.byKey(const Key('watch-ad-coins')));
      await tester.pumpAndSettle();

      expect(
        find.text('Watch the whole ad to earn the reward.'),
        findsOneWidget,
      );
      expect(harness.base.wallet.coins, 2000);
    });

    testWidgets('a type at its daily limit disables its button', (
      tester,
    ) async {
      final harness = RewardsHarness.create(
        script: {
          'GET ads/rewarded/status': [
            jsonOk(adsStatusBody(diamondsClaimed: 2)),
          ],
        },
      );
      await _pump(tester, harness: harness);

      expect(
        find.text('Daily limit reached. Come back tomorrow.'),
        findsOneWidget,
      );
      await tester.tap(find.byKey(const Key('watch-ad-diamonds')));
      await tester.pumpAndSettle();
      expect(harness.sdk.calls, isEmpty);
    });

    testWidgets('a build with ads disabled explains and never calls the SDK', (
      tester,
    ) async {
      final harness = RewardsHarness.create(config: LudoAdsConfig.disabled);
      await _pump(tester, harness: harness);

      expect(
        find.text('Rewarded ads are not available in this build.'),
        findsOneWidget,
      );
      await tester.tap(find.byKey(const Key('watch-ad-coins')));
      await tester.pumpAndSettle();
      expect(harness.sdk.calls, isEmpty);
    });
  });
}
