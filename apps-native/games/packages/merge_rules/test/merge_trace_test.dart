import 'package:merge_rules/merge_rules.dart';
import 'package:test/test.dart';

void main() {
  const rules = MergeRules();

  test('merge traces identify destinations for every direction', () {
    final state = MergeGameState(
      board: MergeBoard([2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2]),
      score: 0,
      moveCount: 0,
      seed: 7,
      rngState: 123,
    );

    expect(
      rules
          .apply(state, MergeDirection.left)
          .trace
          .mergedPairs
          .map((pair) => pair.destinationCell),
      [0, 12],
    );
    expect(
      rules
          .apply(state, MergeDirection.right)
          .trace
          .mergedPairs
          .map((pair) => pair.destinationCell),
      [3, 15],
    );
    expect(
      rules
          .apply(state, MergeDirection.up)
          .trace
          .mergedPairs
          .map((pair) => pair.destinationCell),
      [0, 3],
    );
    expect(
      rules
          .apply(state, MergeDirection.down)
          .trace
          .mergedPairs
          .map((pair) => pair.destinationCell),
      [12, 15],
    );
  });
}
