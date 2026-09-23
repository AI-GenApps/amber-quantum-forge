import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_network_test_support.dart';

MergeRelayHttpGateway _gateway(MergeRelayHttpTransport transport) =>
    MergeRelayHttpGateway(
      config: MergeRelayNetworkConfig(
        apiBaseUri: Uri.parse('https://relay.example/api/'),
        environment: 'debug',
      ),
      transport: transport,
      authStore: MemoryMergeRelayAuthStore()..accessToken = 'guest-token',
    );

void main() {
  final fixture = loadMergeRelayFixture();

  test(
    'decodes source route fixture across guest, relay, daily, and saves',
    () async {
      final transport = FixtureTransport({
        'POST guest': fixtureResponse(fixture['guest_create']),
        'POST guest/recover': fixtureResponse(fixture['guest_recover']),
        'POST guest/upgrade': fixtureResponse({
          'contract_version': mergeRelayContractVersion,
          'data': {
            'guest_id': 'guest_2ece1cffd184494993b3a716234a8434',
            'subject': 'account_subject',
            'upgraded_subject': 'account_subject',
          },
        }),
        'POST challenges': fixtureResponse(
          fixture['challenge_create'],
          statusCode: 201,
        ),
        'GET challenges/ch_a3892a2379bd409d88116519ecc40482/resolve':
            fixtureResponse(fixture['challenge_resolve']),
        'GET challenges/ch_a3892a2379bd409d88116519ecc40482': fixtureResponse(
          fixture['challenge_private'],
        ),
        'POST challenges/ch_a3892a2379bd409d88116519ecc40482/attempts':
            fixtureResponse(fixture['attempt_reserve'], statusCode: 201),
        'POST attempts/att_': fixtureResponse(fixture['attempt_move']),
        'GET attempts/att_': fixtureResponse(fixture['attempt_private']),
        'POST attempts/att_5fed860cfa0d4e8eb9d63a548e0ebe25/finalize':
            fixtureResponse(fixture['attempt_finalize']),
        'GET results/res_': fixtureResponse(fixture['result_private']),
        'GET daily/2026-09-17': fixtureResponse(fixture['daily']),
        'GET config': fixtureResponse(fixture['config']),
        'PUT saves/main': fixtureResponse(fixture['save_put']),
        'GET saves/main': fixtureResponse(fixture['save_get']),
      });
      final auth = MemoryMergeRelayAuthStore();
      final gateway = MergeRelayHttpGateway(
        config: MergeRelayNetworkConfig(
          apiBaseUri: Uri.parse('https://relay.example/api/'),
          environment: 'debug',
        ),
        transport: transport,
        authStore: auth,
      );

      final guest = await gateway.createGuest();
      expect(guest.recoveryToken, 'recovery-token-fixture');
      expect(auth.accessToken, 'guest-token');
      await gateway.recoverGuest(guest.recoveryToken);
      await gateway.upgradeGuest(guest.recoveryToken);

      final checkpoint = MergeCheckpoint.fromState(
        MergeGameState(
          board: MergeBoard([2, 2, ...List<int>.filled(14, 0)]),
          score: 0,
          moveCount: 0,
          seed: 7,
          rngState: 123,
        ),
      );
      final challenge = await gateway.createChallenge(
        MergeRelayChallengeRequest(
          idempotencyKey: 'fixture-create',
          creatorAlias: 'Ada',
          checkpoint: checkpoint,
        ),
      );
      expect(challenge.checkpointHash, challenge.checkpoint.checkpointHash);
      expect(challenge.payloadHash, isNotNull);
      expect(
        (await gateway.resolveChallenge(challenge.challengeId)).mode,
        MergeRelayMode.rescue,
      );
      expect(
        (await gateway.getChallenge(challenge.challengeId)).status,
        MergeRelayChallengeStatus.open,
      );

      final reserved = await gateway.reserveAttempt(
        challenge.challengeId,
        'fixture-reserve',
      );
      expect(reserved.version, 0);
      final moved = await gateway.submitMoves(
        reserved.attemptId,
        MergeRelayMoveRequest(
          expectedVersion: reserved.version,
          moves: [MergeDirection.left],
        ),
      );
      expect(moved.version, 1);
      expect((await gateway.getAttempt(moved.attemptId)).moves, [
        MergeDirection.left,
      ]);
      final result = await gateway.finalizeAttempt(
        moved.attemptId,
        MergeRelayFinalizeRequest(
          idempotencyKey: 'fixture-finalize',
          finishEarly: true,
          returnAlias: 'Ada',
        ),
      );
      expect(result.outcome, MergeRelayResultOutcome.earlyFinish);
      expect(result.returnChallenge?.parentChallengeId, challenge.challengeId);
      expect((await gateway.getResult(result.resultId)).finalScore, 4);

      final daily = await gateway.getDaily('2026-09-17');
      expect(daily.checkpoint.state.seed, 678502064);
      expect((await gateway.getConfig()).spawnWeights.spawnFourWeight, 10);
      expect(
        (await gateway.putSave(
          'main',
          MergeRelaySaveRequest(
            expectedVersion: 0,
            schemaVersion: 1,
            payload: {'hello': 'world'},
          ),
        )).version,
        1,
      );
      expect((await gateway.getSave('main'))?.payload['hello'], 'world');
      expect(transport.requests.any((request) => request.body is Map), isTrue);
    },
  );

  test('recovers a guest token once after an authenticated 401', () async {
    final fixture = loadMergeRelayFixture();
    final transport = QueueTransport({
      'GET challenges/ch_a3892a2379bd409d88116519ecc40482': [
        fixtureResponse(fixtureError('invalid_game_token'), statusCode: 401),
        fixtureResponse(fixture['challenge_private']),
      ],
      'POST guest/recover': [fixtureResponse(fixture['guest_recover'])],
    });
    final auth = MemoryMergeRelayAuthStore()
      ..accessToken = 'expired-token'
      ..recoveryToken = 'recovery-token-fixture';
    final gateway = MergeRelayHttpGateway(
      config: MergeRelayNetworkConfig(
        apiBaseUri: Uri.parse('https://relay.example/api/'),
        environment: 'debug',
      ),
      transport: transport,
      authStore: auth,
    );

    final challenge = await gateway.getChallenge(
      'ch_a3892a2379bd409d88116519ecc40482',
    );
    expect(challenge.status, MergeRelayChallengeStatus.open);
    expect(auth.accessToken, 'guest-token');
    expect(transport.requests.map((request) => request.key), [
      'GET challenges/ch_a3892a2379bd409d88116519ecc40482',
      'POST guest/recover',
      'GET challenges/ch_a3892a2379bd409d88116519ecc40482',
    ]);
  });

  test('rejects wrong contract, changed hashes, and save conflicts', () async {
    final fixture = loadMergeRelayFixture();
    final transport = QueueTransport({
      'GET challenges/ch_a3892a2379bd409d88116519ecc40482/resolve': [
        fixtureResponse({
          'contract_version': 'merge-relay.v0',
          'data': (fixture['challenge_resolve'] as Map)['data'],
        }),
      ],
    });
    final gateway = _gateway(transport);
    await expectLater(
      gateway.resolveChallenge('ch_a3892a2379bd409d88116519ecc40482'),
      throwsA(isA<MergeRelayProtocolException>()),
    );

    final badHash = (fixture['challenge_resolve'] as Map).map<String, Object?>(
      (key, value) => MapEntry(key.toString(), value),
    );
    (badHash['data'] as Map<String, Object?>)['checkpoint_hash'] = '0' * 64;
    final hashTransport = QueueTransport({
      'GET challenges/ch_a3892a2379bd409d88116519ecc40482/resolve': [
        fixtureResponse(badHash),
      ],
    });
    await expectLater(
      _gateway(hashTransport)
          .resolveChallenge('ch_a3892a2379bd409d88116519ecc40482'),
      throwsA(isA<MergeRelayProtocolException>()),
    );

    final conflictTransport = QueueTransport({
      'PUT saves/main': [
        fixtureResponse(fixtureError('save_version_conflict'), statusCode: 409),
      ],
    });
    await expectLater(
      _gateway(conflictTransport).putSave(
        'main',
        MergeRelaySaveRequest(
          expectedVersion: 0,
          schemaVersion: 1,
          payload: {'value': 1},
        ),
      ),
      throwsA(
        isA<MergeRelayApiException>().having(
          (error) => error.code,
          'code',
          'save_version_conflict',
        ),
      ),
    );
  });

  test('requires HTTPS except for explicit local debug transport', () {
    expect(
      () => MergeRelayNetworkConfig(
        apiBaseUri: Uri.parse('http://relay.example/api/'),
        environment: 'debug',
      ),
      throwsArgumentError,
    );
    expect(
      MergeRelayNetworkConfig(
        apiBaseUri: Uri.parse('http://127.0.0.1:8787/api/'),
        environment: 'debug',
        allowInsecureLocalDebug: true,
      ).endpoint('config').path,
      '/api/games/merge_relay/debug/config',
    );
  });
}
