import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:platform_core/platform_core.dart';

void main() {
  testWidgets('Merge Relay exposes accessible move controls', (tester) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();
    expect(find.text('Merge Relay'), findsWidgets);
    expect(find.byTooltip('Move left'), findsOneWidget);
    expect(find.byTooltip('Move right'), findsOneWidget);

    final moveLeft = find.byTooltip('Move left');
    await tester.ensureVisible(moveLeft);
    await tester.tap(moveLeft);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 1700));

    expect(find.text('1 moves'), findsOneWidget);
  });

  testWidgets('restores the saved board after reopening', (tester) async {
    final store = MemorySaveStore();
    await tester.pumpWidget(MergeRelayApp(saveStore: store));
    await tester.pump();
    final moveLeft = find.byTooltip('Move left');
    await tester.ensureVisible(moveLeft);
    await tester.tap(moveLeft);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 1700));

    await tester.pumpWidget(MergeRelayApp(saveStore: store));
    await tester.pump();

    expect(find.text('1 moves'), findsOneWidget);
  });

  testWidgets('shows a save error without blocking the move', (tester) async {
    await tester.pumpWidget(MergeRelayApp(saveStore: FailingSaveStore()));
    await tester.pump();
    final moveLeft = find.byTooltip('Move left');
    await tester.ensureVisible(moveLeft);
    await tester.tap(moveLeft);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 1700));

    expect(find.text("Couldn't save the board."), findsOneWidget);
    expect(find.text('1 moves'), findsOneWidget);
  });

  testWidgets('recovers visibly from future and corrupt saves', (tester) async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
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
    await tester.pumpWidget(MergeRelayApp(saveStore: futureStore));
    await tester.pump();
    expect(find.text('This relay needs a fresh start.'), findsOneWidget);

    final corruptStore = MemorySaveStore();
    await corruptStore.write(
      context,
      SaveEnvelope.create(
        context: context,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026),
        payload: const {'board': []},
      ),
    );
    await tester.pumpWidget(MergeRelayApp(saveStore: corruptStore));
    await tester.pump();
    expect(find.text('This relay needs a fresh start.'), findsOneWidget);
  });

  test('disposal guards a pending restore', () async {
    final read = Completer<SaveEnvelope?>();
    final game = MergeRelayGame(
      context: runtimeAppContext(identity: mergeRelayIdentity),
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
