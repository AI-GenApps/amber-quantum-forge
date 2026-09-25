part of 'merge_relay_game.dart';

/// Session-map schema version. Version 2 adds an optional per-session
/// `move_budget` (rescue campaign chapters 3-6 use a budget above the old
/// fixed 3). Version 1 saves are read the same way — `move_budget` simply
/// defaults to 3 when absent — so this is a transparent migration: an old
/// save keeps its cleared boards and in-progress sessions, and the next
/// write upgrades it to version 2.
const _mergeRelaySessionMapVersion = 2;
const _mergeRelayLegacySessionMapVersion = 1;

final class _MergeRelaySession {
  const _MergeRelaySession({
    required this.mode,
    required this.state,
    required this.rescueId,
    required this.dailyDate,
    required this.rescueMovesUsed,
    required this.paused,
    required this.result,
    required this.contentVersion,
    required this.goalRevision,
    required this.objective,
    required this.targetScore,
    required this.ruleConfig,
    required this.moveBudget,
  });

  final MergeRelayMode mode;
  final MergeGameState state;
  final String? rescueId;
  final String? dailyDate;
  final int rescueMovesUsed;
  final bool paused;
  final MergeRelayResult? result;
  final String? contentVersion;
  final String? goalRevision;
  final String? objective;
  final int? targetScore;
  final MergeRuleConfig? ruleConfig;
  final int moveBudget;

  bool get hasFrozenGoal =>
      mode != MergeRelayMode.rescue ||
      (contentVersion != null &&
          goalRevision != null &&
          objective != null &&
          targetScore != null &&
          ruleConfig != null);

  Map<String, Object?> toJson() => {
    'game': state.toJson(),
    'mode': mode.name,
    'rescue_id': rescueId,
    'daily_date': dailyDate,
    'rescue_moves_used': rescueMovesUsed,
    'paused': paused,
    'result': result?.toJson(),
    'content_version': contentVersion,
    'goal_revision': goalRevision,
    'objective': objective,
    'target_score': targetScore,
    'rule_config': ruleConfig?.toJson(),
    'move_budget': moveBudget,
  };
}

final class _MergeRelayProfile {
  const _MergeRelayProfile({
    required this.tutorialComplete,
    required this.preferences,
    required this.completedRescueIds,
  });

  final bool tutorialComplete;
  final MergeRelayPreferences preferences;
  final Set<String> completedRescueIds;

  Map<String, Object?> toJson() => {
    'tutorial_version': tutorialComplete ? mergeRelayTutorialVersion : 0,
    'theme_id': preferences.themeId,
    'reduced_motion': preferences.reducedMotion,
    'audio_enabled': preferences.audioEnabled,
    'haptics_enabled': preferences.hapticsEnabled,
    'accessible_controls': preferences.accessibleControls,
    'completed_rescue_ids': completedRescueIds.toList()..sort(),
  };
}

final class _MergeRelayRestoredSave {
  const _MergeRelayRestoredSave({
    required this.sessions,
    required this.activeSessionKey,
    required this.profile,
    required this.legacyOffer,
  });

  final Map<String, _MergeRelaySession> sessions;
  final String? activeSessionKey;
  final _MergeRelayProfile profile;
  final bool legacyOffer;
}

extension MergeRelayGameSessions on MergeRelayGame {
  void _rememberCurrentSession() {
    if (!hydrated.value || !hasSavedSession.value) return;
    final key = _activeSessionKey;
    if (key == null) return;
    _sessions[key] = _currentSession();
  }

  _MergeRelaySession _currentSession() => _MergeRelaySession(
    mode: mode.value,
    state: state.value,
    rescueId: rescueId.value,
    dailyDate: _dailyDate,
    rescueMovesUsed: _rescueMovesUsed,
    paused: isPaused.value,
    result: result.value,
    contentVersion: _activeContentVersion,
    goalRevision: _activeGoalRevision,
    objective: _activeObjective,
    targetScore: _activeTargetScore,
    ruleConfig: _activeRuleConfig,
    moveBudget: _activeMoveBudget,
  );

  bool _activateSession(String key) {
    final saved = _sessions[key];
    if (saved == null) return false;
    _activeSessionKey = key;
    _activateSessionMetadata(saved);
    state.value = saved.state;
    mode.value = saved.mode;
    rescueId.value = saved.rescueId;
    _dailyDate = saved.dailyDate;
    _rescueMovesUsed = saved.rescueMovesUsed;
    isPaused.value = saved.paused;
    result.value = saved.result;
    roundComplete.value = saved.result != null;
    hasSavedSession.value = true;
    route.value = roundComplete.value
        ? MergeRelayRoute.result
        : MergeRelayRoute.play;
    return true;
  }

  void _activateSessionMetadata(_MergeRelaySession session) {
    _activeContentVersion = session.contentVersion;
    _activeGoalRevision = session.goalRevision;
    _activeObjective = session.objective;
    _activeTargetScore = session.targetScore;
    _activeRuleConfig = session.ruleConfig ?? const MergeRuleConfig.legacy();
    _activeMoveBudget = session.moveBudget;
  }
}
