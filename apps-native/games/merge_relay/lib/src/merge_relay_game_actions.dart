part of 'merge_relay_game.dart';

extension MergeRelayGameActions on MergeRelayGame {
  void openPlay({MergeRelayMode? requestedMode}) {
    if (!_readyForAction) return;
    _tutorialMode = requestedMode;
    if (requestedMode != MergeRelayMode.rescue) _tutorialRescueIndex = null;
    if (!tutorialComplete.value) {
      route.value = MergeRelayRoute.tutorial;
      return;
    }
    if (requestedMode != null) _startMode(requestedMode);
    route.value = MergeRelayRoute.play;
  }

  void continueSession() {
    if (!_readyForAction) return;
    legacyOffer.value = false;
    route.value = result.value == null
        ? MergeRelayRoute.play
        : MergeRelayRoute.result;
  }

  void replayTutorial() {
    if (!_readyForAction) return;
    _tutorialMode = null;
    route.value = MergeRelayRoute.tutorial;
  }

  void completeTutorial({required bool skipped}) {
    if (!_readyForAction) return;
    tutorialComplete.value = true;
    _announce(
      skipped ? 'You can replay the guide in Settings.' : 'Ready when you are.',
    );
    final requestedMode = _tutorialMode;
    final requestedRescueIndex = _tutorialRescueIndex;
    _tutorialMode = null;
    _tutorialRescueIndex = null;
    if (requestedMode != null) {
      _startMode(requestedMode, rescueIndex: requestedRescueIndex ?? 0);
    }
    if (requestedMode == null && !hasSavedSession.value) {
      _startMode(MergeRelayMode.rescue);
    }
    route.value = MergeRelayRoute.play;
    _queueWrite();
    unawaited(refreshPgsAccount());
  }

  void openHome() {
    if (!_readyForAction) return;
    isPaused.value = false;
    route.value = MergeRelayRoute.home;
    _queueWrite();
  }

  void openRelay() {
    if (!_readyForAction ||
        !features.socialEnabled ||
        relayController == null) {
      return;
    }
    route.value = MergeRelayRoute.relay;
    unawaited(relayController!.bootstrap());
  }

  void move(MergeDirection direction) {
    if (!_readyForAction || roundComplete.value || isPaused.value) {
      return;
    }
    final before = state.value;
    final moveResult = rules.apply(before, direction);
    if (!moveResult.changed) {
      telemetry.record(
        'merge_move_ignored',
        fields: {'reason': moveResult.reason},
      );
      _announce(
        moveResult.reason == 'terminal'
            ? 'No lanes left.'
            : 'That lane is blocked.',
      );
      if (moveResult.reason == 'terminal') _finish(MergeRelayOutcome.terminal);
      return;
    }
    state.value = moveResult.state;
    if (mode.value == MergeRelayMode.rescue) _rescueMovesUsed += 1;
    presentation.value = MergeMovePresentation.fromResult(
      before: before,
      result: moveResult,
      direction: direction,
    );
    _announce(
      moveResult.scoreDelta > 0
          ? 'Chain +${moveResult.scoreDelta}'
          : 'Board shifted.',
    );
    telemetry.record(
      'merge_move_completed',
      fields: {
        'action': mode.value.name,
        'direction': direction.name,
        'move_count': moveResult.state.moveCount,
        'score_delta': moveResult.scoreDelta,
        'rng_draws': moveResult.rngDraws,
      },
    );
    _updateCompletion();
    _queueWrite();
  }

  void startRescue({int index = 0}) {
    if (!_readyForAction) return;
    final safeIndex = index.clamp(0, content.rescues.length - 1).toInt();
    final rescue = content.rescues[safeIndex];
    _setState(rescue.state, MergeRelayMode.rescue, rescue.id, dailyDate: null);
    _announce(rescue.title);
  }

  void openRescue({required int index}) {
    if (!_readyForAction) return;
    _tutorialRescueIndex = index;
    openPlay(requestedMode: MergeRelayMode.rescue);
  }

  void startDaily() {
    if (!_readyForAction) return;
    final date = _mergeRelayUtcDate(clock.now());
    _setState(
      MergeGameState.newGame(seed: _mergeRelayDailySeed(date)),
      MergeRelayMode.daily,
      null,
      dailyDate: date,
    );
    _announce("Today's path awaits.");
  }

