import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_relay_controller.dart';
import 'package:merge_relay/src/merge_relay_relay_models.dart';
import 'package:merge_relay/src/merge_relay_relay_persistence.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_relay_test_support.dart';

void main() {
  test(
    'an unfinished attempt cannot be replaced by another challenge',
    () async {
      final fake = FakeRelayGateway();
      final controller = _controller(fake);
      await controller.bootstrap();
      await controller.openChallenge(fake.challenge.challengeId);
      await controller.reserve();

      await controller.openChallenge('other-challenge');

      expect(controller.snapshot.errorCode, 'active_attempt');
      expect(controller.snapshot.attempt?.attemptId, 'att_test');
      controller.dispose();
    },
  );

  test('a late preview failure cannot replace the current preview', () async {
    final fake = FakeRelayGateway();
    final delayed = Completer<MergeRelayChallenge>();
    fake.resolveQueue.add(delayed.future);
    fake.resolveQueue.add(
      Future.value(_challengeWithId(fake.challenge, 'current-challenge')),
    );
    final controller = _controller(fake);
    final oldRequest = controller.openChallenge('old-challenge');
    await Future<void>.delayed(Duration.zero);

    final currentRequest = controller.openChallenge('current-challenge');
    await currentRequest;
    delayed.completeError(StateError('late preview failure'));
    await oldRequest;

    expect(controller.snapshot.phase, MergeRelayRelayPhase.preview);
    expect(controller.snapshot.errorCode, isNull);
    controller.dispose();
  });

  test('relay retry reconnects an active attempt', () async {
    final fake = FakeRelayGateway();
    final controller = _controller(fake);
    await controller.bootstrap();
    await controller.openChallenge(fake.challenge.challengeId);
    await controller.reserve();

    await controller.retry();

    expect(fake.getAttemptCalls, 1);
    expect(controller.snapshot.phase, MergeRelayRelayPhase.playing);
    controller.dispose();
  });

  test(
    'guest bootstrap is single-flight across concurrent save reads',
    () async {
      final fake = FakeRelayGateway();
      final controller = _controller(fake);

      await Future.wait([
        controller.loadSave('first'),
        controller.loadSave('second'),
      ]);

      expect(fake.createGuestCalls, 1);
      controller.dispose();
    },
  );

  test('a move remains pending when its acknowledged write fails', () async {
    final fake = FakeRelayGateway();
    final store = _FailingRelayStateStore();
    final controller = _controller(fake, store);
    await controller.bootstrap();
    await controller.openChallenge(fake.challenge.challengeId);
    await controller.reserve();
    store.failAtWrite = store.writes + 2;
    final attempt = controller.snapshot.attempt!;
    final direction = _firstLegal(attempt.checkpoint.state);

    await controller.move(direction);

    expect(controller.snapshot.pendingMove, direction);
    expect(controller.snapshot.phase, MergeRelayRelayPhase.offline);
    store.failAtWrite = null;
    await controller.reconnect();
    expect(controller.snapshot.pendingMove, isNull);
    expect(controller.snapshot.phase, MergeRelayRelayPhase.playing);
    controller.dispose();
  });

  test(
    'mismatched move response is rejected without clearing the pending move',
    () async {
      final fake = FakeRelayGateway();
      final controller = _controller(fake);
      await controller.bootstrap();
      await controller.openChallenge(fake.challenge.challengeId);
      await controller.reserve();
      final attempt = controller.snapshot.attempt!;
      final direction = _firstLegal(attempt.checkpoint.state);
      fake.submitResultOverride = testAttempt(
        attempt.checkpoint,
        [direction],
        version: 1,
        attemptId: 'wrong-attempt',
      );

      await controller.move(direction);

      expect(controller.snapshot.errorCode, 'move_response_mismatch');
      expect(controller.snapshot.pendingMove, direction);
      controller.dispose();
    },
  );

  test('invalid persisted relay combinations are rejected', () {
    final base = <String, Object?>{
      'version': 1,
      'challenge_id': null,
      'attempt_id': null,
      'reservation_key': null,
      'expected_version': 0,
      'acknowledged_move_count': 0,
      'pending_move': null,
      'finalize_key': null,
      'finalize_finish_early': false,
      'finalize_return_alias': null,
      'result_id': null,
      'return_challenge_id': null,
      'save_id': null,
      'server_save_version': 0,
    };
    final invalid = [
      {...base, 'pending_move': 'left'},
      {...base, 'challenge_id': 'ch_test', 'attempt_id': 'att_test'},
      {
        ...base,
        'challenge_id': 'ch_test',
        'attempt_id': 'att_test',
        'reservation_key': 'reserve-test',
        'result_id': 'result-test',
      },
    ];

    for (final raw in invalid) {
      expect(
        () => MergeRelayRelayLocalState.fromJson(raw),
        throwsA(isA<FormatException>()),
      );
    }
  });
}

MergeRelayRelayController _controller(
  FakeRelayGateway gateway, [
  MergeRelayRelayStateStore? stateStore,
]) => MergeRelayRelayController(
  context: runtimeAppContext(identity: mergeRelayIdentity),
  gateway: gateway,
  authStore: MemoryMergeRelayAuthStore(),
  stateStore: stateStore ?? MemoryMergeRelayRelayStateStore(),
  keyFactory: (prefix) => '$prefix-fixed',
);

MergeDirection _firstLegal(MergeGameState state) =>
    MergeDirection.values.firstWhere(
      (direction) => const MergeRules().apply(state, direction).changed,
    );

MergeRelayChallenge _challengeWithId(
  MergeRelayChallenge challenge,
  String challengeId,
) => MergeRelayChallenge(
  challengeId: challengeId,
  creatorAlias: challenge.creatorAlias,
  mode: challenge.mode,
  originMode: challenge.originMode,
  configRevision: challenge.configRevision,
  checkpoint: challenge.checkpoint,
  checkpointHash: challenge.checkpointHash,
  payloadHash: challenge.payloadHash,
  parentChallengeId: challenge.parentChallengeId,
  status: challenge.status,
  createdAt: challenge.createdAt,
);

final class _FailingRelayStateStore implements MergeRelayRelayStateStore {
  final _delegate = MemoryMergeRelayRelayStateStore();
  int writes = 0;
  int? failAtWrite;

  @override
  Future<MergeRelayRelayLocalState?> readRelay(AppContext context) =>
      _delegate.readRelay(context);

  @override
  Future<void> writeRelay(AppContext context, MergeRelayRelayLocalState state) {
    writes += 1;
    if (writes == failAtWrite) {
      throw StateError('checkpoint write failed');
    }
    return _delegate.writeRelay(context, state);
  }
}
