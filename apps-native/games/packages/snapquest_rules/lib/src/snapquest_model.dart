class QuestDefinition {
  const QuestDefinition({
    required this.id,
    required this.version,
    required this.descriptorId,
    required this.creatureId,
    required this.rewardId,
    this.minimumQuality = 0.6,
  });

  final String id;
  final int version;
  final String descriptorId;
  final String creatureId;
  final String rewardId;
  final double minimumQuality;
}

class QuestCatalog {
  QuestCatalog({
    required this.version,
    required Set<String> descriptorIds,
    required Set<String> creatureIds,
    required List<QuestDefinition> quests,
  }) : descriptorIds = Set.unmodifiable(descriptorIds),
       creatureIds = Set.unmodifiable(creatureIds),
       quests = List.unmodifiable(quests) {
    final questIds = quests.map((quest) => quest.id).toSet();
    if (this.descriptorIds.isEmpty ||
        this.creatureIds.isEmpty ||
        questIds.length != quests.length ||
        quests.any(
          (quest) =>
              quest.version < 1 ||
              !this.descriptorIds.contains(quest.descriptorId) ||
              !this.creatureIds.contains(quest.creatureId) ||
              quest.minimumQuality < 0 ||
              quest.minimumQuality > 1,
        )) {
      throw ArgumentError('invalid_quest_catalog');
    }
  }

  final int version;
  final Set<String> descriptorIds;
  final Set<String> creatureIds;
  final List<QuestDefinition> quests;

  QuestDefinition? findQuest(String id) {
    for (final quest in quests) {
      if (quest.id == id) {
        return quest;
      }
    }
    return null;
  }
}

class AlbumEntry {
  const AlbumEntry({
    required this.creatureId,
    required this.questKey,
    required this.descriptorId,
  });

  final String creatureId;
  final String questKey;
  final String descriptorId;
}

class SnapQuestState {
  const SnapQuestState({
    this.completedQuestKeys = const {},
    this.claimedRewardIds = const {},
    this.album = const {},
  });

  final Set<String> completedQuestKeys;
  final Set<String> claimedRewardIds;
  final Map<String, AlbumEntry> album;

  SnapQuestState copyWith({
    Set<String>? completedQuestKeys,
    Set<String>? claimedRewardIds,
    Map<String, AlbumEntry>? album,
  }) => SnapQuestState(
    completedQuestKeys: Set.unmodifiable(
      completedQuestKeys ?? this.completedQuestKeys,
    ),
    claimedRewardIds: Set.unmodifiable(
      claimedRewardIds ?? this.claimedRewardIds,
    ),
    album: Map.unmodifiable(album ?? this.album),
  );
}

class QuestActionResult {
  const QuestActionResult({
    required this.state,
    required this.changed,
    this.errorCode,
  });

  final SnapQuestState state;
  final bool changed;
  final String? errorCode;

  bool get accepted => errorCode == null;
}
