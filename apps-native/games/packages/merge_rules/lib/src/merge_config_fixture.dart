import 'merge_board.dart';
import 'merge_config.dart';
import 'merge_config_domain.dart';
import 'merge_content.dart';
import 'merge_game.dart';
import 'merge_models.dart';
import 'merge_replay.dart';
import 'merge_rules.dart';

const mergeConfigFixtureVersion = 'merge-relay-config.v1';

typedef _Json = Map<String, Object?>;

List<String> runMergeConfigFixture(_Json fixture) {
  final failures = <String>[];
  void check(String id, void Function() body) {
    try {
      body();
    } on Object catch (error) {
      failures.add('$id: $error');
    }
  }

  final configs = _configs(fixture);
  if (fixture['fixture_version'] != mergeConfigFixtureVersion) {
    failures.add('fixture_version: unsupported');
  }
  for (final entry in _list(fixture['daily'])) {
    check('daily ${entry['utc_date']}', () => _checkDaily(entry, configs));
  }
  for (final entry in _list(fixture['origins'])) {
    check('origin ${entry['id']}', () => _checkOrigin(entry, configs));
  }
  final origins = {
    for (final entry in _list(fixture['origins']))
      entry['id'] as String: entry['payload_hash'],
  };
  for (final entry in _list(fixture['origins'])) {
    final other = entry['differs_from'];
    if (other != null && origins[other] == entry['payload_hash']) {
      failures.add('origin ${entry['id']}: hash equals $other');
    }
  }
  for (final entry in _list(fixture['attempts'])) {
    check('attempt ${entry['id']}', () => _checkAttempt(entry, configs));
  }
  for (final entry in _list(fixture['negative'])) {
    final id = 'negative ${entry['id']}';
    final code = entry['error_code'];
    try {
      _runNegative(entry, configs);
      failures.add('$id: accepted');
    } on MergeRuleError catch (error) {
      if (code != null && error.code != code) {
        failures.add('$id: code ${error.code}, expected $code');
      }
    } on Object catch (error) {
      if (code != null) failures.add('$id: $error, expected $code');
    }
  }
  return failures;
}

Map<String, MergeFrozenConfig> _configs(_Json fixture) => {
  for (final entry in (fixture['configs']! as Map).entries)
    entry.key as String: MergeFrozenConfig.fromJson(
      (entry.value as Map).cast<String, Object?>(),
    ),
};

List<_Json> _list(Object? value) => (value! as List)
    .map((item) => (item as Map).cast<String, Object?>())
    .toList();

MergeCheckpoint _checkpoint(Object? value) =>
    MergeCheckpoint.fromJson((value! as Map).cast<String, Object?>());

List<MergeDirection> _moves(Object? value) => (value! as List)
    .map((move) => MergeDirection.values.byName(move as String))
    .toList();

void _expect(Object? actual, Object? expected, String name) {
  if (actual.toString() != expected.toString()) {
    throw StateError('$name: expected $expected, got $actual');
  }
}

void _checkDaily(_Json entry, Map<String, MergeFrozenConfig> configs) {
  final config = configs[entry['config']]!;
  final seed = mergeDailySeed(entry['utc_date']! as String);
  _expect(seed, entry['seed'], 'seed');
  final custom = !config.rules.spawnWeights.matches(
    const MergeSpawnWeights.legacy(),
  );
  final state = MergeGameState.newGame(
    seed: seed,
    spawnWeights: config.rules.spawnWeights,
  );
  final checkpoint = MergeCheckpoint.fromState(
    state,
    spawnWeights: custom ? config.rules.spawnWeights : null,
  );
  final wire = (entry['initial_checkpoint']! as Map).cast<String, Object?>();
  _expect(state.toWireJson(), {
    for (final key in state.toWireJson().keys) key: wire[key],
  }, 'initial state');
  _expect(
    wire['spawn_two_weight'],
    custom ? config.rules.spawnWeights.spawnTwoWeight : null,
    'two',
  );
  _expect(checkpoint.checkpointHash, entry['checkpoint_hash'], 'hash');
}

void _checkOrigin(_Json entry, Map<String, MergeFrozenConfig> configs) {
  final origin = mergeOriginFor(entry['kind']! as String);
  _expect(origin.mode.name, entry['mode'], 'mode');
  _expect(origin.originMode.name, entry['origin_mode'], 'origin_mode');
  _expect(origin.ranked, entry['ranked'], 'ranked');
  final hash = mergeChallengePayloadHash(
    checkpoint: _checkpoint(entry['checkpoint']),
    configRevision: configs[entry['config']]!.rules.revision,
    mode: origin.mode,
    originMode: origin.originMode,
  );
  _expect(hash, entry['payload_hash'], 'payload_hash');
}

void _checkAttempt(_Json entry, Map<String, MergeFrozenConfig> configs) {
  final result = mergeEvaluateAttempt(
    _checkpoint(entry['checkpoint']),
    _moves(entry['moves']),
    configs[entry['config']]!,
    finish: entry['finish'] == true,
  );
  final expected = (entry['expected']! as Map).cast<String, Object?>();
  mergeVerifyAttemptClaim(result, expected);
  _expect(
    result.finalState.board.cells,
    (expected['final']! as Map)['board'],
    'board',
  );
}

void _runNegative(_Json entry, Map<String, MergeFrozenConfig> configs) {
  switch (entry['op']) {
    case 'checkpoint':
      _checkpoint(entry['checkpoint']);
    case 'daily_date':
      mergeDailySeed(entry['utc_date']! as String);
    case 'config':
      MergeFrozenConfig.fromJson(
        (entry['config']! as Map).cast<String, Object?>(),
      );
    case 'attempt':
      _evaluate(entry, configs);
    case 'result':
      mergeVerifyAttemptClaim(
        _evaluate(entry, configs),
        (entry['claim']! as Map).cast<String, Object?>(),
      );
    case 'payload_hash':
      final origin = mergeOriginFor(entry['kind']! as String);
      mergeVerifyPayloadHash(
        mergeChallengePayloadHash(
          checkpoint: _checkpoint(entry['checkpoint']),
          configRevision: entry['config_revision']! as int,
          mode: origin.mode,
          originMode: origin.originMode,
        ),
        entry['claimed_hash']! as String,
      );
    default:
      throw FormatException('Unknown negative op: ${entry['op']}');
  }
}

MergeReplayResult _evaluate(
  _Json entry,
  Map<String, MergeFrozenConfig> configs,
) => mergeEvaluateAttempt(
  _checkpoint(entry['checkpoint']),
  _moves(entry['moves']),
  configs[entry['config']]!,
  finish: entry['finish'] == true,
);
