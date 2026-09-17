import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:platform_core/platform_core.dart';

import 'package:sixty_second_heist/src/heist_app.dart';
import 'package:sixty_second_heist/src/heist_ui.dart';

void main() {
  testWidgets('runs a short escape plan with accessible controls', (
    tester,
  ) async {
    await tester.pumpWidget(const SixtySecondHeistApp());
    await tester.pump();

    expect(find.text('Sixty-Second Heist'), findsOneWidget);
    final planRight = find.byTooltip('Plan right');
    final runPlan = find.text('Run plan');
    await tester.ensureVisible(planRight);
    await tester.tap(planRight);
    await tester.tap(planRight);
    await tester.ensureVisible(runPlan);
    await tester.tap(runPlan);
    await tester.pump();

    expect(find.text('Escaped'), findsOneWidget);
    expect(find.textContaining('Clean escape'), findsOneWidget);
  });

  testWidgets('restores the planned route after reopening', (tester) async {
    final store = MemorySaveStore();
    await tester.pumpWidget(SixtySecondHeistApp(saveStore: store));
    await tester.pump();
    final planRight = find.byTooltip('Plan right');
    final runPlan = find.text('Run plan');
    await tester.ensureVisible(planRight);
    await tester.tap(planRight);
    await tester.tap(planRight);
    await tester.ensureVisible(runPlan);
    await tester.tap(runPlan);
    await tester.pump();

    await tester.pumpWidget(SixtySecondHeistApp(saveStore: store));
    await tester.pump();

    final screen = tester.widget<HeistScreen>(find.byType(HeistScreen));
    expect(screen.game.actions.value, hasLength(2));
  });

  testWidgets('persists an unfinished plan and restores the ready state', (
    tester,
  ) async {
    final store = MemorySaveStore();
    await tester.pumpWidget(SixtySecondHeistApp(saveStore: store));
    await tester.pump();
    final planRight = find.byTooltip('Plan right');
    await tester.ensureVisible(planRight);
    await tester.tap(planRight);
    await tester.pump();

    await tester.pumpWidget(SixtySecondHeistApp(saveStore: store));
    await tester.pump();

    final screen = tester.widget<HeistScreen>(find.byType(HeistScreen));
    expect(screen.game.actions.value, hasLength(1));
    expect(screen.game.outcome.value, isNull);
  });

  testWidgets('ordered draft writes leave reset as the final save', (
    tester,
  ) async {
    final store = ReorderingSaveStore();
    await tester.pumpWidget(SixtySecondHeistApp(saveStore: store));
    await tester.pump();
    final planRight = find.byTooltip('Plan right');
    await tester.ensureVisible(planRight);
    await tester.tap(planRight);
    await tester.pump();
    final clearPlan = find.text('Clear plan');
    await tester.ensureVisible(clearPlan);
    await tester.tap(clearPlan);
    await tester.pump(const Duration(milliseconds: 100));

    await tester.pumpWidget(SixtySecondHeistApp(saveStore: store));
    await tester.pump();

    final screen = tester.widget<HeistScreen>(find.byType(HeistScreen));
    expect(screen.game.actions.value, isEmpty);
  });

  testWidgets('plan controls wrap at compact widths with large text', (
    tester,
  ) async {
    try {
      for (final size in const [Size(320, 640), Size(360, 640)]) {
        await tester.binding.setSurfaceSize(size);
        await tester.pumpWidget(
          MediaQuery(
            data: const MediaQueryData(textScaler: TextScaler.linear(2)),
            child: const SixtySecondHeistApp(),
          ),
        );
        await tester.pump();

        expect(tester.takeException(), isNull);
        expect(find.byTooltip('Plan up'), findsOneWidget);
      }
    } finally {
      await tester.binding.setSurfaceSize(null);
    }
  });

  testWidgets('shows a save error without blocking the plan', (tester) async {
    await tester.pumpWidget(SixtySecondHeistApp(saveStore: FailingSaveStore()));
    await tester.pump();
    final planRight = find.byTooltip('Plan right');
    final runPlan = find.text('Run plan');
    await tester.ensureVisible(planRight);
    await tester.tap(planRight);
    await tester.tap(planRight);
    await tester.ensureVisible(runPlan);
    await tester.tap(runPlan);
    await tester.pump();

    expect(find.text("Couldn't save the plan."), findsOneWidget);
    expect(find.text('Escaped'), findsOneWidget);
  });

  testWidgets('recovers visibly from future and corrupt saves', (tester) async {
    final context = runtimeAppContext(identity: sixtySecondHeistIdentity);
    final futureStore = MemorySaveStore();
    await futureStore.write(
      context,
      SaveEnvelope.create(
        context: context,
        schemaVersion: 2,
        savedAt: DateTime.utc(2026),
        payload: const {},
      ),
    );
    await tester.pumpWidget(SixtySecondHeistApp(saveStore: futureStore));
    await tester.pump();
    expect(
      find.text("Couldn't reopen the plan. Starting fresh."),
      findsOneWidget,
    );

    final corruptStore = MemorySaveStore();
    await corruptStore.write(
      context,
      SaveEnvelope.create(
        context: context,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026),
        payload: const {},
      ),
    );
    await tester.pumpWidget(SixtySecondHeistApp(saveStore: corruptStore));
    await tester.pump();
    expect(
      find.text("Couldn't reopen the plan. Starting fresh."),
      findsOneWidget,
    );
  });

  test('disposal guards a pending restore', () async {
    final read = Completer<SaveEnvelope?>();
    final game = HeistGame(
      context: runtimeAppContext(identity: sixtySecondHeistIdentity),
      saveStore: DeferredReadSaveStore(read.future),
    );
    final restoring = game.restore();

    game.dispose();
    read.complete();
    await restoring;

    expect(game.hydrated.value, isFalse);
  });
}

final class FailingSaveStore implements SaveStore {
  @override
  Future<SaveEnvelope?> read(AppContext context) async => null;

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    throw StateError('write failed');
  }

  @override
  Future<void> delete(AppContext context) async {}
}

final class ReorderingSaveStore implements SaveStore {
  SaveEnvelope? saved;

  @override
  Future<SaveEnvelope?> read(AppContext context) async => saved;

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    final actions = envelope.payload['actions'];
    if (actions is List && actions.length == 1) {
      await Future<void>.delayed(const Duration(milliseconds: 40));
    }
    saved = envelope;
  }

  @override
  Future<void> delete(AppContext context) async {
    saved = null;
  }
}

final class DeferredReadSaveStore implements SaveStore {
  DeferredReadSaveStore(this.readResult);

  final Future<SaveEnvelope?> readResult;

  @override
  Future<SaveEnvelope?> read(AppContext context) => readResult;

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {}

  @override
  Future<void> delete(AppContext context) async {}
}
