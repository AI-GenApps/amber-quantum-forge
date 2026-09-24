import 'dart:ui' show Tristate;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/screens/home_lobby_screen.dart';
import 'package:ludo/src/state/ludo_profile_settings.dart';
import 'package:ludo/src/widgets/ludo_panel.dart';

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

/// A profile test seam so every test below renders the lobby header
/// synchronously instead of racing this screen's own async production
/// load.
LudoProfileSettings _testProfile() =>
    LudoProfileSettings(name: 'Rae', avatarId: 'red-face');

void main() {
  testWidgets('renders all four entry cards', (tester) async {
    await tester.pumpWidget(_wrap(HomeLobbyScreen(profile: _testProfile())));

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
      _wrap(
        HomeLobbyScreen(
          onPlayComputer: () => tapped = true,
          profile: _testProfile(),
        ),
      ),
    );

    await tester.tap(find.text('Computer'));
    await tester.pump();

    expect(tapped, isTrue);
  });

  testWidgets('tapping Pass N Play invokes onPlayPassAndPlay', (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      _wrap(
        HomeLobbyScreen(
          onPlayPassAndPlay: () => tapped = true,
          profile: _testProfile(),
        ),
      ),
    );

    await tester.tap(find.text('Pass N Play'));
    await tester.pump();

    expect(tapped, isTrue);
  });

  testWidgets('Play with Friends is visibly disabled and not tappable', (
    tester,
  ) async {
    await tester.pumpWidget(_wrap(HomeLobbyScreen(profile: _testProfile())));

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
    await tester.pumpWidget(_wrap(HomeLobbyScreen(profile: _testProfile())));

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
    await tester.pumpWidget(_wrap(HomeLobbyScreen(profile: _testProfile())));
    expect(find.textContaining('Resume'), findsNothing);

    await tester.pumpWidget(
      _wrap(
        HomeLobbyScreen(
          resumableMatch: const LudoResumableMatchSummary(
            mode: LudoResumableMatchMode.computer,
            description: 'Classic - 2 players - Turn 5',
          ),
          profile: _testProfile(),
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
          profile: _testProfile(),
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
    await tester.pumpWidget(_wrap(HomeLobbyScreen(profile: _testProfile())));

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
    await tester.pumpWidget(_wrap(HomeLobbyScreen(profile: _testProfile())));

    for (final title in [
      'Computer',
      'Pass N Play',
      'Play with Friends',
      'Online',
    ]) {
      final size = tester.getSize(find.widgetWithText(LudoPanel, title).first);
      expect(size.width, greaterThanOrEqualTo(48.0));
      expect(size.height, greaterThanOrEqualTo(48.0));
    }
  });

  testWidgets(
    'lobby content fills a tall viewport without a dominant empty region '
    'below the mode tiles',
    (tester) async {
      // A tall phone aspect ratio close to the reference physical device
      // (1080x2400), where the empty-area regression was found: the
      // Material-default `ListView` used to size its children to their
      // intrinsic (aspect-ratio-based) height and leave roughly the bottom
      // half of a screen this tall as bare, contentless background.
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(_wrap(HomeLobbyScreen(profile: _testProfile())));
      await tester.pumpAndSettle();

      final screenHeight = tester.view.physicalSize.height;

      // The bottom-most edge of the four-tile grid (found via the lowest
      // `LudoPanel` on screen — the mode tiles are the only panels this
      // deep once no resume card is shown) must land within a small
      // fraction of the viewport's actual bottom edge. A large gap here
      // means the grid stopped short and left a dominant empty region,
      // which is exactly what this test guards against.
      final panelFinder = find.byType(LudoPanel);
      var maxBottom = 0.0;
      for (var i = 0; i < tester.widgetList(panelFinder).length; i++) {
        final bottom = tester.getBottomLeft(panelFinder.at(i)).dy;
        if (bottom > maxBottom) maxBottom = bottom;
      }

      // Allow for the outer 16px page padding plus safe-area insets; a
      // "large empty area" regression leaves hundreds of logical pixels
      // of bare background below the content, far more than this margin.
      const allowedGapFromBottom = 32.0;
      expect(
        maxBottom,
        greaterThan(screenHeight - allowedGapFromBottom),
        reason:
            'The lowest LudoPanel (the mode tile grid) ends at $maxBottom '
            'but the viewport is $screenHeight tall — the lobby content '
            'does not fill the viewport and leaves a large empty region.',
      );
    },
  );
}
