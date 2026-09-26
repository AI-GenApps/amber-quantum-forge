/// Task 24's acceptance case: with no Firebase config present (the normal
/// state of a `flutter test` host process — no platform channel mock for
/// `firebase_core` is installed anywhere in this repo, so a real
/// `Firebase.initializeApp()` call fails exactly as it would on a device
/// with no `google-services.json`/`GoogleService-Info.plist`), the app
/// boots and the still-disabled (task 08) Online/Play-with-Friends lobby
/// tiles show their "unavailable" state with no crash, no hang, and no
/// tappable action.
///
/// Real device verification with and without a fake Firebase config file
/// present is out of scope for a host-run `flutter test` (there is no
/// native Android/iOS Firebase config to vary here) and belongs to this
/// task's on-device verification pass instead; this test proves the
/// *Dart-level* guard (`ensureLudoFirebaseInitialized` never throwing, the
/// app never depending on its result to boot) that guard relies on.
library;

import 'dart:async' show unawaited;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/net/ludo_firebase_gateway.dart';
import 'package:ludo/src/screens/home_lobby_screen.dart';
import 'package:ludo/src/state/ludo_profile_settings.dart';

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

LudoProfileSettings _testProfile() =>
    LudoProfileSettings(name: 'Rae', avatarId: 'red-face');

void main() {
  test('ensureLudoFirebaseInitialized degrades to false with no Firebase config, never throwing', () async {
    // No `TestDefaultBinaryMessengerBinding` mock is installed for
    // `plugins.flutter.io/firebase_core` anywhere in this suite, so this
    // call takes the exact "no config present" path a real device build
    // with a missing `google-services.json` would.
    final available = await ensureLudoFirebaseInitialized();
    expect(available, isFalse);
  });

  testWidgets(
    'home lobby boots and shows Online/Play with Friends as unavailable, never crashing',
    (tester) async {
      // Mirrors `main.dart`'s guarded, fire-and-forget bootstrap: nothing
      // in this pump awaits or depends on its result.
      unawaited(ensureLudoFirebaseInitialized());

      await tester.pumpWidget(_wrap(HomeLobbyScreen(profile: _testProfile())));
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Computer'), findsOneWidget);
      expect(find.text('Pass N Play'), findsOneWidget);
      expect(find.text('Play with Friends'), findsOneWidget);
      expect(find.text('Online'), findsOneWidget);
      expect(find.text('Not available yet'), findsNWidgets(2));
      expect(find.text('Coming soon'), findsNWidgets(2));

      // Tapping either disabled tile does nothing: no navigation, no
      // exception, no pending timers/animations left running.
      await tester.tap(find.text('Online'));
      await tester.pump();
      expect(tester.takeException(), isNull);
      expect(find.byType(HomeLobbyScreen), findsOneWidget);

      await tester.tap(find.text('Play with Friends'));
      await tester.pump();
      expect(tester.takeException(), isNull);
      expect(find.byType(HomeLobbyScreen), findsOneWidget);
    },
  );
}
