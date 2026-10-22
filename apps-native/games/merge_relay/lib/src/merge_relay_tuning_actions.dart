part of 'merge_relay_game.dart';

extension MergeRelayGameTuningActions on MergeRelayGame {
  MergeRelayTuning get tuning => _tuning;

  Future<void> refreshTuning() async {
    if (_disposed || !usesServiceDaily) return;
    try {
      final config = await relayController!.gateway.getConfig();
      if (_disposed) return;
      _tuning = MergeRelayTuning.fromRevision(config);
      await eventOutbox?.applyConfig(config);
    } on Object {
      return;
    }
  }

  MergeRuleConfig _ruleConfigForNewRun(MergeRelayMode nextMode, String? date) {
    if (nextMode == MergeRelayMode.rescue) return content.ruleConfig;
    if (nextMode == MergeRelayMode.daily) {
      final daily = dailyStatus.value.daily;
      if (usesServiceDaily &&
          dailyStatus.value.phase == MergeRelayDailyPhase.ready &&
          daily != null &&
          daily.date == date) {
        return _tuning.dailyConfig(daily.checkpoint.spawnWeights);
      }
    }
    return _tuning.ruleConfig;
  }

  bool _newRunAllowed(MergeRelayMode nextMode) => switch (nextMode) {
    MergeRelayMode.daily => _tuning.dailyEnabled,
    MergeRelayMode.endless => _tuning.endlessEnabled,
    MergeRelayMode.rescue => true,
  };

  void _recordRunComplete(MergeRelayOutcome outcome) {
    final outbox = eventOutbox;
    if (outbox == null || mode.value != MergeRelayMode.daily) return;
    unawaited(
      outbox
          .enqueue(
            MergeRelayClientEventType.dailyRunComplete,
            payload: {
              'mode': mode.value.name,
              'outcome': outcome.name,
              'date': _dailyDate,
              'score': state.value.score,
              'move_count': state.value.moveCount,
              'rule_version': _activeRuleConfig.ruleVersion,
              'config_revision': _activeRuleConfig.revision,
            },
          )
          .then((queued) => queued ? outbox.flush() : 0)
          .catchError((Object _) => 0),
    );
  }
}
