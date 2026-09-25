import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_features.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_relay_controller.dart';
import 'package:merge_relay/src/merge_relay_relay_persistence.dart';
import 'package:merge_relay/src/platform/merge_relay_pgs_account.dart';
import 'package:merge_relay/src/platform/merge_relay_play_games.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_fake_gateway.dart';

void main() {
  testWidgets('settings separates signed-in Play Games from linked progress', (
    tester,
  ) async {
    final harness = await _pumpPgsApp(tester);

    await _openSettings(tester);

    expect(find.text('Play Games signed in'), findsOneWidget);
    expect(find.text('Progress not linked'), findsOneWidget);
    expect(find.text('Link progress'), findsOneWidget);
    expect(find.text('Achievements'), findsOneWidget);
    expect(harness.gateway.pgsStatusCalls, 1);

    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('link action is disabled while the account request is pending', (
    tester,
  ) async {
    final access = Completer<MergeRelayPlayGamesServerAccess>();
    final harness = await _pumpPgsApp(tester, accessFuture: access.future);

    await _openSettings(tester);
    await tester.tap(find.text('Link progress'));
    await tester.pump();
    expect(find.text('Connecting…'), findsOneWidget);

    await tester.tap(find.text('Connecting…'));
    expect(harness.provider.serverAccessCalls, 1);

    access.complete(
      const MergeRelayPlayGamesServerAccess(
        granted: true,
        authCode: 'one-shot-code',
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Progress linked'), findsOneWidget);
    expect(find.text('Achievements'), findsOneWidget);
    expect(find.text('Leaderboard'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('unconfigured Play Games stays quiet while guest play works', (
    tester,
  ) async {
    await _pumpPgsApp(tester, configured: false);

    await _openSettings(tester);

    expect(find.text('Play Games unavailable'), findsOneWidget);
    expect(find.text('Link progress'), findsNothing);
    expect(find.text('Achievements'), findsNothing);
    expect(find.text('Leaderboard'), findsNothing);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('resuming refreshes the server link state', (tester) async {
    final harness = await _pumpPgsApp(tester);

    await _openSettings(tester);
    expect(find.text('Progress not linked'), findsOneWidget);
    harness.gateway.pgsIdentityStatus = const MergeRelayPgsIdentitySnapshot(
      provider: 'google_play_games',
      configured: true,
      status: MergeRelayPgsIdentityLinkStatus.active,
    );

    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pumpAndSettle();

    expect(find.text('Progress linked'), findsOneWidget);
    expect(harness.gateway.pgsStatusCalls, 2);
    await tester.pumpWidget(const SizedBox());
  });
}

Future<void> _openSettings(WidgetTester tester) async {
  await tester.tap(find.byTooltip('Settings'));
  await tester.pumpAndSettle();
}

Future<_PgsHarness> _pumpPgsApp(
  WidgetTester tester, {
  bool configured = true,
  Future<MergeRelayPlayGamesServerAccess>? accessFuture,
}) async {
  final gateway = FakeRelayGateway()
    ..pgsIdentityStatus = MergeRelayPgsIdentitySnapshot(
      provider: 'google_play_games',
      configured: configured,
      status: MergeRelayPgsIdentityLinkStatus.unlinked,
    );
  final provider = _PgsProbe(accessFuture: accessFuture);
  final relay = MergeRelayRelayController(
    context: runtimeAppContext(identity: mergeRelayIdentity),
    gateway: gateway,
    authStore: MemoryMergeRelayAuthStore(),
    stateStore: MemoryMergeRelayRelayStateStore(),
  );
  final account = MergeRelayPgsAccountController(
    provider: provider,
    gateway: gateway,
    ensureGuest: relay.bootstrap,
  );
  await tester.pumpWidget(
    MergeRelayApp(
      relayController: relay,
      pgsAccount: account,
      playGames: provider,
      features: const MergeRelayFeatures(socialEnabled: true),
    ),
  );
  await tester.pumpAndSettle();
  await tester.tap(find.text('Play rescue'));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Skip'));
  await tester.pumpAndSettle();
  return _PgsHarness(gateway: gateway, provider: provider);
}

final class _PgsHarness {
  const _PgsHarness({required this.gateway, required this.provider});

  final FakeRelayGateway gateway;
  final _PgsProbe provider;
}

final class _PgsProbe implements MergeRelayPlayGamesProvider {
  _PgsProbe({this.accessFuture});

  final Future<MergeRelayPlayGamesServerAccess>? accessFuture;
  var serverAccessCalls = 0;

  @override
  Future<MergeRelayPlayGamesState> initialize() async =>
      const MergeRelayPlayGamesState(
        status: MergeRelayPlayGamesStatus.authenticated,
      );

  @override
  Future<MergeRelayPlayGamesState> signIn() async =>
      const MergeRelayPlayGamesState(
        status: MergeRelayPlayGamesStatus.authenticated,
      );

  @override
  Future<MergeRelayPlayGamesServerAccess> requestServerAccess() {
    serverAccessCalls += 1;
    return accessFuture ??
        Future.value(
          const MergeRelayPlayGamesServerAccess(
            granted: true,
            authCode: 'one-shot-code',
          ),
        );
  }

  @override
  Future<MergeRelayPlayGamesActionResult> showAchievements() async =>
      const MergeRelayPlayGamesActionResult(
        status: MergeRelayPlayGamesActionStatus.completed,
      );

  @override
  Future<MergeRelayPlayGamesActionResult> showLeaderboards() async =>
      const MergeRelayPlayGamesActionResult(
        status: MergeRelayPlayGamesActionStatus.completed,
      );
}
