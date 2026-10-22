part of 'merge_relay_game.dart';

extension MergeRelayGameDailyActions on MergeRelayGame {
  bool get usesServiceDaily =>
      features.socialEnabled && relayController != null;

  Future<void> refreshDaily() async {
    if (_disposed || !usesServiceDaily) return;
    final date = _mergeRelayUtcDate(clock.now());
    final current = dailyStatus.value;
    if (current.phase == MergeRelayDailyPhase.loading ||
        (current.phase == MergeRelayDailyPhase.ready &&
            current.daily?.date == date)) {
      return;
    }
    dailyStatus.value = const MergeRelayDailyStatus.loading();
    MergeRelayDailyStatus next;
    try {
      final daily = await relayController!.gateway.getDaily(date);
      next = daily.date == date
          ? MergeRelayDailyStatus.ready(daily)
          : MergeRelayDailyStatus.failed(
              mergeRelayOutcomeFor(
                const MergeRelayProtocolException('Daily date mismatch'),
              ),
            );
    } on Object catch (error) {
      next = MergeRelayDailyStatus.failed(
        mergeRelayOutcomeFor(error, fallbackCode: 'daily_unavailable'),
      );
    }
    if (!_disposed) dailyStatus.value = next;
  }

  MergeGameState _dailyStartState(String date) {
    final daily = dailyStatus.value.daily;
    if (usesServiceDaily &&
        dailyStatus.value.phase == MergeRelayDailyPhase.ready &&
        daily != null &&
        daily.date == date) {
      return daily.checkpoint.state;
    }
    return MergeGameState.newGame(seed: _mergeRelayDailySeed(date));
  }
}
