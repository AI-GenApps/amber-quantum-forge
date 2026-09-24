/// The pause/quit dialog (task 09): sound/music/vibration toggles bound to
/// task 06's [LudoSoundSettings], a Resume action, and a Quit action. Task
/// 10 adds a Settings action opening [SettingsScreen] on the *same*
/// [soundSettings]/[reducedMotion] instances this dialog itself reads, so a
/// toggle changed from either place is reflected in the other within the
/// same session.
///
/// Quitting a local match ends it immediately with no penalty; quitting an
/// online match's forfeit semantics are task 25's concern. This dialog
/// exposes a single [onQuit] callback the caller supplies — it never
/// hardcodes forfeit logic itself.
library;

import 'package:flutter/material.dart';

import '../state/ludo_settings_store.dart';
import '../state/ludo_sound_settings.dart';
import '../state/reduced_motion_setting.dart';
import 'settings_screen.dart';

/// Shows the pause/quit dialog. Returns once the dialog is dismissed
/// (Resume, Quit, or barrier tap).
Future<void> showPauseQuitDialog(
  BuildContext context, {
  required LudoSoundSettings soundSettings,
  required VoidCallback onQuit,
  ReducedMotionSetting? reducedMotion,
  LudoSettingsStore? settingsStore,
}) {
  return showDialog<void>(
    context: context,
    builder: (_) => PauseQuitDialog(
      soundSettings: soundSettings,
      reducedMotion: reducedMotion,
      settingsStore: settingsStore,
      onQuit: onQuit,
    ),
  );
}

/// The pause/quit dialog widget itself.
class PauseQuitDialog extends StatelessWidget {
  const PauseQuitDialog({
    super.key,
    required this.soundSettings,
    required this.onQuit,
    this.reducedMotion,
    this.settingsStore,
  });

  final LudoSoundSettings soundSettings;

  /// The shared reduced-motion instance opened onto [SettingsScreen]. A
  /// dialog with no Settings action available (e.g. a caller not yet
  /// wired for it) leaves this `null`.
  final ReducedMotionSetting? reducedMotion;

  /// Forwarded to [SettingsScreen]'s persistence.
  final LudoSettingsStore? settingsStore;

  /// Invoked exactly once when Quit is tapped, after the dialog closes
  /// itself. The caller decides what quitting actually does (end a local
  /// match with no penalty, forfeit an online one, etc.).
  final VoidCallback onQuit;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Paused'),
      content: AnimatedBuilder(
        animation: soundSettings,
        builder: (context, _) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SwitchListTile(
                title: const Text('Sound'),
                value: soundSettings.soundEnabled,
                onChanged: (value) => soundSettings.soundEnabled = value,
              ),
              SwitchListTile(
                title: const Text('Music'),
                value: soundSettings.musicEnabled,
                onChanged: (value) => soundSettings.musicEnabled = value,
              ),
              SwitchListTile(
                title: const Text('Vibration'),
                value: soundSettings.vibrationEnabled,
                onChanged: (value) => soundSettings.vibrationEnabled = value,
              ),
            ],
          );
        },
      ),
      actions: [
        if (reducedMotion != null)
          TextButton(
            key: const Key('pause-dialog-settings-button'),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => SettingsScreen(
                  soundSettings: soundSettings,
                  reducedMotion: reducedMotion!,
                  store: settingsStore,
                ),
              ),
            ),
            child: const Text('Settings'),
          ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Resume'),
        ),
        FilledButton(
          onPressed: () {
            Navigator.of(context).pop();
            onQuit();
          },
          child: const Text('Quit'),
        ),
      ],
    );
  }
}
