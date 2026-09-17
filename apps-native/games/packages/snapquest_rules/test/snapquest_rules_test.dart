import 'package:snapquest_rules/snapquest_rules.dart';
import 'package:test/test.dart';

QuestCatalog catalog() => QuestCatalog(
  version: 3,
  descriptorIds: const {'red', 'blue'},
  creatureIds: const {'emberling', 'azurling'},
  quests: const [
    QuestDefinition(
      id: 'daily-1',
      version: 3,
      descriptorId: 'red',
      creatureId: 'emberling',
      rewardId: 'sticker-ember',
      minimumQuality: 0.7,
    ),
  ],
);

void main() {
  test('desk choice grants one equal reward and album entry', () {
    final rules = SnapQuestRules(catalog());
    final observation = rules.deskObservation(
      questId: 'daily-1',
      descriptorId: 'red',
      observedAt: DateTime.utc(2026, 1, 1),
    );

    final first = rules.complete(
      state: const SnapQuestState(),
      observation: observation,
    );
    expect(first.accepted, isTrue);
    expect(first.state.completedQuestKeys, contains('daily-1:3'));
    expect(first.state.claimedRewardIds, contains('sticker-ember'));
    expect(first.state.album['emberling']?.descriptorId, 'red');

    final duplicate = rules.complete(
      state: first.state,
      observation: observation,
    );
    expect(duplicate.changed, isFalse);
    expect(duplicate.errorCode, 'already_completed');
    expect(duplicate.state.claimedRewardIds.length, 1);
  });

  test('camera denial leaves desk progress available and unchanged', () {
    final rules = SnapQuestRules(catalog());
    final denied = RecognitionObservation(
      status: CaptureStatus.denied,
      mode: CaptureMode.camera,
      questId: 'daily-1',
      questVersion: 3,
      descriptorId: null,
      quality: 0,
      observedAt: nullDate,
    );
    final blocked = rules.complete(
      state: const SnapQuestState(),
      observation: denied,
    );
    expect(blocked.errorCode, 'capture_not_accepted');
    expect(blocked.state.album, isEmpty);

    final desk = rules.deskObservation(
      questId: 'daily-1',
      descriptorId: 'red',
      observedAt: DateTime.utc(2026, 1, 1),
    );
    expect(
      rules.complete(state: blocked.state, observation: desk).accepted,
      isTrue,
    );
  });

  test(
    'bounded recognition rejects wrong descriptor, old version and poor quality',
    () {
      final rules = SnapQuestRules(catalog());
      final wrong = RecognitionObservation(
        status: CaptureStatus.accepted,
        mode: CaptureMode.camera,
        questId: 'daily-1',
        questVersion: 3,
        descriptorId: 'blue',
        quality: 1,
        observedAt: DateTime.utc(2026, 1, 1),
      );
      expect(
        rules
            .complete(state: const SnapQuestState(), observation: wrong)
            .errorCode,
        'descriptor_not_target',
      );

      final old = RecognitionObservation(
        status: CaptureStatus.accepted,
        mode: CaptureMode.camera,
        questId: 'daily-1',
        questVersion: 2,
        descriptorId: 'red',
        quality: 1,
        observedAt: DateTime.utc(2026, 1, 1),
      );
      expect(
        rules
            .complete(state: const SnapQuestState(), observation: old)
            .errorCode,
        'quest_version_mismatch',
      );

      final poor = RecognitionObservation(
        status: CaptureStatus.accepted,
        mode: CaptureMode.camera,
        questId: 'daily-1',
        questVersion: 3,
        descriptorId: 'red',
        quality: 0.1,
        observedAt: DateTime.utc(2026, 1, 1),
      );
      expect(
        rules
            .complete(state: const SnapQuestState(), observation: poor)
            .errorCode,
        'quality_below_threshold',
      );

      for (final quality in [double.nan, double.infinity, -0.1, 1.1]) {
        final invalid = RecognitionObservation(
          status: CaptureStatus.accepted,
          mode: CaptureMode.camera,
          questId: 'daily-1',
          questVersion: 3,
          descriptorId: 'red',
          quality: quality,
          observedAt: DateTime.utc(2026, 1, 1),
        );
        expect(
          rules
              .complete(state: const SnapQuestState(), observation: invalid)
              .errorCode,
          'invalid_quality',
        );
      }
    },
  );
}

final nullDate = DateTime.utc(2026, 1, 1);