  void startEndless() {
    if (!_readyForAction) return;
    final seed = mode.value == MergeRelayMode.endless
        ? (state.value.seed + 1) & maxMergeSeed
        : 0x4d52;
    _setState(
      MergeGameState.newGame(seed: seed == 0 ? 1 : seed),
      MergeRelayMode.endless,
      null,
      dailyDate: null,
    );
    _announce('New run. Keep the chain alive.');
  }

  void retryRescue() {
    final index = content.rescues.indexWhere(
      (rescue) => rescue.id == rescueId.value,
    );
    startRescue(index: index < 0 ? 0 : index);
  }

  void nextRescue() {
    final current = content.rescues.indexWhere(
      (rescue) => rescue.id == rescueId.value,
    );
    startRescue(
      index: current < 0 ? 0 : (current + 1) % content.rescues.length,
    );
  }

  void newRound() {
    switch (mode.value) {
      case MergeRelayMode.rescue:
        retryRescue();
      case MergeRelayMode.daily:
        startDaily();
      case MergeRelayMode.endless:
        startEndless();
    }
  }

  void finishEarly() {
    final movesUsed = mode.value == MergeRelayMode.rescue
        ? _rescueMovesUsed
        : state.value.moveCount;
    if (!_readyForAction || roundComplete.value || movesUsed == 0) {
      return;
    }
    _finish(MergeRelayOutcome.earlyFinish);
  }

  void setPaused(bool value) {
    if (!_readyForAction || roundComplete.value) return;
    isPaused.value = value;
    if (value) _announce('Board paused.');
    _queueWrite();
  }

  void _setState(
    MergeGameState next,
    MergeRelayMode nextMode,
    String? nextRescue, {
    required String? dailyDate,
  }) {
    _rememberCurrentSession();
    final rescue = nextRescue == null
        ? null
        : content.rescues.firstWhere(
            (item) => item.id == nextRescue,
            orElse: () => content.firstRescue,
          );
    _activeRuleConfig = content.ruleConfig;
    _activeContentVersion = nextRescue == null ? null : content.contentVersion;
    _activeGoalRevision = rescue?.goalRevision;
    _activeObjective = rescue?.objective;
    _activeTargetScore = rescue?.targetScore;
    state.value = next;
    mode.value = nextMode;
    rescueId.value = nextRescue;
    _dailyDate = dailyDate;
    result.value = null;
    roundComplete.value = false;
    isPaused.value = false;
    presentation.value = null;
    _rescueMovesUsed = 0;
    route.value = MergeRelayRoute.play;
    hasSavedSession.value = true;
    _activeSessionKey = _mergeRelaySessionKey(
      mode: nextMode,
      rescueId: nextRescue,
      dailyDate: _dailyDate,
    );
    _queueWrite();
  }

  void _updateCompletion() {
    if (result.value != null) return;
    final outcome = switch (mode.value) {
      MergeRelayMode.rescue =>
        state.value.isTerminal
            ? MergeRelayOutcome.terminal
            : _rescueMovesUsed >= 3
            ? (_activeTargetScore != null &&
                      state.value.score >= _activeTargetScore!
                  ? MergeRelayOutcome.completed
                  : MergeRelayOutcome.missed)
            : null,
      MergeRelayMode.daily =>
        state.value.isTerminal
            ? MergeRelayOutcome.terminal
            : state.value.moveCount >= 3
            ? MergeRelayOutcome.completed
            : null,
      MergeRelayMode.endless =>
        state.value.isTerminal ? MergeRelayOutcome.terminal : null,
    };
    if (outcome != null) _finish(outcome);
  }

  void _finish(MergeRelayOutcome outcome) {
    if (_disposed || result.value != null) return;
    final maxTile = state.value.board.cells.fold<int>(
      0,
      (highest, value) => value > highest ? value : highest,
    );
    result.value = MergeRelayResult(
      mode: mode.value,
      outcome: outcome,
      score: state.value.score,
      maxTile: maxTile,
      movesUsed: mode.value == MergeRelayMode.rescue
          ? _rescueMovesUsed
          : state.value.moveCount,
      objective: mode.value == MergeRelayMode.rescue
          ? currentObjective
          : mode.value.goal,
      rescueId: rescueId.value,
    );
    roundComplete.value = true;
    isPaused.value = false;
    if (outcome == MergeRelayOutcome.completed && rescueId.value != null) {
      completedRescueIds.value = Set.unmodifiable({
        ...completedRescueIds.value,
        rescueId.value!,
      });
    }
    route.value = MergeRelayRoute.result;
    _queueWrite();
  }
}
