import 'package:merge_rules/merge_rules.dart';

import 'network/merge_relay_models.dart';

final class MergeRelayReplayException implements Exception {
  const MergeRelayReplayException(this.message);

  final String message;

  @override
  String toString() => message;
}

final class MergeRelayReplayReport {
  const MergeRelayReplayReport({
    required this.challenge,
    required this.attempt,
    required this.replay,
  });

  final MergeRelayChallenge challenge;
  final MergeRelayAttempt attempt;
  final MergeReplayResult replay;

  int get moves => replay.legalMoves;

  int get finalScore => replay.finalState.score;
}

MergeRelayReplayReport verifyMergeRelayReplay({
  required MergeRelayChallenge challenge,
  required MergeRelayAttempt attempt,
  required MergeRelayResultEnvelope result,
  MergeRuleConfig config = const MergeRuleConfig.legacy(),
}) {
  if (attempt.challengeId != challenge.challengeId ||
      result.challengeId != challenge.challengeId ||
      result.attemptId != attempt.attemptId) {
    throw const MergeRelayReplayException('Replay identities do not match');
  }
  _require(
    attempt.status == MergeRelayAttemptStatus.completed,
    'Replay attempt is not complete',
  );
  _require(
    attempt.resultId == result.resultId,
    'Replay result identity is not authoritative',
  );
  _require(
    attempt.environment.isNotEmpty &&
        attempt.environment == result.environment &&
        attempt.recipientSubject.isNotEmpty &&
        attempt.recipientSubject == result.recipientSubject,
    'Replay recipient scope mismatch',
  );
  if (result.mode != challenge.mode ||
      result.originMode != challenge.originMode ||
      result.configRevision != challenge.configRevision) {
    throw const MergeRelayReplayException('Replay result metadata mismatch');
  }
  if (challenge.checkpoint.checkpointHash != challenge.checkpointHash) {
    throw const MergeRelayReplayException('Challenge checkpoint hash mismatch');
  }
  _require(
    attempt.maxLegalMoves == challenge.checkpoint.maxLegalMoves &&
        attempt.checkpoint.maxLegalMoves == attempt.maxLegalMoves,
    'Replay move budget mismatch',
  );
  _require(
    attempt.checkpoint.contentId == challenge.checkpoint.contentId &&
        attempt.checkpoint.contentVersion ==
            challenge.checkpoint.contentVersion &&
        _sameWeights(
          attempt.checkpoint.spawnWeights,
          challenge.checkpoint.spawnWeights,
        ),
    'Replay checkpoint metadata mismatch',
  );
  if (result.challengePayloadHash != challenge.payloadHash) {
    throw const MergeRelayReplayException('Challenge payload hash mismatch');
  }
  late final MergeReplayResult replay;
  try {
    replay = MergeRules(config: config).replayAttempt(
      MergeCheckpoint.fromState(
        challenge.checkpoint.state,
        maxLegalMoves: challenge.checkpoint.maxLegalMoves,
        contentId: challenge.checkpoint.contentId,
        contentVersion: challenge.checkpoint.contentVersion,
        spawnWeights: challenge.checkpoint.spawnWeights,
      ),
      attempt.moves,
      maxLegalMoves: attempt.maxLegalMoves,
      finish: result.outcome == MergeRelayResultOutcome.earlyFinish,
    );
  } on Object catch (error) {
    throw MergeRelayReplayException('Replay rules rejected the trace: $error');
  }
  _require(
    sha256Hex(replay.finalState.toWireJson()) ==
        sha256Hex(attempt.checkpoint.state.toWireJson()),
    'Replay checkpoint does not match server state',
  );
  _require(
    replay.legalMoves == attempt.moves.length,
    'Replay move count mismatch',
  );
  _require(replay.legalMoves == result.movesUsed, 'Result move count mismatch');
  _require(
    replay.finalState.score == result.finalScore,
    'Result score mismatch',
  );
  _require(replay.scoreGained == result.scoreDelta, 'Result delta mismatch');
  _require(replay.maxTile == result.maxTile, 'Result tile mismatch');
  final expectedOutcome = switch (replay.outcome) {
    MergeAttemptOutcome.completed => MergeRelayResultOutcome.complete,
    MergeAttemptOutcome.earlyFinish => MergeRelayResultOutcome.earlyFinish,
    MergeAttemptOutcome.terminal => MergeRelayResultOutcome.terminal,
    MergeAttemptOutcome.inProgress => MergeRelayResultOutcome.unfinished,
  };
  _require(
    expectedOutcome == result.outcome ||
        (result.outcome == MergeRelayResultOutcome.tie &&
            expectedOutcome == MergeRelayResultOutcome.complete),
    'Result outcome mismatch',
  );
  return MergeRelayReplayReport(
    challenge: challenge,
    attempt: attempt,
    replay: replay,
  );
}

void _require(bool value, String message) {
  if (!value) throw MergeRelayReplayException(message);
}

bool _sameWeights(MergeSpawnWeights? first, MergeSpawnWeights? second) {
  if (first == null || second == null) return first == null && second == null;
  return first.matches(second);
}
