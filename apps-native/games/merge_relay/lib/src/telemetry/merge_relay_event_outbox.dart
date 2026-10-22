import 'dart:async';

import 'package:platform_core/platform_core.dart';

import '../merge_relay_gateway.dart';
import 'merge_relay_outbox_store.dart';

final class MergeRelayOutboxPolicy {
  const MergeRelayOutboxPolicy({
    this.maxEntries = 100,
    this.maxAge = const Duration(days: 7),
    this.maxAttempts = 8,
    this.baseBackoff = const Duration(seconds: 5),
    this.maxBackoff = const Duration(minutes: 5),
    this.batchSize = 20,
  });

  final int maxEntries;
  final Duration maxAge;
  final int maxAttempts;
  final Duration baseBackoff;
  final Duration maxBackoff;
  final int batchSize;

  Duration backoffFor(int attempts) {
    var delay = baseBackoff;
    for (var i = 1; i < attempts && delay < maxBackoff; i += 1) {
      delay *= 2;
    }
    return delay > maxBackoff ? maxBackoff : delay;
  }
}

final class MergeRelayEventOutbox {
  MergeRelayEventOutbox({
    required this.gateway,
    required this.store,
    required this.clock,
    this.socialEnabled = false,
    this.policy = const MergeRelayOutboxPolicy(),
  });

  final MergeRelayGateway gateway;
  final MergeRelayOutboxStore store;
  final Clock clock;
  final bool socialEnabled;
  final MergeRelayOutboxPolicy policy;

  bool online = true;
  bool _killed = false;
  bool _loaded = false;
  bool _flushing = false;
  int _sequence = 0;
  List<MergeRelayOutboxEntry> _entries = [];
  Future<void> _tail = Future<void>.value();

  bool get enabled => socialEnabled && !_killed;

  bool get killed => _killed;

  List<MergeRelayOutboxEntry> get pending => List.unmodifiable(_entries);

  Future<void> applyConfig(MergeRelayConfigRevision? config) {
    final kill = config != null && !config.active;
    if (kill == _killed) return Future<void>.value();
    _killed = kill;
    if (!kill) return Future<void>.value();
    return _serialized(() async {
      await _load();
      _entries = [];
      await store.write(_entries);
    });
  }

  Future<bool> enqueue(
    MergeRelayClientEventType type, {
    Map<String, Object?> payload = const {},
    String? artifactId,
  }) async {
    if (!enabled) return false;
    final now = clock.now();
    _sequence += 1;
    final request = MergeRelayEventRequest(
      idempotencyKey: 'tel.${now.millisecondsSinceEpoch}.$_sequence',
      type: type,
      payload: payload,
      artifactId: artifactId,
    );
    await _serialized(() async {
      await _load();
      _entries = [
        ..._entries,
        MergeRelayOutboxEntry(request: request, createdAt: now),
      ];
      _prune(now);
      await store.write(_entries);
    });
    return true;
  }

  Future<int> flush() async {
    if (!enabled || !online || _flushing) return 0;
    _flushing = true;
    var sent = 0;
    try {
      await _serialized(() async {
        await _load();
        _prune(clock.now());
        sent = await _drain();
        await store.write(_entries);
      });
    } finally {
      _flushing = false;
    }
    return sent;
  }

  Future<int> _drain() async {
    var sent = 0;
    while (_entries.isNotEmpty && sent < policy.batchSize) {
      if (!enabled || !online) break;
      final head = _entries.first;
      final now = clock.now();
      if (head.nextAttemptAt != null && head.nextAttemptAt!.isAfter(now)) {
        break;
      }
      try {
        await gateway.postEvent(head.request);
        _entries = _entries.sublist(1);
        sent += 1;
      } on MergeRelayApiException catch (error) {
        if (_isPermanent(error)) {
          _entries = _entries.sublist(1);
          continue;
        }
        _retryLater(head, now);
        break;
      } on Object {
        _retryLater(head, now);
        break;
      }
    }
    return sent;
  }

  void _retryLater(MergeRelayOutboxEntry head, DateTime now) {
    final attempts = head.attempts + 1;
    if (attempts >= policy.maxAttempts) {
      _entries = _entries.sublist(1);
      return;
    }
    _entries = [
      head.retried(attempts, now.add(policy.backoffFor(attempts))),
      ..._entries.sublist(1),
    ];
  }

  bool _isPermanent(MergeRelayApiException error) =>
      error.statusCode >= 400 &&
      error.statusCode < 500 &&
      error.statusCode != 401 &&
      error.statusCode != 408 &&
      error.statusCode != 429;

  void _prune(DateTime now) {
    final cutoff = now.subtract(policy.maxAge);
    var kept = _entries.where((e) => !e.createdAt.isBefore(cutoff)).toList();
    if (kept.length > policy.maxEntries) {
      kept = kept.sublist(kept.length - policy.maxEntries);
    }
    _entries = kept;
  }

  Future<void> _load() async {
    if (_loaded) return;
    _loaded = true;
    try {
      _entries = await store.read();
    } on Object {
      _entries = [];
    }
  }

  Future<void> _serialized(Future<void> Function() action) {
    final next = _tail.then((_) => action());
    _tail = next.catchError((Object _) {});
    return next;
  }
}
