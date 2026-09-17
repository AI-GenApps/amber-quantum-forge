import 'capture_capability.dart';
import 'snapquest_model.dart';

class SnapQuestRules {
  const SnapQuestRules(this.catalog);

  final QuestCatalog catalog;

  RecognitionObservation deskObservation({
    required String questId,
    required String descriptorId,
    required DateTime observedAt,
  }) {
    final quest = catalog.findQuest(questId);
    return RecognitionObservation(
      status: quest != null && quest.descriptorId == descriptorId
          ? CaptureStatus.accepted
          : CaptureStatus.failed,
      mode: CaptureMode.desk,
      questId: questId,
      questVersion: quest?.version ?? 0,
      descriptorId: descriptorId,
      quality: 1,
      observedAt: observedAt.toUtc(),
    );
  }

  QuestActionResult complete({
    required SnapQuestState state,
    required RecognitionObservation observation,
  }) {
    final quest = catalog.findQuest(observation.questId);
    if (quest == null) {
      return _reject(state, 'unknown_quest');
    }
    if (!observation.accepted) {
      return _reject(state, 'capture_not_accepted');
    }
    if (observation.questVersion != quest.version) {
      return _reject(state, 'quest_version_mismatch');
    }
    if (observation.descriptorId != quest.descriptorId ||
        !catalog.descriptorIds.contains(observation.descriptorId)) {
      return _reject(state, 'descriptor_not_target');
    }
    if (!observation.quality.isFinite ||
        observation.quality < 0 ||
        observation.quality > 1) {
      return _reject(state, 'invalid_quality');
    }
    if (observation.quality < quest.minimumQuality) {
      return _reject(state, 'quality_below_threshold');
    }
    final questKey = quest.id + ':' + quest.version.toString();
    if (state.completedQuestKeys.contains(questKey)) {
      return _reject(state, 'already_completed');
    }
    final completed = {...state.completedQuestKeys, questKey};
    final rewards = {...state.claimedRewardIds, quest.rewardId};
    final album = {
      ...state.album,
      quest.creatureId: AlbumEntry(
        creatureId: quest.creatureId,
        questKey: questKey,
        descriptorId: quest.descriptorId,
      ),
    };
    return QuestActionResult(
      state: state.copyWith(
        completedQuestKeys: completed,
        claimedRewardIds: rewards,
        album: album,
      ),
      changed: true,
    );
  }

  QuestActionResult _reject(SnapQuestState state, String code) =>
      QuestActionResult(state: state, changed: false, errorCode: code);
}
