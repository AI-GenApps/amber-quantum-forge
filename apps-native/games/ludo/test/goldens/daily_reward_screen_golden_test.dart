// Goldens for the task 26h daily reward screen: today ready, claimed, a
// Vortex Pass active, the day-7 diamond bonus, and ads at their limit.
// Regenerate with
// `flutter test --update-goldens test/goldens/daily_reward_screen_golden_test.dart`.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/screens/daily_reward_screen.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';
import 'package:ludo/src/theme/ludo_theme.dart';

import '../state/ludo_rewards_test_support.dart';

Future<void> _pump(
  WidgetTester tester, {
  Map<String, Object?>? daily,
  Map<String, Object?>? ads,
  bool claim = false,
  Map<String, Object?>? claimBody,
}) async {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 2.75;
  addTearDown(tester.view.reset);
  final harness = RewardsHarness.create(
    script: {
      'GET daily-reward': [
        jsonOk(daily ?? dailyStatusBody()),
        if (claim)
          jsonOk(dailyStatusBody(claimedToday: true, streakDay: 3, nextDay: 4)),
      ],
      if (ads != null) 'GET ads/rewarded/status': [jsonOk(ads)],
      if (claimBody != null) 'POST daily-reward/claim': [jsonOk(claimBody)],
    },
  );
  await harness.base.wallet.refresh();
  await tester.pumpWidget(
    MaterialApp(
      theme: buildLudoTheme(),
      debugShowCheckedModeBanner: false,
      home: DailyRewardScreen(
        dailyReward: harness.daily,
        ads: harness.ads,
        walletState: harness.base.wallet,
        reducedMotion: ReducedMotionSetting(enabled: true),
      ),
    ),
  );
  await tester.pumpAndSettle();
  if (claim) {
    await tester.tap(find.byKey(const Key('daily-reward-claim')));
    await tester.pumpAndSettle();
  }
}

void main() {
  testWidgets('day 3 ready to claim with free rewards available', (
    tester,
  ) async {
    await _pump(tester);
    await expectLater(
      find.byType(DailyRewardScreen),
      matchesGoldenFile('daily_reward_screen_today.png'),
    );
  });

  testWidgets('after claiming day 3', (tester) async {
    await _pump(
      tester,
      claim: true,
      claimBody: dailyClaimBody(),
      daily: dailyStatusBody(),
    );
    await expectLater(
      find.byType(DailyRewardScreen),
      matchesGoldenFile('daily_reward_screen_claimed.png'),
    );
  });

  testWidgets('Vortex Pass active shows the bonus on every unclaimed day', (
    tester,
  ) async {
    await _pump(tester, daily: dailyStatusBody(passActive: true));
    await expectLater(
      find.byType(DailyRewardScreen),
      matchesGoldenFile('daily_reward_screen_pass.png'),
    );
  });

  testWidgets('day 7 is today: the diamond bonus day', (tester) async {
    await _pump(tester, daily: dailyStatusBody(streakDay: 6, nextDay: 7));
    await expectLater(
      find.byType(DailyRewardScreen),
      matchesGoldenFile('daily_reward_screen_day7.png'),
    );
  });

  testWidgets('ads at their daily limit', (tester) async {
    await _pump(
      tester,
      ads: adsStatusBody(coinsClaimed: 5, diamondsClaimed: 2),
    );
    await expectLater(
      find.byType(DailyRewardScreen),
      matchesGoldenFile('daily_reward_screen_ads_limit.png'),
    );
  });
}
