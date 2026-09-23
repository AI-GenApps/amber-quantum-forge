part of 'merge_relay_relay_controller.dart';

extension MergeRelayRelayControllerMoves on MergeRelayRelayController {
  Future<void> move(MergeDirection direction) async {
    final attempt = snapshot.attempt;
    final generation = _operationGeneration;
    if (isDisposed ||
        attempt == null ||
        snapshot.phase != MergeRelayRelayPhase.playing ||
        _local.pendingMove != null) {
      return;
    }
    if (attempt.version != _local.expectedVersion ||
        attempt.moves.length >= attempt.maxLegalMoves) {
      _setError(
        const FormatException('Relay checkpoint changed'),
        fallbackCode: 'attempt_conflict',
      );
      return;
    }
    final before = attempt.checkpoint.state;
    final rules = MergeRules(
      config: MergeRuleConfig(
        revision: snapshot.config?.revision ?? 1,
        spawnWeights:
            attempt.checkpoint.spawnWeights ?? const MergeSpawnWeights.legacy(),
      ),
    );
    final localResult = rules.apply(before, direction);
    if (!localResult.changed) {
      snapshot
        ..message = localResult.reason == 'terminal'
            ? 'No lanes left.'
            : 'That lane is blocked.'
        ..errorCode = localResult.reason;
      _emit();
      return;
    }
    _local = MergeRelayRelayLocalState(
      challengeId: _local.challengeId,
      attemptId: _local.attemptId,
      reservationKey: _local.reservationKey,
      expectedVersion: _local.expectedVersion,
      acknowledgedMoveCount: _local.acknowledgedMoveCount,
      pendingMove: direction,
      finalizeKey: _local.finalizeKey,
      finalizeFinishEarly: _local.finalizeFinishEarly,
      finalizeReturnAlias: _local.finalizeReturnAlias,
      resultId: _local.resultId,
      returnChallengeId: _local.returnChallengeId,
      saveId: _local.saveId,
      serverSaveVersion: _local.serverSaveVersion,
    );
    snapshot.pendingMove = direction;
    if (!await _persist()) return;
    if (!_isCurrentOperation(generation) ||
        snapshot.attempt?.attemptId != _local.attemptId) {
      return;
    }
    await _submitPending(before, localResult, generation: generation);
  }

  Future<void> _submitPending(
    MergeGameState before,
    MergeMoveResult localResult, {
    required int generation,
  }) async {
    final attempt = snapshot.attempt;
    final direction = _local.pendingMove;
    final attemptId = _local.attemptId;
    final pendingState = _local;
    if (!_isCurrentOperation(generation) ||
        attempt == null ||
        direction == null ||
        attemptId == null ||
        attempt.attemptId != attemptId) {
      return;
    }
    _setPhase(MergeRelayRelayPhase.syncing);
    try {
      final updated = await gateway.submitMoves(
        attemptId,
        MergeRelayMoveRequest(
          expectedVersion: _local.expectedVersion,
          moves: [direction],
        ),
      );
      if (!_isCurrentOperation(generation) ||
          snapshot.attempt?.attemptId != updated.attemptId ||
          updated.challengeId != attempt.challengeId ||
          updated.version != attempt.version + 1 ||
          updated.moves.length != attempt.moves.length + 1 ||
          updated.moves.last != direction) {
        if (_isCurrentOperation(generation)) {
          _setError(
            const FormatException('Relay move response did not match request'),
            fallbackCode: 'move_response_mismatch',
          );
        }
        return;
      }
      snapshot
        ..attempt = updated
        ..pendingMove = null
        ..feedback = MergeMovePresentation.fromResult(
          before: before,
          result: localResult,
          direction: direction,
        )
        ..phase = MergeRelayRelayPhase.playing
        ..clearError();
      _local = MergeRelayRelayLocalState(
        challengeId: updated.challengeId,
        attemptId: updated.attemptId,
        reservationKey: updated.reservationKey,
        expectedVersion: updated.version,
        acknowledgedMoveCount: updated.moves.length,
        finalizeKey: _local.finalizeKey,
        finalizeFinishEarly: _local.finalizeFinishEarly,
        finalizeReturnAlias: _local.finalizeReturnAlias,
        resultId: _local.resultId,
        returnChallengeId: _local.returnChallengeId,
        saveId: _local.saveId,
        serverSaveVersion: _local.serverSaveVersion,
      );
      if (!await _persist()) {
        if (_isCurrentOperation(generation)) {
          _local = pendingState;
          snapshot
            ..pendingMove = direction
            ..phase = MergeRelayRelayPhase.offline
            ..errorCode = 'local_save_failed'
            ..message = 'Move sent. Reconnect to confirm the checkpoint.';
          _emit();
        }
        return;
      }
      _emit();
      if (updated.moves.length >= updated.maxLegalMoves ||
          updated.checkpoint.state.isTerminal) {
        await finalize(
          returnAlias: updated.checkpoint.state.isTerminal
              ? null
              : mergeRelayDefaultReturnAlias,
        );
      }
    } on Object catch (error) {
      if (_isCurrentOperation(generation) &&
          snapshot.attempt?.attemptId == attemptId) {
        _setError(error, fallbackCode: 'move_submit_failed');
      }
    }
  }
}
