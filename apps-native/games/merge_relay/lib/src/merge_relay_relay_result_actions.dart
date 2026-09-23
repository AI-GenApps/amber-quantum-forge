part of 'merge_relay_relay_controller.dart';

extension MergeRelayRelayControllerResultActions on MergeRelayRelayController {
  Future<void> finalize({bool finishEarly = false, String? returnAlias}) async {
    final attempt = snapshot.attempt;
    final generation = _operationGeneration;
    if (isDisposed ||
        _finalizeInFlight ||
        attempt == null ||
        _local.attemptId == null ||
        _local.pendingMove != null) {
      return;
    }
    final retrying = _local.finalizeKey != null && _local.resultId == null;
    final key = _local.finalizeKey ?? _key('finalize');
    final requestFinishEarly = retrying
        ? _local.finalizeFinishEarly
        : finishEarly;
    final requestReturnAlias = retrying
        ? _local.finalizeReturnAlias
        : returnAlias;
    final requestState = MergeRelayRelayLocalState(
      challengeId: _local.challengeId,
      attemptId: _local.attemptId,
      reservationKey: _local.reservationKey,
      expectedVersion: _local.expectedVersion,
      acknowledgedMoveCount: _local.acknowledgedMoveCount,
      finalizeKey: key,
      finalizeFinishEarly: requestFinishEarly,
      finalizeReturnAlias: requestReturnAlias,
      saveId: _local.saveId,
      serverSaveVersion: _local.serverSaveVersion,
    );
    _local = requestState;
    _finalizeInFlight = true;
    try {
      if (!await _persist()) return;
      if (!_isCurrentOperation(generation) ||
          snapshot.attempt?.attemptId != attempt.attemptId) {
        return;
      }
      _setPhase(MergeRelayRelayPhase.finalizing);
      final envelope = await gateway.finalizeAttempt(
        attempt.attemptId,
        MergeRelayFinalizeRequest(
          idempotencyKey: key,
          finishEarly: requestFinishEarly,
          returnAlias: requestReturnAlias,
        ),
      );
      if (!_isCurrentOperation(generation) ||
          snapshot.attempt?.attemptId != attempt.attemptId) {
        return;
      }
      if (envelope.attemptId != attempt.attemptId ||
          envelope.challengeId != attempt.challengeId) {
        throw const FormatException(
          'Relay finalize response did not match request',
        );
      }
      snapshot
        ..result = envelope
        ..returnChallenge = envelope.returnChallenge
        ..phase = MergeRelayRelayPhase.result
        ..clearError();
      _local = MergeRelayRelayLocalState(
        challengeId: _local.challengeId,
        attemptId: _local.attemptId,
        reservationKey: _local.reservationKey,
        expectedVersion: _local.expectedVersion,
        acknowledgedMoveCount: _local.acknowledgedMoveCount,
        finalizeKey: key,
        finalizeFinishEarly: requestFinishEarly,
        finalizeReturnAlias: requestReturnAlias,
        resultId: envelope.resultId,
        returnChallengeId: envelope.returnChallengeId,
        saveId: _local.saveId,
        serverSaveVersion: _local.serverSaveVersion,
      );
      if (!await _persist()) {
        if (_isCurrentOperation(generation)) {
          _local = requestState;
          snapshot
            ..phase = MergeRelayRelayPhase.offline
            ..errorCode = 'local_save_failed'
            ..message = 'Result received. Reconnect to save the result.';
          _emit();
        }
        return;
      }
      _emit();
    } on Object catch (error) {
      if (_isCurrentOperation(generation) &&
          snapshot.attempt?.attemptId == attempt.attemptId) {
        _setError(error, fallbackCode: 'finalize_failed');
      }
    } finally {
      _finalizeInFlight = false;
    }
  }

