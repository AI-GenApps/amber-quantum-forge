import 'package:merge_rules/merge_rules.dart';
import 'package:test/test.dart';

void main() {
  const rules = MergeRules();

  test('checkpoint requires a playable state and has a stable hash', () {
    final state = MergeGameState.newGame(seed: 12345);
    final checkpoint = MergeCheckpoint.fromState(
      state,
      maxLegalMoves: 3,
      contentId: 'rescue-001',
      contentVersion: 'v1',
    );

    expect(checkpoint.toWireJson(), state.toWireJson());
    expect(checkpoint.checkpointHash, hasLength(64));
    expect(
      checkpoint.checkpointHash,
      'b1fdc3e958425be541383b1e84d5425b83400ec4b490b96f6377dbb10861541a',
    );
    expect(
      MergeCheckpoint.fromJson(checkpoint.toJson()).toJson(),
      checkpoint.toJson(),
    );
    expect(
      () => MergeCheckpoint.fromState(
        MergeGameState(
          board: MergeBoard([
            2,
            4,
            8,
            16,
            32,
            64,
            128,
            256,
            512,
            1024,
            2048,
            4096,
            8192,
            16384,
            32768,
            65536,
          ]),
          score: 0,
          moveCount: 0,
          seed: 1,
          rngState: 2,
        ),
      ),
      throwsFormatException,
    );
  });

  test('canonical JSON sorts object keys without reordering arrays', () {
    expect(
      canonicalJson({
        'z': 1,
        'a': [3, 2, 1],
        'nested': {'b': true, 'a': false},
      }),
      '{"a":[3,2,1],"nested":{"a":false,"b":true},"z":1}',
    );
    expect(() => canonicalJson({'value': 1.5}), throwsFormatException);
    expect(
      () => canonicalJson({'value': 'x' * (maxMergeJsonBytes + 1)}),
      throwsFormatException,
    );
  });

  test('ranked replay bounds legal moves and exposes result metrics', () {
    final checkpoint = MergeCheckpoint.fromState(
      MergeGameState.newGame(seed: 12345),
      maxLegalMoves: 3,
    );
    final result = rules.replayAttempt(checkpoint, const [
      MergeDirection.left,
      MergeDirection.up,
      MergeDirection.right,
    ]);

    expect(result.outcome, MergeAttemptOutcome.completed);
    expect(mergeAttemptOutcomeName(result.outcome), 'completed');
    expect(result.legalMoves, 3);
    expect(result.scoreGained, greaterThanOrEqualTo(0));
    expect(result.maxTile, greaterThanOrEqualTo(2));
    expect(result.playableChild(parentChallengeId: 'challenge-1'), isNotNull);
    expect(
      () => rules.replayAttempt(checkpoint, const [
        MergeDirection.left,
        MergeDirection.up,
        MergeDirection.right,
        MergeDirection.down,
      ]),
      throwsA(isA<MergeRuleError>()),
    );
  });

  test('ranked replay rejects no-op and supports early finish', () {
    final checkpoint = MergeCheckpoint.fromState(
      MergeGameState(
        board: MergeBoard([0, 0, 0, 0, 2, 4, 0, 0, ...List<int>.filled(8, 0)]),
        score: 0,
        moveCount: 0,
        seed: 1,
        rngState: 2,
      ),
    );

    expect(
      () => rules.replayAttempt(checkpoint, const [MergeDirection.left]),
      throwsA(
        isA<MergeRuleError>().having((error) => error.code, 'code', 'no_op'),
      ),
    );
    final result = rules.replayAttempt(checkpoint, const [
      MergeDirection.up,
    ], finish: true);
    expect(result.outcome, MergeAttemptOutcome.earlyFinish);
    expect(result.legalMoves, 1);
    expect(mergeAttemptOutcomeName(result.outcome), 'early_finish');
  });

  test('challenge and content hashes reject tampering and duplicates', () {
    final checkpoint = MergeCheckpoint.fromState(
      MergeGameState.newGame(seed: 7),
      contentId: 'rescue-001',
      contentVersion: 'v1',
    );
    final challenge = MergeChallenge(
      challengeId: 'challenge-1',
      mode: MergeRelayMode.rescue,
      checkpoint: checkpoint,
      creatorAlias: 'Player One',
    );
    expect(
      MergeChallenge.fromJson(challenge.toJson()).payloadHash,
      challenge.payloadHash,
    );
    expect(
      () => MergeChallenge.fromJson({
        ...challenge.toJson(),
        'creator_alias': 'Tampered',
      }),
      throwsFormatException,
    );
    expect(
      () => MergeChallenge.fromJson({
        ...challenge.toJson(),
        'future_field': true,
      }),
      throwsFormatException,
    );
    final dailyCheckpoint = MergeCheckpoint.fromState(
      MergeGameState.newGame(seed: 8),
      contentId: 'daily-1',
      contentVersion: 'v1',
    );
    final daily = MergeContentEntry(
      id: 'daily-1',
      version: 'v1',
      mode: MergeRelayMode.daily,
      checkpoint: dailyCheckpoint,
      utcDate: '2026-09-17',
    );
    final catalog = MergeContentCatalog([daily]);
    expect(
      MergeContentCatalog.fromJson(catalog.toJson()).toJson(),
      catalog.toJson(),
    );
    expect(
      () => MergeContentCatalog.fromJson({
        ...catalog.toJson(),
        'schema_version': 2,
      }),
      throwsArgumentError,
    );
    expect(() => MergeContentCatalog([daily, daily]), throwsFormatException);
    expect(
      () => MergeContentEntry(
        id: 'daily-2',
        version: 'v1',
        mode: MergeRelayMode.daily,
        checkpoint: dailyCheckpoint,
        utcDate: '2026-02-30',
      ),
      throwsFormatException,
    );
  });

  test('attempt model enforces reservation lifecycle and budget', () {
    final attempt = MergeAttempt(
      challengeId: 'challenge-1',
      reservationId: 'reservation-1',
      maxLegalMoves: 2,
      acceptedMoves: const [],
    );
    final next = attempt.append(MergeDirection.left);
    expect(next.acceptedMoves, [MergeDirection.left]);
    expect(next.version, 1);
    final completed = next.append(MergeDirection.up).finish();
    expect(completed.status, MergeAttemptStatus.completed);
    expect(() => completed.append(MergeDirection.right), throwsStateError);
    expect(
      () => MergeAttempt(
        challengeId: 'challenge-1',
        reservationId: 'reservation-1',
        maxLegalMoves: 1,
        acceptedMoves: const [MergeDirection.left, MergeDirection.up],
      ),
      throwsFormatException,
    );
  });
}
