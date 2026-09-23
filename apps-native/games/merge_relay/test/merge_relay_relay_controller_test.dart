import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_relay_controller.dart';
import 'package:merge_relay/src/merge_relay_relay_link.dart';
import 'package:merge_relay/src/merge_relay_relay_models.dart';
import 'package:merge_relay/src/merge_relay_relay_persistence.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_network_test_support.dart';
import 'merge_relay_relay_test_support.dart';

void main() {
  test('parses only configured relay links', () {
    final origin = Uri.parse('https://relay.example');
    expect(
      MergeRelayChallengeLink.parse('mergerelay://challenge/ch_abc'),
      'ch_abc',
    );
    expect(
      MergeRelayChallengeLink.parse(
        'https://relay.example/games/merge-relay/challenges/ch_abc',
        publicOrigin: origin,
      ),
      'ch_abc',
    );
    expect(
      MergeRelayChallengeLink.parse(
        'https://other.example/games/merge-relay/challenges/ch_abc',
        publicOrigin: origin,
      ),
      isNull,
    );
    expect(
      MergeRelayChallengeLink.parse('mergerelay://challenge/../x'),
      isNull,
    );
    expect(
      MergeRelayChallengeLink.parse('mergerelay://user@challenge/ch_abc'),
      isNull,
    );
    expect(
      MergeRelayChallengeLink.parse(
        'http://relay.example/games/merge-relay/challenges/ch_abc',
        publicOrigin: Uri.parse('http://relay.example'),
      ),
      isNull,
    );
    expect(
      MergeRelayChallengeLink.parse(
        'https://relay.example/other/games/merge-relay/challenges/ch_abc',
        publicOrigin: origin,
      ),
      isNull,
    );
    expect(
      MergeRelayChallengeLink.parse(
        'https://relay.example/games/merge-relay/challenges/ch_abc?environment=debug',
        publicOrigin: origin,
        environment: 'debug',
      ),
      'ch_abc',
    );
    expect(
      MergeRelayChallengeLink.parse(
        'https://relay.example/games/merge-relay/challenges/ch_abc?environment=production',
        publicOrigin: origin,
        environment: 'debug',
      ),
      isNull,
    );
    expect(
      MergeRelayChallengeLink.parse(
        'https://relay.example/games/merge-relay/challenges/ch_abc?environment=debug&extra=1',
        publicOrigin: origin,
        environment: 'debug',
      ),
      isNull,
    );
  });

  test('runs the fixture route from guest to result', () async {
    final fixture = loadMergeRelayFixture();
    final config =
        jsonDecode(jsonEncode(fixture['config'])) as Map<String, Object?>;
    final data = config['data']! as Map<String, Object?>;
    (data['features']! as Map<String, Object?>)['ranked_relay'] = true;
    final transport = FixtureTransport({
      'POST guest': fixtureResponse(fixture['guest_create']),
      'GET challenges/ch_a3892a2379bd409d88116519ecc40482/resolve':
          fixtureResponse(fixture['challenge_resolve']),
      'POST challenges/ch_a3892a2379bd409d88116519ecc40482/attempts':
          fixtureResponse(fixture['attempt_reserve'], statusCode: 201),
      'POST attempts/att_': fixtureResponse(fixture['attempt_move']),
      'POST attempts/att_5fed860cfa0d4e8eb9d63a548e0ebe25/finalize':
          fixtureResponse(fixture['attempt_finalize']),
      'GET config': fixtureResponse(config),
    });
    final controller = MergeRelayRelayController(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      gateway: MergeRelayHttpGateway(
        config: MergeRelayNetworkConfig(
          apiBaseUri: Uri.parse('https://relay.example/api/'),
          environment: 'debug',
        ),
        transport: transport,
        authStore: MemoryMergeRelayAuthStore(),
      ),
      authStore: MemoryMergeRelayAuthStore(),
      stateStore: MemoryMergeRelayRelayStateStore(),
      publicOrigin: Uri.parse('https://relay.example'),
      keyFactory: (prefix) =>
          prefix == 'reserve' ? 'fixture-reserve' : '$prefix-fixed',
    );

    await controller.bootstrap();
    await controller.openLink(
      'mergerelay://challenge/ch_a3892a2379bd409d88116519ecc40482',
    );
    expect(controller.snapshot.phase, MergeRelayRelayPhase.preview);
    await controller.reserve();
    expect(controller.snapshot.phase, MergeRelayRelayPhase.playing);
    await controller.move(MergeDirection.left);
    expect(controller.snapshot.attempt?.moves, [MergeDirection.left]);
    await controller.finalize(finishEarly: true);

    expect(controller.snapshot.phase, MergeRelayRelayPhase.result);
    expect(
      controller.snapshot.result?.outcome,
      MergeRelayResultOutcome.earlyFinish,
    );
    expect(
      transport.requests.map((request) => request.key),
      containsAllInOrder([
        'POST guest',
        'GET config',
        'GET challenges/ch_a3892a2379bd409d88116519ecc40482/resolve',
        'POST challenges/ch_a3892a2379bd409d88116519ecc40482/attempts',
        'POST attempts/att_5fed860cfa0d4e8eb9d63a548e0ebe25/moves',
        'POST attempts/att_5fed860cfa0d4e8eb9d63a548e0ebe25/finalize',
      ]),
    );
    controller.dispose();
  });

  test(
    'submits three changed legal moves and retries a pending move',
    () async {
      final fake = FakeRelayGateway();
      final controller = _controller(fake);
      await controller.bootstrap();
      await controller.openChallenge(fake.challenge.challengeId);
      await controller.reserve();
      for (var index = 0; index < 3; index += 1) {
        final attempt = controller.snapshot.attempt!;
        final rules = MergeRules(
          config: MergeRuleConfig(
            revision: 1,
            spawnWeights:
                attempt.checkpoint.spawnWeights ??
                const MergeSpawnWeights.legacy(),
          ),
        );
        final direction = MergeDirection.values.firstWhere(
          (value) => rules.apply(attempt.checkpoint.state, value).changed,
        );
        await controller.move(direction);
      }
      expect(fake.submittedMoves, 3);
      expect(controller.snapshot.attempt?.moves, hasLength(3));
      expect(fake.finalizeCalls, 1);
      expect(fake.lastFinalizeRequest?.returnAlias, 'You');
      expect(controller.snapshot.result?.returnChallengeId, 'return_test');
      expect(controller.snapshot.phase, MergeRelayRelayPhase.result);

      final retryFake = FakeRelayGateway();
      final retryController = _controller(retryFake);
      await retryController.bootstrap();
      await retryController.openChallenge(retryFake.challenge.challengeId);
      await retryController.reserve();
      retryFake.failNextMove = true;
      final attempt = retryController.snapshot.attempt!;
      final direction = MergeDirection.values.firstWhere(
        (value) =>
            const MergeRules().apply(attempt.checkpoint.state, value).changed,
      );
      await retryController.move(direction);
      expect(retryController.snapshot.phase, MergeRelayRelayPhase.offline);
      expect(retryController.snapshot.pendingMove, direction);
      await retryController.reconnect();
      expect(retryController.snapshot.pendingMove, direction);
      await retryController.retryPending();
      expect(retryController.snapshot.phase, MergeRelayRelayPhase.playing);
      expect(retryController.snapshot.pendingMove, isNull);
      controller.dispose();
      retryController.dispose();
    },
  );

  test(
    'reopens the latest preview from its persisted challenge identity',
    () async {
      final fake = FakeRelayGateway();
      final stateStore = MemoryMergeRelayRelayStateStore();
      final controller = _controller(fake, stateStore);
      await controller.bootstrap();
      await controller.openChallenge(fake.challenge.challengeId);
      controller.dispose();

      final reopened = _controller(fake, stateStore);
      await reopened.bootstrap();
      expect(reopened.snapshot.phase, MergeRelayRelayPhase.preview);
      expect(
        reopened.snapshot.preview?.challengeId,
        fake.challenge.challengeId,
      );
      reopened.dispose();
    },
  );

  test(
    'normal completion persists the stable return alias across lost ACK',
    () async {
      final fake = FakeRelayGateway();
      final store = MemoryMergeRelayRelayStateStore();
      final controller = _controller(fake, store);
      await controller.bootstrap();
      await controller.openChallenge(fake.challenge.challengeId);
      await controller.reserve();
      fake.failFinalizeAfterCommit = true;
      for (var index = 0; index < 3; index += 1) {
        final attempt = controller.snapshot.attempt!;
        final direction = MergeDirection.values.firstWhere(
          (value) =>
              const MergeRules().apply(attempt.checkpoint.state, value).changed,
        );
        await controller.move(direction);
      }
      expect(controller.snapshot.phase, MergeRelayRelayPhase.offline);
      expect(
        (await store.readRelay(runtimeAppContext(identity: mergeRelayIdentity)))
            ?.finalizeReturnAlias,
        'You',
      );
      controller.dispose();

      final reopened = _controller(fake, store);
      await reopened.bootstrap();
      expect(reopened.snapshot.phase, MergeRelayRelayPhase.result);
      expect(reopened.snapshot.result?.returnChallengeId, 'return_test');
      expect(fake.finalizeCalls, 1);
      reopened.dispose();
    },
  );

  test('rejects a persisted return without its authoritative result', () {
    expect(
      () => MergeRelayRelayLocalState.fromJson({
        'version': 1,
        'challenge_id': 'ch_test',
        'attempt_id': 'att_test',
        'reservation_key': 'reserve-test',
        'expected_version': 1,
        'acknowledged_move_count': 1,
        'pending_move': null,
        'finalize_key': 'finalize-test',
        'finalize_finish_early': false,
        'finalize_return_alias': 'You',
        'result_id': null,
        'return_challenge_id': 'return_test',
        'save_id': null,
        'server_save_version': 0,
        'created_challenge_id': null,
        'pending_create': null,
      }),
      throwsFormatException,
    );
  });

  test(
    'composite writes retain solo payload and relay state in order',
    () async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final delegate = BlockingCompositeDelegate();
      final store = MergeRelayCompositeSaveStore(delegate: delegate);
      final initial = SaveEnvelope.create(
        context: context,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026),
        payload: {'session_map_version': 1, 'active_session_key': 'old'},
      );
      await delegate.write(context, initial);
      delegate.blockNextRead = true;
      final envelope = SaveEnvelope.create(
        context: context,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026, 9, 18),
        payload: {'session_map_version': 1, 'active_session_key': 'endless'},
      );
      final relayState = const MergeRelayRelayLocalState(
        challengeId: 'ch_test',
        attemptId: 'att_test',
        reservationKey: 'reserve-test',
        expectedVersion: 2,
      );
      final gameWrite = store.write(context, envelope);
      final relayWrite = store.writeRelay(context, relayState);
      await delegate.readStarted.future;
      delegate.releaseRead();
      await Future.wait([gameWrite, relayWrite]);
      final saved = await delegate.read(context);
      expect(saved?.payload['active_session_key'], 'endless');
      expect((await store.readRelay(context))?.toJson(), relayState.toJson());
      await store.read(context);
      expect((await store.readRelay(context))?.toJson(), relayState.toJson());
    },
  );

  test(
    'persists finalize semantics and recovers a lost result acknowledgement',
    () async {
      final fake = FakeRelayGateway();
      final stateStore = MemoryMergeRelayRelayStateStore();
      final controller = _controller(fake, stateStore);
      await controller.bootstrap();
      await controller.openChallenge(fake.challenge.challengeId);
      await controller.reserve();
      await controller.move(MergeDirection.left);
      fake.failFinalizeAfterCommit = true;
      await controller.finalize(finishEarly: true, returnAlias: 'Ada');

      expect(controller.snapshot.phase, MergeRelayRelayPhase.offline);
      final saved = await stateStore.readRelay(
        runtimeAppContext(identity: mergeRelayIdentity),
      );
      expect(saved?.finalizeFinishEarly, isTrue);
      expect(saved?.finalizeReturnAlias, 'Ada');
      expect(fake.finalizeCalls, 1);
      controller.dispose();

      final reopened = _controller(fake, stateStore);
      await reopened.bootstrap();
      expect(reopened.snapshot.phase, MergeRelayRelayPhase.result);
      expect(reopened.snapshot.result?.resultId, 'result_test');
      expect(fake.finalizeCalls, 1);
      reopened.dispose();
    },
  );

  test(
    'retrying finalize ignores changed inputs after the request is persisted',
    () async {
      final fake = FakeRelayGateway();
      final controller = _controller(fake);
      await controller.bootstrap();
      await controller.openChallenge(fake.challenge.challengeId);
      await controller.reserve();
      await controller.move(MergeDirection.left);
      fake.failFinalizeAfterCommit = true;
      await controller.finalize(finishEarly: true, returnAlias: 'Ada');
      await controller.finalize(finishEarly: false, returnAlias: 'Other');

      expect(fake.finalizeCalls, 2);
      expect(fake.lastFinalizeRequest?.finishEarly, isTrue);
      expect(fake.lastFinalizeRequest?.returnAlias, 'Ada');
      expect(controller.snapshot.phase, MergeRelayRelayPhase.result);
      controller.dispose();
    },
  );
}

MergeRelayRelayController _controller(
  FakeRelayGateway gateway, [
  MergeRelayRelayStateStore? stateStore,
]) => MergeRelayRelayController(
  context: runtimeAppContext(identity: mergeRelayIdentity),
  gateway: gateway,
  authStore: MemoryMergeRelayAuthStore(),
  stateStore: stateStore ?? MemoryMergeRelayRelayStateStore(),
  keyFactory: (prefix) => '$prefix-fixed',
);
