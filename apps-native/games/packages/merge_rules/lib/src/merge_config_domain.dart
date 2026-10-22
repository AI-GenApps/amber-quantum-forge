import 'merge_board.dart';
import 'merge_codec.dart';
import 'merge_config.dart';
import 'merge_models.dart';
import 'merge_replay.dart';
import 'merge_rules.dart';

final class MergeOrigin {
  const MergeOrigin({
    required this.mode,
    required this.originMode,
    required this.ranked,
  });

  final MergeRelayMode mode;
  final MergeRelayMode originMode;
  final bool ranked;
}

MergeOrigin mergeOriginFor(String kind) => switch (kind) {
  'practice' => const MergeOrigin(
    mode: MergeRelayMode.endless,
    originMode: MergeRelayMode.endless,
    ranked: false,
  ),
  'daily' => const MergeOrigin(
    mode: MergeRelayMode.daily,
    originMode: MergeRelayMode.daily,
    ranked: true,
  ),
  'endless' => const MergeOrigin(
    mode: MergeRelayMode.endless,
    originMode: MergeRelayMode.endless,
    ranked: true,
  ),
  'rescue' => const MergeOrigin(
    mode: MergeRelayMode.rescue,
    originMode: MergeRelayMode.rescue,
    ranked: true,
  ),
  'relay_from_daily' => const MergeOrigin(
    mode: MergeRelayMode.rescue,
    originMode: MergeRelayMode.daily,
    ranked: true,
  ),
  _ => throw FormatException('Unknown merge origin kind: $kind'),
};

final class MergeFrozenConfig {
  const MergeFrozenConfig({required this.rules, required this.contentRevision});

  factory MergeFrozenConfig.fromJson(Map<String, Object?> json) {
    final contentRevision = json['content_revision'];
    if (contentRevision is! String) {
      throw const FormatException('Invalid merge frozen config');
    }
    final rules = <String, Object?>{...json}..remove('content_revision');
    return MergeFrozenConfig(
      rules: MergeRuleConfig.fromJson(rules),
      contentRevision: contentRevision,
    );
  }

  final MergeRuleConfig rules;
  final String contentRevision;

  Map<String, Object?> toJson() => {
    ...rules.toJson(),
    'content_revision': contentRevision,
  };
}

String mergeChallengePayloadHash({
  required MergeCheckpoint checkpoint,
  required int configRevision,
  required MergeRelayMode mode,
  required MergeRelayMode originMode,
  String? parentChallengeId,
}) {
  final state = checkpoint.state;
  return sha256Hex({
    'checkpoint': {
      'board': state.board.cells,
      'content_id': checkpoint.contentId,
      'content_version': checkpoint.contentVersion,
      'max_legal_moves': checkpoint.maxLegalMoves,
      'move_count': state.moveCount,
      'rng_state': state.rngState,
      'rule_version': state.ruleVersion,
      'score': state.score,
      'seed': state.seed,
      'spawn_four_weight': checkpoint.spawnWeights?.spawnFourWeight,
      'spawn_two_weight': checkpoint.spawnWeights?.spawnTwoWeight,
    },
    'config_revision': configRevision,
    'mode': mode.name,
    'origin_mode': originMode.name,
    'parent_challenge_id': parentChallengeId,
  });
}

void mergeVerifyPayloadHash(String expected, String claimed) {
  if (expected != claimed) {
    throw MergeRuleError(
      'hash_mismatch',
      'Challenge payload hash does not match',
    );
  }
}

void mergeRequireBoundConfig(
  MergeCheckpoint checkpoint,
  MergeFrozenConfig config,
) {
  if (config.rules.ruleVersion != mergeRuleVersion) {
    throw MergeRuleError('foreign_rules', 'Configuration rules are foreign');
  }
  final weights = checkpoint.spawnWeights;
  if (weights != null) {
    if (!weights.matches(config.rules.spawnWeights)) {
      throw MergeRuleError('config_mismatch', 'Checkpoint weights differ');
    }
  } else if (!config.rules.spawnWeights.matches(
    const MergeSpawnWeights.legacy(),
  )) {
    throw MergeRuleError('config_mismatch', 'Checkpoint weights are required');
  }
  final version = checkpoint.contentVersion;
  if (version != null && version != config.contentRevision) {
    throw MergeRuleError('content_version_mismatch', 'Content is foreign');
  }
}

MergeReplayResult mergeEvaluateAttempt(
  MergeCheckpoint checkpoint,
  Iterable<MergeDirection> moves,
  MergeFrozenConfig config, {
  bool finish = false,
}) {
  mergeRequireBoundConfig(checkpoint, config);
  return MergeRules(
    config: config.rules,
  ).replayAttempt(checkpoint, moves, finish: finish);
}

void mergeVerifyAttemptClaim(
  MergeReplayResult evaluated,
  Map<String, Object?> claim,
) {
  final final_ = claim['final'];
  final state = evaluated.finalState;
  final consistent =
      final_ is Map &&
      claim['outcome'] == mergeAttemptOutcomeName(evaluated.outcome) &&
      claim['legal_moves'] == evaluated.legalMoves &&
      claim['score_gained'] == evaluated.scoreGained &&
      claim['max_tile'] == evaluated.maxTile &&
      final_['score'] == state.score &&
      final_['move_count'] == state.moveCount &&
      final_['rng_state'] == state.rngState &&
      _sameCells(final_['board'], state.board.cells);
  if (!consistent) {
    throw MergeRuleError(
      'inconsistent_result',
      'Result relations are inconsistent',
    );
  }
}

bool _sameCells(Object? claimed, List<int> cells) {
  if (claimed is! List || claimed.length != cells.length) return false;
  for (var index = 0; index < cells.length; index += 1) {
    if (claimed[index] != cells[index]) return false;
  }
  return true;
}
