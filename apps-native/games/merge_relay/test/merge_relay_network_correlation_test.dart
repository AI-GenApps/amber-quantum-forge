import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_network_test_support.dart';

const _challengeId = 'ch_a3892a2379bd409d88116519ecc40482';
const _attemptId = 'att_5fed860cfa0d4e8eb9d63a548e0ebe25';
const _resultId = 'res_b6557df0d1bf427aae2c2a589dbf8150';

MergeRelayHttpGateway _gateway(MergeRelayHttpTransport transport) =>
    MergeRelayHttpGateway(
      config: MergeRelayNetworkConfig(
        apiBaseUri: Uri.parse('https://relay.example/api/'),
        environment: 'debug',
      ),
      transport: transport,
      authStore: MemoryMergeRelayAuthStore()..accessToken = 'guest-token',
    );

Map<String, Object?> _copy(Object value) =>
    (jsonDecode(jsonEncode(value)) as Map).cast<String, Object?>();

Map<String, Object?> _data(Map<String, Object?> envelope) =>
    (envelope['data'] as Map).cast<String, Object?>();

Future<void> _expectProtocol(Future<Object?> operation) async {
  await expectLater(operation, throwsA(isA<MergeRelayProtocolException>()));
}

void main() {
  final fixture = loadMergeRelayFixture();

  test('rejects mismatched challenge and attempt identities', () async {
    final challenge = _copy(fixture['challenge_resolve']!);
    _data(challenge)['challenge_id'] = 'ch_wrong';
    await _expectProtocol(
      _gateway(
        QueueTransport({
          'GET challenges/$_challengeId/resolve': [fixtureResponse(challenge)],
        }),
      ).resolveChallenge(_challengeId),
    );

    final privateChallenge = _copy(fixture['challenge_private']!);
    final privateValue = (_data(privateChallenge)['challenge'] as Map)
        .cast<String, Object?>();
    privateValue['challenge_id'] = 'ch_wrong';
    await _expectProtocol(
      _gateway(
        QueueTransport({
          'GET challenges/$_challengeId': [fixtureResponse(privateChallenge)],
        }),
      ).getChallenge(_challengeId),
    );

    final reserved = _copy(fixture['attempt_reserve']!);
    final attempt = (_data(reserved)['attempt'] as Map).cast<String, Object?>();
    attempt['challenge_id'] = 'ch_wrong';
    await _expectProtocol(
      _gateway(
        QueueTransport({
          'POST challenges/$_challengeId/attempts': [fixtureResponse(reserved)],
        }),
      ).reserveAttempt(_challengeId, 'fixture-reserve'),
    );

    final fetched = _copy(fixture['attempt_private']!);
    final fetchedAttempt = (_data(fetched)['attempt'] as Map)
        .cast<String, Object?>();
    fetchedAttempt['attempt_id'] = 'att_wrong';
    await _expectProtocol(
      _gateway(
        QueueTransport({
          'GET attempts/$_attemptId': [fixtureResponse(fetched)],
        }),
      ).getAttempt(_attemptId),
    );
  });

  test('rejects move responses with wrong version or move suffix', () async {
    final wrongVersion = _copy(fixture['attempt_move']!);
    final versionAttempt = (_data(wrongVersion)['attempt'] as Map)
        .cast<String, Object?>();
    versionAttempt['version'] = 2;
    await _expectProtocol(
      _gateway(
        QueueTransport({
          'POST attempts/$_attemptId/moves': [fixtureResponse(wrongVersion)],
        }),
      ).submitMoves(
        _attemptId,
        MergeRelayMoveRequest(expectedVersion: 0, moves: [MergeDirection.left]),
      ),
    );

    final wrongSuffix = _copy(fixture['attempt_move']!);
    final suffixAttempt = (_data(wrongSuffix)['attempt'] as Map)
        .cast<String, Object?>();
    suffixAttempt['moves'] = ['right'];
    await _expectProtocol(
      _gateway(
        QueueTransport({
          'POST attempts/$_attemptId/moves': [fixtureResponse(wrongSuffix)],
        }),
      ).submitMoves(
        _attemptId,
        MergeRelayMoveRequest(expectedVersion: 0, moves: [MergeDirection.left]),
      ),
    );
  });

  test(
    'rejects result, return challenge, save, and daily mismatches',
    () async {
      final wrongResultAttempt = _copy(fixture['attempt_finalize']!);
      final result = (_data(wrongResultAttempt)['result'] as Map)
          .cast<String, Object?>();
      result['attempt_id'] = 'att_wrong';
      await _expectProtocol(
        _gateway(
          QueueTransport({
            'POST attempts/$_attemptId/finalize': [
              fixtureResponse(wrongResultAttempt),
            ],
          }),
        ).finalizeAttempt(
          _attemptId,
          MergeRelayFinalizeRequest(idempotencyKey: 'fixture-finalize'),
        ),
      );

      final wrongReturn = _copy(fixture['attempt_finalize']!);
      final returnChallenge = (_data(wrongReturn)['return_challenge'] as Map)
          .cast<String, Object?>();
      returnChallenge['challenge_id'] = 'ch_wrong';
      await _expectProtocol(
        _gateway(
          QueueTransport({
            'POST attempts/$_attemptId/finalize': [
              fixtureResponse(wrongReturn),
            ],
          }),
        ).finalizeAttempt(
          _attemptId,
          MergeRelayFinalizeRequest(idempotencyKey: 'fixture-finalize'),
        ),
      );

      final wrongResultId = _copy(fixture['result_private']!);
      final fetchedResult = (_data(wrongResultId)['result'] as Map)
          .cast<String, Object?>();
      fetchedResult['result_id'] = 'res_wrong';
      await _expectProtocol(
        _gateway(
          QueueTransport({
            'GET results/$_resultId': [fixtureResponse(wrongResultId)],
          }),
        ).getResult(_resultId),
      );

      final wrongSave = _copy(fixture['save_get']!);
      final save = (_data(wrongSave)['save'] as Map).cast<String, Object?>();
      save['save_id'] = 'other';
      await _expectProtocol(
        _gateway(
          QueueTransport({
            'GET saves/main': [fixtureResponse(wrongSave)],
          }),
        ).getSave('main'),
      );

      final wrongPutSave = _copy(fixture['save_put']!);
      final putSave = (_data(wrongPutSave)['save'] as Map)
          .cast<String, Object?>();
      putSave['save_id'] = 'other';
      await _expectProtocol(
        _gateway(
          QueueTransport({
            'PUT saves/main': [fixtureResponse(wrongPutSave)],
          }),
        ).putSave(
          'main',
          MergeRelaySaveRequest(
            expectedVersion: 0,
            schemaVersion: 1,
            payload: {'hello': 'world'},
          ),
        ),
      );

      final wrongDaily = _copy(fixture['daily']!);
      _data(wrongDaily)['date'] = '2026-09-18';
      await _expectProtocol(
        _gateway(
          QueueTransport({
            'GET daily/2026-09-17': [fixtureResponse(wrongDaily)],
          }),
        ).getDaily('2026-09-17'),
      );
    },
  );
}
