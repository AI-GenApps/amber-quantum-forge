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
import '../telemetry/ludo_telemetry.dart';
import 'settings_screen.dart';

const _minTapTarget = 48.0;

/// Shows the pause/quit dialog. Returns once the dialog is dismissed
/// (Resume, Quit, or barrier tap).
Future<void> showPauseQuitDialog(
  BuildContext context, {
  required LudoSoundSettings soundSettings,
  required VoidCallback onQuit,
  ReducedMotionSetting? reducedMotion,
  LudoSettingsStore? settingsStore,
  LudoTelemetry? telemetry,
}) {
  return showDialog<void>(
    context: context,
    builder: (_) => PauseQuitDialog(
      soundSettings: soundSettings,
      reducedMotion: reducedMotion,
      settingsStore: settingsStore,
      telemetry: telemetry,
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
    this.telemetry,
  });

  final LudoSoundSettings soundSettings;

  /// The shared reduced-motion instance opened onto [SettingsScreen]. A
  /// dialog with no Settings action available (e.g. a caller not yet
  /// wired for it) leaves this `null`.
  final ReducedMotionSetting? reducedMotion;

  /// Forwarded to [SettingsScreen]'s persistence.
  final LudoSettingsStore? settingsStore;

  /// Test seam: the telemetry sink `ludo_settings_changed` records
  /// through, both for this dialog's own toggles and (forwarded) for
  /// [SettingsScreen]'s. `null` (the default) resolves a fresh production
  /// [LudoTelemetry].
  final LudoTelemetry? telemetry;

  /// Invoked exactly once when Quit is tapped, after the dialog closes
  /// itself. The caller decides what quitting actually does (end a local
  /// match with no penalty, forfeit an online one, etc.).
  final VoidCallback onQuit;

  @override
  Widget build(BuildContext context) {
    final telemetryRecorder = telemetry ?? LudoTelemetry();
    return AlertDialog(
      title: const Text('Paused'),
      content: AnimatedBuilder(
        animation: soundSettings,
        builder: (context, _) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _PauseDialogSwitch(
                keyValue: 'pause-dialog-sound-switch',
                label: 'Sound',
                value: soundSettings.soundEnabled,
                onChanged: (value) {
                  soundSettings.soundEnabled = value;
                  telemetryRecorder.settingsChanged(toggle: 'sound');
                },
              ),
              _PauseDialogSwitch(
                keyValue: 'pause-dialog-music-switch',
                label: 'Music',
                value: soundSettings.musicEnabled,
                onChanged: (value) {
                  soundSettings.musicEnabled = value;
                  telemetryRecorder.settingsChanged(toggle: 'music');
                },
              ),
              _PauseDialogSwitch(
                keyValue: 'pause-dialog-vibration-switch',
                label: 'Vibration',
                value: soundSettings.vibrationEnabled,
                onChanged: (value) {
                  soundSettings.vibrationEnabled = value;
                  telemetryRecorder.settingsChanged(toggle: 'vibration');
                },
              ),
            ],
          );
        },
      ),
      actions: [
        if (reducedMotion != null)
          Semantics(
            button: true,
            label: 'Settings',
            excludeSemantics: true,
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: _minTapTarget),
              child: TextButton(
                key: const Key('pause-dialog-settings-button'),
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => SettingsScreen(
                      soundSettings: soundSettings,
                      reducedMotion: reducedMotion!,
                      store: settingsStore,
                      telemetry: telemetry,
                    ),
                  ),
                ),
                child: const Text('Settings'),
              ),
            ),
          ),
        Semantics(
          button: true,
          label: 'Resume',
          excludeSemantics: true,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: _minTapTarget),
            child: TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Resume'),
            ),
          ),
        ),
        Semantics(
          button: true,
          label: 'Quit',
          excludeSemantics: true,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: _minTapTarget),
            child: FilledButton(
              onPressed: () {
                Navigator.of(context).pop();
                onQuit();
              },
              child: const Text('Quit'),
            ),
          ),
        ),
      ],
    );
  }
}

/// One toggle row in [PauseQuitDialog], carrying its own [Semantics] label
/// and a 48dp+ minimum tap target — task 09 shipped this dialog's
/// `SwitchListTile`s without either (see this task's Context/Decisions).
class _PauseDialogSwitch extends StatelessWidget {
  const _PauseDialogSwitch({
    required this.keyValue,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String keyValue;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      toggled: value,
      label: label,
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _minTapTarget),
        child: SwitchListTile(
          key: Key(keyValue),
          title: Text(label),
          value: value,
          onChanged: onChanged,
        ),
      ),
    );
  }
}
