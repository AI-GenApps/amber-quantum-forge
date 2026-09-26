part of 'merge_relay_game.dart';

extension MergeRelayGameLifecycle on MergeRelayGame {
  void handleLifecycleState(AppLifecycleState lifecycleState) {
    if (_disposed) return;
    final backgrounding =
        lifecycleState == AppLifecycleState.inactive ||
        lifecycleState == AppLifecycleState.paused ||
        lifecycleState == AppLifecycleState.hidden;
    if (backgrounding) {
      unawaited(audio.pauseMusicForLifecycle());
    } else if (lifecycleState == AppLifecycleState.resumed) {
      unawaited(audio.resumeMusicForLifecycle());
    }
    if (!hydrated.value || roundComplete.value) return;
    if (backgrounding) setPaused(true);
  }

  bool handleSystemBack() {
    if (_disposed || !hydrated.value) return false;
    switch (route.value) {
      case MergeRelayRoute.home:
        return false;
      case MergeRelayRoute.tutorial:
      case MergeRelayRoute.result:
      case MergeRelayRoute.relay:
        openHome();
        return true;
      case MergeRelayRoute.play:
        if (isPaused.value) {
          openHome();
        } else {
          setPaused(true);
        }
        return true;
    }
  }
}
