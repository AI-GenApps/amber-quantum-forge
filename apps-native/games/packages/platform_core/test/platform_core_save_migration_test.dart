import 'package:platform_core/platform_core.dart';
import 'package:test/test.dart';

import 'platform_core_test_support.dart';

void main() {
  test('migrates a valid save and deletes the source after readback', () async {
    final app = context(AppEnvironment.debug);
    final source = MemorySaveStore();
    final destination = MemorySaveStore();
    await source.write(app, _envelope(app, 7));

    final result = await migrateSaveIfAbsent(
      context: app,
      destination: destination,
      source: source,
    );

    expect(result.status, SaveMigrationStatus.migrated);
    expect((await result.store.read(app))!.payload['score'], 7);
    expect(await source.read(app), isNull);
  });

  test('newer destination wins and source remains available', () async {
    final app = context(AppEnvironment.debug);
    final source = MemorySaveStore();
    final destination = MemorySaveStore();
    await source.write(
      app,
      _envelope(app, 7, savedAt: DateTime.utc(2026, 1, 1)),
    );
    await destination.write(
      app,
      _envelope(app, 9, savedAt: DateTime.utc(2026, 1, 2)),
    );

    final result = await migrateSaveIfAbsent(
      context: app,
      destination: destination,
      source: source,
    );

    expect(result.status, SaveMigrationStatus.destinationPresent);
    expect((await result.store.read(app))!.payload['score'], 9);
    expect((await source.read(app))!.payload['score'], 7);
  });

  test('source context isolation prevents cross-app migration', () async {
    final merge = context(AppEnvironment.debug);
    final pocket = AppContext(
      identity: const AppIdentity(
        stableId: 'pocket_biome',
        canonicalName: 'Pocket Biome',
        publicTitle: 'Pocket Biome',
        subtitle: 'Grow tiny worlds',
      ),
      environment: AppEnvironment.debug,
      appVersion: '0.1.0',
      sessionId: 'test-session',
    );
    final source = MemorySaveStore();
    final destination = MemorySaveStore();
    await source.write(merge, _envelope(merge, 7));

    final result = await migrateSaveIfAbsent(
      context: pocket,
      destination: destination,
      source: source,
    );

    expect(result.status, SaveMigrationStatus.noLegacySave);
    expect(await destination.read(pocket), isNull);
    expect(await source.read(merge), isNotNull);
  });

  test('source failure leaves the destination empty', () async {
    final app = context(AppEnvironment.debug);
    final destination = MemorySaveStore();

    final result = await migrateSaveIfAbsent(
      context: app,
      destination: destination,
      source: _ReadFailingStore(),
    );

    expect(result.status, SaveMigrationStatus.sourceReadFailed);
    expect(await destination.read(app), isNull);
  });

  test(
    'destination write failure keeps legacy readable and writes fail',
    () async {
      final app = context(AppEnvironment.debug);
      final source = MemorySaveStore();
      await source.write(app, _envelope(app, 7));

      final result = await migrateSaveIfAbsent(
        context: app,
        destination: _WriteFailingStore(),
        source: source,
      );

      expect(result.status, SaveMigrationStatus.legacyFallback);
      expect((await result.store.read(app))!.payload['score'], 7);
      await expectLater(
        result.store.write(app, _envelope(app, 8)),
        throwsA(isA<StateError>()),
      );
      expect((await source.read(app))!.payload['score'], 7);
    },
  );

  test(
    'readback failure keeps legacy readable and preserves the source',
    () async {
      final app = context(AppEnvironment.debug);
      final source = MemorySaveStore();
      final destination = _ReadbackFailingStore();
      await source.write(app, _envelope(app, 7));

      final result = await migrateSaveIfAbsent(
        context: app,
        destination: destination,
        source: source,
      );

      expect(result.status, SaveMigrationStatus.legacyFallback);
      expect((await result.store.read(app))!.payload['score'], 7);
      expect((await source.read(app))!.payload['score'], 7);
    },
  );

  test(
    'fallback retries with the latest write and then cleans the source',
    () async {
      final app = context(AppEnvironment.debug);
      final source = MemorySaveStore();
      final destination = _FailOnceWriteStore();
      await source.write(app, _envelope(app, 7));

      final result = await migrateSaveIfAbsent(
        context: app,
        destination: destination,
        source: source,
      );

      expect(result.status, SaveMigrationStatus.legacyFallback);
      expect((await result.store.read(app))!.payload['score'], 7);
      await result.store.write(
        app,
        _envelope(app, 11, savedAt: DateTime.utc(2026, 1, 3)),
      );

      expect((await result.store.read(app))!.payload['score'], 11);
      expect(await source.read(app), isNull);
    },
  );

  test(
    'authoritative destination read allows later updates after readback failure',
    () async {
      final app = context(AppEnvironment.debug);
      final source = MemorySaveStore();
      final destination = _ReadbackFailingStore();
      await source.write(app, _envelope(app, 7));

      final result = await migrateSaveIfAbsent(
        context: app,
        destination: destination,
        source: source,
      );

      expect((await result.store.read(app))!.payload['score'], 7);
      expect((await result.store.read(app))!.payload['score'], 7);
      await result.store.write(
        app,
        _envelope(app, 13, savedAt: DateTime.utc(2026, 1, 4)),
      );

      expect((await destination.read(app))!.payload['score'], 13);
    },
  );

  test('foreign writes and deletes do not clear the bound fallback', () async {
    final app = context(AppEnvironment.debug);
    final foreign = AppContext(
      identity: const AppIdentity(
        stableId: 'pocket_biome',
        canonicalName: 'Pocket Biome',
        publicTitle: 'Pocket Biome',
        subtitle: 'Grow tiny worlds',
      ),
      environment: AppEnvironment.debug,
      appVersion: '0.1.0',
      sessionId: 'test-session',
    );
    final source = MemorySaveStore();
    final destination = _FailOnceWriteStore();
    await source.write(app, _envelope(app, 7));

    final result = await migrateSaveIfAbsent(
      context: app,
      destination: destination,
      source: source,
    );
    await result.store.write(foreign, _envelope(foreign, 17));

    expect((await destination.read(foreign))!.payload['score'], 17);
    expect((await result.store.read(app))!.payload['score'], 7);
    await result.store.delete(foreign);

    expect(await destination.read(foreign), isNull);
    expect((await result.store.read(app))!.payload['score'], 7);
    expect(await source.read(app), isNotNull);
  });
}

