import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/telemetry/merge_relay_event_outbox.dart';
import 'package:merge_relay/src/telemetry/merge_relay_outbox_store.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_fake_gateway.dart';

final class _Clock implements Clock {
  _Clock(this.value);

  DateTime value;

  @override
  DateTime now() => value;
}

const _down = MergeRelayApiException(
  statusCode: 503,
  code: 'service_unavailable',
  message: 'down',
  diagnosticId: 'd',
);

({
  MergeRelayEventOutbox outbox,
  FakeRelayGateway gateway,
  MemoryMergeRelayOutboxStore store,
  _Clock clock,
})
_build({bool social = true, MergeRelayOutboxPolicy? policy}) {
  final gateway = FakeRelayGateway();
  final store = MemoryMergeRelayOutboxStore();
  final clock = _Clock(DateTime.utc(2026, 10, 1));
  return (
    outbox: MergeRelayEventOutbox(
      gateway: gateway,
      store: store,
      clock: clock,
      socialEnabled: social,
      policy: policy ?? const MergeRelayOutboxPolicy(),
    ),
    gateway: gateway,
    store: store,
    clock: clock,
  );
}

void main() {
  test('solo build queues nothing and never touches the gateway', () async {
    final h = _build(social: false);
    expect(
      await h.outbox.enqueue(MergeRelayClientEventType.dailyRunComplete),
      isFalse,
    );
    expect(await h.outbox.flush(), 0);
    expect(h.store.entries, isEmpty);
    expect(h.gateway.postedEvents, isEmpty);
  });

  test('request rejects reserved key prefixes and redacts PII', () {
    for (final prefix in [
      'retire:',
      'cancel:',
      'save:',
      'result:',
      'return:',
      'abandoned:',
      'attempt:',
      'challenge:',
      'CHALLENGE:',
    ]) {
      expect(
        () => MergeRelayEventRequest(
          idempotencyKey: '${prefix}x',
          type: MergeRelayClientEventType.replayViewed,
        ),
        throwsArgumentError,
      );
    }
    final request = MergeRelayEventRequest(
      idempotencyKey: 'tel.1',
      type: MergeRelayClientEventType.dailyRunComplete,
      payload: {
        'email': 'a@b.co',
        'display_name': 'Sam',
        'creator_alias': 'Sam',
        'reason': 'sam@example.com',
        'score': 12,
        'mode': 'daily',
        'nested': {'email': 'x'},
      },
    );
    expect(request.payload, {'score': 12, 'mode': 'daily'});
    expect(
      MergeRelayClientEventType.values.map((t) => t.wireName),
      unorderedEquals([
        'challenge_opened',
        'replay_viewed',
        'validation_rejected',
        'daily_run_complete',
        'practice_rewind_used',
      ]),
    );
  });

  test('flushes in order and empties the queue', () async {
    final h = _build();
    for (final n in [1, 2, 3]) {
      await h.outbox.enqueue(
        MergeRelayClientEventType.dailyRunComplete,
        payload: {'score': n},
      );
      h.clock.value = h.clock.value.add(const Duration(seconds: 1));
    }
    expect(await h.outbox.flush(), 3);
    expect(h.gateway.postedEvents.map((e) => e.payload['score']), [1, 2, 3]);
    expect(h.store.entries, isEmpty);
  });

  test('offline keeps order, backs off, then resumes', () async {
    final h = _build();
    await h.outbox.enqueue(
      MergeRelayClientEventType.replayViewed,
      payload: {'count': 1},
    );
    await h.outbox.enqueue(
      MergeRelayClientEventType.replayViewed,
      payload: {'count': 2},
    );
    h.gateway.eventError = _down;
    expect(await h.outbox.flush(), 0);
    expect(h.store.entries, hasLength(2));
    expect(h.store.entries.first.attempts, 1);
    h.gateway.eventError = null;
    expect(await h.outbox.flush(), 0);
    h.clock.value = h.clock.value.add(const Duration(seconds: 6));
    expect(await h.outbox.flush(), 2);
    expect(h.gateway.postedEvents.map((e) => e.payload['count']), [1, 2]);
  });

  test('online flag blocks flush until set', () async {
    final h = _build();
    await h.outbox.enqueue(MergeRelayClientEventType.replayViewed);
    h.outbox.online = false;
    expect(await h.outbox.flush(), 0);
    expect(h.gateway.postedEvents, isEmpty);
    h.outbox.online = true;
    expect(await h.outbox.flush(), 1);
  });

  test('permanent 4xx drops the poison event and continues', () async {
    final h = _build();
    await h.outbox.enqueue(MergeRelayClientEventType.replayViewed);
    await h.outbox.enqueue(MergeRelayClientEventType.challengeOpened);
    h.gateway.eventError = const MergeRelayApiException(
      statusCode: 422,
      code: 'invalid_event',
      message: 'bad',
      diagnosticId: 'd',
    );
    await h.outbox.flush();
    expect(h.store.entries, isEmpty);
  });

  test('drops oldest beyond the cap and expired entries', () async {
    final h = _build(
      policy: const MergeRelayOutboxPolicy(
        maxEntries: 3,
        maxAge: Duration(days: 1),
      ),
    );
    for (final n in [1, 2, 3, 4, 5]) {
      await h.outbox.enqueue(
        MergeRelayClientEventType.replayViewed,
        payload: {'count': n},
      );
    }
    expect(h.store.entries.map((e) => e.request.payload['count']), [3, 4, 5]);
    h.clock.value = h.clock.value.add(const Duration(days: 2));
    h.gateway.eventError = _down;
    await h.outbox.flush();
    expect(h.store.entries, isEmpty);
  });

  test('gives up after the max attempts', () async {
    final h = _build(
      policy: const MergeRelayOutboxPolicy(
        maxAttempts: 2,
        baseBackoff: Duration(seconds: 1),
      ),
    );
    await h.outbox.enqueue(MergeRelayClientEventType.replayViewed);
    h.gateway.eventError = _down;
    await h.outbox.flush();
    h.clock.value = h.clock.value.add(const Duration(seconds: 2));
    await h.outbox.flush();
    expect(h.store.entries, isEmpty);
  });

  test('config kill switch purges and blocks until re-enabled', () async {
    final h = _build();
    await h.outbox.enqueue(MergeRelayClientEventType.replayViewed);
    h.gateway.configOverride = await _config(h.gateway, active: false);
    await h.outbox.applyConfig(await h.gateway.getConfig());
    expect(h.outbox.enabled, isFalse);
    expect(h.store.entries, isEmpty);
    expect(
      await h.outbox.enqueue(MergeRelayClientEventType.replayViewed),
      isFalse,
    );
    expect(await h.outbox.flush(), 0);
    expect(h.gateway.postedEvents, isEmpty);
    h.gateway.configOverride = await _config(h.gateway, active: true);
    await h.outbox.applyConfig(await h.gateway.getConfig());
    expect(
      await h.outbox.enqueue(MergeRelayClientEventType.replayViewed),
      isTrue,
    );
  });

  test(
    'file store persists across instances and survives corruption',
    () async {
      final dir = Directory.systemTemp.createTempSync('mr_outbox');
      addTearDown(() => dir.deleteSync(recursive: true));
      final file = File('${dir.path}/outbox.json');
      final gateway = FakeRelayGateway();
      final clock = _Clock(DateTime.utc(2026, 10, 1));
      final first = MergeRelayEventOutbox(
        gateway: gateway,
        store: FileMergeRelayOutboxStore(file),
        clock: clock,
        socialEnabled: true,
      );
      await first.enqueue(
        MergeRelayClientEventType.dailyRunComplete,
        payload: {'score': 9},
      );
      final second = MergeRelayEventOutbox(
        gateway: gateway,
        store: FileMergeRelayOutboxStore(file),
        clock: clock,
        socialEnabled: true,
      );
      expect(await second.flush(), 1);
      expect(gateway.postedEvents.single.payload['score'], 9);
      file.writeAsStringSync('{not json');
      expect(await FileMergeRelayOutboxStore(file).read(), isEmpty);
    },
  );
}

Future<MergeRelayConfigRevision> _config(
  FakeRelayGateway gateway, {
  required bool active,
}) async {
  gateway.configOverride = null;
  final base = await gateway.getConfig();
  return MergeRelayConfigRevision(
    revision: base.revision,
    rulesVersion: base.rulesVersion,
    contentRevision: base.contentRevision,
    spawnWeights: base.spawnWeights,
    features: base.features,
    active: active,
    createdAt: base.createdAt,
  );
}
