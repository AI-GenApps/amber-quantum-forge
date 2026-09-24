/// In-memory sound/music/vibration toggles.
///
/// This task (06) only needs these three flags to exist and be observable
/// (so [LudoAudioService]/[LudoHaptics] — see `lib/src/audio/` — and this
/// task's own tests can gate on them); it deliberately does not persist
/// them to disk. Task 10's settings screen is expected to bind UI toggles
/// to this [ChangeNotifier] and add its own persistence (e.g.
/// `shared_preferences`) on top, per this task's Context/Decisions note —
/// adding that dependency here was out of scope.
library;

import 'package:flutter/foundation.dart';

/// Holds the three sound-related toggles a Ludo match reads before playing
/// SFX, looping music, or triggering haptics. All three default to `true`
/// (sound, music and vibration all enabled out of the box).
class LudoSoundSettings extends ChangeNotifier {
  LudoSoundSettings({
    bool soundEnabled = true,
    bool musicEnabled = true,
    bool vibrationEnabled = true,
  }) : _soundEnabled = soundEnabled,
       _musicEnabled = musicEnabled,
       _vibrationEnabled = vibrationEnabled;

  bool _soundEnabled;
  bool _musicEnabled;
  bool _vibrationEnabled;

  /// Whether one-shot SFX ([LudoAudioService.playSfx]) should play.
  bool get soundEnabled => _soundEnabled;

  set soundEnabled(bool value) {
    if (_soundEnabled == value) return;
    _soundEnabled = value;
    notifyListeners();
  }

  /// Whether the looping background track ([LudoAudioService.startMusicLoop])
  /// should play.
  bool get musicEnabled => _musicEnabled;

  set musicEnabled(bool value) {
    if (_musicEnabled == value) return;
    _musicEnabled = value;
    notifyListeners();
  }

  /// Whether [LudoHaptics.trigger] should actually vibrate the device.
  bool get vibrationEnabled => _vibrationEnabled;

  set vibrationEnabled(bool value) {
    if (_vibrationEnabled == value) return;
    _vibrationEnabled = value;
    notifyListeners();
  }
}
