import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

MergeDirection _legal(MergeGameState state) => MergeDirection.values.firstWhere(
  (direction) => const MergeRules().apply(state, direction).changed,
);

final class _GatedStore implements SaveStore {
  _GatedStore(this.inner);

  final SaveStore inner;
  Completer<void>? gate;
  var writeStarts = 0;

  @override
  Future<SaveEnvelope?> read(AppContext context) => inner.read(context);

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    writeStarts += 1;
    final pending = gate;
    if (pending != null) await pending.future;
    await inner.write(context, envelope);
  }

  @override
  Future<void> delete(AppContext context) => inner.delete(context);
}

void main() {
  late Directory root;
  late AppContext context;

  setUp(() async {
    root = await Directory.systemTemp.createTemp('mr-death-');
    context = runtimeAppContext(identity: mergeRelayIdentity);
  });

  tearDown(() => root.delete(recursive: true));

  test(
    'process death after every legal endless move restores that move',
    () async {
      final store = JsonFileSaveStore(root: root);
      var game = MergeRelayGame(context: context, saveStore: store);
      await game.restore();
      game.completeTutorial(skipped: true);
      game.startEndless();

      for (var step = 1; step <= 12; step += 1) {
        if (game.roundComplete.value) break;
        game.move(_legal(game.state.value));
        final expected = game.state.value.toJson();
        await game.flushWrites();
        game.dispose();

        game = MergeRelayGame(context: context, saveStore: store);
        await game.restore();
        expect(game.state.value.toJson(), expected, reason: 'move $step');
        expect(game.mode.value, MergeRelayMode.endless);
        expect(game.tutorialComplete.value, isTrue);
      }
      game.dispose();
    },
  );

  test(
    'death while a write is in flight restores the last durable move',
    () async {
      final disk = JsonFileSaveStore(root: root);
      final gated = _GatedStore(disk);
      final game = MergeRelayGame(context: context, saveStore: gated);
      await game.restore();
      game.completeTutorial(skipped: true);
      game.startEndless();
      game.move(_legal(game.state.value));
      await game.flushWrites();
      final durable = game.state.value.toJson();

      gated.gate = Completer<void>();
      final startsBefore = gated.writeStarts;
      game.move(_legal(game.state.value));
      await Future<void>.delayed(Duration.zero);
      expect(gated.writeStarts, startsBefore + 1);
      expect(game.state.value.toJson(), isNot(durable));

      final reopened = MergeRelayGame(context: context, saveStore: disk);
      await reopened.restore();
      expect(reopened.state.value.toJson(), durable);
      expect(reopened.restoreFailed.value, isFalse);

      gated.gate!.complete();
      await game.flushWrites();
      game.dispose();
      reopened.dispose();
    },
  );

  test('a burst of moves lands in order with the newest state last', () async {
    final disk = JsonFileSaveStore(root: root);
    final gated = _GatedStore(disk)..gate = Completer<void>();
    final game = MergeRelayGame(context: context, saveStore: gated);
    await game.restore();
    game.completeTutorial(skipped: true);
    game.startEndless();
    game.flushWrites().ignore();
    for (var i = 0; i < 4; i += 1) {
      if (!game.roundComplete.value) game.move(_legal(game.state.value));
    }
    final newest = game.state.value.toJson();
    gated.gate!.complete();
    await game.flushWrites();
    game.dispose();

    final reopened = MergeRelayGame(context: context, saveStore: disk);
    await reopened.restore();
    expect(reopened.state.value.toJson(), newest);
    reopened.dispose();
  });

  test('offline practice needs no gateway and survives restart', () async {
    final store = JsonFileSaveStore(root: root);
    final game = MergeRelayGame(context: context, saveStore: store);
    await game.restore();
    game.completeTutorial(skipped: true);
    game.startDaily();
    game.move(_legal(game.state.value));
    final expected = game.state.value.toJson();
    await game.flushWrites();
    game.dispose();

    final reopened = MergeRelayGame(context: context, saveStore: store);
    await reopened.restore();
    expect(reopened.relayController, isNull);
    expect(reopened.mode.value, MergeRelayMode.daily);
    expect(reopened.state.value.toJson(), expected);
    reopened.dispose();
  });
}
