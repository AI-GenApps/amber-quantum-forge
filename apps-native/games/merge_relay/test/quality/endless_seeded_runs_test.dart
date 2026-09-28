import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_models.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

/// Task 13: drives >=50 Endless games through the REAL `MergeRelayGame`
/// controller (not just `merge_rules`) with a simple deterministic policy —
/// prefer the move with the largest merge, else a fixed corner-bias order —
/// until each run reaches the result-screen state (`roundComplete`) with a
/// consistent score. `startEndless`'s own seed-increment rule
/// (`merge_relay_game_actions.dart`) guarantees each of the 50 runs gets a
/// distinct seed, so seeds 1..50 aren't threaded through by hand here.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    '50 endless runs each reach a terminal result through the controller',
    () async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final game = MergeRelayGame(
        context: context,
        saveStore: MemorySaveStore(),
      );
      await game.restore();
      game.completeTutorial(skipped: true);

      final seenSeeds = <int>{};
      for (var run = 0; run < 50; run += 1) {
        game.startEndless();
        final seed = game.state.value.seed;
        expect(
          seenSeeds.add(seed),
          isTrue,
          reason: 'seed $seed reused at run $run',
        );

        var guard = 0;
        while (!game.roundComplete.value) {
          guard += 1;
          expect(guard, lessThan(60000), reason: 'seed $seed never terminated');
          game.move(_policyMove(game.state.value));
        }

        expect(game.result.value, isNotNull, reason: 'seed $seed');
        expect(
          game.result.value!.outcome,
          MergeRelayOutcome.terminal,
          reason: 'seed $seed',
        );
        expect(
          game.result.value!.score,
          game.state.value.score,
          reason: 'seed $seed produced an inconsistent score',
        );
        expect(game.state.value.isTerminal, isTrue, reason: 'seed $seed');
      }
      game.dispose();
    },
  );
}

const _cornerBias = [
  MergeDirection.down,
  MergeDirection.left,
  MergeDirection.up,
  MergeDirection.right,
];

/// A deliberately weak, deterministic policy — not a survival strategy: it
/// takes the first direction in corner-bias order that merges anything,
/// else the first direction in that same order that legally slides, else
/// (nothing legal) the first direction at all so `game.move` sees the
/// blocked, terminal attempt and finishes the round. Picking the *largest*
/// merge each turn (rather than just the first) turns this into a
/// near-optimal 2048 strategy that can run for tens of thousands of moves
/// on some seeds, which is too slow for a test suite.
MergeDirection _policyMove(MergeGameState state) {
  const rules = MergeRules();
  for (final direction in _cornerBias) {
    if (rules.apply(state, direction).scoreDelta > 0) return direction;
  }
  for (final direction in _cornerBias) {
    if (rules.apply(state, direction).changed) return direction;
  }
  return _cornerBias.first;
}
