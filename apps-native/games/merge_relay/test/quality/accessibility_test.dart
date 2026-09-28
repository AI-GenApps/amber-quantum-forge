import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_relay/src/screens/merge_relay_chapter_node.dart';
import 'package:merge_relay/src/ui/mr_icon_button.dart';

/// Task 13's other acceptance criterion this repo can check without a
/// device: every interactive element carries a semantics label, and every
/// tap target measures at least 48x48 logical px (the platform minimum).
/// Text-scale-1.3 overflow across every screen is already covered by
/// `test/merge_relay_screens_responsive_test.dart` (task 11), so it isn't
/// repeated here.
void main() {
  const minTapTarget = 48.0;

  Future<void> pumpAt1080(
    WidgetTester tester, {
    MergeRelayContentCatalog? content,
  }) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(MergeRelayApp(content: content));
    await tester.pump();
  }

  Future<void> skipToRescuePlay(WidgetTester tester) async {
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
  }

  void expectEveryIconButtonMeetsTapTarget(WidgetTester tester) {
    for (final element in find.byType(MrIconButton).evaluate()) {
      final size = (element.renderObject! as RenderBox).size;
      expect(
        size.width,
        greaterThanOrEqualTo(minTapTarget),
        reason: 'an MrIconButton is narrower than 48dp: $size',
      );
      expect(
        size.height,
        greaterThanOrEqualTo(minTapTarget),
        reason: 'an MrIconButton is shorter than 48dp: $size',
      );
    }
  }

  void expectEveryIconButtonHasALabel(WidgetTester tester) {
    for (final element in find.byType(MrIconButton).evaluate()) {
      final node = tester.getSemantics(
        find.byElementPredicate((candidate) => candidate == element),
      );
      expect(node.label, isNotEmpty, reason: 'an MrIconButton has no label');
      expect(node.flagsCollection.isButton, isTrue);
    }
  }

  testWidgets('home: icon buttons meet the tap-target and label rules', (
    tester,
  ) async {
    await pumpAt1080(tester);
    expectEveryIconButtonMeetsTapTarget(tester);
    expectEveryIconButtonHasALabel(tester);
  });

  testWidgets('chapter map: unlocked board nodes are ≥48dp with labels', (
    tester,
  ) async {
    final catalog = await tester.runAsync(MergeRelayContentCatalog.load);
    await pumpAt1080(tester, content: catalog);
    await tester.tap(find.text('Rescue paths'));
    await tester.pumpAndSettle();

    var checked = 0;
    for (final element in find.byType(MergeRelayChapterNode).evaluate()) {
      final widget = element.widget as MergeRelayChapterNode;
      if (!widget.unlocked) continue;
      checked += 1;
      final size = (element.renderObject! as RenderBox).size;
      expect(
        size.width,
        greaterThanOrEqualTo(minTapTarget),
        reason: 'board ${widget.rescue.id} node is narrower than 48dp: $size',
      );
      expect(
        size.height,
        greaterThanOrEqualTo(minTapTarget),
        reason: 'board ${widget.rescue.id} node is shorter than 48dp: $size',
      );
      final node = tester.getSemantics(
        find.byElementPredicate((e) => e == element),
      );
      expect(node.label, isNotEmpty, reason: 'board ${widget.rescue.id}');
      expect(node.flagsCollection.isButton, isTrue);
    }
    expect(checked, greaterThan(0));
  });

  testWidgets(
    'play (rescue): header icon buttons and the board itself meet the '
    'accessibility rules',
    (tester) async {
      await pumpAt1080(tester);
      await skipToRescuePlay(tester);

      expectEveryIconButtonMeetsTapTarget(tester);
      expectEveryIconButtonHasALabel(tester);

      final boardNode = tester.getSemantics(find.byType(MergeRelayBoard));
      expect(boardNode.label, isNotEmpty);
    },
  );

  testWidgets('pause: icon buttons meet the tap-target and label rules', (
    tester,
  ) async {
    await pumpAt1080(tester);
    await skipToRescuePlay(tester);
    await tester.tap(find.byTooltip('Pause'));
    await tester.pumpAndSettle();

    expectEveryIconButtonMeetsTapTarget(tester);
    expectEveryIconButtonHasALabel(tester);
  });

  testWidgets('result: icon buttons meet the tap-target and label rules', (
    tester,
  ) async {
    await pumpAt1080(tester);
    await skipToRescuePlay(tester);
    await tester.tap(find.byTooltip('Pause'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Finish here'));
    await tester.tap(find.text('Finish here'));
    await tester.pumpAndSettle();

    expectEveryIconButtonMeetsTapTarget(tester);
    expectEveryIconButtonHasALabel(tester);
  });

  testWidgets(
    'settings: switches meet the tap-target rule and icon buttons keep '
    'their labels',
    (tester) async {
      await pumpAt1080(tester);
      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();

      expectEveryIconButtonHasALabel(tester);
      for (final element in find.byType(Switch).evaluate()) {
        final size = (element.renderObject! as RenderBox).size;
        expect(size.width, greaterThanOrEqualTo(minTapTarget));
        expect(size.height, greaterThanOrEqualTo(minTapTarget));
      }
    },
  );
}
