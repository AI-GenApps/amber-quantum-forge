part of 'merge_relay_relay_controller.dart';

extension MergeRelayRelayControllerReplay on MergeRelayRelayController {
  Future<MergeRelayReplayReport?> verifyReplay({int? replayGeneration}) async {
    final result = snapshot.result;
    if (isDisposed || result == null) return null;
    final replayToken = replayGeneration ?? ++_replayGeneration;
    final generation = _operationGeneration;
    try {
      await _ensureGuest();
      final cachedAttempt = snapshot.attempt;
      final attempt =
          cachedAttempt?.attemptId == result.attemptId &&
              cachedAttempt?.status == MergeRelayAttemptStatus.completed &&
              cachedAttempt?.resultId == result.resultId
          ? cachedAttempt!
          : await gateway.getAttempt(result.attemptId);
      final challenge = snapshot.preview?.challengeId == result.challengeId
          ? snapshot.preview!
          : await gateway.getChallenge(result.challengeId);
      validateFinalizedResultCorrelation(
        result,
        attempt,
        expectedEnvironment: attempt.environment,
        expectedRecipientSubject: attempt.recipientSubject,
        expectedAttemptStatus: MergeRelayAttemptStatus.completed,
        expectedResultId: result.resultId,
      );
      final spawnWeights =
          attempt.checkpoint.spawnWeights ??
          challenge.checkpoint.spawnWeights ??
          const MergeSpawnWeights.legacy();
      final report = verifyMergeRelayReplay(
        challenge: challenge,
        attempt: attempt,
        result: result,
        config: MergeRuleConfig(
          revision: challenge.configRevision,
          spawnWeights: spawnWeights,
        ),
      );
      if (!_isCurrentOperation(generation) ||
          replayToken != _replayGeneration) {
        return null;
      }
      snapshot
        ..replay = report
        ..replayStep = 0
        ..replayPlaying = false
        ..message = 'Replay ready.'
        ..clearError();
      _emit();
      return report;
    } on Object catch (error) {
      if (_isCurrentOperation(generation) && replayToken == _replayGeneration) {
        _setError(error, fallbackCode: 'replay_verification_failed');
      }
      return null;
    }
  }

  Future<void> watchReplay() async {
    if (isDisposed) return;
    final replayToken = ++_replayGeneration;
    if (snapshot.replay == null) {
      final report = await verifyReplay(replayGeneration: replayToken);
      if (report == null) return;
    }
    if (isDisposed || replayToken != _replayGeneration) return;
    if (snapshot.replay!.moves == 0) {
      snapshot.replayStep = 0;
      snapshot.replayPlaying = false;
      _emit();
      return;
    }
    snapshot.replayStep = snapshot.replayStep >= snapshot.replay!.moves
        ? 0
        : snapshot.replayStep;
    _startReplayTimer(replayToken);
    _emit();
  }

  void pauseReplay() {
    if (isDisposed) return;
    _replayGeneration += 1;
    _replayTimer?.cancel();
    _replayTimer = null;
    snapshot.replayPlaying = false;
    _emit();
  }

  void stepReplay() {
    final report = snapshot.replay;
    if (isDisposed || report == null) return;
    _replayGeneration += 1;
    _replayTimer?.cancel();
    _replayTimer = null;
    snapshot
      ..replayPlaying = false
      ..replayStep = (snapshot.replayStep + 1).clamp(0, report.moves);
    _emit();
  }

  void closeReplay() {
    if (isDisposed) return;
    _resetReplay();
    _emit();
  }

  void _resetReplay() {
    _replayGeneration += 1;
    _replayTimer?.cancel();
    _replayTimer = null;
    snapshot
      ..replay = null
      ..replayPlaying = false
      ..replayStep = 0;
  }

  void _startReplayTimer(int replayGeneration) {
    final report = snapshot.replay;
    if (report == null || report.moves == 0) return;
    _replayTimer?.cancel();
    snapshot.replayPlaying = true;
    _replayTimer = Timer.periodic(const Duration(milliseconds: 650), (timer) {
      if (isDisposed ||
          snapshot.replay == null ||
          replayGeneration != _replayGeneration) {
        timer.cancel();
        _replayTimer = null;
        return;
      }
      if (snapshot.replayStep >= snapshot.replay!.moves) {
        timer.cancel();
        _replayTimer = null;
        snapshot.replayPlaying = false;
      } else {
        snapshot.replayStep += 1;
      }
      _emit();
    });
  }

  Future<void> _hydrateReturnChallenge() async {
    final result = snapshot.result;
    final persistedId = _local.returnChallengeId;
    final resultId = result?.returnChallengeId;
    final localResultMatches = _local.resultId == result?.resultId;
    if (localResultMatches && persistedId != null && persistedId != resultId) {
      if (!isDisposed) {
        _setError(
          const FormatException('Persisted return identity does not match'),
          fallbackCode: 'return_identity_mismatch',
        );
      }
      return;
    }
    final challengeId = resultId ?? (localResultMatches ? persistedId : null);
    if (isDisposed ||
        result == null ||
        challengeId == null ||
        snapshot.returnChallenge != null) {
      return;
    }
    final generation = _operationGeneration;
    try {
      await _ensureGuest();
      final challenge = await gateway.getChallenge(challengeId);
      if (!_isCurrentOperation(generation)) return;
      if (challenge.challengeId != challengeId ||
          challenge.parentChallengeId != result.challengeId ||
          _local.resultId != null && _local.resultId != result.resultId) {
        throw const FormatException('Return challenge parent mismatch');
      }
      snapshot.returnChallenge = challenge;
      _emit();
    } on Object {
      if (_isCurrentOperation(generation)) {
        snapshot.message = 'Return relay is waiting for a connection.';
        _emit();
      }
    }
  }
}
