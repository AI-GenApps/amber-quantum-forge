part of 'merge_relay_game.dart';

extension MergeRelayGamePlatformActions on MergeRelayGame {
  Future<void> initializePlayGames() async {
    if (_disposed ||
        !hydrated.value ||
        restoreFailed.value ||
        !features.socialEnabled ||
        _playGamesInitializationStarted) {
      return;
    }
    _playGamesInitializationStarted = true;
    late final MergeRelayPlayGamesState state;
    try {
      state = await playGames.initialize();
    } catch (_) {
      state = const MergeRelayPlayGamesState(
        status: MergeRelayPlayGamesStatus.unavailable,
        diagnosticCode: 'initialization_failed',
      );
    }
    if (_disposed) return;
    playGamesState.value = state;
    if (tutorialComplete.value) await refreshPgsAccount();
  }

  Future<void> refreshPgsAccount() async {
    final account = pgsAccountController;
    if (_disposed ||
        !hydrated.value ||
        restoreFailed.value ||
        !features.socialEnabled ||
        !tutorialComplete.value ||
        account == null) {
      return;
    }
    await account.refreshStatus();
  }

  Future<void> linkPlayGames() async {
    final account = pgsAccountController;
    if (_disposed ||
        !hydrated.value ||
        restoreFailed.value ||
        !features.socialEnabled ||
        !tutorialComplete.value ||
        account == null ||
        account.currentState.isBusy) {
      return;
    }
    final linkedState = await account.link();
    if (_disposed) return;
    try {
      playGamesState.value = await playGames.initialize();
    } catch (_) {
      playGamesState.value = const MergeRelayPlayGamesState(
        status: MergeRelayPlayGamesStatus.unavailable,
        diagnosticCode: 'initialization_failed',
      );
    }
    if (!_disposed) _announce(_pgsLinkMessage(linkedState));
  }

  Future<void> signInToPlayGames() => linkPlayGames();

  bool get canShowPlayGamesActions {
    if (!features.socialEnabled) return false;
    final account = pgsAccountController;
    return account != null &&
        account.currentState.configured &&
        playGamesState.value.isAuthenticated;
  }

  Future<void> showPlayGamesAchievements() async {
    if (!canShowPlayGamesActions) return;
    final result = await pgsAccountController!.showAchievements();
    if (_disposed ||
        result.status == MergeRelayPlayGamesActionStatus.cancelled) {
      return;
    }
    _announce(
      result.status == MergeRelayPlayGamesActionStatus.completed
          ? 'Achievements opened.'
          : 'Achievements are unavailable right now.',
    );
  }

  Future<void> showPlayGamesLeaderboards() async {
    if (!canShowPlayGamesActions) return;
    final result = await pgsAccountController!.showLeaderboards();
    if (_disposed ||
        result.status == MergeRelayPlayGamesActionStatus.cancelled) {
      return;
    }
    _announce(
      result.status == MergeRelayPlayGamesActionStatus.completed
          ? 'Leaderboard opened.'
          : 'Leaderboard is unavailable right now.',
    );
  }
}

String _pgsLinkMessage(MergeRelayPgsAccountState state) =>
    switch (state.phase) {
      MergeRelayPgsAccountPhase.linked => 'Progress linked.',
      MergeRelayPgsAccountPhase.unlinked => 'Progress is ready to link.',
      MergeRelayPgsAccountPhase.reauthorizationRequired =>
        'Sign in again to link progress.',
      MergeRelayPgsAccountPhase.revoked => 'Play Games access was revoked.',
      MergeRelayPgsAccountPhase.cancelled => 'Play Games sign-in canceled.',
      MergeRelayPgsAccountPhase.declined => 'Play Games sign-in declined.',
      MergeRelayPgsAccountPhase.offline => 'Connect to link progress.',
      MergeRelayPgsAccountPhase.conflict =>
        'That Play Games account is already linked.',
      MergeRelayPgsAccountPhase.unavailable =>
        'Play Games is unavailable here.',
      MergeRelayPgsAccountPhase.error => 'Progress could not be linked.',
      MergeRelayPgsAccountPhase.loading => 'Checking your progress link.',
      MergeRelayPgsAccountPhase.linking => 'Linking your progress.',
      MergeRelayPgsAccountPhase.idle => 'Play Games is ready when you are.',
    };
