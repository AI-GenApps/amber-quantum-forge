import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';

void main() {
  group('LudoSoundSettings', () {
    test('defaults to sound, music and vibration all enabled', () {
      final settings = LudoSoundSettings();
      expect(settings.soundEnabled, isTrue);
      expect(settings.musicEnabled, isTrue);
      expect(settings.vibrationEnabled, isTrue);
    });

    test('constructor accepts explicit initial values', () {
      final settings = LudoSoundSettings(
        soundEnabled: false,
        musicEnabled: false,
        vibrationEnabled: false,
      );
      expect(settings.soundEnabled, isFalse);
      expect(settings.musicEnabled, isFalse);
      expect(settings.vibrationEnabled, isFalse);
    });

    test('each toggle setter notifies listeners exactly once per change', () {
      final settings = LudoSoundSettings();
      var notifications = 0;
      settings.addListener(() => notifications++);

      settings.soundEnabled = false;
      settings.musicEnabled = false;
      settings.vibrationEnabled = false;

      expect(notifications, 3);
      expect(settings.soundEnabled, isFalse);
      expect(settings.musicEnabled, isFalse);
      expect(settings.vibrationEnabled, isFalse);
    });

    test('setting a toggle to its current value does not notify', () {
      final settings = LudoSoundSettings();
      var notifications = 0;
      settings.addListener(() => notifications++);

      settings.soundEnabled = true;
      settings.musicEnabled = true;
      settings.vibrationEnabled = true;

      expect(notifications, 0);
    });
  });
}
