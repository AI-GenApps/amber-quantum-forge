import 'dart:convert';
import 'dart:io';

import 'package:merge_rules/merge_rules.dart';

import 'config_fixture_negatives.dart';

typedef Json = Map<String, Object?>;

const _contentRevision = 'MR-CONTENT-1';

final _configs = <String, MergeFrozenConfig>{
  'legacy': MergeFrozenConfig(
    rules: MergeRuleConfig(
      revision: 1,
      spawnWeights: const MergeSpawnWeights.legacy(),
    ),
    contentRevision: _contentRevision,
  ),
  'custom': MergeFrozenConfig(
    rules: MergeRuleConfig(
      revision: 2,
      spawnWeights: MergeSpawnWeights(spawnTwoWeight: 60, spawnFourWeight: 40),
    ),
    contentRevision: _contentRevision,
  ),
  'all_fours': MergeFrozenConfig(
    rules: MergeRuleConfig(
      revision: 4,
      spawnWeights: MergeSpawnWeights(spawnTwoWeight: 0, spawnFourWeight: 100),
    ),
    contentRevision: _contentRevision,
  ),
  'rolled_back': MergeFrozenConfig(
    rules: MergeRuleConfig(
      revision: 3,
      spawnWeights: const MergeSpawnWeights.legacy(),
    ),
    contentRevision: _contentRevision,
  ),
};

const _dates = ['2026-10-22', '2026-01-01', '2026-12-31', '2028-02-29'];

void main(List<String> args) {
  final fixture = <String, Object?>{
    'fixture_version': mergeConfigFixtureVersion,
    'rule_version': mergeRuleVersion,
    'seed_derivation': {
      'initial': 17,
      'multiplier': 31,
      'modulus': 4294967296,
      'zero_replacement': 1,
    },
    'configs': {
      for (final entry in _configs.entries) entry.key: entry.value.toJson(),
    },
    'daily': [
      for (final date in _dates)
        for (final config in ['legacy', 'custom']) _daily(date, config),
    ],
    'origins': _origins(),
    'attempts': _attempts(),
    'negative': buildNegatives(_configs, _origins()),
  };
  final failures = runMergeConfigFixture(fixture);
  if (failures.isNotEmpty) {
    stderr.writeln(failures.join('\n'));
    exit(1);
  }
  final text = const JsonEncoder.withIndent('  ').convert(fixture);
  File(args.single).writeAsStringSync('$text\n');
}

MergeCheckpoint _initial(String config, int seed, {String? content}) {
  final rules = _configs[config]!.rules;
  final custom = !rules.spawnWeights.matches(const MergeSpawnWeights.legacy());
  return MergeCheckpoint.fromState(
    MergeGameState.newGame(seed: seed, spawnWeights: rules.spawnWeights),
    contentId: content,
    contentVersion: content == null ? null : _contentRevision,
    spawnWeights: custom ? rules.spawnWeights : null,
  );
}

Json _daily(String date, String config) {
  final checkpoint = _initial(config, mergeDailySeed(date));
  return {
    'utc_date': date,
    'config': config,
    'seed': mergeDailySeed(date),
    'initial_checkpoint': checkpoint.toJson(),
    'checkpoint_hash': checkpoint.checkpointHash,
  };
}

List<Json> _origins() {
  final daily = _initial(
    'legacy',
    mergeDailySeed('2026-10-22'),
    content: 'daily-2026-10-22',
  );
  final endless = _initial('legacy', 4242, content: 'endless-4242');
  final rescue = _initial('legacy', 99, content: 'rescue-099');
  Json entry(
    String id,
    String kind,
    String config,
    MergeCheckpoint checkpoint,
  ) {
    final origin = mergeOriginFor(kind);
    return {
      'id': id,
      'kind': kind,
      'mode': origin.mode.name,
      'origin_mode': origin.originMode.name,
      'ranked': origin.ranked,
      'config': config,
      'checkpoint': checkpoint.toJson(),
      'payload_hash': mergeChallengePayloadHash(
        checkpoint: checkpoint,
        configRevision: _configs[config]!.rules.revision,
        mode: origin.mode,
        originMode: origin.originMode,
      ),
    };
  }

  return [
    entry('practice', 'practice', 'legacy', endless),
    entry('daily', 'daily', 'legacy', daily),
    {
      ...entry('daily_rolled_back', 'daily', 'rolled_back', daily),
      'differs_from': 'daily',
    },
    entry('endless', 'endless', 'legacy', endless),
    entry('rescue', 'rescue', 'legacy', rescue),
    {
      ...entry('relay_from_daily', 'relay_from_daily', 'legacy', daily),
      'differs_from': 'daily',
    },
  ];
}

