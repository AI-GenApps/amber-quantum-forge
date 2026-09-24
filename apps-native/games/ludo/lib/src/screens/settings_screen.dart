/// The settings screen (task 10): sound/music/vibration toggles plus
/// reduced motion, a link to the how-to-play screen.
///
/// Binds to the *same* [LudoSoundSettings] instance the pause/quit dialog
/// (task 09) uses — callers must pass one shared instance to both rather
/// than constructing two — and to task 04's [ReducedMotionSetting]. Every
/// toggle change is persisted through an optional [LudoSettingsStore]
/// (`null` in tests that don't care about persistence), reusing task 07's
/// `platform_core` save mechanism rather than introducing a second one.
library;

import 'package:flutter/material.dart';

import '../state/ludo_settings_store.dart';
import '../state/ludo_sound_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../telemetry/ludo_telemetry.dart';
import 'how_to_play_screen.dart';

const _minTapTarget = 48.0;

/// The settings screen widget.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({
    super.key,
    required this.soundSettings,
    required this.reducedMotion,
    this.store,
    this.telemetry,
  });

  /// The shared sound/music/vibration toggle state — must be the same
  /// instance the pause/quit dialog was constructed with, so a change made
  /// in either place is reflected in the other within the same session.
  final LudoSoundSettings soundSettings;

  /// The shared reduced-motion toggle state, read by tasks 04/05's
  /// animated components.
  final ReducedMotionSetting reducedMotion;

  /// Persists every toggle change. `null` (the default) disables
  /// persistence, e.g. in widget tests that don't supply a store.
  final LudoSettingsStore? store;

  /// Test seam: the telemetry sink `ludo_settings_changed` records
  /// through. `null` (the default) resolves a fresh production
  /// [LudoTelemetry].
  final LudoTelemetry? telemetry;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final LudoTelemetry _telemetry = widget.telemetry ?? LudoTelemetry();

  void _persist(String toggle) {
    widget.store?.save(widget.soundSettings, widget.reducedMotion);
    _telemetry.settingsChanged(toggle: toggle);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: SafeArea(
        child: AnimatedBuilder(
          animation: Listenable.merge([
            widget.soundSettings,
            widget.reducedMotion,
          ]),
          builder: (context, _) {
            return ListView(
              children: [
                _SettingsSwitch(
                  keyValue: 'settings-sound-switch',
                  label: 'Sound',
                  value: widget.soundSettings.soundEnabled,
                  onChanged: (value) {
                    widget.soundSettings.soundEnabled = value;
                    _persist('sound');
                  },
                ),
                _SettingsSwitch(
                  keyValue: 'settings-music-switch',
                  label: 'Music',
                  value: widget.soundSettings.musicEnabled,
                  onChanged: (value) {
                    widget.soundSettings.musicEnabled = value;
                    _persist('music');
                  },
                ),
                _SettingsSwitch(
                  keyValue: 'settings-vibration-switch',
                  label: 'Vibration',
                  value: widget.soundSettings.vibrationEnabled,
                  onChanged: (value) {
                    widget.soundSettings.vibrationEnabled = value;
                    _persist('vibration');
                  },
                ),
                _SettingsSwitch(
                  keyValue: 'settings-reduced-motion-switch',
                  label: 'Reduce motion',
                  subtitle: 'Skip token/dice/particle animations',
                  value: widget.reducedMotion.value,
                  onChanged: (value) {
                    widget.reducedMotion.value = value;
                    _persist('reduced_motion');
                  },
                ),
                const Divider(),
                Semantics(
                  button: true,
                  label: 'How to play',
                  excludeSemantics: true,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(minHeight: _minTapTarget),
                    child: ListTile(
                      key: const Key('settings-how-to-play-link'),
                      leading: const Icon(Icons.menu_book_outlined),
                      title: const Text('How to play'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const HowToPlayScreen(),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _SettingsSwitch extends StatelessWidget {
  const _SettingsSwitch({
    required this.keyValue,
    required this.label,
    required this.value,
    required this.onChanged,
    this.subtitle,
  });

  final String keyValue;
  final String label;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      toggled: value,
      label: subtitle == null ? label : '$label: $subtitle',
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _minTapTarget),
        child: SwitchListTile(
          key: Key(keyValue),
          title: Text(label),
          subtitle: subtitle == null ? null : Text(subtitle!),
          value: value,
          onChanged: onChanged,
        ),
      ),
    );
  }
}
