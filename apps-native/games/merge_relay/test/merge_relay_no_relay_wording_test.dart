import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_rules/merge_rules.dart';

/// Task 11 fix round 3: the solo v1 scope has no "relay"/"friend" wording
/// (per the task's Copy decision, "handoff" counts too — it's relay
/// language). This walks every main solo screen's actually-rendered text
/// (and semantics/tooltip labels) and fails on any occurrence of
/// relay/friend/handoff outside the "Merge Relay" brand wordmark itself
/// (the rename is task 18, out of scope here).
///
/// A single long-lived app instance walks screen to screen — Home,
/// Settings, tutorial, play (rescue), pause, result (win), play (endless),
/// play (daily), result (loss), chapter map — rather than one `testWidgets`
/// per screen, since most of these routes are only reachable by actually
/// playing through the previous one (there's no way to jump straight to
/// "the result of a run that just finished" without finishing a run).
/// Settings is checked from Home specifically (not from Pause, which also
/// has its own "Settings" button underneath the same modal route and would
/// make `find.text('Settings')` ambiguous when closing the sheet).
final _banned = RegExp(
  r'relay|friend|handoff|hand\s*off',
  caseSensitive: false,
);

/// The one allowed exception: the brand wordmark itself, in any of the
/// forms the header/logo slot renders it ("MERGE RELAY", "Merge Relay",
/// or the stacked "MERGE\nRELAY").
bool _isBrandWordmark(String text) {
  final normalized = text.trim().replaceAll('\n', ' ').toLowerCase();
  return normalized == 'merge relay';
}

void main() {
  testWidgets(
    'no solo-v1 screen renders relay/friend/handoff wording outside the '
    'brand wordmark',
    (tester) async {
      final catalog = await tester.runAsync(MergeRelayContentCatalog.load);
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 3;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(MergeRelayApp(content: catalog));
      await tester.pump();

      final violations = <String>[];
      void checkScreen(String name) =>
          violations.addAll(_violationsOn(tester, name));

      checkScreen('home');

      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();
      checkScreen('settings');
      Navigator.of(tester.element(find.text('Settings'))).pop();
      await tester.pumpAndSettle();

      await tester.tap(find.text('Play rescue'));
      await tester.pumpAndSettle();
      checkScreen('tutorial');

      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();
      checkScreen('play (rescue)');

      await tester.tap(find.byTooltip('Pause'));
      await tester.pumpAndSettle();
      checkScreen('pause');

      await tester.tap(find.text('Resume'));
      await tester.pumpAndSettle();

      final catalogForSolve = catalog ?? MergeRelayContentCatalog.fallback;
      for (final direction in _solveFirstRescue(catalogForSolve)) {
        await tester.fling(
          find.byType(MergeRelayBoard),
          _swipeDelta(direction),
          1000,
        );
        await tester.pumpAndSettle();
      }
      checkScreen('result (win)');

      await tester.tap(find.text('Home'));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Endless'));
      await tester.tap(find.text('Endless'));
      await tester.pumpAndSettle();
      checkScreen('play (endless)');

      await tester.tap(find.byTooltip('Home'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Daily'));
      await tester.pumpAndSettle();
      checkScreen('play (daily)');

      await tester.fling(
        find.byType(MergeRelayBoard),
        const Offset(0, -180),
        1000,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Pause'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Finish here'));
      await tester.pumpAndSettle();
      checkScreen('result (loss)');

      await tester.tap(find.text('Home'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Rescue paths'));
      await tester.pumpAndSettle();
      checkScreen('chapter map');

      expect(violations, isEmpty, reason: violations.join('\n'));
    },
  );
}

/// Collects every relay/friend/handoff violation among [tester]'s currently
/// rendered `Text`/`RichText` strings and `Tooltip`/`Semantics` labels,
/// prefixed with [screen] for a readable failure message.
List<String> _violationsOn(WidgetTester tester, String screen) {
  final violations = <String>[];
  void check(String? text) {
    if (text == null || text.isEmpty) return;
    if (!_banned.hasMatch(text)) return;
    if (_isBrandWordmark(text)) return;
    violations.add('$screen: "$text"');
  }

  for (final element in tester.allElements) {
    final widget = element.widget;
    switch (widget) {
      case Text():
        check(widget.data);
        final span = widget.textSpan;
        if (span != null) check(span.toPlainText());
      case RichText():
        check(widget.text.toPlainText());
      case Tooltip():
        check(widget.message);
      case Semantics():
        final data = widget.properties;
        check(data.label);
        check(data.value);
        check(data.hint);
    }
  }
  return violations;
}

List<MergeDirection> _solveFirstRescue(MergeRelayContentCatalog catalog) {
  final board = catalog.rescues.firstWhere(
    (rescue) => rescue.chapter == 1 && rescue.indexInChapter == 1,
    orElse: () => catalog.rescues.first,
  );
  const solver = MergeRescueSolver();
  final result = solver.solve(
    state: board.state,
    targetScore: board.targetScore,
    moveBudget: board.moveBudget,
  );
  return result.winningLine!;
}

Offset _swipeDelta(MergeDirection direction) => switch (direction) {
  MergeDirection.up => const Offset(0, -180),
  MergeDirection.down => const Offset(0, 180),
  MergeDirection.left => const Offset(-180, 0),
  MergeDirection.right => const Offset(180, 0),
};
