import 'package:merge_rules/merge_rules.dart';
import 'package:test/test.dart';

void main() {
  final checkpoint = MergeGameState.newGame(seed: 42);

  test('reports a winnable board with its minimal full-length line', () {
    const solver = MergeRescueSolver();
    final result = solver.solve(
      state: checkpoint,
      targetScore: 4,
      moveBudget: 3,
    );

    expect(result.solvable, isTrue);
    expect(result.firstReachedDepth, 1);
    expect(result.winningLineCount, greaterThanOrEqualTo(2));
    expect(result.winningLine, hasLength(3));
    expect(result.nodesExplored, greaterThan(0));

    // The claimed winning line really does clear within budget when
    // replayed through the real rules engine.
    const rules = MergeRules();
    final replay = rules.replayFrom(
      checkpoint,
      result.winningLine!,
      rejectNoOp: true,
    );
    expect(replay.legalMoves, 3);
    expect(replay.finalState.score, greaterThanOrEqualTo(4));
  });

  test('reports an unreachable target as unsolvable', () {
    const solver = MergeRescueSolver();
    final result = solver.solve(
      state: checkpoint,
      targetScore: 1000,
      moveBudget: 3,
    );

    expect(result.solvable, isFalse);
    expect(result.winningLine, isNull);
    expect(result.winningLineCount, 0);
    expect(result.firstReachedDepth, isNull);
    expect(result.nodesExplored, greaterThan(0));
  });

  test('fails loudly when the node cap is exceeded', () {
    const solver = MergeRescueSolver(maxNodes: 10);

    expect(
      () => solver.solve(state: checkpoint, targetScore: 4, moveBudget: 3),
      throwsA(isA<MergeRescueSolverLimitExceeded>()),
    );
  });

  test('is deterministic across repeated solves', () {
    const solver = MergeRescueSolver();
    final first = solver.solve(
      state: checkpoint,
      targetScore: 4,
      moveBudget: 3,
    );
    final second = solver.solve(
      state: checkpoint,
      targetScore: 4,
      moveBudget: 3,
    );

    expect(first.winningLine, second.winningLine);
    expect(first.winningLineCount, second.winningLineCount);
    expect(first.firstReachedDepth, second.firstReachedDepth);
    expect(first.nodesExplored, second.nodesExplored);
  });

  test('rejects an out-of-range move budget', () {
    const solver = MergeRescueSolver();
    expect(
      () => solver.solve(state: checkpoint, targetScore: 4, moveBudget: 0),
      throwsArgumentError,
    );
    expect(
      () => solver.solve(state: checkpoint, targetScore: 4, moveBudget: 7),
      throwsArgumentError,
    );
  });
}