List<MergeDirection> _walk(
  MergeCheckpoint checkpoint,
  MergeFrozenConfig config,
  int count,
) {
  final rules = MergeRules(config: config.rules);
  var state = checkpoint.state;
  final moves = <MergeDirection>[];
  for (final direction in [
    MergeDirection.left,
    MergeDirection.up,
    MergeDirection.right,
    MergeDirection.down,
  ]) {
    if (moves.length == count) break;
    final result = rules.apply(state, direction);
    if (result.changed) {
      moves.add(direction);
      state = result.state;
    }
  }
  return moves;
}

Json _attempt(
  String id,
  String config,
  MergeCheckpoint checkpoint,
  List<MergeDirection> moves, {
  bool finish = false,
}) {
  final result = mergeEvaluateAttempt(
    checkpoint,
    moves,
    _configs[config]!,
    finish: finish,
  );
  final state = result.finalState;
  return {
    'id': id,
    'config': config,
    'checkpoint': checkpoint.toJson(),
    'moves': moves.map((move) => move.name).toList(),
    'finish': finish,
    'expected': {
      'outcome': mergeAttemptOutcomeName(result.outcome),
      'legal_moves': result.legalMoves,
      'score_gained': result.scoreGained,
      'max_tile': result.maxTile,
      'final': state.toWireJson(),
    },
  };
}

MergeCheckpoint _board(List<int> cells) => MergeCheckpoint(
  state: MergeGameState(
    board: MergeBoard(cells),
    score: 0,
    moveCount: 0,
    seed: 7,
    rngState: 12345,
  ),
);

List<Json> _attempts() {
  final legacy = _configs['legacy']!;
  final custom = _configs['custom']!;
  final base = _initial('legacy', 12345);
  final rescue = _initial('legacy', 99, content: 'rescue-099');
  final weighted = _initial('custom', 12345);
  final dailyBase = _initial(
    'legacy',
    mergeDailySeed('2026-10-22'),
    content: 'daily-2026-10-22',
  );
  final allFours = _initial('all_fours', 12345);
  final terminal = _board(terminalBoard);
  final capped = _board(cappedBoard);
  return [
    _attempt('ordinary_completed', 'legacy', base, _walk(base, legacy, 3)),
    _attempt('ordinary_in_progress', 'legacy', base, _walk(base, legacy, 2)),
    _attempt(
      'early_finish',
      'legacy',
      base,
      _walk(base, legacy, 1),
      finish: true,
    ),
    _attempt(
      'early_finish_two_moves',
      'legacy',
      dailyBase,
      _walk(dailyBase, legacy, 2),
      finish: true,
    ),
    _attempt('rescue_completed', 'legacy', rescue, _walk(rescue, legacy, 3)),
    _attempt(
      'rescue_budget_two',
      'legacy',
      MergeCheckpoint.fromState(
        rescue.state,
        maxLegalMoves: 2,
        contentId: 'rescue-099',
        contentVersion: _contentRevision,
      ),
      _walk(rescue, legacy, 2),
    ),
    _attempt('terminal', 'legacy', terminal, [MergeDirection.right]),
    _attempt(
      'custom_weights_completed',
      'custom',
      weighted,
      _walk(weighted, custom, 3),
    ),
    _attempt(
      'custom_all_fours',
      'all_fours',
      allFours,
      _walk(allFours, _configs['all_fours']!, 3),
    ),
    _attempt('tile_cap_partial_merge', 'legacy', capped, [MergeDirection.left]),
    _attempt(
      'explicit_legacy_weights',
      'legacy',
      MergeCheckpoint.fromState(
        base.state,
        spawnWeights: const MergeSpawnWeights.legacy(),
      ),
      _walk(base, legacy, 3),
    ),
  ];
}