  Future<void> openResult(String resultId) async {
    if (isDisposed) return;
    if (snapshot.result?.resultId != resultId) _resetReplay();
    final generation = _operationGeneration;
    try {
      await _ensureGuest();
      final envelope = await gateway.getResult(resultId);
      if (!_isCurrentOperation(generation)) return;
      if (envelope.resultId != resultId ||
          _local.resultId != null && _local.resultId != resultId ||
          _local.resultId == resultId &&
              _local.returnChallengeId != null &&
              _local.returnChallengeId != envelope.returnChallengeId ||
          envelope.returnChallengeId != null &&
              envelope.returnChallenge?.challengeId != null &&
              envelope.returnChallenge?.challengeId !=
                  envelope.returnChallengeId ||
          envelope.returnChallenge != null &&
              envelope.returnChallenge!.parentChallengeId !=
                  envelope.challengeId) {
        throw const FormatException(
          'Relay result response did not match request',
        );
      }
      snapshot
        ..result = envelope
        ..returnChallenge = envelope.returnChallenge
        ..phase = MergeRelayRelayPhase.result
        ..clearError();
      _emit();
      if (envelope.returnChallengeId != null &&
          snapshot.returnChallenge == null) {
        await _hydrateReturnChallenge();
      }
    } on Object catch (error) {
      if (_isCurrentOperation(generation)) {
        _setError(error, fallbackCode: 'result_failed');
      }
    }
  }

  void openReturn() {
    unawaited(shareReturn());
  }

  Future<MergeRelaySave?> loadSave(String saveId) async {
    final generation = _operationGeneration;
    try {
      await _ensureGuest();
      final save = await gateway.getSave(saveId);
      if (!_isCurrentOperation(generation)) return null;
      if (save != null) {
        snapshot.saveVersion = save.version;
        _local = _withSave(saveId: saveId, serverSaveVersion: save.version);
        await _persist();
      } else {
        _local = _withSave(saveId: saveId, serverSaveVersion: 0);
        await _persist();
      }
      return save;
    } on Object catch (error) {
      if (_isCurrentOperation(generation)) {
        _setError(error, fallbackCode: 'save_load_failed');
      }
      return null;
    }
  }

  Future<MergeRelaySave?> pushSave({
    required String saveId,
    required Map<String, Object?> payload,
  }) async {
    final generation = _operationGeneration;
    try {
      await _ensureGuest();
      final expectedVersion = _local.saveId == saveId
          ? _local.serverSaveVersion
          : 0;
      final saved = await gateway.putSave(
        saveId,
        MergeRelaySaveRequest(
          expectedVersion: expectedVersion,
          schemaVersion: 1,
          payload: payload,
        ),
      );
      if (!_isCurrentOperation(generation)) return null;
      snapshot
        ..saveVersion = saved.version
        ..clearError();
      _local = _withSave(saveId: saveId, serverSaveVersion: saved.version);
      await _persist();
      return saved;
    } on MergeRelayApiException catch (error) {
      if (error.isConflict) {
        try {
          final remote = await gateway.getSave(saveId);
          if (!isDisposed && remote != null) {
            snapshot.saveVersion = remote.version;
            _local = _withSave(
              saveId: saveId,
              serverSaveVersion: remote.version,
            );
            await _persist();
          }
        } on Object {
          _setError(error, fallbackCode: 'save_write_conflict');
          return null;
        }
      }
      if (_isCurrentOperation(generation)) {
        _setError(error, fallbackCode: 'save_write_failed');
      }
      return null;
    } on Object catch (error) {
      if (_isCurrentOperation(generation)) {
        _setError(error, fallbackCode: 'save_write_failed');
      }
      return null;
    }
  }

  void _setExpired(String message) {
    if (isDisposed) return;
    snapshot
      ..phase = MergeRelayRelayPhase.expired
      ..errorCode = 'reservation_expired'
      ..message = message;
    _emit();
  }

  MergeRelayRelayLocalState _withSave({
    required String saveId,
    required int serverSaveVersion,
  }) => MergeRelayRelayLocalState(
    challengeId: _local.challengeId,
    attemptId: _local.attemptId,
    reservationKey: _local.reservationKey,
    expectedVersion: _local.expectedVersion,
    acknowledgedMoveCount: _local.acknowledgedMoveCount,
    pendingMove: _local.pendingMove,
    finalizeKey: _local.finalizeKey,
    finalizeFinishEarly: _local.finalizeFinishEarly,
    finalizeReturnAlias: _local.finalizeReturnAlias,
    resultId: _local.resultId,
    returnChallengeId: _local.returnChallengeId,
    createdChallengeId: _local.createdChallengeId,
    pendingChallengeId: _local.pendingChallengeId,
    pendingCreate: _local.pendingCreate,
    saveId: saveId,
    serverSaveVersion: serverSaveVersion,
  );
}
