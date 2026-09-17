import 'dart:io';

import 'package:platform_core/platform_core.dart';
import 'package:test/test.dart';

import 'platform_core_test_support.dart';

void main() {
  test(
    'corrupt destination returns legacy fallback without crossing app scopes',
    () async {
      final root = await Directory.systemTemp.createTemp(
        'games-save-migration-file-',
      );
      addTearDown(() async {
        if (await root.exists()) await root.delete(recursive: true);
      });
      final app = context(AppEnvironment.debug);
      final foreign = _foreignContext();
      final source = JsonFileSaveStore(root: Directory('${root.path}/legacy'));
      final destination = JsonFileSaveStore(
        root: Directory('${root.path}/current'),
      );
      await source.write(app, _envelope(app, 7));
      await source.write(foreign, _envelope(foreign, 17));
      await destination.write(foreign, _envelope(foreign, 19));

      final corruptFile = File(
        '${root.path}/current/${app.identity.saveNamespaceFor(app.environment)}.json',
      );
      await corruptFile.parent.create(recursive: true);
      await corruptFile.writeAsString('{corrupt');

      final result = await migrateSaveIfAbsent(
        context: app,
        destination: destination,
        source: source,
      );

      expect(result.status, SaveMigrationStatus.legacyFallback);
      expect(result.error, isA<FormatException>());
      expect((await result.store.read(app))!.payload['score'], 7);
      expect((await result.store.read(foreign))!.payload['score'], 19);
      expect((await source.read(app))!.payload['score'], 7);
      expect((await source.read(foreign))!.payload['score'], 17);
      expect(await corruptFile.readAsString(), '{corrupt');
      await expectLater(
        result.store.write(app, _envelope(app, 8)),
        throwsA(isA<FormatException>()),
      );
      expect((await source.read(app))!.payload['score'], 7);
    },
  );

  test('destination read failure leaves a retryable legacy fallback', () async {
    final app = context(AppEnvironment.debug);
    final source = MemorySaveStore();
    final destination = _FailOnSecondReadStore();
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
  });

  test(
    'a destination found after a read retry remains authoritative',
    () async {
      final app = context(AppEnvironment.debug);
      final source = MemorySaveStore();
      final destination = _FailOnFirstReadStore();
      await source.write(app, _envelope(app, 7));
      await destination.seed(
        app,
        _envelope(app, 19, savedAt: DateTime.utc(2026, 1, 2)),
      );

      final result = await migrateSaveIfAbsent(
        context: app,
        destination: destination,
        source: source,
      );

      expect(result.status, SaveMigrationStatus.destinationPresent);
      expect((await result.store.read(app))!.payload['score'], 19);
      expect((await source.read(app))!.payload['score'], 7);
    },
  );
}

AppContext _foreignContext() {
  return AppContext(
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
}

SaveEnvelope _envelope(AppContext app, int score, {DateTime? savedAt}) {
  return SaveEnvelope.create(
    context: app,
    schemaVersion: 1,
    savedAt: savedAt ?? DateTime.utc(2026, 1, 1),
    payload: {'score': score},
  );
}

final class _FailOnSecondReadStore implements SaveStore {
  final MemorySaveStore _delegate = MemorySaveStore();
  var _readCount = 0;

  @override
  Future<SaveEnvelope?> read(AppContext context) async {
    _readCount += 1;
    if (_readCount == 2) throw StateError('destination temporarily unreadable');
    return _delegate.read(context);
  }

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) {
    return _delegate.write(context, envelope);
  }

  @override
  Future<void> delete(AppContext context) => _delegate.delete(context);
}

final class _FailOnFirstReadStore implements SaveStore {
  final MemorySaveStore _delegate = MemorySaveStore();
  var _failedFirstRead = false;

  Future<void> seed(AppContext context, SaveEnvelope envelope) {
    return _delegate.write(context, envelope);
  }

  @override
  Future<SaveEnvelope?> read(AppContext context) async {
    if (!_failedFirstRead) {
      _failedFirstRead = true;
      throw StateError('destination temporarily unreadable');
    }
    return _delegate.read(context);
  }

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) {
    return _delegate.write(context, envelope);
  }

  @override
  Future<void> delete(AppContext context) => _delegate.delete(context);
}
