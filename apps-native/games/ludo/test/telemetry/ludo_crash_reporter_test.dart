import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/telemetry/ludo_crash_reporter.dart';

final class _RecordingClient implements LudoCrashlyticsClient {
  _RecordingClient({this.failEverything = false});

  final bool failEverything;
  final List<String> calls = [];
  bool? collectionEnabled;

  Future<void> _record(String call) async {
    calls.add(call);
    if (failEverything) throw StateError('plugin failure');
  }

  @override
  Future<void> setCollectionEnabled(bool enabled) async {
    collectionEnabled = enabled;
    await _record('setCollectionEnabled');
  }

  @override
  Future<void> recordFlutterError(
    FlutterErrorDetails details, {
    required bool fatal,
  }) => _record('flutterError:$fatal');

  @override
  Future<void> recordError(
    Object error,
    StackTrace? stack, {
    String? reason,
    required bool fatal,
  }) => _record('error:$fatal:${reason ?? ''}');

  @override
  Future<void> log(String message) => _record('log:$message');
}

final class _ThrowingReporter implements LudoCrashReporter {
  @override
  Future<void> recordFlutterError(
    FlutterErrorDetails details, {
    bool fatal = false,
  }) => throw StateError('sync failure');

  @override
  Future<void> recordError(
    Object error,
    StackTrace? stack, {
    String? reason,
    bool fatal = false,
  }) => Future<void>.error(StateError('async failure'));

  @override
  Future<void> log(String message) => throw StateError('sync failure');
}

void main() {
  group('NullCrashReporter', () {
    test('absorbs every call without throwing', () async {
      const reporter = NullCrashReporter();
      await reporter.recordFlutterError(
        FlutterErrorDetails(exception: StateError('x')),
        fatal: true,
      );
      await reporter.recordError(StateError('x'), StackTrace.current);
      await reporter.recordError('plain', null, reason: 'because', fatal: true);
      await reporter.log('breadcrumb');
    });
  });

  group('createLudoCrashReporter', () {
    test('picks NullCrashReporter when Firebase config is absent', () {
      final client = _RecordingClient();
      final reporter = createLudoCrashReporter(
        firebaseAvailable: false,
        client: client,
      );
      expect(reporter, isA<NullCrashReporter>());
      expect(client.calls, isEmpty);
    });

    test('picks FirebaseCrashlyticsReporter when Firebase is present', () {
      final reporter = createLudoCrashReporter(
        firebaseAvailable: true,
        client: _RecordingClient(),
      );
      expect(reporter, isA<FirebaseCrashlyticsReporter>());
    });

    test('defaults to NullCrashReporter when Firebase is not initialized', () {
      expect(createLudoCrashReporter(), isA<NullCrashReporter>());
    });
  });

  group('FirebaseCrashlyticsReporter', () {
    test('delegates to the client and disables collection in debug', () async {
      final client = _RecordingClient();
      final reporter = FirebaseCrashlyticsReporter(client: client);
      await reporter.log('hello');
      await reporter.recordError(StateError('x'), null, reason: 'r');
      await reporter.recordFlutterError(
        FlutterErrorDetails(exception: StateError('x')),
        fatal: true,
      );
      expect(client.collectionEnabled, isFalse);
      expect(
        client.calls,
        containsAll(<String>[
          'log:hello',
          'error:false:r',
          'flutterError:true',
        ]),
      );
    });

    test('enables collection when asked (release)', () {
      final client = _RecordingClient();
      FirebaseCrashlyticsReporter(client: client, collectionEnabled: true);
      expect(client.collectionEnabled, isTrue);
    });

    test('swallows every plugin failure', () async {
      final reporter = FirebaseCrashlyticsReporter(
        client: _RecordingClient(failEverything: true),
      );
      await reporter.log('x');
      await reporter.recordError(StateError('x'), StackTrace.current);
      await reporter.recordFlutterError(
        FlutterErrorDetails(exception: StateError('x')),
      );
    });
  });

  group('LudoCrashReporting handlers', () {
    late FlutterExceptionHandler? savedFlutterHandler;
    late bool Function(Object, StackTrace)? savedPlatformHandler;

    setUp(() {
      savedFlutterHandler = FlutterError.onError;
      savedPlatformHandler = PlatformDispatcher.instance.onError;
    });

    tearDown(() {
      FlutterError.onError = savedFlutterHandler;
      PlatformDispatcher.instance.onError = savedPlatformHandler;
      LudoCrashReporting.instance.activate(const NullCrashReporter());
    });

    test('forward to the active reporter and chain the old handler', () async {
      var previousCalls = 0;
      FlutterError.onError = (_) => previousCalls++;
      final client = _RecordingClient();
      LudoCrashReporting.instance.install();
      LudoCrashReporting.instance.activate(
        FirebaseCrashlyticsReporter(client: client),
      );
      client.calls.clear();

      FlutterError.onError!(FlutterErrorDetails(exception: StateError('f')));
      final handled = PlatformDispatcher.instance.onError!(
        StateError('p'),
        StackTrace.current,
      );
      await Future<void>.delayed(Duration.zero);

      expect(handled, isTrue);
      expect(previousCalls, 1);
      expect(
        client.calls,
        containsAll(<String>['flutterError:true', 'error:true:']),
      );
    });

    test('a failing reporter never breaks error handling', () async {
      var previousCalls = 0;
      FlutterError.onError = (_) => previousCalls++;
      LudoCrashReporting.instance.install();
      LudoCrashReporting.instance.activate(_ThrowingReporter());

      FlutterError.onError!(FlutterErrorDetails(exception: StateError('f')));
      final handled = PlatformDispatcher.instance.onError!(
        StateError('p'),
        StackTrace.current,
      );
      await Future<void>.delayed(Duration.zero);

      expect(handled, isTrue);
      expect(previousCalls, 1);
    });

    test('starts as Null and activate swaps the reporter', () {
      expect(LudoCrashReporting.instance.reporter, isA<NullCrashReporter>());
      final real = FirebaseCrashlyticsReporter(client: _RecordingClient());
      LudoCrashReporting.instance.activate(real);
      expect(LudoCrashReporting.instance.reporter, same(real));
    });
  });
}
