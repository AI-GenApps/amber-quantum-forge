import 'package:merge_rules/merge_rules.dart';
import 'package:test/test.dart';

void main() {
  const rules = MergeRules();

  test('equal pairs merge once and score produced tiles', () {
    final state = MergeGameState(
      board: MergeBoard([2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      score: 0,
      moveCount: 0,
      seed: 7,
      rngState: 123,
    );

    final result = rules.apply(state, MergeDirection.left);

    expect(result.changed, isTrue);
    expect(result.scoreDelta, 8);
    expect(result.state.board.cells.take(4), [4, 4, 0, 0]);
    expect(result.state.moveCount, 1);
  });

  test('no-op does not consume RNG or move count', () {
    final state = MergeGameState(
      board: MergeBoard([
        2,
        4,
        8,
        16,
        2,
        64,
        128,
        256,
        512,
        1024,
        2,
        4,
        8,
        16,
        32,
        64,
      ]),
      score: 42,
      moveCount: 9,
      seed: 7,
      rngState: 123,
    );

    final result = rules.apply(state, MergeDirection.left);

    expect(result.changed, isFalse);
    expect(result.rngDraws, 0);
    expect(result.state.rngState, state.rngState);
    expect(result.state.moveCount, state.moveCount);
    expect(result.reason, 'no_op');
  });

  test('initial board and replay are deterministic', () {
    final first = MergeGameState.newGame(seed: 12345);
    final second = MergeGameState.newGame(seed: 12345);
    final replay = rules.replay(12345, [
      MergeDirection.left,
      MergeDirection.up,
      MergeDirection.right,
      MergeDirection.down,
      MergeDirection.left,
    ]);

    expect(first.toJson(), second.toJson());
    expect(replay.toJson(), {
      'board': [8, 2, 0, 0, 4, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
      'score': 12,
      'move_count': 5,
      'seed': 12345,
      'rng_state': 150275943,
      'rule_version': 'MR-2D-1',
    });
    expect(
      replay.toJson(),
      rules.replay(12345, const [
        MergeDirection.left,
        MergeDirection.up,
        MergeDirection.right,
        MergeDirection.down,
        MergeDirection.left,
      ]).toJson(),
    );
  });

  test('terminal board has no legal move', () {
    final state = MergeGameState(
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
    );

    expect(state.isTerminal, isTrue);
    expect(rules.apply(state, MergeDirection.right).reason, 'terminal');
  });

  test('state decoding rejects unsupported versions and oversized tiles', () {
    expect(
      () => MergeGameState.fromJson({
        'board': List<int>.filled(16, 2),
        'score': 0,
        'move_count': 0,
        'seed': 1,
        'rng_state': 1,
        'rule_version': 'MR-future',
      }),
      throwsFormatException,
    );
    expect(
      () => MergeBoard([maxMergeTile << 1, ...List<int>.filled(15, 0)]),
      throwsArgumentError,
    );
  });

  test('capped tiles do not merge or create a legal move', () {
    final state = MergeGameState(
      board: MergeBoard([
        maxMergeTile,
        maxMergeTile,
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
      ]),
      score: 0,
      moveCount: 0,
      seed: 1,
      rngState: 2,
    );

    expect(state.isTerminal, isTrue);
    expect(rules.apply(state, MergeDirection.left).reason, 'terminal');
  });

  test('move trace reports merge pairs and spawn details', () {
    final state = MergeGameState(
      board: MergeBoard([2, 2, 0, 0, ...List<int>.filled(12, 0)]),
      score: 0,
      moveCount: 0,
      seed: 7,
      rngState: 123,
    );

    final result = rules.apply(state, MergeDirection.left);

    expect(result.trace.before, state);
    expect(result.trace.after, result.state);
    expect(result.trace.mergedPairs.single.toJson(), {
      'source_cells': [0, 1],
      'value': 4,
    });
    expect(result.trace.scoreDelta, 4);
    expect(result.trace.spawnedCell, isNotNull);
    expect(result.trace.spawnedValue, anyOf(2, 4));
  });

  test('wire decoding is strict while legacy decoding is explicit', () {
    final wire = MergeGameState.newGame(seed: 0).toWireJson();
    expect(MergeGameState.fromWireJson(wire).toWireJson(), wire);
    expect(
      () => MergeGameState.fromWireJson({...wire, 'extra': true}),
      throwsFormatException,
    );
    expect(
      () => MergeGameState.fromWireJson({...wire}..remove('rule_version')),
      throwsFormatException,
    );
    expect(
      () => MergeGameState.fromWireJson({...wire, 'rng_state': 0}),
      throwsArgumentError,
    );
    final legacy = {...wire}
      ..remove('rule_version')
      ..['rng_state'] = 0;
    final migrated = MergeGameState.fromLegacyJson(legacy);
    expect(migrated.rngState, isNonZero);
    expect(migrated.toWireJson()['rule_version'], mergeRuleVersion);
    expect(MergeGameState.migrateLegacyJson(legacy), migrated.toWireJson());
  });

  test('score and move bounds fail with stable rule errors', () {
    final scoreLimited = MergeGameState(
      board: MergeBoard([2, 2, ...List<int>.filled(14, 0)]),
      score: maxMergeScore,
      moveCount: 0,
      seed: 1,
      rngState: 2,
    );
    expect(
      () => rules.apply(scoreLimited, MergeDirection.left),
      throwsA(
        isA<MergeRuleError>().having(
          (error) => error.code,
          'code',
          'score_limit',
        ),
      ),
    );

    final moveLimited = MergeGameState(
      board: MergeBoard([2, 2, ...List<int>.filled(14, 0)]),
      score: 0,
      moveCount: maxMergeMoves,
      seed: 1,
      rngState: 2,
    );
    expect(
      () => rules.apply(moveLimited, MergeDirection.left),
      throwsA(
        isA<MergeRuleError>().having(
          (error) => error.code,
          'code',
          'move_limit',
        ),
      ),
    );
  });
}

Matcher get isNonZero => isNot(0);
