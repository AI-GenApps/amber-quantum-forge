import 'dart:ui' show Tristate;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/screens/home_lobby_screen.dart';

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

void main() {
  testWidgets('renders all four entry cards', (tester) async {
    await tester.pumpWidget(_wrap(const HomeLobbyScreen()));

    expect(find.text('Computer'), findsOneWidget);
    expect(find.text('Pass N Play'), findsOneWidget);
    expect(find.text('Play with Friends'), findsOneWidget);
    expect(find.text('Online'), findsOneWidget);
    // Two "coming soon" badges: Play with Friends and Online.
    expect(find.text('Coming soon'), findsNWidgets(2));
  });

  testWidgets('tapping Computer invokes onPlayComputer', (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      _wrap(HomeLobbyScreen(onPlayComputer: () => tapped = true)),
    );

    await tester.tap(find.text('Computer'));
    await tester.pump();

    expect(tapped, isTrue);
  });

  testWidgets('tapping Pass N Play invokes onPlayPassAndPlay', (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      _wrap(HomeLobbyScreen(onPlayPassAndPlay: () => tapped = true)),
    );

    await tester.tap(find.text('Pass N Play'));
    await tester.pump();

    expect(tapped, isTrue);
  });

  testWidgets('Play with Friends is visibly disabled and not tappable', (
    tester,
  ) async {
    await tester.pumpWidget(_wrap(const HomeLobbyScreen()));

    final cardFinder = find.ancestor(
      of: find.text('Play with Friends'),
      matching: find.byType(Opacity),
    );
    final opacity = tester.widget<Opacity>(cardFinder.first);
    expect(opacity.opacity, lessThan(1.0));

    final inkWell = tester.widget<InkWell>(
      find
          .ancestor(
            of: find.text('Play with Friends'),
            matching: find.byType(InkWell),
          )
          .first,
    );
    expect(inkWell.onTap, isNull);

    // No navigator push happens on tap since the disabled tile has no
    // handler; tapping it must be a silent no-op, not a crash or route.
    await tester.tap(find.text('Play with Friends'), warnIfMissed: false);
    await tester.pump();
    expect(find.byType(HomeLobbyScreen), findsOneWidget);
  });

  testWidgets('Online is visibly disabled and not tappable', (tester) async {
    await tester.pumpWidget(_wrap(const HomeLobbyScreen()));

    final cardFinder = find.ancestor(
      of: find.text('Online'),
      matching: find.byType(Opacity),
    );
    final opacity = tester.widget<Opacity>(cardFinder.first);
    expect(opacity.opacity, lessThan(1.0));

    final inkWell = tester.widget<InkWell>(
      find
          .ancestor(of: find.text('Online'), matching: find.byType(InkWell))
          .first,
    );
    expect(inkWell.onTap, isNull);
  });

  testWidgets('resume affordance renders only when summary is non-null', (
    tester,
  ) async {
    await tester.pumpWidget(_wrap(const HomeLobbyScreen()));
    expect(find.textContaining('Resume'), findsNothing);

    await tester.pumpWidget(
      _wrap(
        const HomeLobbyScreen(
          resumableMatch: LudoResumableMatchSummary(
            mode: LudoResumableMatchMode.computer,
            description: 'Classic - 2 players - Turn 5',
          ),
        ),
      ),
    );
    expect(find.textContaining('Resume'), findsOneWidget);
    expect(find.text('Classic - 2 players - Turn 5'), findsOneWidget);
  });

  testWidgets('resume affordance invokes onResume when tapped', (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      _wrap(
        HomeLobbyScreen(
          resumableMatch: const LudoResumableMatchSummary(
            mode: LudoResumableMatchMode.passAndPlay,
            description: 'Quick - 4 players - Turn 2',
          ),
          onResume: () => tapped = true,
        ),
      ),
    );

    await tester.tap(find.textContaining('Resume'));
    await tester.pump();

    expect(tapped, isTrue);
  });

  testWidgets('every entry card exposes a Semantics label with its state', (
    tester,
  ) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(_wrap(const HomeLobbyScreen()));

    expect(find.bySemanticsLabel('Computer'), findsOneWidget);
    expect(find.bySemanticsLabel('Pass N Play'), findsOneWidget);
    expect(
      find.bySemanticsLabel('Play with Friends, coming soon, unavailable'),
      findsOneWidget,
    );
    expect(
      find.bySemanticsLabel('Online, coming soon, unavailable'),
      findsOneWidget,
    );

    final friendsSemantics = tester.getSemantics(
      find.bySemanticsLabel('Play with Friends, coming soon, unavailable'),
    );
    expect(friendsSemantics.flagsCollection.isEnabled, Tristate.isFalse);

    final computerSemantics = tester.getSemantics(
      find.bySemanticsLabel('Computer'),
    );
    expect(computerSemantics.flagsCollection.isButton, isTrue);

    handle.dispose();
  });

  testWidgets('every entry card meets the 48dp minimum tap target', (
    tester,
  ) async {
    await tester.pumpWidget(_wrap(const HomeLobbyScreen()));

    for (final title in [
      'Computer',
      'Pass N Play',
      'Play with Friends',
      'Online',
    ]) {
      final size = tester.getSize(find.widgetWithText(Card, title).first);
      expect(size.width, greaterThanOrEqualTo(48.0));
      expect(size.height, greaterThanOrEqualTo(48.0));
    }
  });
}
