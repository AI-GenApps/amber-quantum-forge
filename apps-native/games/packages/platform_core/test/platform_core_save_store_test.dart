import 'dart:io';

import 'package:platform_core/platform_core.dart';
import 'package:test/test.dart';

import 'platform_core_test_support.dart';

void main() {
  test('save namespaces isolate app and environment', () async {
    final debug = context(AppEnvironment.debug);
    final staging = context(AppEnvironment.staging);
    final store = MemorySaveStore();
    final envelope = SaveEnvelope.create(
      context: debug,
      schemaVersion: 1,
      savedAt: DateTime.utc(2026, 1, 1),
      payload: {'score': 12},
    );

    await store.write(debug, envelope);

    expect(await store.read(debug), isNotNull);
    expect(await store.read(staging), isNull);
    expect(envelope.namespace, 'games.merge_relay.debug');
    expect(envelope.toJson()['environment'], 'debug');
  });

  test(
    'memory save store isolates payload mutations across writes and reads',
    () async {
      final debug = context(AppEnvironment.debug);
      final store = MemorySaveStore();
      final payload = <String, Object?>{
        'nested': {'score': 12},
        'moves': [1, 2],
      };
      final envelope = SaveEnvelope.create(
        context: debug,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026, 1, 1),
        payload: payload,
      );

      await store.write(debug, envelope);
      (payload['nested'] as Map<String, Object?>)['score'] = 99;
      (payload['moves'] as List<Object?>)[0] = 99;
      final firstRead = await store.read(debug);
      expect((firstRead!.payload['nested'] as Map)['score'], 12);
      expect((firstRead.payload['moves'] as List).first, 1);

      (firstRead.payload['nested'] as Map<String, Object?>)['score'] = 77;
      (firstRead.payload['moves'] as List<Object?>)[0] = 77;
      final secondRead = await store.read(debug);
      expect((secondRead!.payload['nested'] as Map)['score'], 12);
      expect((secondRead.payload['moves'] as List).first, 1);
    },
  );

  test(
    'file save store persists only the selected environment namespace',
    () async {
      final root = await Directory.systemTemp.createTemp('games-save-test-');
      addTearDown(() => root.delete(recursive: true));
      final debug = context(AppEnvironment.debug);
      final staging = context(AppEnvironment.staging);
      final envelope = SaveEnvelope.create(
        context: debug,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026, 1, 1),
        payload: {'score': 18},
      );
      final store = JsonFileSaveStore(root: root);

      await store.write(debug, envelope);

      expect((await store.read(debug))?.payload['score'], 18);
      expect(await store.read(staging), isNull);
    },
  );

  test('file save store serializes interleaved namespace operations', () async {
    final root = await Directory.systemTemp.createTemp('games-save-queue-');
    addTearDown(() => root.delete(recursive: true));
    final debug = context(AppEnvironment.debug);
    final store = JsonFileSaveStore(root: root);
    final writes = List.generate(
      80,
      (index) => store.write(
        debug,
        SaveEnvelope.create(
          context: debug,
          schemaVersion: 1,
          savedAt: DateTime.utc(2026, 1, 1).add(Duration(milliseconds: index)),
          payload: {'score': index},
        ),
      ),
    );
    final reads = List.generate(40, (_) => store.read(debug));

    await Future.wait([...writes, ...reads]);

    final finalEnvelope = await store.read(debug);
    expect(finalEnvelope, isNotNull);
    expect(finalEnvelope!.payload['score'], inInclusiveRange(0, 79));

    await Future.wait([
      store.write(
        debug,
        SaveEnvelope.create(
          context: debug,
          schemaVersion: 1,
          savedAt: DateTime.utc(2026, 1, 2),
          payload: {'score': 100},
        ),
      ),
      store.delete(debug),
    ]);
    expect(await store.read(debug), isNull);
  });

  test('separate file store owners keep concurrent snapshots valid', () async {
    final root = await Directory.systemTemp.createTemp('games-save-owners-');
    addTearDown(() => root.delete(recursive: true));
    final debug = context(AppEnvironment.debug);
    final first = JsonFileSaveStore(root: root);
    final second = JsonFileSaveStore(root: root);
    final writes = <Future<void>>[];
    for (var index = 0; index < 24; index += 1) {
      final store = index.isEven ? first : second;
      writes.add(
        store.write(
          debug,
          SaveEnvelope.create(
            context: debug,
            schemaVersion: 1,
            savedAt: DateTime.utc(
              2026,
              1,
              3,
            ).add(Duration(milliseconds: index)),
            payload: {'score': index},
          ),
        ),
      );
    }

    await Future.wait(writes);

    final envelope = await first.read(debug);
    expect(envelope, isNotNull);
    expect(envelope!.payload['score'], inInclusiveRange(0, 23));
  });

  test(
    'file save queue recovers after malformed and oversized reads',
    () async {
      final root = await Directory.systemTemp.createTemp('games-save-failure-');
      addTearDown(() => root.delete(recursive: true));
      final debug = context(AppEnvironment.debug);
      final store = JsonFileSaveStore(root: root);
      final path = File('${root.path}/games.merge_relay.debug.json');

      await root.create(recursive: true);
      await path.writeAsString('{');
      await expectLater(store.read(debug), throwsA(isA<FormatException>()));
      await store.delete(debug);
      expect(await store.read(debug), isNull);

      await path.writeAsString('x' * (maxSaveEnvelopeBytes + 1));
      await expectLater(
        store.read(debug),
        throwsA(isA<SaveValidationException>()),
      );
      await store.delete(debug);
      expect(await store.read(debug), isNull);
    },
  );
}
