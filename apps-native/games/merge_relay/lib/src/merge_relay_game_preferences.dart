part of 'merge_relay_game.dart';

extension MergeRelayGamePreferences on MergeRelayGame {
  void selectTheme(String themeId) =>
      _updatePreferences(preferences.value.copyWith(themeId: themeId));

  void setReducedMotion(bool value) =>
      _updatePreferences(preferences.value.copyWith(reducedMotion: value));

  void setAudioEnabled(bool value) =>
      _updatePreferences(preferences.value.copyWith(audioEnabled: value));

  void setHapticsEnabled(bool value) =>
      _updatePreferences(preferences.value.copyWith(hapticsEnabled: value));

  void setAccessibleControls(bool value) =>
      _updatePreferences(preferences.value.copyWith(accessibleControls: value));

  void _updatePreferences(MergeRelayPreferences next) {
    if (!_readyForAction) return;
    preferences.value = next;
    _queueWrite();
  }
}
