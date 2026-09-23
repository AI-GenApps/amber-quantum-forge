import 'dart:convert';
import 'dart:io';

import 'package:merge_rules/merge_rules.dart';

Future<void> main(List<String> args) async {
  if (args.length < 1 || args.length > 2) {
    stderr.writeln(
      'Usage: dart run tool/generate_rescue_catalog.dart specs.json [output.json]',
    );
    exitCode = 64;
    return;
  }
  try {
    final input = jsonDecode(await File(args.first).readAsString());
    final parsed = _parseInput(input);
    final records = MergeRescueGenerator(
      config: parsed.config,
    ).generateCatalog(parsed.specs);
    final output = {
      'schema_version': 1,
      'rule_version': parsed.config.ruleVersion,
      'rule_config': parsed.config.toJson(),
      'generator': {'algorithm': mergeRescueTraceAlgorithm},
      'rescue_boards': records.map((record) => record.toJson()).toList(),
    };
    final encoded = '${const JsonEncoder.withIndent('  ').convert(output)}\n';
    if (args.length == 2) {
      await File(args[1]).writeAsString(encoded);
    } else {
      stdout.write(encoded);
    }
  } on Object catch (error) {
    stderr.writeln(error);
    exitCode = 1;
  }
}

_RescueInput _parseInput(Object? raw) {
  if (raw is! Map) throw const FormatException('Specs must be an object');
  final records = raw['records'];
  if (records is! List ||
      records.isEmpty ||
      records.any((value) => value is! Map)) {
    throw const FormatException('Specs records must be a non-empty list');
  }
  final configValue = raw['rule_config'];
  final config = configValue == null
      ? const MergeRuleConfig.legacy()
      : configValue is Map
      ? MergeRuleConfig.fromJson(configValue.cast<String, Object?>())
      : throw const FormatException('Invalid rule config');
  final specs = records
      .map((value) {
        final record = (value as Map).cast<String, Object?>();
        final id = record['id'];
        final seed = record['origin_seed'];
        final length = record['origin_move_count'] ?? 3;
        if (id is! String || seed is! int || length is! int) {
          throw const FormatException('Invalid rescue generation spec');
        }
        return MergeRescueGenerationSpec(
          id: id,
          originSeed: seed,
          originMoveCount: length,
        );
      })
      .toList(growable: false);
  return _RescueInput(config: config, specs: specs);
}

final class _RescueInput {
  const _RescueInput({required this.config, required this.specs});

  final MergeRuleConfig config;
  final List<MergeRescueGenerationSpec> specs;
}
