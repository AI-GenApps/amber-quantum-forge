import 'package:merge_rules/merge_rules.dart';
import 'package:test/test.dart';

void main() {
  const rules = MergeRules();
  final checkpoint = MergeCheckpoint.fromState(
    MergeGameState.newGame(seed: 12345),
    maxLegalMoves: 3,
    contentId: 'relay-001',
    contentVersion: 'v1',
  );

  test('session specs round trip with explicit objective and budget', () {
    final spec = MergeSessionSpec(
      kind: MergeSessionKind.relay,
      access: MergeSessionAccess.ranked,
      checkpoint: checkpoint,
      moveBudget: MergeMoveBudget.bounded(3),
      objective: MergeObjective(
        id: 'rescue-signal',
        title: 'Reach the signal',
        detail: 'Make three clean moves.',
      ),
      sessionId: 'session-001',
    );

    expect(MergeSessionSpec.fromJson(spec.toJson()).toJson(), spec.toJson());
    expect(MergeMoveBudget.fromJson({'max_legal_moves': 3}).maxLegalMoves, 3);
    expect(
      MergeMoveBudget.fromJson({'max_legal_moves': null}).isBounded,
      isFalse,
    );
  });

  test('session validation keeps mode budgets explicit', () {
    expect(
      () => MergeSessionSpec(
        kind: MergeSessionKind.rescue,
        access: MergeSessionAccess.practice,
        checkpoint: checkpoint,
        moveBudget: const MergeMoveBudget.unbounded(),
      ),
      throwsArgumentError,
    );
    expect(
      () => MergeSessionSpec(
        kind: MergeSessionKind.relay,
        access: MergeSessionAccess.practice,
        checkpoint: checkpoint,
        moveBudget: const MergeMoveBudget.unbounded(),
      ),
      throwsArgumentError,
    );
    expect(
      () => MergeSessionSpec(
        kind: MergeSessionKind.endless,
        access: MergeSessionAccess.practice,
        checkpoint: checkpoint,
        moveBudget: MergeMoveBudget.bounded(3),
      ),
      throwsArgumentError,
    );
    expect(
      () => MergeSessionSpec(
        kind: MergeSessionKind.daily,
        access: MergeSessionAccess.ranked,
        checkpoint: checkpoint,
        moveBudget: MergeMoveBudget.bounded(3),
        dailyDate: '2026-09-17',
      ),
      throwsArgumentError,
    );
    expect(
      () => MergeSessionSpec(
        kind: MergeSessionKind.daily,
        access: MergeSessionAccess.practice,
        checkpoint: checkpoint,
        moveBudget: const MergeMoveBudget.unbounded(),
        dailyDate: '2026-02-30',
      ),
      throwsArgumentError,
    );
  });

  test('daily uses its explicit budget while endless stays unbounded', () {
    final daily = MergeSessionSpec(
      kind: MergeSessionKind.daily,
      access: MergeSessionAccess.practice,
      checkpoint: checkpoint,
      moveBudget: MergeMoveBudget.bounded(3),
      dailyDate: '2026-09-17',
    );
    final endless = MergeSessionSpec(
      kind: MergeSessionKind.endless,
      access: MergeSessionAccess.practice,
      checkpoint: checkpoint,
      moveBudget: const MergeMoveBudget.unbounded(),
    );
    const moves = [
      MergeDirection.left,
      MergeDirection.up,
      MergeDirection.right,
      MergeDirection.down,
    ];

    final endlessResult = rules.replaySession(endless, moves, finish: true);

    expect(
      () => rules.replaySession(daily, moves),
      throwsA(isA<MergeRuleError>()),
    );
    expect(endlessResult.movesUsed, greaterThan(3));
    expect(endlessResult.outcome, MergeAttemptOutcome.earlyFinish);
  });

  test(
    'ranked relay reports early finish and authoritative trace destination',
    () {
      final spec = MergeSessionSpec(
        kind: MergeSessionKind.relay,
        access: MergeSessionAccess.ranked,
        checkpoint: checkpoint,
        moveBudget: MergeMoveBudget.bounded(3),
      );

      final result = rules.replaySession(spec, const [
        MergeDirection.left,
      ], finish: true);

      expect(result.outcome, MergeAttemptOutcome.earlyFinish);
      expect(result.replay.contentId, 'relay-001');
      expect(
        result.replay.traces.single.mergedPairs.every(
          (pair) => pair.destinationCell >= 0 && pair.destinationCell < 16,
        ),
        isTrue,
      );
    },
  );

  test('session config must match the configured replay rules', () {
    final config = MergeRuleConfig(
      revision: 2,
      spawnWeights: MergeSpawnWeights(spawnTwoWeight: 100, spawnFourWeight: 0),
    );
    final spec = MergeSessionSpec(
      kind: MergeSessionKind.rescue,
      access: MergeSessionAccess.practice,
      checkpoint: MergeCheckpoint.fromState(
        checkpoint.state,
        spawnWeights: config.spawnWeights,
      ),
      moveBudget: MergeMoveBudget.bounded(3),
      config: config,
    );

    expect(
      () => rules.replaySession(spec, const [MergeDirection.left]),
      throwsA(
        isA<MergeRuleError>().having(
          (error) => error.code,
          'code',
          'config_mismatch',
        ),
      ),
    );
    expect(
      MergeRules(
        config: config,
      ).replaySession(spec, const [MergeDirection.left]).replay.traces,
      hasLength(1),
    );
  });

  test('direct replays reject checkpoint weight drift', () {
    final config = MergeRuleConfig(
      revision: 2,
      spawnWeights: MergeSpawnWeights(spawnTwoWeight: 100, spawnFourWeight: 0),
    );
    final weightedCheckpoint = MergeCheckpoint.fromState(
      checkpoint.state,
      spawnWeights: const MergeSpawnWeights.legacy(),
    );

    expect(
      () => MergeRules(
        config: config,
      ).replayAttempt(weightedCheckpoint, const [MergeDirection.left]),
      throwsA(
        isA<MergeRuleError>().having(
          (error) => error.code,
          'code',
          'config_mismatch',
        ),
      ),
    );
  });

  test('custom sessions require checkpoint spawn weights', () {
    final config = MergeRuleConfig(
      revision: 2,
      spawnWeights: MergeSpawnWeights(spawnTwoWeight: 0, spawnFourWeight: 100),
    );
    expect(
      () => MergeSessionSpec(
        kind: MergeSessionKind.rescue,
        access: MergeSessionAccess.practice,
        checkpoint: checkpoint,
        moveBudget: MergeMoveBudget.bounded(3),
        config: config,
      ),
      throwsArgumentError,
    );
    final weighted = MergeCheckpoint.fromState(
      checkpoint.state,
      spawnWeights: config.spawnWeights,
    );
    expect(
      MergeSessionSpec(
        kind: MergeSessionKind.rescue,
        access: MergeSessionAccess.practice,
        checkpoint: weighted,
        moveBudget: MergeMoveBudget.bounded(3),
        config: config,
      ).checkpoint.spawnWeights,
      config.spawnWeights,
    );
  });
}
