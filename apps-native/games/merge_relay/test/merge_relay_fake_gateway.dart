import 'dart:async';

import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_rules/merge_rules.dart';

final class FakeRelayGateway implements MergeRelayGateway {
  FakeRelayGateway() : challenge = _testChallenge();

  final MergeRelayChallenge challenge;
  MergeRelayAttempt? attempt;
  MergeRelayResultEnvelope? result;
  var submittedMoves = 0;
  var createGuestCalls = 0;
  var getAttemptCalls = 0;
  var failNextMove = false;
  var failNextCreate = false;
  var finalizeCalls = 0;
  var failFinalizeAfterCommit = false;
  var stripReturnChallengeOnGetResult = false;
  Completer<void>? getAttemptGate;
  MergeRelayFinalizeRequest? lastFinalizeRequest;
  MergeRelayAttempt? submitResultOverride;
  MergeRelayChallenge? returnChallenge;
  var pgsIdentityStatus = const MergeRelayPgsIdentitySnapshot(
    provider: 'google_play_games',
    configured: false,
    status: MergeRelayPgsIdentityLinkStatus.unlinked,
  );
  MergeRelayPgsIdentity? pgsIdentity = _testPgsIdentity();
  Object? pgsStatusError;
  Object? pgsLinkError;
  String? lastPgsAuthCode;
  Future<MergeRelayPgsIdentitySnapshot>? pgsStatusFuture;
  var pgsStatusCalls = 0;
  final createRequests = <MergeRelayChallengeRequest>[];
  final resolveQueue = <Future<MergeRelayChallenge>>[];

  @override
  Future<MergeRelayGuestSession> createGuest() async {
    createGuestCalls += 1;
    return _guest();
  }

  @override
  Future<MergeRelayGuestSession> recoverGuest(String recoveryToken) async =>
      _guest();

  @override
  Future<void> upgradeGuest(String recoveryToken) async {}

  @override
  Future<MergeRelayChallenge> createChallenge(
    MergeRelayChallengeRequest request,
  ) async {
    createRequests.add(request);
    if (failNextCreate) {
      failNextCreate = false;
      throw const MergeRelayTransportException('offline');
    }
    return challenge;
  }

  @override
  Future<MergeRelayChallenge> resolveChallenge(String challengeId) async {
    if (resolveQueue.isNotEmpty) return resolveQueue.removeAt(0);
    return challenge;
  }

  @override
  Future<MergeRelayChallenge> getChallenge(String challengeId) async =>
      returnChallenge?.challengeId == challengeId
      ? returnChallenge!
      : challenge;

  @override
  Future<MergeRelayAttempt> reserveAttempt(
    String challengeId,
    String reservationKey,
  ) async {
    attempt = testAttempt(challenge.checkpoint, const [], version: 0);
    return attempt!;
  }

  @override
  Future<MergeRelayAttempt> submitMoves(
    String attemptId,
    MergeRelayMoveRequest request,
  ) async {
    if (failNextMove) {
      failNextMove = false;
      throw const MergeRelayTransportException('offline');
    }
    final current = attempt!;
    if (request.expectedVersion != current.version) {
      throw const MergeRelayApiException(
        statusCode: 409,
        code: 'attempt_version_conflict',
        message: 'changed',
        diagnosticId: 'test',
      );
    }
    var state = current.checkpoint.state;
    final rules = MergeRules(
      config: MergeRuleConfig(
        revision: 1,
        spawnWeights:
            current.checkpoint.spawnWeights ?? const MergeSpawnWeights.legacy(),
      ),
    );
    for (final direction in request.moves) {
      final move = rules.apply(state, direction);
      if (!move.changed) throw StateError('Expected a changed move');
      state = move.state;
      submittedMoves += 1;
    }
    attempt = testAttempt(
      MergeRelayCheckpoint(
        state: state,
        maxLegalMoves: current.maxLegalMoves,
        spawnWeights: current.checkpoint.spawnWeights,
      ),
      [...current.moves, ...request.moves],
      version: current.version + request.moves.length,
    );
    return submitResultOverride ?? attempt!;
  }

  @override
  Future<MergeRelayAttempt> getAttempt(String attemptId) async {
    getAttemptCalls += 1;
    await getAttemptGate?.future;
    return attempt!;
  }

  @override
  Future<MergeRelayResultEnvelope> finalizeAttempt(
    String attemptId,
    MergeRelayFinalizeRequest request,
  ) async {
    final current = attempt!;
    finalizeCalls += 1;
    lastFinalizeRequest = request;
    returnChallenge = request.returnAlias == null
        ? null
        : MergeRelayChallenge(
            challengeId: 'return_test',
            creatorAlias: request.returnAlias!,
            mode: MergeRelayMode.rescue,
            originMode: MergeRelayMode.rescue,
            configRevision: 1,
            checkpoint: current.checkpoint,
            checkpointHash: current.checkpoint.checkpointHash,
            payloadHash: 'return_payload',
            parentChallengeId: current.challengeId,
            status: MergeRelayChallengeStatus.open,
            createdAt: DateTime.utc(2026),
          );
    result = MergeRelayResultEnvelope(
      resultId: 'result_test',
      attemptId: current.attemptId,
      challengeId: current.challengeId,
      environment: 'debug',
      recipientSubject: 'guest_test',
      scoreDelta: current.checkpoint.state.score,
      finalScore: current.checkpoint.state.score,
      maxTile: current.checkpoint.state.board.cells.reduce(
        (a, b) => a > b ? a : b,
      ),
      movesUsed: current.moves.length,
      outcome: request.finishEarly
          ? MergeRelayResultOutcome.earlyFinish
          : MergeRelayResultOutcome.complete,
      mode: MergeRelayMode.rescue,
      originMode: MergeRelayMode.rescue,
      configRevision: 1,
      challengePayloadHash: 'payload_test',
      returnChallengeId: returnChallenge?.challengeId,
      createdAt: DateTime.utc(2026),
      returnChallenge: returnChallenge,
    );
    attempt = testAttempt(
      current.checkpoint,
      current.moves,
      version: current.version,
      status: MergeRelayAttemptStatus.completed,
      resultId: result!.resultId,
    );
    if (failFinalizeAfterCommit) {
      failFinalizeAfterCommit = false;
      throw const MergeRelayTransportException('ack lost');
    }
    return result!;
  }

