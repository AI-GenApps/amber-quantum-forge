part of 'merge_relay_game.dart';

extension MergeRelayGameModeActions on MergeRelayGame {
  /// The finished result of today's Daily session, if the player already
  /// played (and finished) it — `null` before it's started or while it's
  /// still in progress. Backs Home's Daily card "today's state" (task 11).
  MergeRelayResult? get todaysDailyResult {
    final date = _mergeRelayUtcDate(clock.now());
    final key = _mergeRelaySessionKey(
      mode: MergeRelayMode.daily,
      rescueId: null,
      dailyDate: date,
    );
    return _sessions[key]?.result;
  }

  void _startMode(MergeRelayMode requestedMode, {int rescueIndex = 0}) {
    switch (requestedMode) {
      case MergeRelayMode.rescue:
        final safeIndex = rescueIndex
            .clamp(0, content.rescues.length - 1)
            .toInt();
        final rescue = content.rescues[safeIndex];
        final key = _mergeRelaySessionKey(
          mode: requestedMode,
          rescueId: rescue.id,
          dailyDate: null,
        );
        if (!_activateSession(key)) startRescue(index: safeIndex);
      case MergeRelayMode.daily:
        final date = _mergeRelayUtcDate(clock.now());
        final key = _mergeRelaySessionKey(
          mode: requestedMode,
          rescueId: null,
          dailyDate: date,
        );
        if (!_activateSession(key)) startDaily();
      case MergeRelayMode.endless:
        if (!_activateSession('endless')) startEndless();
    }
  }
}
