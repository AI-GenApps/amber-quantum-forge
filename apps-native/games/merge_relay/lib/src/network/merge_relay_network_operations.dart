part of 'merge_relay_network.dart';

base mixin _MergeRelayGatewayOperations on _MergeRelayHttpGatewayBase
    implements MergeRelayGateway {
  @override
  Future<MergeRelayGuestSession> createGuest() async {
    final session = await _request(
      method: 'POST',
      path: 'guest',
      parser: parseCreatedGuest,
    );
    await authStore.saveGuest(
      recoveryToken: session.recoveryToken,
      accessToken: session.accessToken,
    );
    return session;
  }

  @override
  Future<MergeRelayGuestSession> recoverGuest(String recoveryToken) async {
    final session = await _request(
      method: 'POST',
      path: 'guest/recover',
      body: {'recovery_token': recoveryToken},
      parser: (data) => parseRecoveredGuest(data, recoveryToken: recoveryToken),
    );
    await authStore.saveGuest(
      recoveryToken: recoveryToken,
      accessToken: session.accessToken,
    );
    return session;
  }

  @override
  Future<void> upgradeGuest(String recoveryToken) async {
    await _request<void>(
      method: 'POST',
      path: 'guest/upgrade',
      body: {'recovery_token': recoveryToken},
      authenticated: true,
      parser: parseGuestUpgrade,
    );
  }

  @override
  Future<MergeRelayChallenge> createChallenge(
    MergeRelayChallengeRequest request,
  ) async {
    final challenge = await _request<MergeRelayChallenge>(
      method: 'POST',
      path: 'challenges',
      body: _challengeBody(request),
      authenticated: true,
      parser: (data) {
        final json = _nested(data, 'challenge', {'challenge', 'idempotent'});
        if (json['idempotent'] is! bool) {
          throw const MergeRelayProtocolException('Invalid idempotent result');
        }
        return parseChallenge(json['challenge']);
      },
    );
    validateCreatedChallenge(challenge, request);
    return challenge;
  }

  @override
  Future<MergeRelayChallenge> resolveChallenge(String challengeId) async {
    final challenge = await _request<MergeRelayChallenge>(
      method: 'GET',
      path: 'challenges/${_pathId(challengeId, 'challengeId')}/resolve',
      parser: parseChallenge,
    );
    validateChallengeIdentity(challenge, challengeId);
    return challenge;
  }

  @override
  Future<MergeRelayChallenge> getChallenge(String challengeId) async {
    final challenge = await _request<MergeRelayChallenge>(
      method: 'GET',
      path: 'challenges/${_pathId(challengeId, 'challengeId')}',
      authenticated: true,
      parser: (data) => parseChallenge(
        _nested(data, 'challenge', {'challenge'})['challenge'],
      ),
    );
    validateChallengeIdentity(challenge, challengeId);
    return challenge;
  }

  @override
  Future<MergeRelayAttempt> reserveAttempt(
    String challengeId,
    String reservationKey,
  ) async {
    final attempt = await _request<MergeRelayAttempt>(
      method: 'POST',
      path: 'challenges/${_pathId(challengeId, 'challengeId')}/attempts',
      body: {'reservation_key': _requestKey(reservationKey, 'reservationKey')},
      authenticated: true,
      parser: (data) => parseAttempt(
        _nested(data, 'attempt', {'attempt', 'idempotent'})['attempt'],
      ),
    );
    validateReservedAttempt(attempt, challengeId, reservationKey);
    return attempt;
  }

  @override
  Future<MergeRelayAttempt> submitMoves(
    String attemptId,
    MergeRelayMoveRequest request,
  ) async {
    final attempt = await _request<MergeRelayAttempt>(
      method: 'POST',
      path: 'attempts/${_pathId(attemptId, 'attemptId')}/moves',
      body: {
        'expected_version': request.expectedVersion,
        'moves': request.moves.map((move) => move.name).toList(growable: false),
      },
      authenticated: true,
      parser: (data) =>
          parseAttempt(_nested(data, 'attempt', {'attempt'})['attempt']),
    );
    validateSubmittedAttempt(attempt, attemptId, request);
    return attempt;
  }

  @override
  Future<MergeRelayAttempt> getAttempt(String attemptId) async {
    final attempt = await _request<MergeRelayAttempt>(
      method: 'GET',
      path: 'attempts/${_pathId(attemptId, 'attemptId')}',
      authenticated: true,
      parser: (data) =>
          parseAttempt(_nested(data, 'attempt', {'attempt'})['attempt']),
    );
    validateAttemptIdentity(attempt, attemptId);
    return attempt;
  }

  @override
  Future<MergeRelayResultEnvelope> finalizeAttempt(
    String attemptId,
    MergeRelayFinalizeRequest request,
  ) async {
    final result = await _request<MergeRelayResultEnvelope>(
      method: 'POST',
      path: 'attempts/${_pathId(attemptId, 'attemptId')}/finalize',
      body: {
        'idempotency_key': request.idempotencyKey,
        if (request.finishEarly) 'finish_early': true,
        if (request.returnAlias != null) 'return_alias': request.returnAlias,
      },
      authenticated: true,
      parser: (data) {
        final json = _nested(data, 'finalize', {
          'result',
          'return_challenge',
          'idempotent',
        });
        if (json['idempotent'] is! bool) {
          throw const MergeRelayProtocolException('Invalid idempotent result');
        }
        final child = json['return_challenge'] == null
            ? null
            : parseChallenge(json['return_challenge']);
        return parseResult(json['result'], returnChallenge: child);
      },
    );
    validateFinalizedResult(result, attemptId);
    return result;
  }

  @override
  Future<MergeRelayResultEnvelope> getResult(String resultId) async {
    final result = await _request<MergeRelayResultEnvelope>(
      method: 'GET',
      path: 'results/${_pathId(resultId, 'resultId')}',
      authenticated: true,
      parser: (data) =>
          parseResult(_nested(data, 'result', {'result'})['result']),
    );
    validateResultIdentity(result, resultId);
    return result;
  }

  @override
  Future<MergeRelayDailyChallenge> getDaily(String date) async {
    final daily = await _request<MergeRelayDailyChallenge>(
      method: 'GET',
      path: 'daily/${_datePath(date)}',
      parser: parseDaily,
    );
    validateDailyIdentity(daily, date);
    return daily;
  }

  @override
  Future<MergeRelayConfigRevision> getConfig() =>
      _request(method: 'GET', path: 'config', parser: parseConfig);

  @override
  Future<MergeRelaySave?> getSave(String saveId) async {
    try {
      final save = await _request<MergeRelaySave>(
        method: 'GET',
        path: 'saves/${_pathId(saveId, 'saveId')}',
        authenticated: true,
        parser: (data) => parseSave(_nested(data, 'save', {'save'})['save']),
      );
      validateSaveIdentity(save, saveId);
      return save;
    } on MergeRelayApiException catch (error) {
      if (error.statusCode == 404 && error.code == 'save_not_found') {
        return null;
      }
      rethrow;
    }
  }

  @override
  Future<MergeRelaySave> putSave(
    String saveId,
    MergeRelaySaveRequest request,
  ) async {
    final save = await _request<MergeRelaySave>(
      method: 'PUT',
      path: 'saves/${_pathId(saveId, 'saveId')}',
      body: {
        'expected_version': request.expectedVersion,
        'schema_version': request.schemaVersion,
        'payload': request.payload,
      },
      authenticated: true,
      parser: (data) => parseSave(parseSaveWriteData(data)['save']),
    );
    validateSaveIdentity(save, saveId);
    return save;
  }

  @override
  Future<MergeRelaySaveWriteResult> putSaveWithReceipt(
    String saveId,
    MergeRelaySaveRequest request,
  ) async {
    final fingerprint = mergeRelaySavePayloadFingerprint(
      schemaVersion: request.schemaVersion,
      payload: request.payload,
    );
    final result = await _request<MergeRelaySaveWriteResult>(
      method: 'PUT',
      path: 'saves/${_pathId(saveId, 'saveId')}',
      body: {
        'expected_version': request.expectedVersion,
        'schema_version': request.schemaVersion,
        'payload': request.payload,
        if (request.clientWriteId != null)
          'client_write_id': request.clientWriteId,
      },
      authenticated: true,
      parser: (data) {
        final json = parseSaveWriteData(data);
        final save = parseSave(json['save']);
        validateSaveIdentity(save, saveId);
        if (save.payloadFingerprint != null &&
            save.payloadFingerprint != fingerprint) {
          throw const MergeRelayProtocolException(
            'Save payload fingerprint mismatch',
          );
        }
        final receipt = parseSaveWriteReceipt(
          json['write_receipt'],
          expectedSaveId: saveId,
          expectedClientWriteId: request.clientWriteId,
          expectedPayloadFingerprint: fingerprint,
          expectedSavedVersion: save.version,
        );
        return MergeRelaySaveWriteResult(
          save: save,
          receipt: receipt,
          replayed: receipt?.replayed ?? false,
        );
      },
    );
    return result;
  }
}
