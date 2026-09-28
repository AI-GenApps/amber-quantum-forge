import 'package:flutter_test/flutter_test.dart';
import 'package:platform_core/platform_core.dart';

import 'package:ludo/src/state/ludo_offline_xp_queue.dart';

LudoOfflineXpQueue _newQueue() => LudoOfflineXpQueue(
  saveStore: MemorySaveStore(),
  appContext: runtimeAppContext(identity: ludoOfflineXpQueueIdentity),
);

void main() {
  test('load returns null when nothing is queued', () async {
    final queue = _newQueue();
    expect(await queue.load(), isNull);
  });

  test('enqueue persists a single pending delta', () async {
    final queue = _newQueue();
    await queue.enqueue(xpDelta: 40, elapsedMs: 30000, matchesCompleted: 1);

    final pending = await queue.load();
    expect(pending, isNotNull);
    expect(pending!.xpDelta, 40);
    expect(pending.elapsedMs, 30000);
    expect(pending.matchesCompleted, 1);
  });

  test(
    'a second enqueue coalesces onto the first, reusing the same claim id',
    () async {
      final queue = _newQueue();
      await queue.enqueue(xpDelta: 40, elapsedMs: 30000, matchesCompleted: 1);
      final first = await queue.load();

      await queue.enqueue(xpDelta: 100, elapsedMs: 60000, matchesCompleted: 1);
      final merged = await queue.load();

      expect(merged!.claimId, first!.claimId);
      expect(merged.xpDelta, 140);
      expect(merged.elapsedMs, 90000);
      expect(merged.matchesCompleted, 2);
    },
  );

  test('clear removes the queued batch', () async {
    final queue = _newQueue();
    await queue.enqueue(xpDelta: 40, elapsedMs: 30000, matchesCompleted: 1);
    await queue.clear();
    expect(await queue.load(), isNull);
  });

  test('flush is a no-op returning null when nothing is queued', () async {
    final queue = _newQueue();
    final result = await queue.flush<int>(claim: (pending) async => 1);
    expect(result, isNull);
  });

  test('flush leaves the queue intact when the claim call fails, then clears '
      'it once a later flush succeeds (a mocked gateway that fails once then '
      'succeeds)', () async {
    final queue = _newQueue();
    await queue.enqueue(xpDelta: 40, elapsedMs: 30000, matchesCompleted: 1);

    var attempts = 0;
    Future<String> flakyClaim(LudoPendingXpDelta pending) async {
      attempts++;
      if (attempts == 1) throw StateError('offline');
      return 'claimed:${pending.xpDelta}';
    }

    final firstResult = await queue.flush<String>(claim: flakyClaim);
    expect(firstResult, isNull);
    expect(await queue.load(), isNotNull, reason: 'still queued after failure');

    final secondResult = await queue.flush<String>(claim: flakyClaim);
    expect(secondResult, 'claimed:40');
    expect(await queue.load(), isNull, reason: 'cleared after success');
  });

  test(
    'a delta enqueued after a successful flush starts a fresh batch',
    () async {
      final queue = _newQueue();
      await queue.enqueue(xpDelta: 40, elapsedMs: 30000, matchesCompleted: 1);
      final firstId = (await queue.load())!.claimId;
      await queue.flush<void>(claim: (pending) async {});

      await queue.enqueue(xpDelta: 100, elapsedMs: 60000, matchesCompleted: 1);
      final secondId = (await queue.load())!.claimId;
      expect(secondId, isNot(firstId));
    },
  );
}
