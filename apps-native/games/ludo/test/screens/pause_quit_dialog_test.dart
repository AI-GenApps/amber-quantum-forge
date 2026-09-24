import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/screens/pause_quit_dialog.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

void main() {
  testWidgets('toggles mutate ludo_sound_settings', (tester) async {
    final settings = LudoSoundSettings();
    await tester.pumpWidget(
      _wrap(
        Scaffold(
          body: Builder(
            builder: (context) => ElevatedButton(
              onPressed: () => showPauseQuitDialog(
                context,
                soundSettings: settings,
                onQuit: () {},
              ),
              child: const Text('open'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    expect(settings.soundEnabled, isTrue);
    await tester.tap(find.widgetWithText(SwitchListTile, 'Sound'));
    await tester.pump();
    expect(settings.soundEnabled, isFalse);

    expect(settings.musicEnabled, isTrue);
    await tester.tap(find.widgetWithText(SwitchListTile, 'Music'));
    await tester.pump();
    expect(settings.musicEnabled, isFalse);

    expect(settings.vibrationEnabled, isTrue);
    await tester.tap(find.widgetWithText(SwitchListTile, 'Vibration'));
    await tester.pump();
    expect(settings.vibrationEnabled, isFalse);
  });

  testWidgets('Resume closes the dialog without side effects', (tester) async {
    final settings = LudoSoundSettings();
    var quit = false;
    await tester.pumpWidget(
      _wrap(
        Scaffold(
          body: Builder(
            builder: (context) => ElevatedButton(
              onPressed: () => showPauseQuitDialog(
                context,
                soundSettings: settings,
                onQuit: () => quit = true,
              ),
              child: const Text('open'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    expect(find.byType(PauseQuitDialog), findsOneWidget);

    await tester.tap(find.text('Resume'));
    await tester.pumpAndSettle();

    expect(find.byType(PauseQuitDialog), findsNothing);
    expect(quit, isFalse);
    expect(settings.soundEnabled, isTrue);
    expect(settings.musicEnabled, isTrue);
    expect(settings.vibrationEnabled, isTrue);
  });

  testWidgets('Quit invokes the supplied callback exactly once', (
    tester,
  ) async {
    final settings = LudoSoundSettings();
    var quitCount = 0;
    await tester.pumpWidget(
      _wrap(
        Scaffold(
          body: Builder(
            builder: (context) => ElevatedButton(
              onPressed: () => showPauseQuitDialog(
                context,
                soundSettings: settings,
                onQuit: () => quitCount++,
              ),
              child: const Text('open'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Quit'));
    await tester.pumpAndSettle();

    expect(quitCount, 1);
    expect(find.byType(PauseQuitDialog), findsNothing);
  });
}
