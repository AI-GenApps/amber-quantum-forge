/// Crash-reporting seam for Glow Rescue (task 24, release readiness).
///
/// v1 ships wired to [NoOpCrashReporter] only: **no crash-reporting SDK is
/// bundled**, so no crash, ANR, breadcrumb, or error text ever leaves the
/// device. This interface exists so a real backend (Firebase Crashlytics or
/// Sentry — an open human decision, see
/// `.agents/games/merge-relay/open-questions.md`) can be dropped in behind
/// `main.dart`'s error-zone wiring later without touching any call site,
/// and so that decision never needs an SDK that requires build-time
/// credentials just to compile.
abstract interface class MergeRelayCrashReporter {
  /// The shared no-op instance every call site should default to in v1.
  static const MergeRelayCrashReporter noOp = NoOpCrashReporter();

  /// Records an error the app caught (or a fatal one from a global error
  /// handler). [context] is a short, static label ("flutter_error",
  /// "platform_dispatcher") — never free text, tokens, or anything that
  /// could identify a player.
  void recordError(
    Object error,
    StackTrace? stackTrace, {
    String? context,
    bool fatal = false,
  });

  /// Attaches a short, static breadcrumb ahead of a future crash report.
  void log(String message);
}

/// The only [MergeRelayCrashReporter] wired into the shipped v1 app: every
/// method is a no-op. Nothing is captured, stored, or transmitted.
final class NoOpCrashReporter implements MergeRelayCrashReporter {
  const NoOpCrashReporter();

  @override
  void recordError(
    Object error,
    StackTrace? stackTrace, {
    String? context,
    bool fatal = false,
  }) {}

  @override
  void log(String message) {}
}

/// An in-memory [MergeRelayCrashReporter] for tests: it never leaves the
/// process, but it records what was reported so a test can assert on it —
/// the same pattern as `platform_core`'s `MemoryTelemetrySink`.
final class MemoryCrashReporter implements MergeRelayCrashReporter {
  final List<MergeRelayCrashRecord> records = [];
  final List<String> breadcrumbs = [];

  @override
  void recordError(
    Object error,
    StackTrace? stackTrace, {
    String? context,
    bool fatal = false,
  }) {
    records.add(
      MergeRelayCrashRecord(
        error: error,
        stackTrace: stackTrace,
        context: context,
        fatal: fatal,
      ),
    );
  }

  @override
  void log(String message) {
    breadcrumbs.add(message);
  }
}

final class MergeRelayCrashRecord {
  const MergeRelayCrashRecord({
    required this.error,
    required this.stackTrace,
    this.context,
    this.fatal = false,
  });

  final Object error;
  final StackTrace? stackTrace;
  final String? context;
  final bool fatal;
}
