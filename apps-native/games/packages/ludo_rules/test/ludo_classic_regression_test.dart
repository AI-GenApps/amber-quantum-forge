// Task 12g regression guard: Classic mode's rules/engine behavior must not
// change as part of aligning Quick mode with Ludo King's real rules. This
// re-runs every `classic_*.json` fixture through the exact same
// deterministic-replay loop `bin/replay_fixture.dart` uses and asserts the
// regenerated `events`/`final_state` are byte-identical (as parsed JSON, so
// key order doesn't matter) to what's committed in `test/fixtures/`.
//
// The committed `classic_*.json` files were left completely untouched by
// task 12g (see that task's Out-of-Scope constraint and `LudoRuleset.toJson`
// / `LudoPlayerState.toJson`'s doc comments, which keep Classic's serialized
// schema frozen even though Quick's gained new fields). So the content this
// test reads off disk with `file.readAsStringSync()` *is* the real
// pre-task/pre-12g committed baseline, not a re-generated one — there is no
// circularity here as long as nothing else in this repo ever hand-edits a
// `classic_*.json` fixture. Its job is to catch *future* drift: if a later
// change to Quick's engine code (e.g. task 17's TS port work, or any further
// Quick tuning) accidentally perturbs Classic's own move sequence, final
// state, or serialized shape for these fixed seeds, this test fails loudly.
import 'dart:convert';
import 'dart:io';

import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart';
import 'package:test/test.dart';

const _maxTurns = 100000;

/// Mirrors `bin/replay_fixture.dart`'s deterministic-replay loop exactly,
/// so this test exercises the same code path the fixture-generation CLI
/// does (just without shelling out to a subprocess).
Map<String, Object?> _runFixture({
  required LudoRuleset ruleset,
  required int seed,
  required List<String> subjects,
  String? botId,
}) {
  final bot = botId == null ? null : ludoBotStrategyById(botId);
  final rng = DeterministicRng(seed);
  final diceSource = FunctionDiceSource(() => rng.nextInt(6) + 1);

  var state = LudoMatchState.initial(ruleset: ruleset, subjects: subjects);
  final events = <LudoReplayEvent>[];
  var turns = 0;
  while (!isTerminal(state)) {
    if (turns >= _maxTurns) {
      fail('fixture regeneration exceeded $_maxTurns turns without finishing');
    }
    turns++;
    final rollResult = rollDice(state, diceSource);
    state = rollResult.state;
    events.addAll(rollResult.events);
    if (state.phase == LudoMatchPhase.awaitingMove) {
      final chosen = bot != null
          ? bot.selectMove(state, rng)
          : (List<int>.of(legalMoves(state))..sort()).first;
      final moveResult = applyMove(state, chosen);
      state = moveResult.state;
      events.addAll(moveResult.events);
    }
  }

  return {
    'events': events.map((e) => e.toJson()).toList(),
    'final_state': state.toJson(),
  };
}

void main() {
  final fixturesDir = Directory('test/fixtures');
  final classicFixtures =
      fixturesDir
          .listSync()
          .whereType<File>()
          .where(
            (f) =>
                f.path.endsWith('.json') &&
                f.uri.pathSegments.last.startsWith('classic_'),
          )
          .toList()
        ..sort((a, b) => a.path.compareTo(b.path));

  test('at least 4 Classic fixtures are checked in', () {
    expect(classicFixtures.length, greaterThanOrEqualTo(4));
  });

  for (final file in classicFixtures) {
    test('${file.uri.pathSegments.last}: regenerated output is byte-identical '
        'to committed content (Classic must never drift)', () {
      final committed = (jsonDecode(file.readAsStringSync()) as Map)
          .cast<String, Object?>();
      final rulesetId = committed['ruleset'] as String;
      final seed = committed['seed'] as int;
      final subjects = (committed['subjects'] as List).cast<String>();
      final botId = committed['bot'] as String?;

      final regenerated = _runFixture(
        ruleset: LudoRuleset.byId[rulesetId]!,
        seed: seed,
        subjects: subjects,
        botId: botId,
      );

      expect(
        jsonDecode(jsonEncode(regenerated['events'])),
        committed['events'],
        reason: '${file.path}: regenerated events drifted from committed',
      );
      expect(
        jsonDecode(jsonEncode(regenerated['final_state'])),
        committed['final_state'],
        reason: '${file.path}: regenerated final_state drifted from committed',
      );
    });
  }
}
