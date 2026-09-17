import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:platform_core/platform_core.dart';

import 'package:pocket_biome/src/pocket_biome_app.dart';
import 'package:pocket_biome/src/pocket_biome_ui.dart';

void main() {
  testWidgets('plants a specimen through the accessible control', (
    tester,
  ) async {
    await tester.pumpWidget(const PocketBiomeApp());
    await tester.pump();

    expect(find.text('Pocket Biome'), findsOneWidget);
    expect(find.text('ALBUM'), findsWidgets);
    final plant = find.text('Plant Mossling');
    await tester.ensureVisible(plant);
    await tester.tap(plant);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 2300));

    final screen = tester.widget<PocketBiomeScreen>(
      find.byType(PocketBiomeScreen),
    );
    expect(screen.game.state.value.album, isEmpty);
    expect(find.text('Nothing ready'), findsOneWidget);
  });

  testWidgets('restores the planted specimen after reopening', (tester) async {
    final store = MemorySaveStore();
    await tester.pumpWidget(PocketBiomeApp(saveStore: store));
    await tester.pump();
    final plant = find.text('Plant Mossling');
    await tester.ensureVisible(plant);
    await tester.tap(plant);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 2300));

    await tester.pumpWidget(PocketBiomeApp(saveStore: store));
    await tester.pump();

    final screen = tester.widget<PocketBiomeScreen>(
      find.byType(PocketBiomeScreen),
    );
    expect(screen.game.state.value.slots.first, isNotNull);
  });

  testWidgets('shows a save error without blocking planting', (tester) async {
    await tester.pumpWidget(PocketBiomeApp(saveStore: FailingSaveStore()));
    await tester.pump();
    final plant = find.text('Plant Mossling');
    await tester.ensureVisible(plant);
    await tester.tap(plant);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 2300));

    expect(find.text("Couldn't save the habitat."), findsOneWidget);
    final screen = tester.widget<PocketBiomeScreen>(
      find.byType(PocketBiomeScreen),
    );
    expect(screen.game.state.value.album, isEmpty);
  });

  testWidgets('recovers visibly from future and corrupt saves', (tester) async {
    final context = runtimeAppContext(identity: pocketBiomeIdentity);
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
    await tester.pumpWidget(PocketBiomeApp(saveStore: futureStore));
    await tester.pump();
    expect(
      find.text("Couldn't reopen that habitat. Starting fresh."),
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
    await tester.pumpWidget(PocketBiomeApp(saveStore: corruptStore));
    await tester.pump();
    expect(
      find.text("Couldn't reopen that habitat. Starting fresh."),
      findsOneWidget,
    );
  });

  testWidgets('exposes each pot as an accessible inspect action', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    try {
      await tester.pumpWidget(const PocketBiomeApp());
      await tester.pump();

      expect(find.bySemanticsLabel('Pot 1, empty'), findsOneWidget);
      expect(find.bySemanticsLabel('Pot 6, empty'), findsOneWidget);
      await tester.tap(find.bySemanticsLabel('Pot 3, empty'));
      await tester.pump();
      final screen = tester.widget<PocketBiomeScreen>(
        find.byType(PocketBiomeScreen),
      );
      expect(screen.game.selectedSlot.value, 2);
      expect(
        find.text('Empty pot. Plant a Mossling to start growing.'),
        findsOneWidget,
      );
    } finally {
      semantics.dispose();
    }
  });

  testWidgets('settles trusted growth without writing every timer tick', (
    tester,
  ) async {
    final store = CountingSaveStore();
    await tester.pumpWidget(PocketBiomeApp(saveStore: store));
    await tester.pump();
    await tester.pump(const Duration(seconds: 3));

    final screen = tester.widget<PocketBiomeScreen>(
      find.byType(PocketBiomeScreen),
    );
    expect(screen.game.state.value.lastTrustedAt, isNotNull);
    expect(store.writeCount, lessThanOrEqualTo(1));
    expect(
      screen.game.telemetrySink.events.where(
        (event) => event.name == 'biome_settle',
      ),
      hasLength(1),
    );
  });

  testWidgets('pauses the growth ticker while the app is backgrounded', (
    tester,
  ) async {
    final store = CountingSaveStore();
    await tester.pumpWidget(PocketBiomeApp(saveStore: store));
    await tester.pump();

    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
    await tester.pump();
    final writesAfterPause = store.writeCount;
    await tester.pump(const Duration(seconds: 3));
    expect(store.writeCount, writesAfterPause);

    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pump();
    final screen = tester.widget<PocketBiomeScreen>(
      find.byType(PocketBiomeScreen),
    );
    expect(screen.game.state.value.lastTrustedAt, isNotNull);
  });

  test('disposal guards a pending restore', () async {
    final read = Completer<SaveEnvelope?>();
    final game = PocketBiomeGame(
      context: runtimeAppContext(identity: pocketBiomeIdentity),
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

final class CountingSaveStore implements SaveStore {
  int writeCount = 0;

  @override
  Future<SaveEnvelope?> read(AppContext context) async => null;

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    writeCount += 1;
  }

  @override
  Future<void> delete(AppContext context) async {}
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
