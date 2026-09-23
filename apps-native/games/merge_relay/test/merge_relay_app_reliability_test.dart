import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_relay_controller.dart';
import 'package:merge_relay/src/merge_relay_relay_models.dart';
import 'package:merge_relay/src/merge_relay_relay_persistence.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_relay_test_support.dart';

void main() {
  testWidgets('warm challenge links wait for restore before opening', (
    tester,
  ) async {
    final saveStore = _DeferredSaveStore();
    final links = _TestChallengeLinks();
    final controller = MergeRelayRelayController(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      gateway: FakeRelayGateway(),
      authStore: MemoryMergeRelayAuthStore(),
      stateStore: MemoryMergeRelayRelayStateStore(),
    );
    await tester.pumpWidget(
      MergeRelayApp(
        saveStore: saveStore,
        relayController: controller,
        challengeLinks: links,
      ),
    );
    links.emit('mergerelay://challenge/ch_test');
    await tester.pump();
    expect(controller.snapshot.phase, MergeRelayRelayPhase.idle);

    saveStore.complete();
    await tester.pumpAndSettle();

    expect(controller.snapshot.phase, MergeRelayRelayPhase.preview);
    expect(controller.snapshot.preview?.challengeId, 'ch_test');
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('resuming a relay asks the controller to reconnect', (
    tester,
  ) async {
    final fake = FakeRelayGateway();
    final links = _TestChallengeLinks();
    final controller = MergeRelayRelayController(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      gateway: fake,
      authStore: MemoryMergeRelayAuthStore(),
      stateStore: MemoryMergeRelayRelayStateStore(),
    );
    await tester.pumpWidget(
      MergeRelayApp(relayController: controller, challengeLinks: links),
    );
    await tester.pumpAndSettle();
    await controller.bootstrap();
    await controller.openChallenge(fake.challenge.challengeId);
    await controller.reserve();

    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pumpAndSettle();

    expect(fake.getAttemptCalls, 1);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets(
    'incoming link waits through failed restore and replays on retry',
    (tester) async {
      final saveStore = _FailOnceSaveStore();
      final links = _TestChallengeLinks();
      final controller = MergeRelayRelayController(
        context: runtimeAppContext(identity: mergeRelayIdentity),
        gateway: FakeRelayGateway(),
        authStore: MemoryMergeRelayAuthStore(),
        stateStore: MemoryMergeRelayRelayStateStore(),
      );
      await tester.pumpWidget(
        MergeRelayApp(
          saveStore: saveStore,
          relayController: controller,
          challengeLinks: links,
        ),
      );
      await tester.pumpAndSettle();

      links.emit('mergerelay://challenge/ch_test');
      await tester.pump();
      expect(controller.snapshot.phase, MergeRelayRelayPhase.idle);

      await tester.tap(find.text('Retry restore'));
      await tester.pumpAndSettle();

      expect(controller.snapshot.phase, MergeRelayRelayPhase.preview);
      expect(controller.snapshot.preview?.challengeId, 'ch_test');
      await tester.pumpWidget(const SizedBox());
    },
  );

  testWidgets(
    'invalid content renders recovery diagnostic without bootstrapping',
    (tester) async {
      await tester.pumpWidget(
        const MergeRelayApp(contentError: 'invalid rescue envelope'),
      );

      expect(
        find.text(
          'Game content could not be loaded. Close and reopen the app to try again.',
        ),
        findsOneWidget,
      );
      expect(find.textContaining('content_load_failed'), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
    },
  );
}

final class _DeferredSaveStore implements SaveStore {
  final _read = Completer<SaveEnvelope?>();

  void complete() => _read.complete(null);

  @override
  Future<SaveEnvelope?> read(AppContext context) => _read.future;

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {}

  @override
  Future<void> delete(AppContext context) async {}
}

final class _FailOnceSaveStore implements SaveStore {
  var _failRead = true;

  @override
  Future<SaveEnvelope?> read(AppContext context) async {
    if (_failRead) {
      _failRead = false;
      throw StateError('corrupt save');
    }
    return null;
  }

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {}

  @override
  Future<void> delete(AppContext context) async {}
}

final class _TestChallengeLinks implements MergeRelayChallengeLinkSource {
  final _events = StreamController<String>.broadcast(sync: true);

  @override
  Stream<String> get links => _events.stream;

  @override
  Future<List<String>> initialize() async => const [];

  void emit(String link) => _events.add(link);

  @override
  void dispose() {
    _events.close();
  }
}
