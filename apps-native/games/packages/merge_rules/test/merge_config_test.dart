import 'package:merge_rules/merge_rules.dart';
import 'package:test/test.dart';

void main() {
  test('rule config validates weights and preserves legacy spawning', () {
    const legacy = MergeRuleConfig.legacy();
    expect(MergeRuleConfig.fromJson(legacy.toJson()).matches(legacy), isTrue);
    expect(
      () => MergeSpawnWeights(spawnTwoWeight: 80, spawnFourWeight: 30),
      throwsArgumentError,
    );
    expect(
      () => MergeRuleConfig(
        revision: 2,
        ruleVersion: 'MR-future',
        spawnWeights: const MergeSpawnWeights.legacy(),
      ),
      throwsArgumentError,
    );

    final state = MergeGameState(
      board: MergeBoard([2, 2, ...List<int>.filled(14, 0)]),
      score: 0,
      moveCount: 0,
      seed: 1,
      rngState: 2,
    );
    final alwaysTwo = MergeRules(
      config: MergeRuleConfig(
        revision: 2,
        spawnWeights: MergeSpawnWeights(
          spawnTwoWeight: 100,
          spawnFourWeight: 0,
        ),
      ),
    );
    final alwaysFour = MergeRules(
      config: MergeRuleConfig(
        revision: 3,
        spawnWeights: MergeSpawnWeights(
          spawnTwoWeight: 0,
          spawnFourWeight: 100,
        ),
      ),
    );

    expect(alwaysTwo.apply(state, MergeDirection.left).spawnedValue, 2);
    expect(alwaysFour.apply(state, MergeDirection.left).spawnedValue, 4);
  });

  test('custom spawn weights stay in parity with the server fixture', () {
    final config = MergeRuleConfig(
      revision: 2,
      spawnWeights: MergeSpawnWeights(spawnTwoWeight: 0, spawnFourWeight: 100),
    );
    final initial = MergeGameState.newGame(
      seed: 12345,
      spawnWeights: config.spawnWeights,
    );
    expect(initial.toWireJson(), {
      'board': [0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0],
      'score': 0,
      'move_count': 0,
      'seed': 12345,
      'rng_state': 1955480042,
      'rule_version': 'MR-2D-1',
    });
    final replay = MergeRules(config: config).replay(12345, const [
      MergeDirection.left,
      MergeDirection.up,
      MergeDirection.right,
      MergeDirection.down,
      MergeDirection.left,
    ]);

    expect(replay.toJson(), {
      'board': [8, 8, 0, 0, 4, 0, 0, 0, 4, 0, 4, 0, 0, 0, 0, 0],
      'score': 16,
      'move_count': 5,
      'seed': 12345,
      'rng_state': 150275943,
      'rule_version': 'MR-2D-1',
    });
  });

  test('replay metadata preserves custom content and spawn weights', () {
    final config = MergeRuleConfig(
      revision: 2,
      spawnWeights: MergeSpawnWeights(spawnTwoWeight: 0, spawnFourWeight: 100),
    );
    final result = MergeRules(config: config).replayFrom(
      MergeGameState.newGame(seed: 12345, spawnWeights: config.spawnWeights),
      const [MergeDirection.left],
      contentId: 'board-1',
      contentVersion: 'MR-CONTENT-1',
      spawnWeights: config.spawnWeights,
    );

    expect(result.toJson()['content_id'], 'board-1');
    expect(result.toJson()['content_version'], 'MR-CONTENT-1');
    expect(result.toJson()['spawn_two_weight'], 0);
    expect(result.toJson()['spawn_four_weight'], 100);
  });
}
