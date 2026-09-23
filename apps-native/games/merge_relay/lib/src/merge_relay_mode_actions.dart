part of 'merge_relay_game.dart';

extension MergeRelayGameModeActions on MergeRelayGame {
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
