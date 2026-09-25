part of 'merge_relay_game.dart';

extension MergeRelayGameRestoreParsing on MergeRelayGame {
  _MergeRelayRestoredSave _parseEnvelope(SaveEnvelope envelope) {
    if (envelope.schemaVersion != 1) {
      throw const FormatException('Unsupported merge save schema');
    }
    final payload = envelope.payload;
    if (payload['session_map_version'] != null) {
      return _parseSessionMap(payload);
    }
    return _parseLegacyPayload(payload);
  }

  _MergeRelayRestoredSave _parseSessionMap(Map<String, Object?> payload) {
    final version = payload['session_map_version'];
    if (version != _mergeRelaySessionMapVersion &&
        version != _mergeRelayLegacySessionMapVersion) {
      throw const FormatException('Unsupported merge session map');
    }
    final rawSessions = payload['sessions'];
    final rawProfile = payload['profile'];
    final active = payload['active_session_key'];
    if (rawSessions is! Map ||
        rawProfile is! Map ||
        (active != null && active is! String)) {
      throw const FormatException('Invalid merge session map');
    }
    final sessions = <String, _MergeRelaySession>{};
    for (final entry in rawSessions.entries) {
      if (entry.key is! String || entry.value is! Map) {
        throw const FormatException('Invalid merge session');
      }
      final key = entry.key as String;
      sessions[key] = _parseSession(key, _object(entry.value));
    }
    final activeKey = active as String?;
    if (activeKey != null && !sessions.containsKey(activeKey)) {
      throw const FormatException('Missing active merge session');
    }
    return _MergeRelayRestoredSave(
      sessions: sessions,
      activeSessionKey: activeKey,
      profile: _parseProfile(_object(rawProfile)),
      legacyOffer: sessions.values.any(
        (session) =>
            session.mode == MergeRelayMode.rescue &&
            session.result == null &&
            !session.hasFrozenGoal,
      ),
    );
  }

  _MergeRelayRestoredSave _parseLegacyPayload(Map<String, Object?> payload) {
    final wrapped = payload['game'] is Map;
    final gamePayload = wrapped ? _object(payload['game']) : payload;
    final state = MergeGameState.fromLegacyJson(gamePayload);
    final modeName = wrapped ? payload['mode'] : null;
    final mode = wrapped ? _parseMode(modeName) : MergeRelayMode.endless;
    final rescueId = wrapped ? _optionalString(payload['rescue_id']) : null;
    final dailyDate = wrapped ? _optionalString(payload['daily_date']) : null;
    final session = _MergeRelaySession(
      mode: mode,
      state: state,
      rescueId: rescueId,
      dailyDate: dailyDate,
      rescueMovesUsed: mode == MergeRelayMode.rescue
          ? state.moveCount.clamp(0, 3).toInt()
          : 0,
      paused: wrapped && payload['paused'] == true,
      result: wrapped ? _parseResult(payload['result']) : null,
      contentVersion: null,
      goalRevision: null,
      objective: null,
      targetScore: null,
      ruleConfig: const MergeRuleConfig.legacy(),
      moveBudget: mergeRelayDefaultRescueMoveBudget,
    );
    final key = _mergeRelaySessionKey(
      mode: mode,
      rescueId: rescueId,
      dailyDate: dailyDate,
    );
    return _MergeRelayRestoredSave(
      sessions: {key: session},
      activeSessionKey: key,
      profile: wrapped
          ? _parseProfile(payload)
          : const _MergeRelayProfile(
              tutorialComplete: false,
              preferences: MergeRelayPreferences(),
              completedRescueIds: {},
            ),
      legacyOffer:
          !wrapped ||
          mode == MergeRelayMode.rescue &&
              session.result == null &&
              !session.hasFrozenGoal,
    );
  }

