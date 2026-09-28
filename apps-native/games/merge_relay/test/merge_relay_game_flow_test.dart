import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_relay/src/merge_relay_models.dart';
import 'package:merge_relay/src/merge_relay_tutorial.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

void main() {
  test('tutorial state is versioned separately from a legacy run', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final store = MemorySaveStore();
    final legacy = MergeGameState(
      board: MergeBoard([2, 0, 0, 0, 0, 4, ...List<int>.filled(10, 0)]),
      score: 8,
      moveCount: 1,
      seed: 7,
      rngState: 9,
    );
    await store.write(
      context,
      SaveEnvelope.create(
        context: context,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026),
        payload: legacy.toJson(),
      ),
    );

    final game = MergeRelayGame(context: context, saveStore: store);
    await game.restore();
    expect(game.legacyOffer.value, isTrue);
    expect(game.tutorialComplete.value, isFalse);
    game.openPlay(requestedMode: MergeRelayMode.rescue);
    expect(game.route.value, MergeRelayRoute.tutorial);
    game.completeTutorial(skipped: true);
    await game.flushWrites();

    final reopened = MergeRelayGame(context: context, saveStore: store);
    await reopened.restore();
    expect(reopened.tutorialComplete.value, isTrue);
    reopened.openPlay(requestedMode: MergeRelayMode.endless);
    expect(reopened.state.value.score, 8);
    game.dispose();
    reopened.dispose();
  });

  test(
    'rescue result persists and restores after process recreation',
    () async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final store = MemorySaveStore();
      final game = MergeRelayGame(context: context, saveStore: store);
      await game.restore();
      game.completeTutorial(skipped: true);
      _playThreeRescueMoves(game);
      await game.flushWrites();

      expect(game.result.value, isNotNull);
      expect(game.result.value?.movesUsed, 3);
      final reopened = MergeRelayGame(context: context, saveStore: store);
      await reopened.restore();
      expect(reopened.result.value?.movesUsed, 3);
      expect(reopened.route.value, MergeRelayRoute.home);
      reopened.continueSession();
      expect(reopened.route.value, MergeRelayRoute.result);
      game.dispose();
      reopened.dispose();
    },
  );

  test(
    'unfinished rescue keeps its frozen goal after content changes',
    () async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final store = MemorySaveStore();
      final game = MergeRelayGame(context: context, saveStore: store);
      await game.restore();
      game.completeTutorial(skipped: true);
      game.move(MergeDirection.left);
      final savedObjective = game.currentObjective;
      final savedTarget = game.currentTargetScore;
      await game.flushWrites();

      final original = MergeRelayContentCatalog.fallback.rescues.first;
      final changed = MergeRescueBoard(
        id: original.id,
        title: original.title,
        subtitle: original.subtitle,
        state: original.state,
        originSeed: original.originSeed,
        originMoves: original.originMoves,
        objective: 'Reach 999 points.',
        targetScore: 999,
        goalRevision: 'MR-GOALS-FUTURE',
      );
      final changedCatalog = MergeRelayContentCatalog([
        changed,
        ...MergeRelayContentCatalog.fallback.rescues.skip(1),
      ]);
      final reopened = MergeRelayGame(
        context: context,
        saveStore: store,
        content: changedCatalog,
      );
      await reopened.restore();
      reopened.openPlay(requestedMode: MergeRelayMode.rescue);

      expect(reopened.state.value.toJson(), game.state.value.toJson());
      expect(reopened.currentObjective, savedObjective);
      expect(reopened.currentTargetScore, savedTarget);
      game.dispose();
      reopened.dispose();
    },
  );

  test('legacy rescue requires a deliberate fresh-goal choice', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final store = MemorySaveStore();
    final state = MergeRelayContentCatalog.fallback.firstRescue.state;
    await store.write(
      context,
      SaveEnvelope.create(
        context: context,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026),
        payload: {
          'session_map_version': 1,
          'active_session_key': 'rescue:rescue-signal',
          'sessions': {
            'rescue:rescue-signal': {
              'game': state.toJson(),
              'mode': 'rescue',
              'rescue_id': 'rescue-signal',
              'daily_date': null,
              'rescue_moves_used': 0,
              'paused': false,
              'result': null,
            },
          },
          'profile': {
            'tutorial_version': mergeRelayTutorialVersion,
            'theme_id': 'signal',
            'reduced_motion': false,
            'audio_enabled': true,
            'haptics_enabled': true,
            'accessible_controls': false,
            'completed_rescue_ids': <String>[],
          },
        },
      ),
    );
    final game = MergeRelayGame(context: context, saveStore: store);
    await game.restore();
    expect(game.legacyOffer.value, isTrue);
    expect(game.currentTargetScore, isNull);
    game.continueSession();
    expect(game.currentTargetScore, isNull);
    game.startRescue();
    expect(game.currentTargetScore, 16);
    game.dispose();
  });

  test('trace-derived rescue keeps its own three-move player budget', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final store = MemorySaveStore();
    final game = MergeRelayGame(context: context, saveStore: store);
    await game.restore();
    game.completeTutorial(skipped: true);
    expect(game.state.value.moveCount, 3);
    expect(game.movesRemaining, 3);

    _playOneRescueMove(game);
    expect(game.result.value, isNull);
    expect(game.movesRemaining, 2);
    await game.flushWrites();

    final reopened = MergeRelayGame(context: context, saveStore: store);
    await reopened.restore();
    expect(reopened.movesRemaining, 2);
    expect(reopened.result.value, isNull);
    game.dispose();
    reopened.dispose();
  });

  test('endless new run always chooses a new seed explicitly', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final game = MergeRelayGame(context: context, saveStore: MemorySaveStore());
    await game.restore();
    game.completeTutorial(skipped: true);
    game.startEndless();
    final firstSeed = game.state.value.seed;
    game.startEndless();
    expect(game.state.value.seed, isNot(firstSeed));
    expect(game.mode.value, MergeRelayMode.endless);
    game.dispose();
  });

  test(
    'ordered writes keep the latest outcome after a slow first write',
    () async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final store = _DelayedSaveStore();
      final game = MergeRelayGame(context: context, saveStore: store);
      await game.restore();
      game.completeTutorial(skipped: true);
      _playThreeRescueMoves(game);
      await game.flushWrites();

      expect(store.writes, hasLength(greaterThanOrEqualTo(2)));
      final sessions = store.writes.last.payload['sessions'] as Map;
      final rescue = sessions['rescue:rescue-signal'] as Map;
      expect(rescue['result'], isA<Map>());
      expect(rescue['rescue_moves_used'], 3);
      game.dispose();
    },
  );

  test('tutorial only advances on its intended legal domain merge', () {
    final initial = MergeRelayTutorialSession.initial();
    final noOp = initial.attempt(MergeDirection.up);
    final wrongDirection = initial.attempt(MergeDirection.right);
    final merged = initial.attempt(MergeDirection.left);

    expect(noOp.complete, isFalse);
    expect(noOp.state.toJson(), initial.state.toJson());
    expect(wrongDirection.complete, isFalse);
    expect(wrongDirection.state.toJson(), initial.state.toJson());
    expect(merged.complete, isTrue);
    expect(merged.state.moveCount, 1);
    expect(merged.state.score, 4);
    expect(merged.state.rngState, isNot(initial.state.rngState));
    expect(merged.presentation?.direction, MergeDirection.left);
    expect(merged.presentation?.spawnedCell, isNotNull);
    expect(merged.presentation?.spawnedValue, anyOf(2, 4));
  });

  test(
    'mode sessions survive switching and restore the prior endless run',
    () async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final store = MemorySaveStore();
      final game = MergeRelayGame(context: context, saveStore: store);
      await game.restore();
      game.completeTutorial(skipped: true);
      game.startEndless();
      game.move(MergeDirection.left);
      final endlessBoard = game.state.value.toJson();
      game.startDaily();
      expect(game.mode.value, MergeRelayMode.daily);
      game.openPlay(requestedMode: MergeRelayMode.endless);
      expect(game.mode.value, MergeRelayMode.endless);
      expect(game.state.value.toJson(), endlessBoard);
      await game.flushWrites();

      final reopened = MergeRelayGame(context: context, saveStore: store);
      await reopened.restore();
      reopened.openPlay(requestedMode: MergeRelayMode.daily);
      expect(reopened.mode.value, MergeRelayMode.daily);
      reopened.openPlay(requestedMode: MergeRelayMode.endless);
      expect(reopened.state.value.toJson(), endlessBoard);
      game.dispose();
      reopened.dispose();
    },
  );

  test('replaying or skipping the guide preserves the saved run', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final store = MemorySaveStore();
    final game = MergeRelayGame(context: context, saveStore: store);
    await game.restore();
    game.completeTutorial(skipped: true);
    game.startEndless();
    game.move(MergeDirection.left);
    final beforeReplay = game.state.value.toJson();
    game.replayTutorial();
    expect(game.route.value, MergeRelayRoute.tutorial);
    game.completeTutorial(skipped: false);
    expect(game.state.value.toJson(), beforeReplay);
    await game.flushWrites();

    final reopened = MergeRelayGame(context: context, saveStore: store);
    await reopened.restore();
    expect(reopened.tutorialComplete.value, isTrue);
    expect(reopened.state.value.toJson(), beforeReplay);
    game.dispose();
    reopened.dispose();
  });

  test(
    'a legacy (v1) session map migrates and keeps cleared rescue boards',
    () async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final store = MemorySaveStore();
      await store.write(
        context,
        SaveEnvelope.create(
          context: context,
          schemaVersion: 1,
          savedAt: DateTime.utc(2026),
          payload: {
            'session_map_version': 1,
            'active_session_key': null,
            'sessions': <String, Object?>{},
            'profile': {
              'tutorial_version': mergeRelayTutorialVersion,
              'theme_id': 'signal',
              'reduced_motion': false,
              'audio_enabled': true,
              'haptics_enabled': true,
              'accessible_controls': false,
              'completed_rescue_ids': ['rescue-signal', 'rescue-echo'],
            },
          },
        ),
      );

      final game = MergeRelayGame(context: context, saveStore: store);
      await game.restore();
      expect(game.completedRescueIds.value, {'rescue-signal', 'rescue-echo'});
      game.openHome();
      await game.flushWrites();

      final envelope = await store.read(context);
      expect(envelope?.payload['session_map_version'], 2);

      final reopened = MergeRelayGame(context: context, saveStore: store);
      await reopened.restore();
      expect(reopened.completedRescueIds.value, {
        'rescue-signal',
        'rescue-echo',
      });
      game.dispose();
      reopened.dispose();
    },
  );

  test(
    'a legacy rescue session without move_budget keeps its three-move play',
    () async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final store = MemorySaveStore();
      final state = MergeRelayContentCatalog.fallback.firstRescue.state;
      await store.write(
        context,
        SaveEnvelope.create(
          context: context,
          schemaVersion: 1,
          savedAt: DateTime.utc(2026),
          payload: {
            'session_map_version': 1,
            'active_session_key': 'rescue:rescue-signal',
            'sessions': {
              'rescue:rescue-signal': {
                'game': state.toJson(),
                'mode': 'rescue',
                'rescue_id': 'rescue-signal',
                'daily_date': null,
                'rescue_moves_used': 0,
                'paused': false,
                'result': null,
                'content_version': mergeRelayContentVersion,
                'goal_revision': mergeRelayGoalRevision,
                'objective': 'Reach 16 points.',
                'target_score': 16,
                'rule_config': const MergeRuleConfig.legacy().toJson(),
              },
            },
            'profile': {
              'tutorial_version': mergeRelayTutorialVersion,
              'theme_id': 'signal',
              'reduced_motion': false,
              'audio_enabled': true,
              'haptics_enabled': true,
              'accessible_controls': false,
              'completed_rescue_ids': <String>[],
            },
          },
        ),
      );
      final game = MergeRelayGame(context: context, saveStore: store);
      await game.restore();

      expect(game.movesRemaining, 3);
      _playThreeRescueMoves(game);
      expect(game.result.value, isNotNull);
      game.dispose();
    },
  );

  test(
    'invalid session map does not partially replace the live board',
    () async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final store = MemorySaveStore();
      final game = MergeRelayGame(context: context, saveStore: store);
      await game.restore();
      game.completeTutorial(skipped: true);
      game.startEndless();
      game.move(MergeDirection.left);
      final before = game.state.value.toJson();
      await game.flushWrites();
      await store.write(
        context,
        SaveEnvelope.create(
          context: context,
          schemaVersion: 1,
          savedAt: DateTime.utc(2026),
          payload: {
            'session_map_version': 1,
            'active_session_key': 'endless',
            'sessions': {
              'endless': {
                'game': game.state.value.toJson(),
                'mode': 'future_mode',
                'rescue_id': null,
                'daily_date': null,
                'paused': false,
                'result': null,
              },
            },
            'profile': {
              'tutorial_version': mergeRelayTutorialVersion,
              'theme_id': 'signal',
              'reduced_motion': false,
              'audio_enabled': true,
              'haptics_enabled': true,
              'accessible_controls': false,
              'completed_rescue_ids': <String>[],
            },
          },
        ),
      );
      await game.restore();

      expect(game.state.value.toJson(), before);
      expect(game.persistenceMessage.value, contains("Couldn't restore"));
      game.dispose();
    },
  );
}

void _playThreeRescueMoves(MergeRelayGame game) {
  const rules = MergeRules();
  for (var index = 0; index < 3; index += 1) {
    final direction = MergeDirection.values.firstWhere(
      (direction) => rules.apply(game.state.value, direction).changed,
    );
    game.move(direction);
  }
}

void _playOneRescueMove(MergeRelayGame game) {
  const rules = MergeRules();
  final direction = MergeDirection.values.firstWhere(
    (direction) => rules.apply(game.state.value, direction).changed,
  );
  game.move(direction);
}

final class _DelayedSaveStore implements SaveStore {
  final writes = <SaveEnvelope>[];
  var _first = true;

  @override
  Future<SaveEnvelope?> read(AppContext context) async => null;

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    if (_first) {
      _first = false;
      await Future<void>.delayed(const Duration(milliseconds: 15));
    }
    writes.add(envelope);
  }

  @override
  Future<void> delete(AppContext context) async {}
}
