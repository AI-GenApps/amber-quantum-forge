import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_feature_gates.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_theme.dart';

import 'merge_relay_fake_gateway.dart';

Future<void> _pump(WidgetTester tester, FakeRelayGateway gateway) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: MergeRelayFeatureGatePanel(
            gateway: gateway,
            theme: signalRelayTheme,
          ),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void expectNoActions(WidgetTester tester) {
  expect(find.byType(FilledButton), findsNothing);
  expect(find.byType(ElevatedButton), findsNothing);
  expect(find.textContaining('Buy'), findsNothing);
  expect(find.textContaining('Watch'), findsNothing);
}

void main() {
  testWidgets('flags off read as switched off by the service', (tester) async {
    await _pump(tester, FakeRelayGateway());
    expect(find.text('Rewards · Off'), findsOneWidget);
    expect(find.text('Ads · Off'), findsOneWidget);
    expect(find.text('Themes and purchases · Off'), findsOneWidget);
    expect(find.text('Remote tuning · Not available yet'), findsOneWidget);
    expectNoActions(tester);
  });

  testWidgets('flags on never imply a working reward or purchase', (
    tester,
  ) async {
    final gateway = FakeRelayGateway()
      ..featureOverride = const MergeRelayFeatureFlags(
        daily: true,
        endless: true,
        rankedRelay: true,
        rewardedAds: true,
        cosmetics: true,
      );
    await _pump(tester, gateway);
    expect(find.text('Rewards · Not available yet'), findsOneWidget);
    expect(find.text('Ads · Not available yet'), findsOneWidget);
    expect(
      find.text('Themes and purchases · Not available yet'),
      findsOneWidget,
    );
    expect(
      find.text('This build has no support for it. Nothing is granted.'),
      findsNWidgets(3),
    );
    expectNoActions(tester);
  });

  testWidgets('an unreachable service reads as unavailable and can retry', (
    tester,
  ) async {
    final gateway = FakeRelayGateway()
      ..configError = const MergeRelayTransportException('x');
    await _pump(tester, gateway);
    expect(find.text('Rewards · Unavailable'), findsOneWidget);
    expect(find.text('Remote tuning · Unavailable'), findsOneWidget);
    gateway.configError = null;
    await tester.tap(find.text('Check again'));
    await tester.pumpAndSettle();
    expect(find.text('Rewards · Off'), findsOneWidget);
  });

  test('statuses are checking before the config arrives', () {
    final rows = mergeRelayGateStatuses(null, checking: true);
    expect(
      rows.map((row) => row.state),
      everyElement(MergeRelayGateState.checking),
    );
  });
}
