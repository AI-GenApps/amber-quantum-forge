part of 'merge_relay_relay_controller.dart';

extension MergeRelayRelayControllerCreator on MergeRelayRelayController {
  Future<void> createChallengeFromCheckpoint({
    required MergeCheckpoint checkpoint,
    required MergeRelayMode originMode,
    String creatorAlias = 'You',
    String? contentId,
    String? contentVersion,
    String? parentChallengeId,
  }) async {
    if (isDisposed || _local.hasAttempt) {
      if (!isDisposed) {
        _setError(
          StateError('Finish the active relay before creating another one'),
          fallbackCode: 'active_attempt',
        );
      }
      return;
    }
    late final MergeRelayPendingCreate pending;
    try {
      pending = MergeRelayPendingCreate(
        idempotencyKey: _key('create'),
        creatorAlias: creatorAlias,
        checkpoint: MergeCheckpoint.fromState(
          checkpoint.state,
          maxLegalMoves: checkpoint.maxLegalMoves,
          contentId: contentId ?? checkpoint.contentId,
          contentVersion: contentVersion ?? checkpoint.contentVersion,
          parentChallengeId: checkpoint.parentChallengeId,
          spawnWeights: checkpoint.spawnWeights,
        ),
        originMode: originMode,
        contentId: contentId,
        contentVersion: contentVersion,
        parentChallengeId: parentChallengeId,
      );
    } on Object catch (error) {
      _setError(error, fallbackCode: 'invalid_create_checkpoint');
      return;
    }
    await _sendCreate(pending, persistPending: true);
  }

  Future<void> _resumeCreate() async {
    final pending = _local.pendingCreate;
    if (pending == null || isDisposed) return;
    await _sendCreate(pending, persistPending: false);
  }

  Future<void> _sendCreate(
    MergeRelayPendingCreate pending, {
    required bool persistPending,
  }) async {
    final generation = ++_operationGeneration;
    if (persistPending) {
      _local = _copyLocal(
        pendingCreate: pending,
        challengeId: null,
        createdChallengeId: null,
        clearChallengeId: true,
        clearCreatedChallengeId: true,
        clearPendingCreate: false,
      );
      if (!await _persist()) return;
    }
    if (isDisposed) return;
    _setPhase(MergeRelayRelayPhase.creating);
    try {
      await _ensureGuest();
      final challenge = await gateway.createChallenge(pending.toRequest());
      if (!_isCurrentOperation(generation)) return;
      final payload = MergeRelaySharePayload.fromChallenge(
        challenge,
        publicOrigin: publicOrigin,
        environment: context.environment.name,
      );
      final created = _copyLocal(
        challengeId: challenge.challengeId,
        createdChallengeId: challenge.challengeId,
        pendingCreate: null,
        clearPendingCreate: true,
      );
      _local = created;
      snapshot
        ..preview = challenge
        ..sharePayload = payload
        ..shareStatus = null
        ..phase = MergeRelayRelayPhase.creator
        ..clearError();
      if (!await _persist()) {
        _local = _copyLocal(
          challengeId: null,
          createdChallengeId: null,
          pendingCreate: pending,
          clearChallengeId: true,
          clearCreatedChallengeId: true,
          clearPendingCreate: false,
        );
        snapshot.phase = MergeRelayRelayPhase.offline;
        snapshot.message =
            'Challenge ready. Save it before leaving this screen.';
        _emit();
        return;
      }
      _emit();
    } on Object catch (error) {
      if (_isCurrentOperation(generation)) {
        _setError(error, fallbackCode: 'create_failed');
      }
    }
  }

  Future<void> _restoreCreatedChallenge() async {
    final challengeId = _local.createdChallengeId;
    if (challengeId == null || isDisposed) return;
    final generation = ++_operationGeneration;
    _setPhase(MergeRelayRelayPhase.creating);
    try {
      await _ensureGuest();
      final challenge = await gateway.getChallenge(challengeId);
      if (!_isCurrentOperation(generation) ||
          challenge.challengeId != challengeId) {
        return;
      }
      snapshot
        ..preview = challenge
        ..sharePayload = MergeRelaySharePayload.fromChallenge(
          challenge,
          publicOrigin: publicOrigin,
          environment: context.environment.name,
        )
        ..shareStatus = null
        ..phase = MergeRelayRelayPhase.creator
        ..clearError();
      _emit();
    } on Object catch (error) {
      if (_isCurrentOperation(generation)) {
        _setError(error, fallbackCode: 'created_challenge_restore_failed');
      }
    }
  }

  Future<void> shareChallenge() {
    if (snapshot.preview?.status != MergeRelayChallengeStatus.open) {
      snapshot.message = 'This challenge is closed.';
      _emit();
      return Future<void>.value();
    }
    return _share(snapshot.sharePayload);
  }

  Future<void> shareReturn() async {
    if (snapshot.returnChallenge == null && _local.returnChallengeId != null) {
      await _hydrateReturnChallenge();
    }
    final challenge = snapshot.returnChallenge;
    if (challenge == null) {
      return;
    }
    if (challenge.status != MergeRelayChallengeStatus.open) {
      if (!isDisposed) {
        snapshot.message = 'This return relay is closed.';
        _emit();
      }
      return;
    }
    await _share(
      MergeRelaySharePayload.fromChallenge(
        challenge,
        publicOrigin: publicOrigin,
        environment: context.environment.name,
      ),
    );
  }

  Future<void> _share(MergeRelaySharePayload? payload) async {
    if (isDisposed || payload == null) return;
    final provider = shareProvider;
    if (provider == null) {
      snapshot
        ..shareStatus = MergeRelayShareStatus.unavailable
        ..message = 'Copy the challenge code to pass it on.';
      _emit();
      return;
    }
    try {
      final status = await provider.share(payload);
      if (isDisposed) return;
      snapshot.shareStatus = status;
      snapshot.message = switch (status) {
        MergeRelayShareStatus.opened => 'Share sheet opened.',
        MergeRelayShareStatus.unavailable =>
          'Copy the challenge code to pass it on.',
        MergeRelayShareStatus.failed => 'The share sheet could not open.',
      };
      _emit();
    } on Object {
      if (isDisposed) return;
      snapshot
        ..shareStatus = MergeRelayShareStatus.failed
        ..message = 'The share sheet could not open.';
      _emit();
    }
  }

  MergeRelayRelayLocalState _copyLocal({
    String? challengeId,
    String? createdChallengeId,
    String? pendingChallengeId,
    MergeRelayPendingCreate? pendingCreate,
    bool clearChallengeId = false,
    bool clearCreatedChallengeId = false,
    bool clearPendingChallengeId = false,
    bool clearPendingCreate = false,
  }) => MergeRelayRelayLocalState(
    challengeId: clearChallengeId
        ? challengeId
        : challengeId ?? _local.challengeId,
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
    saveId: _local.saveId,
    serverSaveVersion: _local.serverSaveVersion,
    createdChallengeId: clearCreatedChallengeId
        ? createdChallengeId
        : createdChallengeId ?? _local.createdChallengeId,
    pendingChallengeId: clearPendingChallengeId
        ? pendingChallengeId
        : pendingChallengeId ?? _local.pendingChallengeId,
    pendingCreate: clearPendingCreate
        ? pendingCreate
        : pendingCreate ?? _local.pendingCreate,
  );
}
