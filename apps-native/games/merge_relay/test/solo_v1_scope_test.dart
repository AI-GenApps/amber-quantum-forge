import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_client.dart';
import 'package:merge_relay/src/merge_relay_features.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_relay_controller.dart';
import 'package:merge_relay/src/merge_relay_relay_models.dart';
import 'package:merge_relay/src/merge_relay_relay_persistence.dart';
import 'package:merge_relay/src/platform/merge_relay_pgs_account.dart';
import 'package:merge_relay/src/platform/merge_relay_play_games.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_fake_gateway.dart';

/// Proves the v1 solo scope gate (`lib/src/merge_relay_features.dart`).
///
/// Every relay/PGS collaborator below is real (not `null`), so an absent
/// widget or unreached code path is caused by the gate, not by a missing
/// dependency. The "gate forced on" group is a positive control: it reuses
/// the exact same finders on the exact same harness with only the gate
/// flipped, proving the absence assertions above aren't trivially true.
void main() {
  test('the gate defaults to off', () {
    expect(mergeRelaySocialEnabled, isFalse);
    expect(const MergeRelayFeatures().socialEnabled, isFalse);
  });

  group('createMergeRelayClient (gated off)', () {
    test('never invokes the gateway factory and returns null', () {
      var factoryCalls = 0;
      final client = createMergeRelayClient(
        context: runtimeAppContext(identity: mergeRelayIdentity),
        saveStore: MemorySaveStore(),
        gatewayFactory:
            ({
              required MergeRelayNetworkConfig config,
              required MergeRelayHttpTransport transport,
              required MergeRelayAuthStore authStore,
            }) {
              factoryCalls += 1;
              return FakeRelayGateway();
            },
      );
      expect(client, isNull);
      expect(factoryCalls, 0);
    });

    test('an explicit socialEnabled: false also never builds a gateway', () {
      var factoryCalls = 0;
      final client = createMergeRelayClient(
        context: runtimeAppContext(identity: mergeRelayIdentity),
        saveStore: MemorySaveStore(),
        features: const MergeRelayFeatures(socialEnabled: false),
        gatewayFactory:
            ({
              required MergeRelayNetworkConfig config,
              required MergeRelayHttpTransport transport,
              required MergeRelayAuthStore authStore,
            }) {
              factoryCalls += 1;
              return FakeRelayGateway();
            },
      );
      expect(client, isNull);
      expect(factoryCalls, 0);
    });
  });

  testWidgets(
    'an incoming challenge link opens Home instead of the relay while gated',
    (tester) async {
      final controller = _relayController();
      final links = _StubChallengeLinks(
        pending: const ['mergerelay://challenge/ch_cold_start'],
      );

      await tester.pumpWidget(
        MergeRelayApp(relayController: controller, challengeLinks: links),
      );
      await tester.pumpAndSettle();

      expect(find.text('Rescue paths'), findsOneWidget);
      expect(find.text('Join a relay'), findsNothing);
      expect(links.initializeCalls, 0);
      expect(controller.snapshot.phase, MergeRelayRelayPhase.idle);

      links.emit('mergerelay://challenge/ch_live');
      await tester.pumpAndSettle();
      expect(controller.snapshot.phase, MergeRelayRelayPhase.idle);
      expect(find.text('Rescue paths'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    },
  );

  testWidgets(
    'Home, Pause, Result, and Settings hide every relay/PGS control',
    (tester) async {
      final found = await _walkSurfaces(tester, const MergeRelayFeatures());
      expect(found.joinRelayOnHome, isFalse);
      expect(found.shareOnPause, isFalse);
      expect(found.shareOnResult, isFalse);
      expect(found.playGamesInSettings, isFalse);
    },
  );

  testWidgets(
    'positive control: forcing the gate on surfaces the same relay/PGS controls',
    (tester) async {
      final found = await _walkSurfaces(
        tester,
        const MergeRelayFeatures(socialEnabled: true),
      );
      expect(found.joinRelayOnHome, isTrue);
      expect(found.shareOnPause, isTrue);
      expect(found.shareOnResult, isTrue);
      expect(found.playGamesInSettings, isTrue);
    },
  );
}

MergeRelayRelayController _relayController({MergeRelayGateway? gateway}) =>
    MergeRelayRelayController(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      gateway: gateway ?? FakeRelayGateway(),
      authStore: MemoryMergeRelayAuthStore(),
      stateStore: MemoryMergeRelayRelayStateStore(),
    );

final class _SurfaceFindings {
  const _SurfaceFindings({
    required this.joinRelayOnHome,
    required this.shareOnPause,
    required this.shareOnResult,
    required this.playGamesInSettings,
  });

  final bool joinRelayOnHome;
  final bool shareOnPause;
  final bool shareOnResult;
  final bool playGamesInSettings;
}

Future<_SurfaceFindings> _walkSurfaces(
  WidgetTester tester,
  MergeRelayFeatures features,
) async {
  final gateway = FakeRelayGateway()
    ..pgsIdentityStatus = const MergeRelayPgsIdentitySnapshot(
      provider: 'google_play_games',
      configured: true,
      status: MergeRelayPgsIdentityLinkStatus.unlinked,
    );
  final relay = _relayController(gateway: gateway);
  final provider = FakeMergeRelayPlayGamesProvider(
    state: const MergeRelayPlayGamesState(
      status: MergeRelayPlayGamesStatus.authenticated,
    ),
  );
  final pgsAccount = MergeRelayPgsAccountController(
    provider: provider,
    gateway: gateway,
    ensureGuest: relay.bootstrap,
  );

  await tester.pumpWidget(
    MergeRelayApp(
      relayController: relay,
      pgsAccount: pgsAccount,
      playGames: provider,
      features: features,
    ),
  );
  await tester.pumpAndSettle();
  final joinRelayOnHome = find.text('Join a relay').evaluate().isNotEmpty;

  await tester.tap(find.text('Play rescue'));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Skip'));
  await tester.pumpAndSettle();

  await tester.tap(find.byTooltip('Pause'));
  await tester.pumpAndSettle();
  final shareOnPause = find.text('Share this board').evaluate().isNotEmpty;
  await tester.tap(find.text('Resume'));
  await tester.pumpAndSettle();

  for (final delta in const [
    Offset(0, -180),
    Offset(-180, 0),
    Offset(-180, 0),
  ]) {
    await tester.fling(find.byType(MergeRelayBoard), delta, 1000);
    await tester.pumpAndSettle();
  }
  final shareOnResult = find.text('Share this board').evaluate().isNotEmpty;

  await tester.tap(find.text('Home'));
  await tester.pumpAndSettle();
  await tester.tap(find.byTooltip('Settings'));
  await tester.pumpAndSettle();
  final playGamesInSettings = find.text('Play Games').evaluate().isNotEmpty;

  await tester.pumpWidget(const SizedBox());
  return _SurfaceFindings(
    joinRelayOnHome: joinRelayOnHome,
    shareOnPause: shareOnPause,
    shareOnResult: shareOnResult,
    playGamesInSettings: playGamesInSettings,
  );
}

final class _StubChallengeLinks implements MergeRelayChallengeLinkSource {
  _StubChallengeLinks({this.pending = const []});

  final List<String> pending;
  var initializeCalls = 0;
  final _events = StreamController<String>.broadcast(sync: true);

  @override
  Stream<String> get links => _events.stream;

  @override
  Future<List<String>> initialize() async {
    initializeCalls += 1;
    return pending;
  }

  void emit(String link) => _events.add(link);

  @override
  void dispose() => _events.close();
}
