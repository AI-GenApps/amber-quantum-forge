part of 'merge_relay_relay_controller.dart';

extension MergeRelayRelayControllerActions on MergeRelayRelayController {
  Future<void> _bootstrap() async {
    if (isDisposed) return;
    _setPhase(MergeRelayRelayPhase.bootstrapping);
    try {
      _local =
          await stateStore.readRelay(context) ??
          const MergeRelayRelayLocalState();
      await _ensureGuest();
      if (isDisposed) return;
      if (snapshot.config == null) {
        try {
          snapshot.config = await gateway.getConfig();
        } on Object {
          snapshot.config = null;
        }
      }
      if (isDisposed) return;
      snapshot
        ..guestReady = true
        ..phase = MergeRelayRelayPhase.ready
        ..clearError();
      _emit();
      if (_local.pendingCreate != null) {
        await _resumeCreate();
      } else if (_local.pendingChallengeId != null) {
        await openChallenge(_local.pendingChallengeId!);
      } else if (_local.createdChallengeId != null &&
          !_local.hasAttempt &&
          _local.resultId == null) {
        await _restoreCreatedChallenge();
      } else if (_local.challengeId != null &&
          !_local.hasAttempt &&
          _local.resultId == null) {
        await _restorePreview();
      }
      if (_local.hasAttempt) {
        await reconnect();
        if (!isDisposed &&
            _local.resultId == null &&
            snapshot.phase == MergeRelayRelayPhase.playing &&
            snapshot.attempt != null &&
            (_local.finalizeKey != null ||
                snapshot.attempt!.moves.length >=
                    snapshot.attempt!.maxLegalMoves ||
                snapshot.attempt!.checkpoint.state.isTerminal)) {
          await finalize(
            returnAlias: snapshot.attempt!.checkpoint.state.isTerminal
                ? null
                : mergeRelayDefaultReturnAlias,
          );
        }
      }
    } on Object catch (error) {
      _setError(error, fallbackCode: 'guest_bootstrap_failed');
    }
  }

  Future<void> _ensureGuest() async {
    if (_guest != null) return;
    final future = _guestFuture ??= _loadGuest();
    try {
      _guest = await future;
    } finally {
      if (identical(_guestFuture, future)) _guestFuture = null;
    }
  }

  Future<MergeRelayGuestSession> _loadGuest() async {
    final recoveryToken = await authStore.readRecoveryToken();
    return recoveryToken == null
        ? gateway.createGuest()
        : gateway.recoverGuest(recoveryToken);
  }

  Future<void> openLink(String raw) async {
    final challengeId = MergeRelayChallengeLink.parse(
      raw,
      publicOrigin: publicOrigin,
      environment: context.environment.name,
    );
    if (challengeId == null) {
      _setError(
        const FormatException('Invalid challenge link'),
        fallbackCode: 'invalid_challenge_link',
      );
      return;
    }
    await openChallenge(challengeId);
  }

  Future<void> openChallenge(String challengeId) async {
    if (isDisposed) return;
    if (_local.hasAttempt && _local.resultId == null) {
      _setError(
        StateError('Finish the active relay before changing challenges'),
        fallbackCode: 'active_attempt',
      );
      return;
    }
    _resetReplay();
    final generation = ++_operationGeneration;
    final request = ++_challengeRequest;
    _local = MergeRelayRelayLocalState(
      pendingChallengeId: challengeId,
      saveId: _local.saveId,
      serverSaveVersion: _local.serverSaveVersion,
    );
    snapshot
      ..preview = null
      ..attempt = null
      ..result = null
      ..returnChallenge = null
      ..sharePayload = null
      ..pendingMove = null;
    _setPhase(MergeRelayRelayPhase.loadingPreview);
    if (!await _persist()) return;
    try {
      final challenge = await gateway.resolveChallenge(challengeId);
      if (!_isCurrentOperation(generation) ||
          request != _challengeRequest ||
          challenge.challengeId != challengeId) {
        return;
      }
      snapshot
        ..preview = challenge
        ..attempt = null
        ..result = null
        ..returnChallenge = null
        ..pendingMove = null
        ..phase = MergeRelayRelayPhase.preview
        ..clearError();
      _local = MergeRelayRelayLocalState(
        challengeId: challenge.challengeId,
        pendingChallengeId: null,
        saveId: _local.saveId,
        serverSaveVersion: _local.serverSaveVersion,
        createdChallengeId: null,
        pendingCreate: null,
      );
      if (!await _persist()) return;
      _emit();
    } on Object catch (error) {
      if (_isCurrentOperation(generation) && request == _challengeRequest) {
        _setError(error, fallbackCode: 'preview_failed');
      }
    }
  }

