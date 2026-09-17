import 'dart:convert';

import 'package:merge_rules/merge_rules.dart';

const fixtureDefine = String.fromEnvironment('REPLAY_FIXTURE_B64');

MergeDirection parseDirection(Object? value) {
  if (value is! String) throw const FormatException('move must be a string');
  return switch (value) {
    'up' => MergeDirection.up,
    'down' => MergeDirection.down,
    'left' => MergeDirection.left,
    'right' => MergeDirection.right,
    _ => throw FormatException('unknown move: $value'),
  };
}

void main() {
  if (fixtureDefine.isEmpty) {
    throw const FormatException('REPLAY_FIXTURE_B64 define is required');
  }
  final raw = utf8.decode(base64Decode(fixtureDefine));
  final decoded = jsonDecode(raw);
  if (decoded is! Map) throw const FormatException('fixture must be an object');
  final seed = decoded['seed'];
  final moves = decoded['moves'];
  if (seed is! int || moves is! List) {
    throw const FormatException('fixture requires integer seed and moves');
  }
  final state = const MergeRules().replay(seed, moves.map(parseDirection));
  print(jsonEncode(state.toJson()));
}
