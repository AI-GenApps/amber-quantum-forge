import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/screens/pass_and_play_interstitial.dart';

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

void main() {
  testWidgets('shows the passed player\'s name and avatar', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(
      _wrap(
        const PassAndPlayInterstitial(
          playerName: 'Priya',
          avatarId: 'green-spark',
          onContinue: _noop,
        ),
      ),
    );

    expect(find.text('Pass to Priya'), findsOneWidget);
    expect(find.bySemanticsLabel('Pass the device to Priya'), findsOneWidget);
    handle.dispose();
  });

  testWidgets(
    'tapping Ready with the toggle untouched calls onContinue(false)',
    (tester) async {
      bool? dontShowAgain;
      await tester.pumpWidget(
        _wrap(
          PassAndPlayInterstitial(
            playerName: 'Priya',
            avatarId: 'green-spark',
            onContinue: (value) => dontShowAgain = value,
          ),
        ),
      );

      await tester.tap(find.byKey(const Key('pass-and-play-ready-button')));
      await tester.pump();

      expect(dontShowAgain, isFalse);
    },
  );

  testWidgets(
    'checking "don\'t show again" then tapping Ready calls onContinue(true)',
    (tester) async {
      bool? dontShowAgain;
      await tester.pumpWidget(
        _wrap(
          PassAndPlayInterstitial(
            playerName: 'Priya',
            avatarId: 'green-spark',
            onContinue: (value) => dontShowAgain = value,
          ),
        ),
      );

      await tester.tap(find.byKey(const Key('pass-and-play-dont-show-again')));
      await tester.pump();
      await tester.tap(find.byKey(const Key('pass-and-play-ready-button')));
      await tester.pump();

      expect(dontShowAgain, isTrue);
    },
  );

  testWidgets('every interactive control has a Semantics label and a '
      '48dp+ tap target', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(
      _wrap(
        const PassAndPlayInterstitial(
          playerName: 'Priya',
          avatarId: 'green-spark',
          onContinue: _noop,
        ),
      ),
    );

    for (final label in ["Don't show this again this session", 'Ready']) {
      final finder = find.bySemanticsLabel(label);
      expect(finder, findsOneWidget, reason: label);
      final size = tester.getSize(finder);
      expect(size.width, greaterThanOrEqualTo(48.0), reason: label);
      expect(size.height, greaterThanOrEqualTo(48.0), reason: label);
    }
    handle.dispose();
  });
}

void _noop(bool value) {}
