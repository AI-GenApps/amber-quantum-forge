part of 'snapquest_app.dart';

extension on _SnapQuestHomeState {
  SnapQuestState _stateFromPayload(JsonObject payload) {
    if (payload['catalog_version'] != _rules.catalog.version) {
      throw const FormatException('Unsupported SnapQuest catalog');
    }
    final completed = _stringSet(payload['completed_quest_keys']);
    final rewards = _stringSet(payload['claimed_reward_ids']);
    final questsByKey = {
      for (final quest in _rules.catalog.quests)
        '${quest.id}:${quest.version}': quest,
    };
    if (!completed.every(questsByKey.containsKey)) {
      throw const FormatException('Unknown SnapQuest quest key');
    }
    final expectedRewards = {
      for (final key in completed) questsByKey[key]!.rewardId,
    };
    if (rewards.length != expectedRewards.length ||
        !rewards.every(expectedRewards.contains)) {
      throw const FormatException('Inconsistent SnapQuest rewards');
    }
    final rawAlbum = payload['album'];
    if (rawAlbum is! List ||
        rawAlbum.length > _rules.catalog.quests.length ||
        rawAlbum.length != completed.length) {
      throw const FormatException('Invalid SnapQuest album');
    }
    final album = <String, AlbumEntry>{};
    for (final raw in rawAlbum) {
      if (raw is! Map) throw const FormatException('Invalid SnapQuest entry');
      final map = raw.cast<String, Object?>();
      final creatureId = map['creature_id'];
      final questKey = map['quest_key'];
      final descriptorId = map['descriptor_id'];
      if (creatureId is! String ||
          questKey is! String ||
          descriptorId is! String ||
          !_rules.catalog.creatureIds.contains(creatureId) ||
          !questsByKey.containsKey(questKey) ||
          !_rules.catalog.descriptorIds.contains(descriptorId)) {
        throw const FormatException('Invalid SnapQuest album entry');
      }
      final quest = questsByKey[questKey]!;
      if (album.containsKey(creatureId) ||
          !completed.contains(questKey) ||
          quest.creatureId != creatureId ||
          quest.descriptorId != descriptorId) {
        throw const FormatException('Inconsistent SnapQuest album entry');
      }
      album[creatureId] = AlbumEntry(
        creatureId: creatureId,
        questKey: questKey,
        descriptorId: descriptorId,
      );
    }
    if (album.length != completed.length) {
      throw const FormatException('Incomplete SnapQuest album');
    }
    return SnapQuestState(
      completedQuestKeys: completed,
      claimedRewardIds: rewards,
      album: album,
    );
  }

  Set<String> _stringSet(Object? value) {
    if (value is! List || value.any((item) => item is! String)) {
      throw const FormatException('Invalid SnapQuest string set');
    }
    final values = value.cast<String>();
    final result = values.toSet();
    if (result.length != values.length) {
      throw const FormatException('Duplicate SnapQuest state value');
    }
    return result;
  }

  Future<void> _persist() async {
    final envelope = SaveEnvelope.create(
      context: _appContext,
      schemaVersion: 1,
      savedAt: DateTime.now().toUtc(),
      payload: {
        'catalog_version': _rules.catalog.version,
        'completed_quest_keys': _state.completedQuestKeys.toList()..sort(),
        'claimed_reward_ids': _state.claimedRewardIds.toList()..sort(),
        'album': [
          for (final entry in _state.album.values)
            {
              'creature_id': entry.creatureId,
              'quest_key': entry.questKey,
              'descriptor_id': entry.descriptorId,
            },
        ],
      },
    );
    try {
      await _saveStore.write(_appContext, envelope);
    } catch (_) {
      if (mounted) _update(() => _message = 'Progress could not be saved.');
    }
  }
}
