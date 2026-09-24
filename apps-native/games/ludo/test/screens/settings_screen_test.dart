import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:platform_core/platform_core.dart';

import 'package:ludo/src/screens/how_to_play_screen.dart';
import 'package:ludo/src/screens/pause_quit_dialog.dart';
import 'package:ludo/src/screens/settings_screen.dart';
import 'package:ludo/src/state/ludo_settings_store.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

void main() {
  testWidgets('toggles mutate the shared LudoSoundSettings/ReducedMotion', (
    tester,
  ) async {
    final sound = LudoSoundSettings();
    final reducedMotion = ReducedMotionSetting();
    await tester.pumpWidget(
      _wrap(SettingsScreen(soundSettings: sound, reducedMotion: reducedMotion)),
    );

    await tester.tap(find.byKey(const Key('settings-sound-switch')));
    await tester.pump();
    expect(sound.soundEnabled, isFalse);

    await tester.tap(find.byKey(const Key('settings-music-switch')));
    await tester.pump();
    expect(sound.musicEnabled, isFalse);

    await tester.tap(find.byKey(const Key('settings-vibration-switch')));
    await tester.pump();
    expect(sound.vibrationEnabled, isFalse);

    expect(reducedMotion.value, isFalse);
    await tester.tap(find.byKey(const Key('settings-reduced-motion-switch')));
    await tester.pump();
    expect(reducedMotion.value, isTrue);
  });

  testWidgets(
    'pause dialog and settings screen bound to the same LudoSoundSettings '
    'stay consistent within one session',
    (tester) async {
      final sound = LudoSoundSettings();
      final reducedMotion = ReducedMotionSetting();
      await tester.pumpWidget(
        _wrap(
          Builder(
            builder: (context) => Column(
              children: [
                ElevatedButton(
                  onPressed: () => showPauseQuitDialog(
                    context,
                    soundSettings: sound,
                    reducedMotion: reducedMotion,
                    onQuit: () {},
                  ),
                  child: const Text('open pause'),
                ),
                Expanded(
                  child: SettingsScreen(
                    soundSettings: sound,
                    reducedMotion: reducedMotion,
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      // Change from the settings screen; the pause dialog (constructed
      // fresh on open, bound to the very same `sound` instance) must
      // reflect it immediately.
      await tester.tap(find.byKey(const Key('settings-music-switch')));
      await tester.pump();
      expect(sound.musicEnabled, isFalse);

      await tester.tap(find.text('open pause'));
      await tester.pumpAndSettle();
      final dialogFinder = find.byType(PauseQuitDialog);
      final musicTile = tester.widget<SwitchListTile>(
        find.descendant(
          of: dialogFinder,
          matching: find.widgetWithText(SwitchListTile, 'Music'),
        ),
      );
      expect(musicTile.value, isFalse);

      // Change from the pause dialog; the settings screen underneath (the
      // same `sound` instance) must reflect it once the dialog closes.
      await tester.tap(
        find.descendant(
          of: dialogFinder,
          matching: find.widgetWithText(SwitchListTile, 'Sound'),
        ),
      );
      await tester.pump();
      expect(sound.soundEnabled, isFalse);
      await tester.tap(find.text('Resume'));
      await tester.pumpAndSettle();

      final soundSwitch = tester.widget<SwitchListTile>(
        find.byKey(const Key('settings-sound-switch')),
      );
      expect(soundSwitch.value, isFalse);
    },
  );

  testWidgets('persists every toggle change through the supplied store', (
    tester,
  ) async {
    final sound = LudoSoundSettings();
    final reducedMotion = ReducedMotionSetting();
    final store = LudoSettingsStore(
      saveStore: MemorySaveStore(),
      appContext: runtimeAppContext(identity: ludoSettingsIdentity),
    );

    await tester.pumpWidget(
      _wrap(
        SettingsScreen(
          soundSettings: sound,
          reducedMotion: reducedMotion,
          store: store,
        ),
      ),
    );

    await tester.tap(find.byKey(const Key('settings-sound-switch')));
    await tester.pump();
    await tester.pumpAndSettle();

    final reloadedSound = LudoSoundSettings();
    final reloadedReducedMotion = ReducedMotionSetting();
    await store.load(reloadedSound, reloadedReducedMotion);
    expect(reloadedSound.soundEnabled, isFalse);
  });

  testWidgets('how-to-play link opens HowToPlayScreen', (tester) async {
    await tester.pumpWidget(
      _wrap(
        SettingsScreen(
          soundSettings: LudoSoundSettings(),
          reducedMotion: ReducedMotionSetting(),
        ),
      ),
    );

    expect(find.byType(HowToPlayScreen), findsNothing);
    await tester.tap(find.byKey(const Key('settings-how-to-play-link')));
    await tester.pumpAndSettle();
    expect(find.byType(HowToPlayScreen), findsOneWidget);
  });

  testWidgets(
    'every interactive control has a Semantics label and 48dp+ tap target',
    (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(
          SettingsScreen(
            soundSettings: LudoSoundSettings(),
            reducedMotion: ReducedMotionSetting(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      for (final label in [
        'Sound',
        'Music',
        'Vibration',
        'Reduce motion: Skip token/dice/particle animations',
        'How to play',
      ]) {
        final finder = find.bySemanticsLabel(label);
        expect(finder, findsOneWidget, reason: label);
        final size = tester.getSize(finder);
        expect(size.width, greaterThanOrEqualTo(48.0), reason: label);
        expect(size.height, greaterThanOrEqualTo(48.0), reason: label);
      }

      handle.dispose();
    },
  );
}
