import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/crash/merge_relay_crash_reporter.dart';

/// Task 24 (release readiness): the crash-reporting seam ships as
/// [NoOpCrashReporter] in v1 — this test locks in that it truly does
/// nothing observable — plus [MemoryCrashReporter], the in-process test
/// double future call sites (and future backend wiring tests) can assert
/// against.
void main() {
  group('NoOpCrashReporter', () {
    test('recordError and log never throw and have no observable effect', () {
      const reporter = MergeRelayCrashReporter.noOp;
      expect(
        () => reporter.recordError(
          Exception('boom'),
          StackTrace.current,
          context: 'unit_test',
          fatal: true,
        ),
        returnsNormally,
      );
      expect(() => reporter.log('breadcrumb'), returnsNormally);
    });

    test('is const, so it never allocates per call site', () {
      expect(
        identical(const NoOpCrashReporter(), const NoOpCrashReporter()),
        isTrue,
      );
    });
  });

  group('MemoryCrashReporter', () {
    test('records errors with their fields', () {
      final reporter = MemoryCrashReporter();
      final stackTrace = StackTrace.current;

      reporter.recordError(
        Exception('boom'),
        stackTrace,
        context: 'flutter_error',
        fatal: true,
      );

      expect(reporter.records, hasLength(1));
      final record = reporter.records.single;
      expect(record.error, isA<Exception>());
      expect(record.stackTrace, stackTrace);
      expect(record.context, 'flutter_error');
      expect(record.fatal, isTrue);
    });

    test('defaults fatal to false and context to null', () {
      final reporter = MemoryCrashReporter();
      reporter.recordError(Exception('boom'), null);

      final record = reporter.records.single;
      expect(record.fatal, isFalse);
      expect(record.context, isNull);
    });

    test('records breadcrumbs in order', () {
      final reporter = MemoryCrashReporter();
      reporter.log('a');
      reporter.log('b');
      expect(reporter.breadcrumbs, ['a', 'b']);
    });
  });
}
