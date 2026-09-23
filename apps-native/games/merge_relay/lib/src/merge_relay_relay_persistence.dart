import 'dart:async';

import 'package:platform_core/platform_core.dart';

import 'merge_relay_relay_models.dart';

abstract interface class MergeRelayRelayStateStore {
  Future<MergeRelayRelayLocalState?> readRelay(AppContext context);

  Future<void> writeRelay(AppContext context, MergeRelayRelayLocalState state);
}

final class MemoryMergeRelayRelayStateStore
    implements MergeRelayRelayStateStore {
  MergeRelayRelayLocalState? _state;

  @override
  Future<MergeRelayRelayLocalState?> readRelay(AppContext context) async =>
      _state;

  @override
  Future<void> writeRelay(
    AppContext context,
    MergeRelayRelayLocalState state,
  ) async {
    _state = state;
  }
}

final class MergeRelayCompositeSaveStore
    implements SaveStore, MergeRelayRelayStateStore {
  MergeRelayCompositeSaveStore({
    required this.delegate,
    this.clock = const SystemClock(),
  });

  final SaveStore delegate;
  final Clock clock;
  Object? _relayRaw;
  SaveEnvelope? _latestEnvelope;
  String? _contextKey;
  bool _loaded = false;
  Future<void> _writeTail = Future<void>.value();

  @override
  Future<SaveEnvelope?> read(AppContext context) => _enqueue(() async {
    final envelope = await delegate.read(context);
    _setCache(context, envelope);
    return envelope;
  });

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) =>
      _enqueue(() async {
        await _load(context);
        final next = _withRelay(context, envelope);
        await delegate.write(context, next);
        _setCache(context, next);
      });

  @override
  Future<void> delete(AppContext context) => _enqueue(() async {
    await delegate.delete(context);
    _relayRaw = null;
    _latestEnvelope = null;
    _contextKey = _keyFor(context);
    _loaded = true;
  });

  @override
  Future<MergeRelayRelayLocalState?> readRelay(AppContext context) =>
      _enqueue(() async {
        await _load(context);
        final raw = _relayRaw;
        if (raw == null) return null;
        return MergeRelayRelayLocalState.fromJson(raw);
      });

  @override
  Future<void> writeRelay(
    AppContext context,
    MergeRelayRelayLocalState state,
  ) => _enqueue(() async {
    await _load(context);
    final envelope = await delegate.read(context) ?? _latestEnvelope;
    final payload = <String, Object?>{
      if (envelope != null) ...envelope.payload,
      'relay_state': state.toJson(),
    };
    final next = SaveEnvelope.create(
      context: context,
      schemaVersion: envelope?.schemaVersion ?? 1,
      savedAt: clock.now(),
      payload: payload,
    );
    await delegate.write(context, next);
    _setCache(context, next);
  });

  Future<void> _load(AppContext context) async {
    final key = _keyFor(context);
    if (_loaded && _contextKey == key) return;
    final envelope = await delegate.read(context);
    _setCache(context, envelope);
  }

  Future<T> _enqueue<T>(Future<T> Function() operation) {
    final result = Completer<T>();
    final prior = _writeTail.catchError((_) {});
    final next = prior.then<void>((_) async {
      try {
        result.complete(await operation());
      } on Object catch (error, stackTrace) {
        result.completeError(error, stackTrace);
      }
    });
    _writeTail = next.catchError((_) {});
    return result.future;
  }

  void _setCache(AppContext context, SaveEnvelope? envelope) {
    _contextKey = _keyFor(context);
    _latestEnvelope = envelope;
    _relayRaw = envelope?.payload['relay_state'];
    _loaded = true;
  }

  String _keyFor(AppContext context) =>
      '${context.identity.stableId}:${context.environment.name}:${context.identity.saveNamespaceFor(context.environment)}';

  SaveEnvelope _withRelay(AppContext context, SaveEnvelope envelope) {
    final payload = <String, Object?>{
      ...envelope.payload,
      if (_relayRaw != null) 'relay_state': _relayRaw,
    };
    return SaveEnvelope.create(
      context: context,
      schemaVersion: envelope.schemaVersion,
      savedAt: envelope.savedAt,
      payload: payload,
    );
  }
}
