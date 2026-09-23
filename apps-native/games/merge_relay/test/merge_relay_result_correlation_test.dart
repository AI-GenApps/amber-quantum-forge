import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/network/merge_relay_models.dart';
import 'package:merge_relay/src/network/merge_relay_response_validation.dart';
import 'package:merge_relay/src/network/merge_relay_wire.dart';
import 'package:merge_rules/merge_rules.dart';

void main() {
  test('accepts a result correlated to its attempt and session', () {
    final attempt = _attempt();
    final result = _result();

    expect(
      () => validateFinalizedResultCorrelation(
        result,
        attempt,
        expectedEnvironment: 'debug',
        expectedRecipientSubject: 'guest_test',
        expectedScoreDelta: 4,
      ),
      returnsNormally,
    );
  });

  test('rejects result environment, recipient, and score mismatches', () {
    final attempt = _attempt();

    _expectProtocol(
      () => validateFinalizedResultCorrelation(
        _result(environment: 'production'),
        attempt,
        expectedEnvironment: 'debug',
        expectedRecipientSubject: 'guest_test',
        expectedScoreDelta: 4,
      ),
    );
    _expectProtocol(
      () => validateFinalizedResultCorrelation(
        _result(recipientSubject: 'other_guest'),
        attempt,
        expectedEnvironment: 'debug',
        expectedRecipientSubject: 'guest_test',
        expectedScoreDelta: 4,
      ),
    );
    _expectProtocol(
      () => validateFinalizedResultCorrelation(
        _result(scoreDelta: 8),
        attempt,
        expectedEnvironment: 'debug',
        expectedRecipientSubject: 'guest_test',
        expectedScoreDelta: 4,
      ),
    );
  });

  test('correlates completed attempt status and result ID when available', () {
    final attempt = _attempt(
      status: MergeRelayAttemptStatus.completed,
      resultId: 'result_test',
    );
    final result = _result();

    expect(
      () => validateFinalizedResultCorrelation(
        result,
        attempt,
        expectedAttemptStatus: MergeRelayAttemptStatus.completed,
        expectedResultId: 'result_test',
      ),
      returnsNormally,
    );
    _expectProtocol(
      () => validateFinalizedResultCorrelation(
        result,
        attempt,
        expectedAttemptStatus: MergeRelayAttemptStatus.reserved,
      ),
    );
    _expectProtocol(
      () => validateFinalizedResultCorrelation(
        result,
        attempt,
        expectedResultId: 'other_result',
      ),
    );
  });
}

void _expectProtocol(void Function() operation) {
  expect(operation, throwsA(isA<MergeRelayProtocolException>()));
}

MergeRelayAttempt _attempt({
  MergeRelayAttemptStatus status = MergeRelayAttemptStatus.reserved,
  String? resultId,
}) {
  return MergeRelayAttempt(
    attemptId: 'attempt_test',
    challengeId: 'challenge_test',
    environment: 'debug',
    recipientSubject: 'guest_test',
    checkpoint: _checkpoint,
    moves: const [MergeDirection.left],
    maxLegalMoves: 3,
    status: status,
    reservationKey: 'reservation_test',
    reservedAt: DateTime.utc(2026),
    expiresAt: DateTime.utc(2026, 9, 18),
    version: 1,
    resultId: resultId,
    updatedAt: DateTime.utc(2026),
  );
}

MergeRelayResultEnvelope _result({
  String environment = 'debug',
  String recipientSubject = 'guest_test',
  int scoreDelta = 4,
}) {
  return MergeRelayResultEnvelope(
    resultId: 'result_test',
    attemptId: 'attempt_test',
    challengeId: 'challenge_test',
    environment: environment,
    recipientSubject: recipientSubject,
    scoreDelta: scoreDelta,
    finalScore: 4,
    maxTile: 4,
    movesUsed: 1,
    outcome: MergeRelayResultOutcome.earlyFinish,
    mode: MergeRelayMode.rescue,
    originMode: MergeRelayMode.rescue,
    configRevision: 1,
    challengePayloadHash: null,
    returnChallengeId: null,
    createdAt: DateTime.utc(2026),
  );
}

final _checkpoint = MergeRelayCheckpoint(
  state: MergeGameState(
    board: MergeBoard([2, 2, ...List<int>.filled(14, 0)]),
    score: 0,
    moveCount: 0,
    seed: 7,
    rngState: 123,
  ),
  maxLegalMoves: 3,
  spawnWeights: const MergeSpawnWeights.legacy(),
);
