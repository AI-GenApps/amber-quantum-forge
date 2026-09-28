import 'dart:async';

import 'package:flutter/material.dart';
import 'package:platform_core/platform_core.dart';

import 'src/assets/mr_bitmap_art_cache.dart';
import 'src/crash/merge_relay_crash_reporter.dart';
import 'src/merge_relay_app.dart';
import 'src/merge_relay_client.dart';
import 'src/merge_relay_content.dart';
import 'src/merge_relay_features.dart';
import 'src/save_adapter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Task 24: route uncaught Flutter/platform errors through the
  // crash-reporting seam. v1 wires only `NoOpCrashReporter` (see
  // `src/crash/merge_relay_crash_reporter.dart`) — no data leaves the
  // device — but every crash path already flows through one place, so
  // swapping in a real backend later needs no call-site changes.
  const crashReporter = MergeRelayCrashReporter.noOp;
  final previousOnError = FlutterError.onError;
  FlutterError.onError = (details) {
    crashReporter.recordError(
      details.exception,
      details.stack,
      context: 'flutter_error',
      fatal: true,
    );
    (previousOnError ?? FlutterError.presentError)(details);
  };
  WidgetsBinding.instance.platformDispatcher.onError = (error, stack) {
    crashReporter.recordError(
      error,
      stack,
      context: 'platform_dispatcher',
      fatal: true,
    );
    return true;
  };
  // Task 23: kick off the tile/board-frame bitmap decode as early as
  // possible (in parallel with the content/save-store loads below) so it's
  // already warm by the time the player opens Play, rather than only
  // starting once `MergeRelayBoard` first mounts.
  unawaited(MrBitmapArtCache.instance.ensureLoaded());
  final saveStore = await createMergeRelaySaveStore();
  MergeRelayContentCatalog? content;
  String? contentError;
  try {
    content = await MergeRelayContentCatalog.load();
  } on MergeRelayContentLoadException catch (error) {
    contentError = error.toString();
  }
  final context = runtimeAppContext(identity: mergeRelayIdentity);
  const features = MergeRelayFeatures();
  final relayClient = contentError == null
      ? createMergeRelayClient(
          context: context,
          saveStore: saveStore,
          features: features,
        )
      : null;
  runApp(
    MergeRelayApp(
      content: content,
      contentError: contentError,
      saveStore: relayClient?.saveStore ?? saveStore,
      relayController: relayClient?.controller,
      features: features,
    ),
  );
}
