import 'package:merge_rules/merge_rules.dart';

typedef Json = Map<String, Object?>;

const terminalBoard = [2, 4, 2, 4, 4, 2, 4, 2, 8, 16, 8, 16, 8, 16, 8, 0];

const cappedBoard = [1073741824, 1073741824, 2, 2, ...zeros12];

const zeros12 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const _stuckBoard = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];

Json _base() => {
  ...MergeGameState.newGame(seed: 12345).toWireJson(),
  'max_legal_moves': 3,
};

Json _with(Json overrides) => {..._base(), ...overrides};

Json _cp(String id, String category, Json overrides) => {
  'id': id,
  'category': category,
  'op': 'checkpoint',
  'checkpoint': _with(overrides),
};

Json _attempt(
  String id,
  String category,
  String config,
  Json checkpoint,
  List<String> moves,
) => {
  'id': id,
  'category': category,
  'op': 'attempt',
  'config': config,
  'checkpoint': checkpoint,
  'moves': moves,
  'finish': false,
};

List<int> _cells(List<int> head) => [
  ...head,
  ...List<int>.filled(16 - head.length, 0),
];

List<Json> buildNegatives(
  Map<String, MergeFrozenConfig> configs,
  List<Json> origins,
) {
  final base = _base();
  final legacy = configs['legacy']!.toJson();
  final daily = origins.firstWhere((entry) => entry['id'] == 'daily');
  final dailyHash = daily['payload_hash']! as String;
  final flipped =
      '${dailyHash.startsWith('0') ? '1' : '0'}${dailyHash.substring(1)}';
  final terminal = {..._base(), 'board': terminalBoard};
  final applied = const MergeRules().apply(
    MergeGameState.newGame(seed: 12345),
    MergeDirection.left,
  );
  final good = <String, Object?>{
    'outcome': 'early_finish',
    'legal_moves': 1,
    'score_gained': applied.scoreDelta,
    'max_tile': applied.state.board.cells.reduce((a, b) => a > b ? a : b),
    'final': applied.state.toWireJson(),
  };
  Json result(String id, Json overrides) => {
    'id': id,
    'category': 'inconsistent_result',
    'op': 'result',
    'config': 'legacy',
    'checkpoint': base,
    'moves': ['left'],
    'finish': true,
    'claim': {...good, ...overrides},
  };
  Json finalWith(Json overrides) => {...(good['final']! as Json), ...overrides};
  Json hash(String id, String kind, int revision) => {
    'id': id,
    'category': 'hash_mismatch',
    'op': 'payload_hash',
    'kind': kind,
    'config_revision': revision,
    'checkpoint': daily['checkpoint'],
    'claimed_hash': dailyHash,
  };
  Json config(String id, Json overrides) => {
    'id': id,
    'category': 'foreign_config',
    'op': 'config',
    'config': {...legacy, ...overrides},
  };
  Json date(String id, String value) => {
    'id': id,
    'category': 'numeric_limit',
    'op': 'daily_date',
    'utc_date': value,
  };
  final entries = [
    _cp('score_over_limit', 'numeric_limit', {'score': 1000000000001}),
    _cp('move_count_over_limit', 'numeric_limit', {'move_count': 100001}),
    _cp('seed_over_uint32', 'numeric_limit', {'seed': 4294967296}),
    _cp('negative_seed', 'numeric_limit', {'seed': -1}),
    _cp('rng_state_zero', 'numeric_limit', {'rng_state': 0}),
    _cp('rng_state_over_uint32', 'numeric_limit', {'rng_state': 4294967296}),
    _cp('budget_four', 'numeric_limit', {'max_legal_moves': 4}),
    _cp('budget_zero', 'numeric_limit', {'max_legal_moves': 0}),
    _cp('fractional_score', 'numeric_limit', {'score': 1.5}),
    _cp('tile_over_cap', 'numeric_limit', {
      'board': _cells([2147483648]),
    }),
    _cp('tile_not_power_of_two', 'numeric_limit', {
      'board': _cells([3]),
    }),
    _cp('board_length_fifteen', 'numeric_limit', {
      'board': List<int>.filled(15, 0),
    }),
    _cp('weights_sum_not_100', 'numeric_limit', {
      'spawn_two_weight': 80,
      'spawn_four_weight': 30,
    }),
    _cp('weight_negative', 'numeric_limit', {
      'spawn_two_weight': 110,
      'spawn_four_weight': -10,
    }),
    _cp('weight_unpaired', 'numeric_limit', {'spawn_four_weight': 10}),
    _cp('terminal_checkpoint', 'numeric_limit', {'board': _stuckBoard}),
    date('date_feb_30', '2026-02-30'),
    date('date_not_padded', '2026-1-1'),
    _attempt(
      'move_limit',
      'numeric_limit',
      'legacy',
      _with({'move_count': 100000}),
      ['left'],
    ),
    _attempt(
      'score_limit',
      'numeric_limit',
      'legacy',
      _with({
        'board': _cells([2, 2]),
        'score': 999999999998,
      }),
      ['left'],
    ),
    _attempt(
      'tile_cap_no_op',
      'numeric_limit',
      'legacy',
      _with({
        'board': _cells([1073741824, 1073741824]),
      }),
      ['left'],
    ),
    config('rules_version_foreign', {'rules_version': 'MR-3D-1'}),
    config('config_weights_invalid', {
      'spawn_two_weight': 70,
      'spawn_four_weight': 20,
    }),
    config('config_revision_zero', {'revision': 0}),
    config('config_extra_field', {'bonus': 1}),
    _attempt(
      'weights_foreign_to_config',
      'foreign_config',
      'legacy',
      _with({'spawn_two_weight': 60, 'spawn_four_weight': 40}),
      ['left'],
    ),
    _attempt('weights_missing_for_custom', 'foreign_config', 'custom', base, [
      'left',
    ]),
    _attempt(
      'legacy_weights_under_custom',
      'foreign_config',
      'custom',
      _with({'spawn_two_weight': 90, 'spawn_four_weight': 10}),
      ['left'],
    ),
    _attempt(
      'content_version_foreign',
      'foreign_content',
      'legacy',
      _with({'content_id': 'rescue-099', 'content_version': 'MR-CONTENT-0'}),
      ['left'],
    ),
    {...hash('hash_flipped_char', 'daily', 1), 'claimed_hash': flipped},
    hash('hash_other_revision', 'daily', 3),
    hash('hash_other_origin', 'relay_from_daily', 1),
    hash('hash_other_mode', 'endless', 1),
    _attempt(
      'trailing_move_after_terminal',
      'inconsistent_result',
      'legacy',
      terminal,
      ['right', 'left'],
    ),
    _attempt('no_op_move', 'inconsistent_result', 'legacy', terminal, ['left']),
    _attempt(
      'over_budget',
      'inconsistent_result',
      'legacy',
      _with({'max_legal_moves': 1}),
      ['left', 'up'],
    ),
    result('claim_score_gained', {
      'score_gained': (good['score_gained']! as int) + 1,
    }),
    result('claim_outcome_completed', {'outcome': 'completed'}),
    result('claim_outcome_terminal', {'outcome': 'terminal'}),
    result('claim_legal_moves', {'legal_moves': 2}),
    result('claim_max_tile', {'max_tile': 1024}),
    result('claim_final_score', {
      'final': finalWith({'score': 99}),
    }),
    result('claim_final_rng', {
      'final': finalWith({'rng_state': 5}),
    }),
    result('claim_final_move_count', {
      'final': finalWith({'move_count': 7}),
    }),
  ];
  return [
    for (final entry in entries)
      {
        ...entry,
        if (_codes[entry['id']] != null) 'error_code': _codes[entry['id']],
      },
  ];
}

const _codes = <String, String>{
  'move_limit': 'move_limit',
  'score_limit': 'score_limit',
  'tile_cap_no_op': 'no_op',
  'weights_foreign_to_config': 'config_mismatch',
  'weights_missing_for_custom': 'config_mismatch',
  'legacy_weights_under_custom': 'config_mismatch',
  'content_version_foreign': 'content_version_mismatch',
  'hash_flipped_char': 'hash_mismatch',
  'hash_other_revision': 'hash_mismatch',
  'hash_other_origin': 'hash_mismatch',
  'hash_other_mode': 'hash_mismatch',
  'trailing_move_after_terminal': 'trailing_move',
  'no_op_move': 'no_op',
  'over_budget': 'over_budget',
  'claim_score_gained': 'inconsistent_result',
  'claim_outcome_completed': 'inconsistent_result',
  'claim_outcome_terminal': 'inconsistent_result',
  'claim_legal_moves': 'inconsistent_result',
  'claim_max_tile': 'inconsistent_result',
  'claim_final_score': 'inconsistent_result',
  'claim_final_rng': 'inconsistent_result',
  'claim_final_move_count': 'inconsistent_result',
};
