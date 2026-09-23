import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_pending_create.dart';
import 'package:merge_relay/src/merge_relay_relay_controller.dart';
import 'package:merge_relay/src/merge_relay_relay_models.dart';
import 'package:merge_relay/src/merge_relay_relay_persistence.dart';
import 'package:merge_relay/src/merge_relay_relay_share.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_relay_test_support.dart';

void main() {
  test(
    'pending create retries the exact request after transport failure',
    () async {
      final fake = FakeRelayGateway()..failNextCreate = true;
      final store = MemoryMergeRelayRelayStateStore();
      final controller = _controller(fake, store);
      await controller.bootstrap();
      final checkpoint = MergeCheckpoint.fromState(
        fake.challenge.checkpoint.state,
        contentId: 'rescue-signal',
        contentVersion: 'MR-CONTENT-1',
        spawnWeights: const MergeSpawnWeights.legacy(),
      );

      await controller.createChallengeFromCheckpoint(
        checkpoint: checkpoint,
        originMode: MergeRelayMode.rescue,
        creatorAlias: 'Ada',
        contentId: checkpoint.contentId,
        contentVersion: checkpoint.contentVersion,
      );
      final pending = await store.readRelay(_context);
      expect(controller.snapshot.phase, MergeRelayRelayPhase.offline);
      expect(pending?.pendingCreate, isNotNull);
      expect(fake.createRequests, hasLength(1));

      await controller.retry();
      expect(controller.snapshot.phase, MergeRelayRelayPhase.creator);
      expect(fake.createRequests, hasLength(2));
      expect(
        fake.createRequests[1].idempotencyKey,
        fake.createRequests[0].idempotencyKey,
      );
      expect(fake.createRequests[1].creatorAlias, 'Ada');
      expect(
        fake.createRequests[1].checkpoint.toJson(),
        fake.createRequests[0].checkpoint.toJson(),
      );
      expect((await store.readRelay(_context))?.pendingCreate, isNull);
      expect((await store.readRelay(_context))?.createdChallengeId, 'ch_test');
      controller.dispose();
    },
  );

  test('created challenge restores as a shareable board', () async {
    final fake = FakeRelayGateway();
    final store = MemoryMergeRelayRelayStateStore();
    final first = _controller(fake, store);
    await first.bootstrap();
    await first.createChallengeFromCheckpoint(
      checkpoint: _checkpoint(fake),
      originMode: MergeRelayMode.rescue,
    );
    first.dispose();

    final reopened = _controller(fake, store);
    await reopened.bootstrap();
    expect(reopened.snapshot.phase, MergeRelayRelayPhase.creator);
    expect(reopened.snapshot.sharePayload?.code, 'ch_test');
    expect(
      reopened.snapshot.sharePayload?.appLink,
      'mergerelay://challenge/ch_test',
    );
    expect(
      reopened.snapshot.sharePayload?.httpsLink,
      'https://relay.example/games/merge-relay/challenges/ch_test?environment=debug',
    );
    reopened.dispose();
  });

  test('sharing reports provider status and never claims delivery', () async {
    final fake = FakeRelayGateway();
    final provider = _ShareProvider(MergeRelayShareStatus.opened);
    final controller = _controller(fake, null, provider);
    await controller.bootstrap();
    await controller.createChallengeFromCheckpoint(
      checkpoint: _checkpoint(fake),
      originMode: MergeRelayMode.rescue,
    );
    await controller.shareChallenge();
    expect(provider.payloads.single.challengeId, 'ch_test');
    expect(controller.snapshot.shareStatus, MergeRelayShareStatus.opened);
    expect(controller.snapshot.message, 'Share sheet opened.');
    controller.dispose();

    final unavailable = _controller(fake);
    await unavailable.bootstrap();
    await unavailable.createChallengeFromCheckpoint(
      checkpoint: _checkpoint(fake),
      originMode: MergeRelayMode.rescue,
    );
    await unavailable.shareChallenge();
    expect(unavailable.snapshot.shareStatus, MergeRelayShareStatus.unavailable);
    expect(
      unavailable.snapshot.message,
      'Copy the challenge code to pass it on.',
    );
    unavailable.dispose();
  });

  test('pending create state round trips all request inputs', () {
    final pending = MergeRelayPendingCreate(
      idempotencyKey: 'create-fixed',
      creatorAlias: 'Ada',
      checkpoint: MergeCheckpoint.fromState(
        MergeGameState.newGame(seed: 7),
        maxLegalMoves: 3,
        contentId: 'daily-2026-09-17',
        contentVersion: 'MR-CONTENT-1',
        spawnWeights: const MergeSpawnWeights.legacy(),
      ),
      originMode: MergeRelayMode.daily,
      contentId: 'daily-2026-09-17',
      contentVersion: 'MR-CONTENT-1',
      parentChallengeId: 'ch_parent',
    );
    final restored = MergeRelayPendingCreate.fromJson(pending.toJson());
    expect(restored.toRequest().idempotencyKey, 'create-fixed');
    expect(restored.toRequest().originMode, MergeRelayMode.daily);
    expect(restored.toRequest().parentChallengeId, 'ch_parent');
    expect(restored.checkpoint.toJson(), pending.checkpoint.toJson());
  });
}

final _context = runtimeAppContext(identity: mergeRelayIdentity);

MergeRelayRelayController _controller(
  FakeRelayGateway gateway, [
  MergeRelayRelayStateStore? store,
  MergeRelayShareProvider? shareProvider,
]) => MergeRelayRelayController(
  context: _context,
  gateway: gateway,
  authStore: MemoryMergeRelayAuthStore(),
  stateStore: store ?? MemoryMergeRelayRelayStateStore(),
  publicOrigin: Uri.parse('https://relay.example'),
  shareProvider: shareProvider,
  keyFactory: (prefix) => '$prefix-fixed',
);

MergeCheckpoint _checkpoint(FakeRelayGateway fake) => MergeCheckpoint.fromState(
  fake.challenge.checkpoint.state,
  maxLegalMoves: fake.challenge.checkpoint.maxLegalMoves,
  spawnWeights: fake.challenge.checkpoint.spawnWeights,
);

final class _ShareProvider implements MergeRelayShareProvider {
  _ShareProvider(this.status);

  final MergeRelayShareStatus status;
  final payloads = <MergeRelaySharePayload>[];

  @override
  Future<MergeRelayShareStatus> share(MergeRelaySharePayload payload) async {
    payloads.add(payload);
    return status;
  }
}
