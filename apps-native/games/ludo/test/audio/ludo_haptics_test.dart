import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/audio/ludo_haptics.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';

class _RecordingHapticsChannel implements LudoHapticsChannel {
  final List<String> calls = [];

  @override
  Future<void> lightImpact() async => calls.add('lightImpact()');

  @override
  Future<void> mediumImpact() async => calls.add('mediumImpact()');

  @override
  Future<void> heavyImpact() async => calls.add('heavyImpact()');

  @override
  Future<void> selectionClick() async => calls.add('selectionClick()');
}

void main() {
  group('LudoHaptics', () {
    test('triggers the channel when vibration is enabled', () async {
      final channel = _RecordingHapticsChannel();
      final haptics = LudoHaptics(
        settings: LudoSoundSettings(),
        channel: channel,
      );

      await haptics.trigger(LudoFeedbackEvent.capture);

      expect(channel.calls, ['heavyImpact()']);
    });

    test('disabling vibrationEnabled suppresses every event', () async {
      final channel = _RecordingHapticsChannel();
      final haptics = LudoHaptics(
        settings: LudoSoundSettings(vibrationEnabled: false),
        channel: channel,
      );

      for (final event in LudoFeedbackEvent.values) {
        await haptics.trigger(event);
      }

      expect(channel.calls, isEmpty);
    });

    test('every LudoFeedbackEvent maps to exactly one haptic call', () async {
      for (final event in LudoFeedbackEvent.values) {
        final channel = _RecordingHapticsChannel();
        final haptics = LudoHaptics(
          settings: LudoSoundSettings(),
          channel: channel,
        );

        await haptics.trigger(event);

        expect(
          channel.calls,
          hasLength(1),
          reason: '$event should trigger exactly one haptic pattern',
        );
      }
    });
  });
}
