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

import '../app.dart' show ludoIdentity;
import '../state/ludo_settings_store.dart';
import '../state/ludo_sound_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../telemetry/ludo_telemetry.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_panel.dart';
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
      body: LudoBackground(
        child: SafeArea(
          child: AnimatedBuilder(
            animation: Listenable.merge([
              widget.soundSettings,
              widget.reducedMotion,
            ]),
            builder: (context, _) {
              // A `LayoutBuilder` + `ConstrainedBox(minHeight)` +
              // `IntrinsicHeight` + `Spacer` wrapper rather than a bare
              // `ListView`: on a tall phone the two content panels above
              // don't reach anywhere near the bottom of the screen on
              // their own, which used to leave roughly the bottom half of
              // the viewport as bare, contentless background. The footer
              // panel is now always pinned to the bottom of the viewport
              // (or scrolls below the content on a short viewport where
              // everything doesn't fit), so no large empty region remains.
              return LayoutBuilder(
                builder: (context, constraints) {
                  return SingleChildScrollView(
                    padding: const EdgeInsets.all(LudoThemeTokens.spaceMd),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minHeight:
                            constraints.maxHeight - 2 * LudoThemeTokens.spaceMd,
                      ),
                      child: IntrinsicHeight(
                        child: Column(
                          children: [
                            _settingsContent(context),
                            const Spacer(),
                            const _AboutPanel(),
                            const Spacer(),
                            const SizedBox(height: LudoThemeTokens.spaceMd),
                            const _SettingsFooter(),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _settingsContent(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        LudoPanel(
          padding: EdgeInsets.zero,
          child: Column(
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
            ],
          ),
        ),
        const SizedBox(height: LudoThemeTokens.spaceMd),
        LudoPanel(
          padding: EdgeInsets.zero,
          child: Semantics(
            button: true,
            label: 'How to play',
            excludeSemantics: true,
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: _minTapTarget),
              child: ListTile(
                key: const Key('settings-how-to-play-link'),
                leading: const Icon(
                  Icons.menu_book_outlined,
                  color: LudoThemeTokens.gold,
                ),
                title: const Text('How to play'),
                trailing: const Icon(
                  Icons.chevron_right,
                  color: LudoThemeTokens.gold,
                ),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const HowToPlayScreen(),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// A short attribution/version footer pinned to the bottom of the
/// settings screen, using the same panel chrome as the content above it
/// rather than leaving bare background below the last content row.
class _SettingsFooter extends StatelessWidget {
  const _SettingsFooter();

  @override
  Widget build(BuildContext context) {
    return LudoPanel(
      padding: const EdgeInsets.symmetric(
        horizontal: LudoThemeTokens.spaceMd,
        vertical: LudoThemeTokens.spaceSm,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.casino_outlined,
            size: 18,
            color: LudoThemeTokens.gold.withValues(alpha: 0.8),
          ),
          const SizedBox(width: LudoThemeTokens.spaceSm),
          Text(
            'Made with dice and dedication',
            style: LudoTextStyles.caption,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// A small "about" panel (app name + version) shown between the toggle
/// group and the footer, giving the middle of a tall settings screen real
/// content rather than leaving it as bare background.
class _AboutPanel extends StatelessWidget {
  const _AboutPanel();

  @override
  Widget build(BuildContext context) {
    return LudoPanel(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.casino,
            size: 36,
            color: LudoThemeTokens.gold.withValues(alpha: 0.85),
          ),
          const SizedBox(height: LudoThemeTokens.spaceSm),
          Text(ludoIdentity.publicTitle, style: LudoTextStyles.displaySmall),
          const SizedBox(height: 4),
          Text('Version 0.1.0', style: LudoTextStyles.caption),
        ],
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
