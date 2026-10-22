import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_daily_status.dart';
import 'package:merge_relay/src/merge_relay_features.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_relay_controller.dart';
import 'package:merge_relay/src/merge_relay_relay_persistence.dart';
import 'package:merge_relay/src/platform/merge_relay_play_games.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_fake_gateway.dart';

const _apiError = MergeRelayApiException(
  statusCode: 503,
  code: 'service_unavailable',
  message: 'down',
  diagnosticId: 'diag',
);

final _clock = FixedClock(DateTime.utc(2026, 9, 17, 12));

({MergeRelayGame game, FakeRelayGateway gateway}) _build({bool social = true}) {
  final gateway = FakeRelayGateway();
  final relay = MergeRelayRelayController(
    context: runtimeAppContext(identity: mergeRelayIdentity),
    gateway: gateway,
    authStore: MemoryMergeRelayAuthStore(),
    stateStore: MemoryMergeRelayRelayStateStore(),
  );
  final game = MergeRelayGame(
    context: runtimeAppContext(identity: mergeRelayIdentity),
    saveStore: MemorySaveStore(),
    relayController: relay,
    playGames: FakeMergeRelayPlayGamesProvider(),
    features: MergeRelayFeatures(socialEnabled: social),
    clock: _clock,
  );
  return (game: game, gateway: gateway);
}

void main() {
  test(
    'service daily moves through loading to ready and seeds the board',
    () async {
      final harness = _build();
      final game = harness.game;
      final pending = Completer<MergeRelayDailyChallenge>();
      harness.gateway.dailyFuture = pending.future;
      await game.restore();
      expect(game.dailyStatus.value.phase, MergeRelayDailyPhase.loading);
      harness.gateway.dailyFuture = null;
      pending.complete(
        MergeRelayDailyChallenge(
          date: '2026-09-17',
          checkpoint: MergeRelayCheckpoint(
            state: MergeGameState.newGame(seed: 4242),
            maxLegalMoves: 3,
          ),
          maxLegalMoves: 3,
          contentRevision: 'MR-CONTENT-1',
          generated: true,
          updatedAt: DateTime.utc(2026, 9, 17),
        ),
      );
      await Future<void>.delayed(Duration.zero);
      expect(game.dailyStatus.value.phase, MergeRelayDailyPhase.ready);
      game.completeTutorial(skipped: true);
      game.startDaily();
      expect(game.state.value.seed, 4242);
      game.dispose();
    },
  );

  test('offline falls back to the local daily seed and can retry', () async {
    final harness = _build();
    final game = harness.game;
    harness.gateway.dailyError = const MergeRelayTransportException('offline');
    await game.restore();
    await Future<void>.delayed(Duration.zero);
    expect(game.dailyStatus.value.phase, MergeRelayDailyPhase.offline);
    game.completeTutorial(skipped: true);
    game.startDaily();
    expect(game.state.value.seed, isNot(4242));
    final localSeed = game.state.value.seed;

    harness.gateway.dailyError = null;
    await game.refreshDaily();
    expect(game.dailyStatus.value.phase, MergeRelayDailyPhase.ready);
    expect(harness.gateway.dailyCalls, 2);
    game.openHome();
    game.startDaily();
    expect(game.state.value.seed, 4242);
    expect(localSeed, isNot(4242));
    game.dispose();
  });

  test('service errors map through mergeRelayOutcomeFor', () async {
    final harness = _build();
    final game = harness.game;
    harness.gateway.dailyError = _apiError;
    await game.restore();
    await Future<void>.delayed(Duration.zero);
    final status = game.dailyStatus.value;
    expect(status.phase, MergeRelayDailyPhase.error);
    expect(status.outcome?.code, 'service_unavailable');
    expect(status.detail, contains('unavailable'));
    game.dispose();
  });

  test('solo build never calls the gateway', () async {
    final harness = _build(social: false);
    await harness.game.restore();
    await harness.game.refreshDaily();
    expect(harness.gateway.dailyCalls, 0);
    expect(harness.game.dailyStatus.value.phase, MergeRelayDailyPhase.local);
    harness.game.dispose();
  });

  testWidgets('Home shows the offline note and retry recovers', (tester) async {
    final gateway = FakeRelayGateway()
      ..dailyError = const MergeRelayTransportException('offline');
    final relay = MergeRelayRelayController(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      gateway: gateway,
      authStore: MemoryMergeRelayAuthStore(),
      stateStore: MemoryMergeRelayRelayStateStore(),
    );
    await tester.pumpWidget(
      MergeRelayApp(
        relayController: relay,
        playGames: FakeMergeRelayPlayGamesProvider(),
        features: const MergeRelayFeatures(socialEnabled: true),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Offline. Local board ready'), findsOneWidget);
    expect(find.text('Retry'), findsOneWidget);

    gateway.dailyError = null;
    await tester.ensureVisible(find.text('Retry'));
    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();
    expect(find.text("Today's service board"), findsOneWidget);
    expect(find.text('Retry'), findsNothing);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('Home profile and achievements open provider UI only', (
    tester,
  ) async {
    final gateway = FakeRelayGateway();
    final relay = MergeRelayRelayController(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      gateway: gateway,
      authStore: MemoryMergeRelayAuthStore(),
      stateStore: MemoryMergeRelayRelayStateStore(),
    );
    await tester.pumpWidget(
      MergeRelayApp(
        relayController: relay,
        playGames: FakeMergeRelayPlayGamesProvider(),
        features: const MergeRelayFeatures(socialEnabled: true),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byTooltip('Profile'), findsOneWidget);
    expect(find.byTooltip('Achievements'), findsOneWidget);
    await tester.tap(find.byTooltip('Profile'));
    await tester.pumpAndSettle();
    expect(find.text('Profile'), findsWidgets);
    expect(find.textContaining('rescues cleared'), findsOneWidget);
    expect(find.textContaining('Best Endless'), findsOneWidget);
    expect(gateway.submittedMoves, 0);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('solo Home hides profile and achievements entries', (
    tester,
  ) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pumpAndSettle();
    expect(find.byTooltip('Profile'), findsNothing);
    expect(find.byTooltip('Achievements'), findsNothing);
    expect(find.byTooltip('Settings'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });
}