SaveEnvelope _envelope(AppContext app, int score, {DateTime? savedAt}) {
  return SaveEnvelope.create(
    context: app,
    schemaVersion: 1,
    savedAt: savedAt ?? DateTime.utc(2026, 1, 1),
    payload: {'score': score},
  );
}

final class _ReadFailingStore implements SaveStore {
  @override
  Future<SaveEnvelope?> read(AppContext context) async {
    throw StateError('source unavailable');
  }

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {}

  @override
  Future<void> delete(AppContext context) async {}
}

final class _WriteFailingStore implements SaveStore {
  @override
  Future<SaveEnvelope?> read(AppContext context) async => null;

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    throw StateError('destination unavailable');
  }

  @override
  Future<void> delete(AppContext context) async {}
}

final class _FailOnceWriteStore implements SaveStore {
  final MemorySaveStore _delegate = MemorySaveStore();
  bool _failWrite = true;

  @override
  Future<SaveEnvelope?> read(AppContext context) => _delegate.read(context);

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    if (_failWrite) {
      _failWrite = false;
      throw StateError('destination temporarily unavailable');
    }
    await _delegate.write(context, envelope);
  }

  @override
  Future<void> delete(AppContext context) => _delegate.delete(context);
}

final class _ReadbackFailingStore implements SaveStore {
  final MemorySaveStore _delegate = MemorySaveStore();
  var _readsToFail = 0;
  var _failedFirstWrite = false;

  @override
  Future<SaveEnvelope?> read(AppContext context) {
    if (_readsToFail > 0) {
      _readsToFail -= 1;
      return Future.error(StateError('readback unavailable'));
    }
    return _delegate.read(context);
  }

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    await _delegate.write(context, envelope);
    if (!_failedFirstWrite) {
      _failedFirstWrite = true;
      _readsToFail = 2;
    }
  }

  @override
  Future<void> delete(AppContext context) => _delegate.delete(context);
}
