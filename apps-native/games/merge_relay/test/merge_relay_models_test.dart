import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_models.dart';
import 'package:merge_rules/merge_rules.dart';

void main() {
  test('move presentation marks merge and spawn from the domain result', () {
    final before = MergeGameState(
      board: MergeBoard([2, 2, 4, ...List<int>.filled(13, 0)]),
      score: 0,
      moveCount: 0,
      seed: 7,
      rngState: 123,
    );
    final result = const MergeRules().apply(before, MergeDirection.left);

    final presentation = MergeMovePresentation.fromResult(
      before: before,
      result: result,
      direction: MergeDirection.left,
    );

    expect(presentation.before.cells, before.board.cells);
    expect(presentation.after.cells, result.state.board.cells);
    expect(presentation.scoreDelta, 4);
    expect(presentation.hasMerge, isTrue);
    expect(presentation.mergedCells, contains(0));
    expect(presentation.changedCells, contains(1));
    expect(presentation.mergedCells, isNot(contains(1)));
    expect(presentation.changedCells, contains(0));
    expect(presentation.spawnedCell, isNotNull);
    expect(presentation.spawnedValue, anyOf(2, 4));
  });

  test('move presentation paints the authoritative trace destinations', () {
    final state = MergeGameState(
      board: MergeBoard([2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2]),
      score: 0,
      moveCount: 0,
      seed: 7,
      rngState: 123,
    );
    const expected = {
      MergeDirection.left: {0, 12},
      MergeDirection.right: {3, 15},
      MergeDirection.up: {0, 3},
      MergeDirection.down: {12, 15},
    };

    for (final entry in expected.entries) {
      final result = const MergeRules().apply(state, entry.key);
      final presentation = MergeMovePresentation.fromResult(
        before: state,
        result: result,
        direction: entry.key,
      );
      expect(presentation.mergedCells, entry.value);
    }
  });
}
