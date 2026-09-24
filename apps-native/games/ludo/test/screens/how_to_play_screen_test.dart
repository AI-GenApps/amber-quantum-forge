import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/screens/how_to_play_screen.dart';

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

Future<void> _scrollTo(WidgetTester tester, Finder finder) {
  return tester.scrollUntilVisible(
    finder,
    200,
    scrollable: find.byType(Scrollable),
  );
}

void main() {
  testWidgets('shows the Classic and Quick rule sections', (tester) async {
    await tester.pumpWidget(_wrap(const HowToPlayScreen()));
    await tester.pumpAndSettle();

    expect(find.text('Classic'), findsOneWidget);
    expect(find.text('Getting a token out'), findsOneWidget);

    await _scrollTo(tester, find.text('Winning'));
    expect(find.text('Winning'), findsOneWidget);

    await _scrollTo(tester, find.text('Quick'));
    expect(find.text('Quick'), findsOneWidget);
    expect(find.text('Getting started'), findsOneWidget);
    await _scrollTo(tester, find.text('Winning in Quick'));
    expect(find.text('Winning in Quick'), findsOneWidget);
  });

  testWidgets(
    'the rules text is written for a player, not copied from this epic\'s '
    'internal task language',
    (tester) async {
      await tester.pumpWidget(_wrap(const HowToPlayScreen()));
      await tester.pumpAndSettle();

      final seen = <String>{};
      for (final anchor in [
        'Getting a token out',
        'Rolling a six',
        'Capturing',
        'Safe squares',
        'Getting home',
        'Bringing a token home',
        'Winning',
        'Getting started',
        'Winning in Quick',
      ]) {
        await _scrollTo(tester, find.text(anchor));
        seen.addAll(
          tester
              .widgetList<Text>(find.byType(Text))
              .map((t) => t.data ?? '')
              .where((text) => text.isNotEmpty),
        );
      }

      final bodyText = seen.join('\n');
      expect(bodyText.contains('LudoRuleset'), isFalse);
      expect(bodyText.contains('task 0'), isFalse);
      expect(bodyText.contains('blockades'), isTrue);
    },
  );

  testWidgets('every rule entry has a Semantics label and a 48dp+ tap target', (
    tester,
  ) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(_wrap(const HowToPlayScreen()));
    await tester.pumpAndSettle();

    for (final label in [
      'Getting a token out',
      'Getting home',
      'Winning',
      'Getting started',
      'Winning in Quick',
    ]) {
      final labelled = find.bySemanticsLabel(RegExp('^$label:'));
      await _scrollTo(tester, labelled);
      final finder = labelled;
      expect(finder, findsOneWidget, reason: label);
      final size = tester.getSize(finder);
      expect(size.width, greaterThanOrEqualTo(48.0), reason: label);
      expect(size.height, greaterThanOrEqualTo(48.0), reason: label);
    }

    handle.dispose();
  });
}
