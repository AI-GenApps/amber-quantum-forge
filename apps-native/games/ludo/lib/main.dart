import 'dart:async' show unawaited;

import 'package:flutter/material.dart';

import 'src/app.dart';
import 'src/net/ludo_ads.dart' show prepareLudoAdsConsent;
import 'src/net/ludo_deep_link_bootstrap.dart' show wireLudoDeepLinks;
import 'src/net/ludo_firebase_gateway.dart' show ensureLudoFirebaseInitialized;
import 'src/telemetry/ludo_crash_reporter.dart'
    show LudoCrashReporting, createLudoCrashReporter;

void main() {
  // Guarded, optional bootstrap: nothing here depends on Firebase or any
  // network/config service. The app must boot straight to local/offline
  // modes even when no Firebase config (e.g. google-services.json) is
  // present.
  WidgetsFlutterBinding.ensureInitialized();
  // Task 27: install the global error handlers first so framework and
  // platform errors during startup are not lost. They forward to a
  // `NullCrashReporter` until Firebase initializes (below), and a failing
  // reporter never breaks error handling.
  LudoCrashReporting.instance.install();
  // Fire-and-forget: `ensureLudoFirebaseInitialized` never throws (it
  // swallows and reports `false` for a missing/invalid Firebase config),
  // and nothing in `runApp` below waits on it — every local mode (Computer,
  // Pass N Play) works whether this resolves `true` or `false`. Only the
  // guest/Google online auth flow (`LudoAuthController`, task 24) and the
  // still-disabled Online/Play-with-Friends lobby tiles (task 08, enabled
  // in task 26) depend on its result, and both re-check availability
  // lazily rather than blocking startup on it.
  unawaited(_initFirebaseAndCrashReporting());
  // Same "fire-and-forget, never gates startup" contract (task 26x): a
  // routed room-invite code only ever reaches `HomeLobbyScreen` once it is
  // mounted and online is available (see `ludo_deep_link_router.dart`),
  // never blocking the local/offline modes this app boots straight to.
  unawaited(wireLudoDeepLinks());
  // Task 26h: refresh Google UMP consent info in the background (no form is
  // shown here; the consent form appears just before the first rewarded ad
  // request). Same "never throws, never gates startup" contract: with ads
  // unconfigured or on an unsupported platform this is a no-op.
  unawaited(prepareLudoAdsConsent());
  runApp(const LudoApp());
}

/// Initializes Firebase, then (only if that succeeded) swaps the real
/// Crashlytics reporter into the already-installed crash handlers. Never
/// throws: with no Firebase config the `NullCrashReporter` stays active.
Future<void> _initFirebaseAndCrashReporting() async {
  final available = await ensureLudoFirebaseInitialized();
  LudoCrashReporting.instance.activate(
    createLudoCrashReporter(firebaseAvailable: available),
  );
}
