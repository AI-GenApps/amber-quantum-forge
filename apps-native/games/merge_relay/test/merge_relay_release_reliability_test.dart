import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_models.dart';
import 'package:merge_relay/src/merge_relay_relay_controller.dart';
import 'package:merge_relay/src/merge_relay_relay_models.dart';
import 'package:merge_relay/src/merge_relay_relay_persistence.dart';
import 'package:merge_relay/src/merge_relay_replay.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_fake_gateway.dart';
import 'merge_relay_relay_test_support.dart';

void main() {
  test('closing a delayed replay invalidates its late verification', () async {
    final fake = FakeRelayGateway();
    final controller = _controller(fake);
    await _finishRelay(fake, controller);
    final gate = Completer<void>();
    fake.getAttemptGate = gate;

    final verification = controller.verifyReplay();
    await Future<void>.delayed(Duration.zero);
    controller.closeReplay();
    gate.completeError(StateError('late verification failure'));

    expect(await verification, isNull);
    expect(controller.snapshot.replay, isNull);
    expect(controller.snapshot.errorCode, isNull);
    controller.dispose();
  });

  test('replay rejects mismatched recipient and score delta', () {
    final fake = FakeRelayGateway();
    final attempt = testAttempt(
      fake.challenge.checkpoint,
      const [MergeDirection.left],
      version: 1,
      status: MergeRelayAttemptStatus.completed,
      resultId: 'result_test',
    );
    final result = MergeRelayResultEnvelope(
      resultId: 'result_test',
      attemptId: attempt.attemptId,
      challengeId: fake.challenge.challengeId,
      environment: 'production',
      recipientSubject: 'other_guest',
      scoreDelta: 999,
      finalScore: 4,
      maxTile: 4,
      movesUsed: 1,
      outcome: MergeRelayResultOutcome.earlyFinish,
      mode: MergeRelayMode.rescue,
      originMode: MergeRelayMode.rescue,
      configRevision: 1,
      challengePayloadHash: fake.challenge.payloadHash,
      returnChallengeId: null,
      createdAt: DateTime.utc(2026),
    );

    expect(
      () => verifyMergeRelayReplay(
        challenge: fake.challenge,
        attempt: attempt,
        result: result,
      ),
      throwsA(isA<MergeRelayReplayException>()),
    );
  });

  test('stale persisted return identity is rejected for the result', () async {
    final fake = FakeRelayGateway();
    final store = MemoryMergeRelayRelayStateStore();
    final controller = _controller(fake, store);
    await _finishRelay(fake, controller, returnAlias: 'You');
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final saved = await store.readRelay(context);
    expect(saved, isNotNull);
    final stale = MergeRelayRelayLocalState(
      challengeId: saved!.challengeId,
      attemptId: saved.attemptId,
      reservationKey: saved.reservationKey,
      expectedVersion: saved.expectedVersion,
      acknowledgedMoveCount: saved.acknowledgedMoveCount,
      finalizeKey: saved.finalizeKey,
      finalizeFinishEarly: saved.finalizeFinishEarly,
      finalizeReturnAlias: saved.finalizeReturnAlias,
      resultId: saved.resultId,
      returnChallengeId: 'return_old',
      saveId: saved.saveId,
      serverSaveVersion: saved.serverSaveVersion,
    );
    await store.writeRelay(context, stale);
    controller.dispose();

    final reopened = _controller(fake, store);
    await reopened.bootstrap();
    expect(reopened.snapshot.phase, MergeRelayRelayPhase.error);
    expect(reopened.snapshot.errorCode, 'result_failed');
    reopened.dispose();
  });

  test('failed preview keeps an exact retryable challenge request', () async {
    final fake = FakeRelayGateway();
    final store = MemoryMergeRelayRelayStateStore();
    final failedResolve = Completer<MergeRelayChallenge>();
    fake.resolveQueue.add(failedResolve.future);
    final controller = _controller(fake, store);
    await controller.bootstrap();
    final request = controller.openChallenge('ch_retry');
    await Future<void>.delayed(Duration.zero);
    failedResolve.completeError(const MergeRelayTransportException('offline'));
    await request;

    expect(controller.snapshot.preview, isNull);
    expect(controller.snapshot.errorCode, 'offline');
    expect(
      (await store.readRelay(runtimeAppContext(identity: mergeRelayIdentity)))
          ?.pendingChallengeId,
      'ch_retry',
    );

    fake.resolveQueue.add(Future.value(_challenge(fake.challenge, 'ch_retry')));
    await controller.retry();
    expect(controller.snapshot.preview?.challengeId, 'ch_retry');
    expect(
      (await store.readRelay(runtimeAppContext(identity: mergeRelayIdentity)))
          ?.pendingChallengeId,
      isNull,
    );
    controller.dispose();
  });

  test('overlapping preview requests keep the latest challenge', () async {
    final fake = FakeRelayGateway();
    final first = Completer<MergeRelayChallenge>();
    final second = Completer<MergeRelayChallenge>();
    fake.resolveQueue
      ..add(first.future)
      ..add(second.future);
    final controller = _controller(fake);
    await controller.bootstrap();

    final firstRequest = controller.openChallenge('ch_first');
    await Future<void>.delayed(Duration.zero);
    final secondRequest = controller.openChallenge('ch_second');
    second.complete(_challenge(fake.challenge, 'ch_second'));
    await secondRequest;
    first.complete(_challenge(fake.challenge, 'ch_first'));
    await firstRequest;

    expect(controller.snapshot.preview?.challengeId, 'ch_second');
    controller.dispose();
  });

  test('legacy sessions keep legacy rules when the catalog changes', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final store = MemorySaveStore();
    final rescue = MergeRelayContentCatalog.fallback.firstRescue;
    await store.write(
      context,
      SaveEnvelope.create(
        context: context,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026),
        payload: _sessionPayload(rescue.state),
      ),
    );
    final changed = MergeRelayContentCatalog(
      MergeRelayContentCatalog.fallback.rescues,
      ruleConfig: MergeRuleConfig(
        revision: 2,
        spawnWeights: MergeSpawnWeights(
          spawnTwoWeight: 80,
          spawnFourWeight: 20,
        ),
      ),
    );
    final game = MergeRelayGame(
      context: context,
      saveStore: store,
      content: changed,
    );
    await game.restore();

    expect(game.rules.config.matches(const MergeRuleConfig.legacy()), isTrue);
    game.dispose();
  });

  test('partial frozen rescue metadata without a target is rejected', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final store = MemorySaveStore();
    final rescue = MergeRelayContentCatalog.fallback.firstRescue;
    final payload = _sessionPayload(rescue.state)
      ..['sessions'] = {
        'rescue:rescue-signal': {
          'game': rescue.state.toWireJson(),
          'mode': 'rescue',
          'rescue_id': 'rescue-signal',
          'daily_date': null,
          'rescue_moves_used': 0,
          'paused': false,
          'result': null,
          'content_version': 'MR-CONTENT-1',
          'goal_revision': 'MR-GOALS-2',
          'objective': 'Reach 16 points.',
          'rule_config': const MergeRuleConfig.legacy().toJson(),
        },
      };
    await store.write(
      context,
      SaveEnvelope.create(
        context: context,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026),
        payload: payload,
      ),
    );
    final game = MergeRelayGame(context: context, saveStore: store);
    await game.restore();

    expect(game.restoreFailed.value, isTrue);
    game.dispose();
  });
}

