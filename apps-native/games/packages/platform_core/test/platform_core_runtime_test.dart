import 'package:platform_core/platform_core.dart';
import 'package:test/test.dart';

import 'platform_core_test_support.dart';

void main() {
  test(
    'runtime context uses generated identity and validated build defines',
    () {
      final runtime = runtimeAppContext(
        identity: appIdentityFor('merge_relay'),
      );

      expect(runtime.identity.canonicalName, 'Merge Relay');
      expect(runtime.identity.publicTitle, 'Merge Relay');
      expect(runtime.environment, parseAppEnvironment(gameEnvironmentDefine));
      expect(runtime.appVersion, appVersionDefine);
      expect(() => parseAppEnvironment('qa'), throwsArgumentError);
      expect(
        () => AppContext(
          identity: runtime.identity,
          environment: runtime.environment,
          appVersion: 'development',
          sessionId: runtime.sessionId,
        ).validate(),
        throwsStateError,
      );
    },
  );

  test('checksum fixture stays a bounded unsigned 32-bit value', () {
    final envelope = SaveEnvelope.create(
      context: context(AppEnvironment.debug),
      schemaVersion: 1,
      savedAt: DateTime.utc(2026, 1, 1),
      payload: {'score': 12},
    );

    expect(envelope.computeChecksum(), 'f4aaf8f2');
    expect(
      SaveEnvelope.decode(envelope.encode()).computeChecksum(),
      'f4aaf8f2',
    );
  });

  test('save migration preserves app and environment', () {
    final debug = context(AppEnvironment.debug);
    final envelope = SaveEnvelope.create(
      context: debug,
      schemaVersion: 1,
      savedAt: DateTime.utc(2026, 1, 1),
      payload: {'score': 12},
    );

    final migrated = envelope.migrate(
      context: debug,
      targetVersion: 2,
      migrations: {
        1: (payload) => {...payload, 'moves': 3},
      },
    );

    expect(migrated.schemaVersion, 2);
    expect(migrated.payload['moves'], 3);
    expect(migrated.appId, envelope.appId);
    expect(migrated.environment, envelope.environment);
    expect(migrated.namespace, envelope.namespace);
  });

  test('current schema does not rerun migrations', () {
    final debug = context(AppEnvironment.debug);
    final envelope = SaveEnvelope.create(
      context: debug,
      schemaVersion: 2,
      savedAt: DateTime.utc(2026, 1, 1),
      payload: {'score': 12},
    );

    final migrated = envelope.migrate(
      context: debug,
      targetVersion: 2,
      migrations: {1: (_) => fail('migration should not run')},
    );

    expect(migrated, same(envelope));
  });

  test('deterministic rng is versioned and bounded', () {
    final first = DeterministicRng(1234);
    final second = DeterministicRng(1234);
    final firstValues = List.generate(8, (_) => first.nextUint32());
    final secondValues = List.generate(8, (_) => second.nextUint32());

    expect(DeterministicRng.algorithm, 'xorshift32-v1');
    expect(firstValues, secondValues);
    expect(
      firstValues.every((value) => value > 0 && value <= 0xffffffff),
      isTrue,
    );
    expect(first.snapshot()['state'], first.state32);
  });

  test('telemetry redacts unsafe values and keeps context', () {
    final clock = FixedClock(DateTime.utc(2026, 1, 1));
    final sink = MemoryTelemetrySink();
    final recorder = TelemetryRecorder(
      context: context(AppEnvironment.debug),
      clock: clock,
      sink: sink,
    );

    recorder.record(
      'move_completed',
      fields: {
        'move_count': 2,
        'rawPhoto': 'pixels',
        'details': {'caption': 'private text', 'score': 10},
      },
    );

    final event = sink.events.single;
    expect(event.toJson()['app_id'], 'merge_relay');
    expect(event.toJson()['environment'], 'debug');
    expect(event.fields['rawphoto'], isNull);
    expect((event.fields['details'] as Map)['caption'], '[redacted]');
    expect((event.fields['details'] as Map)['score'], 10);
  });
}
