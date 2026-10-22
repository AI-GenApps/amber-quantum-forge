import 'dart:convert';
import 'dart:io';

import 'package:merge_rules/merge_rules.dart';
import 'package:test/test.dart';

File _fixtureFile() {
  var directory = Directory.current;
  for (var depth = 0; depth < 8; depth += 1) {
    final candidate = File(
      '${directory.path}/scripts/games/merge_relay_config_fixture.json',
    );
    if (candidate.existsSync()) return candidate;
    directory = directory.parent;
  }
  throw const FileSystemException('merge_relay_config_fixture.json not found');
}

void main() {
  final file = _fixtureFile();
  final fixture = jsonDecode(file.readAsStringSync()) as Map<String, Object?>;

  test('fixture covers every required domain category', () {
    final negatives = (fixture['negative']! as List).cast<Map>();
    final categories = negatives.map((entry) => entry['category']).toSet();
    expect(categories, {
      'numeric_limit',
      'foreign_config',
      'foreign_content',
      'hash_mismatch',
      'inconsistent_result',
    });
    final outcomes = (fixture['attempts']! as List)
        .map((entry) => (entry as Map)['expected']['outcome'])
        .toSet();
    expect(outcomes, {'in_progress', 'completed', 'early_finish', 'terminal'});
    final kinds = (fixture['origins']! as List)
        .map((entry) => (entry as Map)['kind'])
        .toSet();
    expect(kinds, {
      'practice',
      'daily',
      'endless',
      'rescue',
      'relay_from_daily',
    });
  });

  test('Dart VM reproduces every fixture expectation and rejection', () {
    expect(runMergeConfigFixture(fixture), isEmpty);
  });

  test('daily seeds use the 17 times 31 derivation', () {
    final derivation = fixture['seed_derivation']! as Map;
    expect(derivation['initial'], 17);
    expect(derivation['multiplier'], 31);
    expect(mergeDailySeed('2026-10-22'), 679157492);
  });

  test('compiled Dart reproduces the same fixture bytes', () async {
    final directory = Directory.systemTemp.createTempSync('merge_fixture_');
    addTearDown(() => directory.deleteSync(recursive: true));
    final binary = '${directory.path}/verify';
    final compile = await Process.run(Platform.resolvedExecutable, [
      'compile',
      'exe',
      'bin/verify_config_fixture.dart',
      '-o',
      binary,
    ]);
    expect(compile.exitCode, 0, reason: '${compile.stderr}');
    final run = await Process.run(binary, [file.path]);
    expect(run.exitCode, 0, reason: '${run.stderr}');
    expect(run.stdout, contains('fixture ok'));
  }, timeout: const Timeout(Duration(minutes: 5)));
}
