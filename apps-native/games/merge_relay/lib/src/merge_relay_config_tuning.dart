import 'package:merge_rules/merge_rules.dart';

import 'network/merge_relay_models.dart';

final class MergeRelayTuning {
  const MergeRelayTuning._({
    required this.ruleConfig,
    required this.dailyEnabled,
    required this.endlessEnabled,
    required this.rankedRelayEnabled,
    required this.killed,
  });

  const MergeRelayTuning.legacy()
    : ruleConfig = const MergeRuleConfig.legacy(),
      dailyEnabled = true,
      endlessEnabled = true,
      rankedRelayEnabled = true,
      killed = false;

  factory MergeRelayTuning.fromRevision(MergeRelayConfigRevision revision) {
    if (!revision.active) {
      return const MergeRelayTuning._(
        ruleConfig: MergeRuleConfig.legacy(),
        dailyEnabled: true,
        endlessEnabled: true,
        rankedRelayEnabled: false,
        killed: true,
      );
    }
    try {
      return MergeRelayTuning._(
        ruleConfig: MergeRuleConfig(
          revision: revision.revision,
          spawnWeights: revision.spawnWeights,
          ruleVersion: revision.rulesVersion,
        ),
        dailyEnabled: revision.features.daily,
        endlessEnabled: revision.features.endless,
        rankedRelayEnabled: revision.features.rankedRelay,
        killed: false,
      );
    } on ArgumentError {
      return const MergeRelayTuning._(
        ruleConfig: MergeRuleConfig.legacy(),
        dailyEnabled: true,
        endlessEnabled: true,
        rankedRelayEnabled: false,
        killed: true,
      );
    }
  }

  final MergeRuleConfig ruleConfig;
  final bool dailyEnabled;
  final bool endlessEnabled;
  final bool rankedRelayEnabled;
  final bool killed;

  MergeSpawnWeights get relaySpawnWeights => rankedRelayEnabled
      ? ruleConfig.spawnWeights
      : const MergeSpawnWeights.legacy();

  MergeRuleConfig dailyConfig(MergeSpawnWeights? frozen) {
    if (frozen == null) return const MergeRuleConfig.legacy();
    final tuned = ruleConfig.spawnWeights.matches(frozen);
    return MergeRuleConfig(
      revision: tuned ? ruleConfig.revision : 1,
      spawnWeights: frozen,
    );
  }
}
