import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_content.dart';

/// Task 11's Implementation Checklist requires small-screen (360x640) and
/// large-text (1.3x) coverage with no `RenderFlex` overflow on every
/// restyled screen. Each test boots at that exact viewport/text scale (the
/// combination the task calls out, rather than the two independently) and
/// walks to one screen, then asserts `tester.takeException()` is `null` —
/// the same idiom `test/widget_test.dart`'s existing compact/large-text
/// cases use.
void main() {
  testWidgets('home has no overflow at 360x640 and 1.3x text', (tester) async {
    await _pumpResponsive(tester);
    expect(tester.takeException(), isNull);
  });

  testWidgets('chapter map has no overflow at 360x640 and 1.3x text', (
    tester,
  ) async {
    await _pumpResponsive(tester);
    await tester.tap(find.text('Rescue paths'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });

  testWidgets('welcome has no overflow at 360x640 and 1.3x text', (
    tester,
  ) async {
    await _pumpResponsive(tester);
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });

  testWidgets('tutorial has no overflow at 360x640 and 1.3x text', (
    tester,
  ) async {
    await _pumpResponsive(tester);
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text("Let's play"));
    // Never `pumpAndSettle` here: the hand-hint's animation repeats forever
    // (task 12's `_SwipeHandHint`).
    await tester.pump();
    expect(tester.takeException(), isNull);
  });

  testWidgets('play (rescue) has no overflow at 360x640 and 1.3x text', (
    tester,
  ) async {
    await _pumpResponsive(tester);
    await _skipToRescuePlay(tester);
    expect(tester.takeException(), isNull);
  });

  testWidgets('play (endless) has no overflow at 360x640 and 1.3x text', (
    tester,
  ) async {
    await _pumpResponsive(tester);
    await _skipToRescuePlay(tester);
    await tester.tap(find.byTooltip('Home'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Endless'));
    await tester.tap(find.text('Endless'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });

  testWidgets('accessible move controls have no overflow at 360x640 and '
      '1.3x text', (tester) async {
    await _pumpResponsive(tester);
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Board controls'));
    await tester.tap(find.text('Board controls'));
    // Dismiss the settings sheet by popping its route directly — at this
    // viewport size the sheet's own content can fill the full height, so
    // there's no barrier area left to tap outside it.
    Navigator.of(tester.element(find.text('Settings'))).pop();
    await tester.pumpAndSettle();
    await _skipToRescuePlay(tester);
    expect(tester.takeException(), isNull);
  });

  testWidgets('result (win) has no overflow at 360x640 and 1.3x text', (
    tester,
  ) async {
    final catalog = await tester.runAsync(MergeRelayContentCatalog.load);
    await _pumpResponsive(tester, content: catalog);
    await _skipToRescuePlay(tester);
    for (final delta in const [
      Offset(0, -180),
      Offset(-180, 0),
      Offset(-180, 0),
    ]) {
      await tester.fling(find.byType(MergeRelayBoard), delta, 1000);
      await tester.pumpAndSettle();
    }
    expect(tester.takeException(), isNull);
  });

  testWidgets('result (loss) has no overflow at 360x640 and 1.3x text', (
    tester,
  ) async {
    await _pumpResponsive(tester);
    await _skipToRescuePlay(tester);
    await tester.fling(
      find.byType(MergeRelayBoard),
      const Offset(0, -180),
      1000,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Pause'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Finish here'));
    await tester.tap(find.text('Finish here'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });

  testWidgets('pause has no overflow at 360x640 and 1.3x text', (tester) async {
    await _pumpResponsive(tester);
    await _skipToRescuePlay(tester);
    await tester.tap(find.byTooltip('Pause'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });

  testWidgets('settings has no overflow at 360x640 and 1.3x text', (
    tester,
  ) async {
    await _pumpResponsive(tester);
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });

  testWidgets('how to play has no overflow at 360x640 and 1.3x text', (
    tester,
  ) async {
    await _pumpResponsive(tester);
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('How to play'));
    await tester.tap(find.text('How to play'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}

/// Pumps [MergeRelayApp] at a 360x640 logical viewport with a 1.3x text
/// scale — the exact combination the task's checklist names — inside its
/// own `RepaintBoundary`-free tree (no golden capture here, only the
/// exception check).
Future<void> _pumpResponsive(
  WidgetTester tester, {
  MergeRelayContentCatalog? content,
}) async {
  tester.view.physicalSize = const Size(360, 640);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    MediaQuery(
      data: const MediaQueryData(textScaler: TextScaler.linear(1.3)),
      child: MergeRelayApp(content: content),
    ),
  );
  await tester.pump();
}

Future<void> _skipToRescuePlay(WidgetTester tester) async {
  await tester.ensureVisible(find.text('Play rescue'));
  await tester.tap(find.text('Play rescue'));
  await tester.pumpAndSettle();
  await tester.ensureVisible(find.text('Skip'));
  await tester.tap(find.text('Skip'));
  await tester.pumpAndSettle();
}
