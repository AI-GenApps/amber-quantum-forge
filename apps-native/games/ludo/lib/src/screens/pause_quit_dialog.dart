/// The pause/quit dialog (task 09): sound/music/vibration toggles bound to
/// task 06's [LudoSoundSettings], a Resume action, and a Quit action.
///
/// Quitting a local match ends it immediately with no penalty; quitting an
/// online match's forfeit semantics are task 25's concern. This dialog
/// exposes a single [onQuit] callback the caller supplies — it never
/// hardcodes forfeit logic itself.
library;

import 'package:flutter/material.dart';

import '../state/ludo_sound_settings.dart';

/// Shows the pause/quit dialog. Returns once the dialog is dismissed
/// (Resume, Quit, or barrier tap).
Future<void> showPauseQuitDialog(
  BuildContext context, {
  required LudoSoundSettings soundSettings,
  required VoidCallback onQuit,
}) {
  return showDialog<void>(
    context: context,
    builder: (_) =>
        PauseQuitDialog(soundSettings: soundSettings, onQuit: onQuit),
  );
}

/// The pause/quit dialog widget itself.
class PauseQuitDialog extends StatelessWidget {
  const PauseQuitDialog({
    super.key,
    required this.soundSettings,
    required this.onQuit,
  });

  final LudoSoundSettings soundSettings;

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
