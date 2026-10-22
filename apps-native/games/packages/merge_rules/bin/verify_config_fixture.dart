import 'dart:convert';
import 'dart:io';

import 'package:merge_rules/merge_rules.dart';

void main(List<String> args) {
  final fixture =
      jsonDecode(File(args.single).readAsStringSync()) as Map<String, Object?>;
  final failures = runMergeConfigFixture(fixture);
  if (failures.isNotEmpty) {
    stderr.writeln(failures.join('\n'));
    exit(1);
  }
  stdout.writeln('merge-relay config fixture ok');
}
