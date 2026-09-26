import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:platform_core/platform_core.dart';

void main() {
  testWidgets('fresh launch starts at a compact home', (tester) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();

    expect(find.text('MERGE RELAY'), findsOneWidget);
    expect(find.text('Play rescue'), findsOneWidget);
    expect(find.text('Rescue paths'), findsOneWidget);
    expect(find.text('Friend relays'), findsNothing);
    expect(find.text('Swipe the board to move'), findsNothing);
  });

  testWidgets('first play offers a hands-on guide and skip starts swipe play', (
    tester,
  ) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();

    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    expect(find.text('First handoff'), findsOneWidget);
    expect(find.text('Slide the pair left.'), findsOneWidget);

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
    expect(find.text('Signal in').first, findsOneWidget);
    expect(find.text('Swipe the board to move'), findsOneWidget);
    expect(find.byTooltip('Move left'), findsNothing);
  });

  testWidgets('a real board swipe follows the domain trace into a result', (
    tester,
  ) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    await _playThreeLegalBoardSwipes(tester);

    expect(find.text('Path cleared'), findsOneWidget);
    expect(find.text('Score'), findsOneWidget);
    expect(find.text('Next path'), findsOneWidget);
  });

  testWidgets(
    'settings expose optional controls and replay without changing save',
    (tester) async {
      await tester.pumpWidget(const MergeRelayApp());
      await tester.pump();
      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();
      expect(find.text('Board controls'), findsOneWidget);
      expect(find.text('High contrast'), findsOneWidget);

      await tester.tap(find.text('Board controls'));
      await tester.tap(find.text('High contrast'));
      // The Music toggle (task 10) pushed this action below the fold of
      // the default 600-tall test surface; scroll the sheet's
      // `SingleChildScrollView` until it's actually hit-testable, the way
      // a real finger would need to.
      await tester.ensureVisible(find.text('Replay handoff guide'));
      await tester.tap(find.text('Replay handoff guide'));
      await tester.pumpAndSettle();
      expect(find.text('First handoff'), findsOneWidget);
    },
  );

  testWidgets('large text keeps the board route available', (tester) async {
    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(textScaler: TextScaler.linear(1.5)),
        child: const MergeRelayApp(),
      ),
    );
    await tester.pump();
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    expect(find.byType(MergeRelayBoard), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('pause actions remain usable on a compact large-text board', (
    tester,
  ) async {
    try {
      await tester.binding.setSurfaceSize(const Size(320, 540));
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(textScaler: TextScaler.linear(2)),
          child: const MergeRelayApp(),
        ),
      );
      await tester.pump();
      await tester.ensureVisible(find.text('Play rescue'));
      await tester.tap(find.text('Play rescue'));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Skip'));
      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Pause'));
      await tester.pumpAndSettle();

      expect(find.text('Board paused'), findsOneWidget);
      expect(find.text('Resume'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.ensureVisible(find.text('Resume'));
      await tester.tap(find.text('Resume'));
      await tester.pumpAndSettle();
      expect(find.byTooltip('Pause'), findsOneWidget);
    } finally {
      await tester.binding.setSurfaceSize(null);
    }
  });

  testWidgets('restore keeps a completed result available from Continue', (
    tester,
  ) async {
    final store = MemorySaveStore();
    await tester.pumpWidget(MergeRelayApp(saveStore: store));
    await tester.pump();
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
    await _playThreeLegalBoardSwipes(tester);

    await tester.pumpWidget(MergeRelayApp(key: UniqueKey(), saveStore: store));
    await tester.pumpAndSettle();
    expect(find.text('See result'), findsOneWidget);
    await tester.tap(find.text('See result'));
    await tester.pumpAndSettle();
    expect(find.text('Path cleared'), findsOneWidget);
  });
}

Future<void> _playThreeLegalBoardSwipes(WidgetTester tester) async {
  for (final delta in const [
    Offset(0, -180),
    Offset(-180, 0),
    Offset(-180, 0),
  ]) {
    await tester.fling(find.byType(MergeRelayBoard), delta, 1000);
    await tester.pumpAndSettle();
  }
}