Future<void> _finishRelay(
  FakeRelayGateway fake,
  MergeRelayRelayController controller, {
  String? returnAlias,
}) async {
  await controller.bootstrap();
  await controller.openChallenge(fake.challenge.challengeId);
  await controller.reserve();
  await controller.move(MergeDirection.left);
  await controller.finalize(finishEarly: true, returnAlias: returnAlias);
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

MergeRelayChallenge _challenge(MergeRelayChallenge source, String id) =>
    MergeRelayChallenge(
      challengeId: id,
      creatorAlias: source.creatorAlias,
      mode: source.mode,
      originMode: source.originMode,
      configRevision: source.configRevision,
      checkpoint: source.checkpoint,
      checkpointHash: source.checkpointHash,
      payloadHash: source.payloadHash,
      parentChallengeId: source.parentChallengeId,
      status: source.status,
      createdAt: source.createdAt,
    );

Map<String, Object?> _sessionPayload(MergeGameState state) => {
  'session_map_version': 1,
  'active_session_key': 'rescue:rescue-signal',
  'sessions': {
    'rescue:rescue-signal': {
      'game': state.toWireJson(),
      'mode': 'rescue',
      'rescue_id': 'rescue-signal',
      'daily_date': null,
      'rescue_moves_used': 0,
      'paused': false,
      'result': null,
    },
  },
  'profile': {
    'tutorial_version': mergeRelayTutorialVersion,
    'theme_id': 'signal',
    'reduced_motion': false,
    'audio_enabled': true,
    'haptics_enabled': true,
    'accessible_controls': false,
    'completed_rescue_ids': <String>[],
  },
};
