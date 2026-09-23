import 'package:platform_core/platform_core.dart';

const mergeRuleVersion = 'MR-2D-1';
const mergeConfigSchemaVersion = 1;

final class MergeSpawnWeights {
  const MergeSpawnWeights._({
    required this.spawnTwoWeight,
    required this.spawnFourWeight,
  });

  const MergeSpawnWeights.legacy() : spawnTwoWeight = 90, spawnFourWeight = 10;

  factory MergeSpawnWeights({
    required int spawnTwoWeight,
    required int spawnFourWeight,
  }) {
    _validateWeights(spawnTwoWeight, spawnFourWeight);
    return MergeSpawnWeights._(
      spawnTwoWeight: spawnTwoWeight,
      spawnFourWeight: spawnFourWeight,
    );
  }

  factory MergeSpawnWeights.fromJson(Map<String, Object?> json) {
    const fields = {'spawn_two_weight', 'spawn_four_weight'};
    if (json.keys.any((key) => !fields.contains(key)) ||
        fields.any((key) => !json.containsKey(key))) {
      throw const FormatException('Unexpected merge spawn weight fields');
    }
    final two = json['spawn_two_weight'];
    final four = json['spawn_four_weight'];
    if (two is! int || four is! int) {
      throw const FormatException('Invalid merge spawn weights');
    }
    return MergeSpawnWeights(spawnTwoWeight: two, spawnFourWeight: four);
  }

  final int spawnTwoWeight;
  final int spawnFourWeight;

  int nextValue(DeterministicRng rng) {
    if (spawnTwoWeight == 90 && spawnFourWeight == 10) {
      return rng.oneIn(10) ? 4 : 2;
    }
    return rng.nextInt(100) < spawnFourWeight ? 4 : 2;
  }

  Map<String, Object> toJson() => {
    'spawn_two_weight': spawnTwoWeight,
    'spawn_four_weight': spawnFourWeight,
  };

  bool matches(MergeSpawnWeights other) =>
      spawnTwoWeight == other.spawnTwoWeight &&
      spawnFourWeight == other.spawnFourWeight;
}

final class MergeRuleConfig {
  MergeRuleConfig({
    required this.revision,
    required this.spawnWeights,
    this.ruleVersion = mergeRuleVersion,
  }) {
    if (revision < 1) {
      throw ArgumentError.value(revision, 'revision');
    }
    if (ruleVersion != mergeRuleVersion) {
      throw ArgumentError.value(ruleVersion, 'ruleVersion');
    }
  }

  const MergeRuleConfig.legacy()
    : revision = 1,
      spawnWeights = const MergeSpawnWeights.legacy(),
      ruleVersion = mergeRuleVersion;

  factory MergeRuleConfig.fromJson(Map<String, Object?> json) {
    const fields = {
      'revision',
      'rules_version',
      'spawn_two_weight',
      'spawn_four_weight',
    };
    if (json.keys.any((key) => !fields.contains(key)) ||
        fields.any((key) => !json.containsKey(key))) {
      throw const FormatException('Unexpected merge rule config fields');
    }
    final revision = json['revision'];
    final ruleVersion = json['rules_version'];
    if (revision is! int || ruleVersion is! String) {
      throw const FormatException('Invalid merge rule config');
    }
    return MergeRuleConfig(
      revision: revision,
      ruleVersion: ruleVersion,
      spawnWeights: MergeSpawnWeights.fromJson({
        'spawn_two_weight': json['spawn_two_weight'],
        'spawn_four_weight': json['spawn_four_weight'],
      }),
    );
  }

  final int revision;
  final MergeSpawnWeights spawnWeights;
  final String ruleVersion;

  Map<String, Object> toJson() => {
    'revision': revision,
    'rules_version': ruleVersion,
    ...spawnWeights.toJson(),
  };

  bool matches(MergeRuleConfig other) =>
      revision == other.revision &&
      ruleVersion == other.ruleVersion &&
      spawnWeights.matches(other.spawnWeights);
}

void _validateWeights(int spawnTwoWeight, int spawnFourWeight) {
  if (spawnTwoWeight < 0 ||
      spawnFourWeight < 0 ||
      spawnTwoWeight > 100 ||
      spawnFourWeight > 100 ||
      spawnTwoWeight + spawnFourWeight != 100) {
    throw ArgumentError.value([
      spawnTwoWeight,
      spawnFourWeight,
    ], 'spawnWeights');
  }
}
