import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_relay_controller.dart';
import 'package:merge_relay/src/merge_relay_relay_models.dart';
import 'package:merge_relay/src/merge_relay_relay_persistence.dart';
import 'package:merge_relay/src/merge_relay_replay.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_relay_test_support.dart';

void main() {
  test('replay verifies the complete server checkpoint and result', () async {
    final fake = FakeRelayGateway();
    final controller = _controller(fake);
    await controller.bootstrap();
    await controller.openChallenge(fake.challenge.challengeId);
    await controller.reserve();
    await controller.move(MergeDirection.left);
    await controller.finalize(finishEarly: true);

    final report = await controller.verifyReplay();
    expect(report, isNotNull);
    expect(report!.moves, 1);
    expect(report.finalScore, controller.snapshot.result!.finalScore);
    expect(controller.snapshot.replay, same(report));
    final liveState = controller.snapshot.attempt!.checkpoint.state.toJson();
    await controller.watchReplay();
    expect(controller.snapshot.replayPlaying, isTrue);
    expect(controller.snapshot.replayStep, 0);
    controller.stepReplay();
    expect(controller.snapshot.replayStep, 1);
    expect(
      controller.snapshot.replayState?.toJson(),
      report.replay.traces.first.after.toJson(),
    );
    expect(controller.snapshot.attempt!.checkpoint.state.toJson(), liveState);
    controller.closeReplay();
    expect(controller.snapshot.replayPlaying, isFalse);
    expect(controller.snapshot.replayStep, 0);
    controller.dispose();
  });

  test('replay rejects a checkpoint that does not match accepted moves', () {
    final fake = FakeRelayGateway();
    final challenge = fake.challenge;
    final attempt = testAttempt(
      MergeRelayCheckpoint(
        state: MergeGameState.newGame(seed: 99),
        maxLegalMoves: 3,
        spawnWeights: const MergeSpawnWeights.legacy(),
      ),
      const [MergeDirection.left],
      version: 1,
      status: MergeRelayAttemptStatus.completed,
      resultId: 'result_test',
    );
    final result = MergeRelayResultEnvelope(
      resultId: 'result_test',
      attemptId: attempt.attemptId,
      challengeId: challenge.challengeId,
      environment: 'debug',
      recipientSubject: 'guest_test',
      scoreDelta: 4,
      finalScore: 4,
      maxTile: 4,
      movesUsed: 1,
      outcome: MergeRelayResultOutcome.earlyFinish,
      mode: MergeRelayMode.rescue,
      originMode: MergeRelayMode.rescue,
      configRevision: 1,
      challengePayloadHash: challenge.payloadHash,
      returnChallengeId: null,
      createdAt: DateTime.utc(2026),
    );
    expect(
      () => verifyMergeRelayReplay(
        challenge: challenge,
        attempt: attempt,
        result: result,
      ),
      throwsA(isA<MergeRelayReplayException>()),
    );
  });

  test(
    'restored result hydrates the return challenge by parent identity',
    () async {
      final fake = FakeRelayGateway()..stripReturnChallengeOnGetResult = true;
      final store = MemoryMergeRelayRelayStateStore();
      final controller = _controller(fake, store);
      await controller.bootstrap();
      await controller.openChallenge(fake.challenge.challengeId);
      await controller.reserve();
      await controller.move(MergeDirection.left);
      await controller.finalize(finishEarly: true, returnAlias: 'You');
      expect(
        controller.snapshot.returnChallenge?.parentChallengeId,
        fake.challenge.challengeId,
      );
      controller.dispose();

      final reopened = _controller(fake, store);
      await reopened.bootstrap();
      expect(reopened.snapshot.phase, MergeRelayRelayPhase.result);
      expect(reopened.snapshot.returnChallenge?.challengeId, 'return_test');
      expect(
        reopened.snapshot.returnChallenge?.parentChallengeId,
        fake.challenge.challengeId,
      );
      reopened.dispose();
    },
  );
}

final _context = runtimeAppContext(identity: mergeRelayIdentity);

MergeRelayRelayController _controller(
  FakeRelayGateway gateway, [
  MergeRelayRelayStateStore? store,
]) => MergeRelayRelayController(
  context: _context,
  gateway: gateway,
  authStore: MemoryMergeRelayAuthStore(),
  stateStore: store ?? MemoryMergeRelayRelayStateStore(),
  keyFactory: (prefix) => '$prefix-fixed',
);
