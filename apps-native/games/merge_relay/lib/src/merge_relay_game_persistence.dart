part of 'merge_relay_game.dart';

extension MergeRelayGamePersistence on MergeRelayGame {
  Future<void> restore() async {
    try {
      final envelope = await saveStore.read(context);
      if (_disposed) return;
      if (envelope != null) _restoreEnvelope(envelope);
      restoreFailed.value = false;
    } catch (_) {
      if (!_disposed) {
        restoreFailed.value = true;
        persistenceMessage.value =
            "Couldn't restore that board. Retry before starting a new run.";
      }
    } finally {
      if (!_disposed) {
        hydrated.value = true;
        unawaited(initializePlayGames());
      }
    }
  }

  Future<void> retryRestore() async {
    if (_disposed || !hydrated.value || !restoreFailed.value) return;
    hydrated.value = false;
    persistenceMessage.value = null;
    await restore();
  }

  void _restoreEnvelope(SaveEnvelope envelope) {
    final restored = _parseEnvelope(envelope);
    if (_disposed) return;
    _sessions
      ..clear()
      ..addAll(restored.sessions);
    _activeSessionKey = restored.activeSessionKey;
    tutorialComplete.value = restored.profile.tutorialComplete;
    preferences.value = restored.profile.preferences;
    completedRescueIds.value = Set.unmodifiable(
      restored.profile.completedRescueIds,
    );
    legacyOffer.value = restored.legacyOffer;
    hasSavedSession.value = restored.sessions.isNotEmpty;
    _rescueMovesUsed = 0;
    final active = restored.activeSessionKey == null
        ? null
        : restored.sessions[restored.activeSessionKey];
    if (active != null) {
      _activateSessionMetadata(active);
      state.value = active.state;
      mode.value = active.mode;
      rescueId.value = active.rescueId;
      _dailyDate = active.dailyDate;
      _rescueMovesUsed = active.rescueMovesUsed;
      isPaused.value = active.paused;
      result.value = active.result;
      roundComplete.value = active.result != null;
    }
    if (roundComplete.value) route.value = MergeRelayRoute.home;
  }

  void _queueWrite() {
    if (_disposed || !hydrated.value || restoreFailed.value) return;
    final revision = ++_writeRevision;
    final envelope = _snapshot();
    _writeTail = _writeTail.catchError((_) {}).then((_) async {
      try {
        await saveStore.write(context, envelope);
        if (_disposed) return;
        hasSavedSession.value =
            _activeSessionKey != null || _sessions.isNotEmpty;
        if (revision == _writeRevision) persistenceMessage.value = null;
      } catch (_) {
        if (!_disposed && revision == _writeRevision) {
          persistenceMessage.value = "Couldn't save your run.";
        }
      }
    });
  }

  SaveEnvelope _snapshot() {
    final sessions = <String, Object?>{
      for (final entry in _sessions.entries) entry.key: entry.value.toJson(),
    };
    if (_activeSessionKey != null && hasSavedSession.value) {
      sessions[_activeSessionKey!] = _currentSession().toJson();
    }
    final profile = _MergeRelayProfile(
      tutorialComplete: tutorialComplete.value,
      preferences: preferences.value,
      completedRescueIds: completedRescueIds.value,
    );
    return SaveEnvelope.create(
      context: context,
      schemaVersion: 1,
      savedAt: clock.now(),
      payload: {
        'session_map_version': _mergeRelaySessionMapVersion,
        'active_session_key': _activeSessionKey,
        'sessions': sessions,
        'profile': profile.toJson(),
      },
    );
  }

  Future<void> flushWrites() => _writeTail;
}

String _mergeRelaySessionKey({
  required MergeRelayMode mode,
  required String? rescueId,
  required String? dailyDate,
}) => switch (mode) {
  MergeRelayMode.rescue => 'rescue:${rescueId ?? 'default'}',
  MergeRelayMode.daily => 'daily:${dailyDate ?? 'unknown'}',
  MergeRelayMode.endless => 'endless',
};
