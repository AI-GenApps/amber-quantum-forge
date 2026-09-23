part of 'merge_relay_relay_controller.dart';

extension MergeRelayRelayControllerReconnect on MergeRelayRelayController {
  Future<void> retryPending() async {
    final attempt = snapshot.attempt;
    final direction = _local.pendingMove;
    final generation = _operationGeneration;
    if (attempt == null || direction == null) return;
    final rules = MergeRules(
      config: MergeRuleConfig(
        revision: snapshot.config?.revision ?? 1,
        spawnWeights:
            attempt.checkpoint.spawnWeights ?? const MergeSpawnWeights.legacy(),
      ),
    );
    final localResult = rules.apply(attempt.checkpoint.state, direction);
    if (!localResult.changed) return;
    await _submitPending(
      attempt.checkpoint.state,
      localResult,
      generation: generation,
    );
  }

  Future<void> reconnect() async {
    if (isDisposed || _local.attemptId == null) return;
    final generation = _operationGeneration;
    final attemptId = _local.attemptId!;
    final pendingState = _local;
    _setPhase(MergeRelayRelayPhase.syncing);
    try {
      final current = await gateway.getAttempt(attemptId);
      if (!_isCurrentOperation(generation)) return;
      if (current.attemptId != attemptId ||
          current.challengeId != _local.challengeId) {
        _setError(
          const FormatException('Relay attempt response did not match request'),
          fallbackCode: 'attempt_response_mismatch',
        );
        return;
      }
      if (current.status == MergeRelayAttemptStatus.completed &&
          current.resultId != null) {
        snapshot.attempt = current;
        _local = MergeRelayRelayLocalState(
          challengeId: current.challengeId,
          attemptId: current.attemptId,
          reservationKey: current.reservationKey,
          expectedVersion: current.version,
          acknowledgedMoveCount: current.moves.length,
          finalizeKey: _local.finalizeKey,
          finalizeFinishEarly: _local.finalizeFinishEarly,
          finalizeReturnAlias: _local.finalizeReturnAlias,
          resultId: current.resultId,
          returnChallengeId: _local.returnChallengeId,
          saveId: _local.saveId,
          serverSaveVersion: _local.serverSaveVersion,
        );
        await _persist();
        await openResult(current.resultId!);
        return;
      }
      if (current.status != MergeRelayAttemptStatus.reserved) {
        _setExpired('This relay attempt is no longer open.');
        return;
      }
      final pending = _local.pendingMove;
      if (pending != null && current.version != _local.expectedVersion) {
        final acknowledged =
            current.moves.length > _local.acknowledgedMoveCount &&
            current.moves[_local.acknowledgedMoveCount] == pending;
        if (!acknowledged) {
          snapshot
            ..attempt = current
            ..phase = MergeRelayRelayPhase.conflict
            ..errorCode = 'attempt_conflict'
            ..message = 'This checkpoint changed. Review it before retrying.';
          _emit();
          return;
        }
      }
      if (pending != null && current.version == _local.expectedVersion) {
        snapshot
          ..attempt = current
          ..phase = MergeRelayRelayPhase.offline
          ..errorCode = 'pending_move'
          ..message = 'Your move is ready to retry.';
        _emit();
        return;
      }
      snapshot
        ..attempt = current
        ..phase = MergeRelayRelayPhase.playing
        ..clearError();
      _local = MergeRelayRelayLocalState(
        challengeId: current.challengeId,
        attemptId: current.attemptId,
        reservationKey: current.reservationKey,
        expectedVersion: current.version,
        acknowledgedMoveCount: current.moves.length,
        pendingMove: null,
        finalizeKey: _local.finalizeKey,
        finalizeFinishEarly: _local.finalizeFinishEarly,
        finalizeReturnAlias: _local.finalizeReturnAlias,
        resultId: _local.resultId,
        returnChallengeId: _local.returnChallengeId,
        saveId: _local.saveId,
        serverSaveVersion: _local.serverSaveVersion,
      );
      snapshot.pendingMove = null;
      if (!await _persist() &&
          pending != null &&
          _isCurrentOperation(generation)) {
        _local = pendingState;
        snapshot
          ..pendingMove = pending
          ..phase = MergeRelayRelayPhase.offline
          ..errorCode = 'local_save_failed'
          ..message = 'Checkpoint received. Reconnect to save the move.';
      }
      _emit();
      if (snapshot.phase == MergeRelayRelayPhase.playing &&
          snapshot.attempt != null &&
          (current.moves.length >= current.maxLegalMoves ||
              current.checkpoint.state.isTerminal)) {
        await finalize(
          returnAlias: current.checkpoint.state.isTerminal
              ? null
              : mergeRelayDefaultReturnAlias,
        );
      }
    } on Object catch (error) {
      if (_isCurrentOperation(generation) &&
          snapshot.attempt?.attemptId == attemptId) {
        _setError(error, fallbackCode: 'reconnect_failed');
      }
    }
  }
}