  _MergeRelaySession _parseSession(String key, Map<String, Object?> payload) {
    final mode = _parseMode(payload['mode']);
    final rawGame = payload['game'];
    if (rawGame is! Map) throw const FormatException('Invalid merge game');
    final state = MergeGameState.fromWireJson(_object(rawGame));
    final rescueId = _optionalString(payload['rescue_id']);
    final dailyDate = _optionalString(payload['daily_date']);
    final expectedKey = _mergeRelaySessionKey(
      mode: mode,
      rescueId: rescueId,
      dailyDate: dailyDate,
    );
    if (key != expectedKey) throw const FormatException('Invalid merge key');
    final result = _parseResult(payload['result']);
    final rawMoveBudget = payload['move_budget'];
    if (rawMoveBudget != null &&
        (rawMoveBudget is! int ||
            rawMoveBudget < 1 ||
            rawMoveBudget > mergeRelayMaxRescueMoveBudget)) {
      throw const FormatException('Invalid rescue move budget');
    }
    final resolvedMoveBudget =
        rawMoveBudget as int? ?? mergeRelayDefaultRescueMoveBudget;
    final rawRescueMovesUsed = payload['rescue_moves_used'];
    if (rawRescueMovesUsed != null &&
        (rawRescueMovesUsed is! int ||
            rawRescueMovesUsed < 0 ||
            rawRescueMovesUsed > resolvedMoveBudget)) {
      throw const FormatException('Invalid rescue move budget');
    }
    final rescueMovesUsed =
        rawRescueMovesUsed as int? ??
        (mode == MergeRelayMode.rescue
            ? state.moveCount.clamp(0, resolvedMoveBudget).toInt()
            : 0);
    if (result != null &&
        (result.mode != mode || result.rescueId != rescueId)) {
      throw const FormatException('Merge result does not match session');
    }
    final paused = payload['paused'];
    if (paused != null && paused is! bool) {
      throw const FormatException('Invalid merge pause state');
    }
    final targetScore = payload['target_score'];
    if (targetScore != null && targetScore is! int) {
      throw const FormatException('Invalid frozen rescue target');
    }
    final resolvedTarget = targetScore as int?;
    final objective = _optionalString(payload['objective']);
    final contentVersion = _optionalString(payload['content_version']);
    final goalRevision = _optionalString(payload['goal_revision']);
    final rawConfig = payload['rule_config'];
    final ruleConfig = rawConfig == null ? null : _parseRuleConfig(rawConfig);
    final hasGoalMetadata =
        contentVersion != null ||
        goalRevision != null ||
        objective != null ||
        targetScore != null ||
        rawConfig != null;
    if (mode == MergeRelayMode.rescue && hasGoalMetadata) {
      if (contentVersion == null ||
          contentVersion.isEmpty ||
          goalRevision == null ||
          goalRevision.isEmpty ||
          objective == null ||
          objective.isEmpty ||
          resolvedTarget == null ||
          ruleConfig == null) {
        throw const FormatException('Incomplete frozen rescue goal');
      }
      if (resolvedTarget <= 0 || resolvedTarget > maxMergeScore) {
        throw const FormatException('Invalid frozen rescue target');
      }
      final frozenRules = MergeRules(config: ruleConfig);
      if (result == null &&
          resolvedTarget > state.score &&
          !validateMergeRelayGoal(
            state: state,
            targetScore: resolvedTarget,
            rules: frozenRules,
            maxMoves: resolvedMoveBudget,
          ).reachable) {
        throw const FormatException('Frozen rescue target is not reachable');
      }
      if (result != null) {
        final reached = result.score >= resolvedTarget;
        if (result.outcome == MergeRelayOutcome.completed && !reached ||
            result.outcome == MergeRelayOutcome.missed && reached) {
          throw const FormatException('Frozen rescue result bypasses target');
        }
      }
    }
    return _MergeRelaySession(
      mode: mode,
      state: state,
      rescueId: rescueId,
      dailyDate: dailyDate,
      rescueMovesUsed: rescueMovesUsed,
      paused: paused == true,
      result: result,
      contentVersion: contentVersion,
      goalRevision: goalRevision,
      objective: objective,
      targetScore: resolvedTarget,
      ruleConfig: ruleConfig ?? const MergeRuleConfig.legacy(),
      moveBudget: resolvedMoveBudget,
    );
  }

  MergeRuleConfig _parseRuleConfig(Object raw) {
    if (raw is! Map) throw const FormatException('Invalid frozen rule config');
    try {
      return MergeRuleConfig.fromJson(
        raw.map<String, Object?>((key, value) {
          if (key is! String) throw const FormatException('Invalid rule key');
          return MapEntry(key, value);
        }),
      );
    } on Object {
      throw const FormatException('Invalid frozen rule config');
    }
  }

  _MergeRelayProfile _parseProfile(Map<String, Object?> payload) {
    final version = payload['tutorial_version'];
    if (version is! int || version < 0 || version > mergeRelayTutorialVersion) {
      throw const FormatException('Invalid merge tutorial version');
    }
    final completed = payload['completed_rescue_ids'];
    if (completed != null &&
        (completed is! List || completed.any((value) => value is! String))) {
      throw const FormatException('Invalid completed rescue list');
    }
    final completedIds = completed == null
        ? <String>[]
        : (completed as List).cast<String>();
    return _MergeRelayProfile(
      tutorialComplete: version == mergeRelayTutorialVersion,
      preferences: _preferencesFrom(payload),
      completedRescueIds: Set.unmodifiable(completedIds),
    );
  }

  MergeRelayMode _parseMode(Object? value) {
    if (value is! String ||
        !MergeRelayMode.values.any((mode) => mode.name == value)) {
      throw const FormatException('Invalid Merge mode');
    }
    return MergeRelayModePresentation.fromName(value);
  }

  MergeRelayResult? _parseResult(Object? value) {
    if (value == null) return null;
    if (value is! Map) throw const FormatException('Invalid Merge result');
    return MergeRelayResult.fromJson(_object(value));
  }

  String? _optionalString(Object? value) {
    if (value != null && value is! String) {
      throw const FormatException('Invalid merge text field');
    }
    return value as String?;
  }

  MergeRelayPreferences _preferencesFrom(Map<String, Object?> payload) {
    final theme = payload['theme_id'];
    final reduced = payload['reduced_motion'];
    final audio = payload['audio_enabled'];
    final haptics = payload['haptics_enabled'];
    final accessible = payload['accessible_controls'];
    if ((theme != null && theme is! String) ||
        (reduced != null && reduced is! bool) ||
        (audio != null && audio is! bool) ||
        (haptics != null && haptics is! bool) ||
        (accessible != null && accessible is! bool)) {
      throw const FormatException('Invalid merge preferences');
    }
    return MergeRelayPreferences(
      themeId: theme as String? ?? 'signal',
      reducedMotion: reduced == true,
      audioEnabled: audio != false,
      hapticsEnabled: haptics != false,
      accessibleControls: accessible == true,
    );
  }

  static Map<String, Object?> _object(Object? value) {
    if (value is! Map) throw const FormatException('Invalid saved game');
    return value.map<String, Object?>(
      (key, value) => MapEntry(key.toString(), value),
    );
  }
}