  Future<void> _restorePreview() async {
    final challengeId = _local.pendingChallengeId ?? _local.challengeId;
    if (isDisposed || challengeId == null) return;
    final generation = _operationGeneration;
    try {
      final challenge = await gateway.resolveChallenge(challengeId);
      if (!_isCurrentOperation(generation) ||
          challenge.challengeId != challengeId) {
        return;
      }
      _local = MergeRelayRelayLocalState(
        challengeId: challenge.challengeId,
        saveId: _local.saveId,
        serverSaveVersion: _local.serverSaveVersion,
      );
      snapshot
        ..preview = challenge
        ..attempt = null
        ..result = null
        ..returnChallenge = null
        ..phase = MergeRelayRelayPhase.preview
        ..clearError();
      if (!await _persist()) return;
      _emit();
    } on Object catch (error) {
      if (_isCurrentOperation(generation)) {
        _setError(error, fallbackCode: 'preview_restore_failed');
      }
    }
  }

  Future<void> reserve() async {
    final challenge = snapshot.preview;
    if (isDisposed || challenge == null) return;
    final challengeId = challenge.challengeId;
    final generation = _operationGeneration;
    try {
      await _ensureGuest();
      if (!_isCurrentOperation(generation) ||
          snapshot.preview?.challengeId != challengeId) {
        return;
      }
      final config = snapshot.config ??= await gateway.getConfig();
      if (!_isCurrentOperation(generation) ||
          snapshot.preview?.challengeId != challengeId) {
        return;
      }
      if (!config.active || !config.features.rankedRelay) {
        _setError(
          const FormatException('Relay is not enabled'),
          fallbackCode: 'relay_disabled',
        );
        return;
      }
      final reservationKey = _local.reservationKey ?? _key('reserve');
      _local = MergeRelayRelayLocalState(
        challengeId: challenge.challengeId,
        reservationKey: reservationKey,
        finalizeKey: _local.finalizeKey,
        saveId: _local.saveId,
        serverSaveVersion: _local.serverSaveVersion,
      );
      if (!await _persist()) return;
      _setPhase(MergeRelayRelayPhase.reserving);
      final attempt = await gateway.reserveAttempt(challengeId, reservationKey);
      if (!_isCurrentOperation(generation) ||
          snapshot.preview?.challengeId != challengeId ||
          attempt.challengeId != challengeId) {
        return;
      }
      snapshot
        ..attempt = attempt
        ..phase = MergeRelayRelayPhase.playing
        ..clearError();
      _local = MergeRelayRelayLocalState(
        challengeId: attempt.challengeId,
        attemptId: attempt.attemptId,
        reservationKey: attempt.reservationKey,
        expectedVersion: attempt.version,
        acknowledgedMoveCount: attempt.moves.length,
        finalizeKey: _local.finalizeKey,
        finalizeFinishEarly: _local.finalizeFinishEarly,
        finalizeReturnAlias: _local.finalizeReturnAlias,
        saveId: _local.saveId,
        serverSaveVersion: _local.serverSaveVersion,
      );
      await _persist();
      _emit();
    } on Object catch (error) {
      if (_isCurrentOperation(generation) &&
          snapshot.preview?.challengeId == challengeId) {
        _setError(error, fallbackCode: 'reserve_failed');
      }
    }
  }
}
