// Reads a JSON match fixture (ruleset id + seed + player count), runs a
// full deterministic match to completion, and prints the resulting event
// log and final state as JSON.
//
// This is the format task 02's cross-runtime fixtures and task 17's TS
// parity test consume, so its shape is deliberately simple:
//
//   { "ruleset": "classic" | "quick", "seed": <int>,
//     "player_count": 2 | 3 | 4, "subjects": ["a", "b", ...]? }
//
// Fixture input is read from the file path given as the first CLI
// argument, or from stdin when no argument is given. Dice are drawn from a
// `platform_core` `DeterministicRng` seeded by `seed`, so the same fixture
// always produces byte-identical output. Where more than one legal move
// exists for a roll:
//
// - By default (no `--bot` flag), the lowest token id is chosen — a fixed,
//   documented tie-break, not a bot strategy.
// - With `--bot <difficulty>` (`easy`/`medium`/`hard`), the named
//   `LudoBotStrategy` from `ludo_bot.dart` (task 02) chooses the move
//   instead, drawing its own tie-break randomness from the same seeded
//   `DeterministicRng` used for dice, so output stays byte-identical for a
//   given seed + difficulty.
import 'dart:convert';
import 'dart:io';

import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart';

/// Safety cap on turns so a mis-configured fixture cannot hang the CLI.
const _maxTurns = 100000;

Future<void> main(List<String> args) async {
  String? botFlag;
  final positional = <String>[];
  for (var i = 0; i < args.length; i++) {
    final arg = args[i];
    if (arg == '--bot') {
      if (i + 1 >= args.length) {
        throw const FormatException('--bot requires a difficulty argument');
      }
      botFlag = args[i + 1];
      i++;
    } else {
      positional.add(arg);
    }
  }
  final bot = botFlag == null ? null : ludoBotStrategyById(botFlag);

  final raw = positional.isNotEmpty
      ? File(positional.first).readAsStringSync()
      : await stdin.transform(utf8.decoder).join();
  final decoded = jsonDecode(raw);
  if (decoded is! Map) {
    throw const FormatException('fixture must be a JSON object');
  }
  final fixture = decoded.cast<String, Object?>();

  final rulesetId = fixture['ruleset'];
  final seed = fixture['seed'];
  final playerCount = fixture['player_count'];
  final subjectsJson = fixture['subjects'];
  if (rulesetId is! String || seed is! int || playerCount is! int) {
    throw const FormatException(
      'fixture requires string ruleset, integer seed, integer player_count',
    );
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

  final rng = DeterministicRng(seed);
  final diceSource = FunctionDiceSource(() => rng.nextInt(6) + 1);

  var state = LudoMatchState.initial(ruleset: ruleset, subjects: subjects);
  final events = <LudoReplayEvent>[];
  var turns = 0;
  while (!isTerminal(state)) {
    if (turns >= _maxTurns) {
      throw StateError(
        'replay_fixture exceeded $_maxTurns turns without finishing',
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
  stdout.writeln(jsonEncode(output));
}
