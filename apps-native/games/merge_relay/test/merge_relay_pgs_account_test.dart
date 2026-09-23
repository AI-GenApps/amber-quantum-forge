import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/platform/merge_relay_pgs_account.dart';
import 'package:merge_relay/src/platform/merge_relay_play_games.dart';

import 'merge_relay_fake_gateway.dart';

void main() {
  test(
    'refreshes a guest-safe unlinked status without exposing identity data',
    () async {
      final gateway = FakeRelayGateway()
        ..pgsIdentityStatus = const MergeRelayPgsIdentitySnapshot(
          provider: 'google_play_games',
          configured: true,
          status: MergeRelayPgsIdentityLinkStatus.unlinked,
        );
      var guestCalls = 0;
      final controller = MergeRelayPgsAccountController(
        provider: FakeMergeRelayPlayGamesProvider(),
        gateway: gateway,
        ensureGuest: () async => guestCalls += 1,
      );

      final state = await controller.refreshStatus();

      expect(state.phase, MergeRelayPgsAccountPhase.unlinked);
      expect(state.isLinked, isFalse);
      expect(state.configured, isTrue);
      expect(guestCalls, 1);
      controller.dispose();
    },
  );

  test('links through native access and sends the auth code once', () async {
    final provider = FakeMergeRelayPlayGamesProvider(
      state: const MergeRelayPlayGamesState(
        status: MergeRelayPlayGamesStatus.authenticated,
      ),
      serverAccess: const MergeRelayPlayGamesServerAccess(
        granted: true,
        authCode: 'one-shot-code',
      ),
    );
    final gateway = FakeRelayGateway();
    var guestCalls = 0;
    final controller = MergeRelayPgsAccountController(
      provider: provider,
      gateway: gateway,
      ensureGuest: () async => guestCalls += 1,
    );

    final state = await controller.link();

    expect(state.phase, MergeRelayPgsAccountPhase.linked);
    expect(gateway.lastPgsAuthCode, 'one-shot-code');
    expect(guestCalls, 1);
    controller.dispose();
  });

  test(
    'maps unavailable configuration and platform cancellation honestly',
    () async {
      final unavailableController = MergeRelayPgsAccountController(
        provider: FakeMergeRelayPlayGamesProvider(),
        gateway: FakeRelayGateway(),
        ensureGuest: () async {},
      );
      expect(
        (await unavailableController.refreshStatus()).phase,
        MergeRelayPgsAccountPhase.unavailable,
      );
      unavailableController.dispose();

      final cancelledController = MergeRelayPgsAccountController(
        provider: FakeMergeRelayPlayGamesProvider(
          state: const MergeRelayPlayGamesState(
            status: MergeRelayPlayGamesStatus.cancelled,
            diagnosticCode: 'user_cancelled',
          ),
        ),
        gateway: FakeRelayGateway(),
        ensureGuest: () async {},
      );
      expect(
        (await cancelledController.link()).phase,
        MergeRelayPgsAccountPhase.cancelled,
      );
      cancelledController.dispose();
    },
  );

  test('passes achievement and leaderboard actions through without claiming settlement', () async {
    final provider = FakeMergeRelayPlayGamesProvider(
      achievementsResult: const MergeRelayPlayGamesActionResult(
        status: MergeRelayPlayGamesActionStatus.completed,
      ),
      leaderboardsResult: const MergeRelayPlayGamesActionResult(
        status: MergeRelayPlayGamesActionStatus.cancelled,
      ),
    );
    final controller = MergeRelayPgsAccountController(
      provider: provider,
      gateway: FakeRelayGateway(),
      ensureGuest: () async {},
    );

    expect(
      (await controller.showAchievements()).status,
      MergeRelayPlayGamesActionStatus.completed,
    );
    expect(
      (await controller.showLeaderboards()).status,
      MergeRelayPlayGamesActionStatus.cancelled,
    );
    controller.dispose();
  });

  test('shares concurrent status refreshes', () async {
    final pending = Completer<MergeRelayPgsIdentitySnapshot>();
    final gateway = FakeRelayGateway()..pgsStatusFuture = pending.future;
    final controller = MergeRelayPgsAccountController(
      provider: FakeMergeRelayPlayGamesProvider(),
      gateway: gateway,
      ensureGuest: () async {},
    );

    final first = controller.refreshStatus();
    final second = controller.refreshStatus();
    await Future<void>.delayed(Duration.zero);
    expect(gateway.pgsStatusCalls, 1);

    pending.complete(
      const MergeRelayPgsIdentitySnapshot(
        provider: 'google_play_games',
        configured: true,
        status: MergeRelayPgsIdentityLinkStatus.active,
      ),
    );
    expect((await first).phase, MergeRelayPgsAccountPhase.linked);
    expect((await second).phase, MergeRelayPgsAccountPhase.linked);
    controller.dispose();
  });

  test('queues a link intent behind an in-flight status refresh', () async {
    final pending = Completer<MergeRelayPgsIdentitySnapshot>();
    final provider = FakeMergeRelayPlayGamesProvider(
      state: const MergeRelayPlayGamesState(
        status: MergeRelayPlayGamesStatus.authenticated,
      ),
      serverAccess: const MergeRelayPlayGamesServerAccess(
        granted: true,
        authCode: 'queued-link-code',
      ),
    );
    final gateway = FakeRelayGateway()..pgsStatusFuture = pending.future;
    final controller = MergeRelayPgsAccountController(
      provider: provider,
      gateway: gateway,
      ensureGuest: () async {},
    );

    final refresh = controller.refreshStatus();
    final link = controller.link();
    await Future<void>.delayed(Duration.zero);
    expect(gateway.pgsStatusCalls, 1);

    pending.complete(
      const MergeRelayPgsIdentitySnapshot(
        provider: 'google_play_games',
        configured: true,
        status: MergeRelayPgsIdentityLinkStatus.unlinked,
      ),
    );

    expect((await refresh).phase, MergeRelayPgsAccountPhase.unlinked);
    expect((await link).phase, MergeRelayPgsAccountPhase.linked);
    expect(gateway.lastPgsAuthCode, 'queued-link-code');
    controller.dispose();
  });

  test(
    'disposal before native access completion prevents code exchange',
    () async {
      final pending = Completer<MergeRelayPlayGamesServerAccess>();
      final provider = FakeMergeRelayPlayGamesProvider(
        state: const MergeRelayPlayGamesState(
          status: MergeRelayPlayGamesStatus.authenticated,
        ),
      )..serverAccessFuture = pending.future;
      final gateway = FakeRelayGateway();
      final controller = MergeRelayPgsAccountController(
        provider: provider,
        gateway: gateway,
        ensureGuest: () async {},
      );

      final link = controller.link();
      await Future<void>.delayed(Duration.zero);
      controller.dispose();
      pending.complete(
        const MergeRelayPlayGamesServerAccess(
          granted: true,
          authCode: 'late-one-shot-code',
        ),
      );

      await link;
      expect(gateway.lastPgsAuthCode, isNull);
    },
  );
}
