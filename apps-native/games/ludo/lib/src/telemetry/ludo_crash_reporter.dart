/// Crash reporting behind a Firebase-optional interface (task 27).
///
/// Mirrors task 24's guarded-Firebase pattern: the real
/// `firebase_crashlytics` types are referenced only in this file, every
/// other source depends on [LudoCrashReporter], and [createLudoCrashReporter]
/// picks [FirebaseCrashlyticsReporter] only when Firebase initialized
/// successfully (see `ensureLudoFirebaseInitialized`). Without Firebase
/// config the app gets a [NullCrashReporter] that absorbs every call.
///
/// The one hard rule: crash reporting must never itself crash the app.
/// Every [FirebaseCrashlyticsReporter] method swallows its own failures,
/// and [LudoCrashReporting] swallows reporter failures in the global error
/// handlers it installs.
///
/// Privacy: no user identifier, display name or custom key is ever sent.
/// Crashlytics itself attaches crash stack traces, device/OS info and an
/// installation id (declared in `docs-internal/gaming/ludo-data-safety.md`).
/// Collection is disabled in debug builds so developer crashes never reach
/// the console.
library;

import 'package:firebase_core/firebase_core.dart' as fb_core;
import 'package:firebase_crashlytics/firebase_crashlytics.dart' as fb_crash;
import 'package:flutter/foundation.dart';

/// The narrow slice of crash reporting Ludo depends on.
abstract interface class LudoCrashReporter {
  /// Records a Flutter framework error. [fatal] mirrors Crashlytics'
  /// fatal/non-fatal split.
  Future<void> recordFlutterError(
    FlutterErrorDetails details, {
    bool fatal = false,
  });

  /// Records an uncaught or handled error with its [stack].
  Future<void> recordError(
    Object error,
    StackTrace? stack, {
    String? reason,
    bool fatal = false,
  });

  /// Appends a breadcrumb line to the next crash report.
  Future<void> log(String message);
}

/// No-op reporter used when Firebase config is absent. Never throws.
final class NullCrashReporter implements LudoCrashReporter {
  const NullCrashReporter();

  @override
  Future<void> recordFlutterError(
    FlutterErrorDetails details, {
    bool fatal = false,
  }) async {}

  @override
  Future<void> recordError(
    Object error,
    StackTrace? stack, {
    String? reason,
    bool fatal = false,
  }) async {}

  @override
  Future<void> log(String message) async {}
}

/// The narrow slice of `FirebaseCrashlytics` this file calls, so tests can
/// verify delegation and failure-swallowing without a plugin channel.
abstract interface class LudoCrashlyticsClient {
  Future<void> setCollectionEnabled(bool enabled);

  Future<void> recordFlutterError(
    FlutterErrorDetails details, {
    required bool fatal,
  });

  Future<void> recordError(
    Object error,
    StackTrace? stack, {
    String? reason,
    required bool fatal,
  });

  Future<void> log(String message);
}

final class _PluginCrashlyticsClient implements LudoCrashlyticsClient {
  const _PluginCrashlyticsClient();

  fb_crash.FirebaseCrashlytics get _instance =>
      fb_crash.FirebaseCrashlytics.instance;

  @override
  Future<void> setCollectionEnabled(bool enabled) =>
      _instance.setCrashlyticsCollectionEnabled(enabled);

  @override
  Future<void> recordFlutterError(
    FlutterErrorDetails details, {
    required bool fatal,
  }) => fatal
      ? _instance.recordFlutterFatalError(details)
      : _instance.recordFlutterError(details);

  @override
  Future<void> recordError(
    Object error,
    StackTrace? stack, {
    String? reason,
    required bool fatal,
  }) => _instance.recordError(error, stack, reason: reason, fatal: fatal);

  @override
  Future<void> log(String message) => _instance.log(message);
}

/// Production reporter backed by Firebase Crashlytics. Construct it only
/// after Firebase initialized; every method still swallows failures.
final class FirebaseCrashlyticsReporter implements LudoCrashReporter {
  FirebaseCrashlyticsReporter({
    LudoCrashlyticsClient? client,
    bool collectionEnabled = !kDebugMode,
  }) : _client = client ?? const _PluginCrashlyticsClient() {
    _guard(() => _client.setCollectionEnabled(collectionEnabled));
  }

  final LudoCrashlyticsClient _client;

  Future<void> _guard(Future<void> Function() body) async {
    try {
      await body();
    } on Object {
      // Crash reporting must never crash the app.
    }
  }

  @override
  Future<void> recordFlutterError(
    FlutterErrorDetails details, {
    bool fatal = false,
  }) => _guard(() => _client.recordFlutterError(details, fatal: fatal));

  @override
  Future<void> recordError(
    Object error,
    StackTrace? stack, {
    String? reason,
    bool fatal = false,
  }) => _guard(
    () => _client.recordError(error, stack, reason: reason, fatal: fatal),
  );

  @override
  Future<void> log(String message) => _guard(() => _client.log(message));
}

/// Selects the reporter: [FirebaseCrashlyticsReporter] only when Firebase
/// config is present (initialized), otherwise [NullCrashReporter]. A
/// failure constructing the real reporter also degrades to the null one.
LudoCrashReporter createLudoCrashReporter({
  bool? firebaseAvailable,
  LudoCrashlyticsClient? client,
}) {
  final available = firebaseAvailable ?? _firebaseInitialized();
  if (!available) return const NullCrashReporter();
  try {
    return FirebaseCrashlyticsReporter(client: client);
  } on Object {
    return const NullCrashReporter();
  }
}

bool _firebaseInitialized() {
  try {
    return fb_core.Firebase.apps.isNotEmpty;
  } on Object {
    return false;
  }
}

/// Installs the global error handlers once and forwards to whichever
/// reporter is currently active. It starts as [NullCrashReporter] so the
/// handlers can be installed before Firebase finishes initializing; call
/// [activate] once it has.
final class LudoCrashReporting {
  LudoCrashReporting._();

  static final LudoCrashReporting instance = LudoCrashReporting._();

  LudoCrashReporter _reporter = const NullCrashReporter();

  LudoCrashReporter get reporter => _reporter;

  /// Swaps in [reporter]. Safe to call any number of times.
  void activate(LudoCrashReporter reporter) {
    _reporter = reporter;
  }

  /// Installs `FlutterError.onError` and `PlatformDispatcher.onError`,
  /// chaining the previous Flutter handler so console logging is kept.
  void install({PlatformDispatcher? dispatcher}) {
    final previous = FlutterError.onError;
    FlutterError.onError = (details) {
      _safely(() => _reporter.recordFlutterError(details, fatal: true));
      if (previous != null) {
        previous(details);
      } else {
        FlutterError.presentError(details);
      }
    };
    (dispatcher ?? PlatformDispatcher.instance).onError = (error, stack) {
      _safely(() => _reporter.recordError(error, stack, fatal: true));
      return true;
    };
  }

  void _safely(Future<void> Function() body) {
    try {
      body().catchError((Object _) {});
    } on Object {
      // Never let reporting break error handling.
    }
  }
}
