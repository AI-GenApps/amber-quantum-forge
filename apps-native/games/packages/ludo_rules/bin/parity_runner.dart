// Same deterministic match runner as `replay_fixture.dart`, but reads its
// input from a `-D REPLAY_FIXTURE_B64=<base64 json>` compile-time define
// instead of a file path / stdin.
//
// This split exists because task 17's `games:ludo:parity` script needs to
// `dart compile js` this entrypoint (to prove Dart-VM/compiled-JS/TS
// three-way agreement), and `dart:io`'s `File`/`stdin` — which
// `replay_fixture.dart` uses for its CLI/test ergonomics — throws
// `Unsupported operation` at runtime once compiled to JS (there is no
// stdin/filesystem in that environment). Reading from a `String.fromEnvironment`
// define instead (the same pattern `scripts/games/merge_relay`'s
// `bin/replay_fixture.dart` already uses for exactly this reason) avoids
// `dart:io` entirely, so the compiled JS output can actually run under Bun.
//
// Input/output shape is otherwise identical to `replay_fixture.dart`:
//   { "ruleset": "classic" | "quick", "seed": <int>, "player_count": 2..4,
//     "subjects": ["a", "b", ...]?, "bot": "easy" | "medium" | "hard" | null }
// -> { "events": [...], "final_state": {...} }
import 'dart:convert';

import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart';

const _fixtureDefine = String.fromEnvironment('REPLAY_FIXTURE_B64');

/// Safety cap on turns so a mis-configured fixture cannot hang the runner.
const _maxTurns = 100000;

void main() {
  if (_fixtureDefine.isEmpty) {
    throw const FormatException('REPLAY_FIXTURE_B64 define is required');
  }
  final raw = utf8.decode(base64Decode(_fixtureDefine));
  final decoded = jsonDecode(raw);
  if (decoded is! Map) {
    throw const FormatException('fixture must be a JSON object');
  }
  final fixture = decoded.cast<String, Object?>();

  final rulesetId = fixture['ruleset'];
  final seed = fixture['seed'];
  final playerCount = fixture['player_count'];
  final subjectsJson = fixture['subjects'];
  final botFlag = fixture['bot'];
  if (rulesetId is! String || seed is! int || playerCount is! int) {
    throw const FormatException(
      'fixture requires string ruleset, integer seed, integer player_count',
    );
  }
  if (botFlag != null && botFlag is! String) {
    throw const FormatException('fixture bot must be a string or null');
  }
  if (playerCount < 2 || playerCount > 4) {
    throw const FormatException('player_count must be 2..4');
  }
  final ruleset = LudoRuleset.byId[rulesetId];
  if (ruleset == null) {
    throw FormatException('unknown ruleset: $rulesetId');
  }
  final subjects = subjectsJson is List
      ? subjectsJson.cast<String>()
      : List.generate(playerCount, (i) => 'seat-$i');
  if (subjects.length != playerCount) {
    throw const FormatException('subjects length must equal player_count');
  }
  final bot = botFlag == null ? null : ludoBotStrategyById(botFlag as String);

  final rng = DeterministicRng(seed);
  final diceSource = FunctionDiceSource(() => rng.nextInt(6) + 1);

  var state = LudoMatchState.initial(ruleset: ruleset, subjects: subjects);
  final events = <LudoReplayEvent>[];
  var turns = 0;
  while (!isTerminal(state)) {
    if (turns >= _maxTurns) {
      throw StateError(
        'parity_runner exceeded $_maxTurns turns without finishing',
      );
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

  final output = {
    'events': events.map((e) => e.toJson()).toList(),
    'final_state': state.toJson(),
  };
  print(jsonEncode(output));
}
