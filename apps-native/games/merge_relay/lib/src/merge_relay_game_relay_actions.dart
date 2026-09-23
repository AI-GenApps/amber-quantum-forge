part of 'merge_relay_game.dart';

extension MergeRelayGameRelayActions on MergeRelayGame {
  void createRelayFromCurrentBoard() {
    if (!_readyForAction || relayController == null) return;
    try {
      final checkpoint = MergeCheckpoint.fromState(
        state.value,
        maxLegalMoves: 3,
        contentId: mode.value == MergeRelayMode.rescue
            ? rescueId.value
            : mode.value == MergeRelayMode.daily
            ? _dailyDate
            : null,
        contentVersion: mergeRelayContentVersion,
        spawnWeights: const MergeSpawnWeights.legacy(),
      );
      route.value = MergeRelayRoute.relay;
      unawaited(
        relayController!.createChallengeFromCheckpoint(
          checkpoint: checkpoint,
          originMode: mode.value,
          contentId: checkpoint.contentId,
          contentVersion: checkpoint.contentVersion,
        ),
      );
    } on Object {
      _announce('This board cannot be shared yet.');
    }
  }
}
