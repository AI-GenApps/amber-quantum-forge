part of 'merge_relay_game.dart';

extension MergeRelayGameLifecycle on MergeRelayGame {
  void handleLifecycleState(AppLifecycleState lifecycleState) {
    if (_disposed || !hydrated.value || roundComplete.value) return;
    if (lifecycleState == AppLifecycleState.inactive ||
        lifecycleState == AppLifecycleState.paused ||
        lifecycleState == AppLifecycleState.hidden) {
      setPaused(true);
    }
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