  @override
  Future<MergeRelayResultEnvelope> getResult(String resultId) async {
    if (!stripReturnChallengeOnGetResult || result?.returnChallenge == null) {
      return result!;
    }
    final value = result!;
    return MergeRelayResultEnvelope(
      resultId: value.resultId,
      attemptId: value.attemptId,
      challengeId: value.challengeId,
      environment: value.environment,
      recipientSubject: value.recipientSubject,
      scoreDelta: value.scoreDelta,
      finalScore: value.finalScore,
      maxTile: value.maxTile,
      movesUsed: value.movesUsed,
      outcome: value.outcome,
      mode: value.mode,
      originMode: value.originMode,
      configRevision: value.configRevision,
      challengePayloadHash: value.challengePayloadHash,
      returnChallengeId: value.returnChallengeId,
      createdAt: value.createdAt,
    );
  }

  @override
  Future<MergeRelayDailyChallenge> getDaily(String date) async =>
      throw UnimplementedError();

  @override
  Future<MergeRelayConfigRevision> getConfig() async => _testConfig();

  @override
  Future<MergeRelaySave?> getSave(String saveId) async => null;

  @override
  Future<MergeRelaySave> putSave(
    String saveId,
    MergeRelaySaveRequest request,
  ) async => throw UnimplementedError();

  @override
  Future<MergeRelaySaveWriteResult> putSaveWithReceipt(
    String saveId,
    MergeRelaySaveRequest request,
  ) async => throw UnimplementedError();

  @override
  Future<MergeRelayPgsIdentity> linkPgsIdentity(String serverAuthCode) async {
    lastPgsAuthCode = serverAuthCode;
    final error = pgsLinkError;
    if (error != null) throw error;
    if (pgsIdentity == null) throw StateError('Missing PGS identity fixture');
    return pgsIdentity!;
  }

  @override
  Future<MergeRelayPgsIdentitySnapshot> getPgsIdentityStatus() async {
    pgsStatusCalls += 1;
    final error = pgsStatusError;
    if (error != null) throw error;
    final pending = pgsStatusFuture;
    if (pending != null) return pending;
    return pgsIdentityStatus;
  }
}

MergeRelayGuestSession _guest() => MergeRelayGuestSession(
  guestId: 'guest_test',
  subject: 'guest_test',
  recoveryToken: 'recovery_test',
  accessToken: 'access_test',
  createdAt: DateTime.utc(2026),
);

MergeRelayConfigRevision _testConfig() => MergeRelayConfigRevision(
  revision: 1,
  rulesVersion: 'test',
  contentRevision: 'test',
  spawnWeights: MergeSpawnWeights(spawnTwoWeight: 90, spawnFourWeight: 10),
  features: MergeRelayFeatureFlags(
    daily: true,
    endless: true,
    rankedRelay: true,
    rewardedAds: false,
    cosmetics: false,
  ),
  active: true,
  createdAt: DateTime.utc(2026),
);

MergeRelayPgsIdentity _testPgsIdentity() => MergeRelayPgsIdentity(
  identityId: 'pgs_identity_test',
  provider: 'google_play_games',
  playerId: 'player_test',
  status: MergeRelayPgsIdentityLinkStatus.active,
  verifiedAt: DateTime.utc(2026),
);

MergeRelayChallenge _testChallenge() {
  final checkpoint = MergeRelayCheckpoint(
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
  return MergeRelayChallenge(
    challengeId: 'ch_test',
    creatorAlias: 'Ada',
    mode: MergeRelayMode.rescue,
    originMode: MergeRelayMode.rescue,
    configRevision: 1,
    checkpoint: checkpoint,
    checkpointHash: checkpoint.checkpointHash,
    payloadHash: 'payload_test',
    parentChallengeId: null,
    status: MergeRelayChallengeStatus.open,
    createdAt: DateTime.utc(2026),
  );
}

MergeRelayAttempt testAttempt(
  MergeRelayCheckpoint checkpoint,
  List<MergeDirection> moves, {
  required int version,
  String attemptId = 'att_test',
  String challengeId = 'ch_test',
  MergeRelayAttemptStatus status = MergeRelayAttemptStatus.reserved,
  String? resultId,
}) => MergeRelayAttempt(
  attemptId: attemptId,
  challengeId: challengeId,
  environment: 'debug',
  recipientSubject: 'guest_test',
  checkpoint: checkpoint,
  moves: List.unmodifiable(moves),
  maxLegalMoves: 3,
  status: status,
  reservationKey: 'reserve-fixed',
  reservedAt: DateTime.utc(2026),
  expiresAt: DateTime.utc(2026, 9, 18),
  version: version,
  resultId: resultId,
  updatedAt: DateTime.utc(2026),
);
