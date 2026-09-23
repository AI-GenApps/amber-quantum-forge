import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

void main() {
  test('theme and reduced-motion preferences survive reopening', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final store = MemorySaveStore();
    final game = MergeRelayGame(context: context, saveStore: store);

    await game.restore();
    game.selectTheme('ember');
    game.setReducedMotion(true);
    await Future<void>.delayed(Duration.zero);

    final reopened = MergeRelayGame(context: context, saveStore: store);
    await reopened.restore();

    expect(reopened.preferences.value.themeId, 'ember');
    expect(reopened.preferences.value.reducedMotion, isTrue);

    game.dispose();
    reopened.dispose();
  });

  test(
    'legacy installed board payload restores without inventing a mode',
    () async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final store = MemorySaveStore();
      final legacyState = MergeGameState(
        board: MergeBoard([2, 0, 0, 0, 0, 4, ...List<int>.filled(10, 0)]),
        score: 12,
        moveCount: 2,
        seed: 11,
        rngState: 77,
      );
      await store.write(
        context,
        SaveEnvelope.create(
          context: context,
          schemaVersion: 1,
          savedAt: DateTime.utc(2026),
          payload: legacyState.toJson(),
        ),
      );

      final game = MergeRelayGame(context: context, saveStore: store);
      await game.restore();

      expect(game.state.value.toJson(), legacyState.toJson());
      expect(game.mode.value, MergeRelayMode.endless);
      expect(game.rescueId.value, isNull);
      game.dispose();
    },
  );

  test('new round keeps daily practice separate from endless play', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final game = MergeRelayGame(context: context, saveStore: MemorySaveStore());

    await game.restore();
    game.startDaily();
    final dailySeed = game.state.value.seed;
    game.newRound();

    expect(game.mode.value, MergeRelayMode.daily);
    expect(game.state.value.seed, dailySeed);
    expect(game.state.value.moveCount, 0);
    game.dispose();
  });
}
