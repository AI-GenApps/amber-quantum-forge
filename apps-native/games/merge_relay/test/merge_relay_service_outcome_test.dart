import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_relay_controller.dart';
import 'package:merge_relay/src/merge_relay_relay_models.dart';
import 'package:merge_relay/src/merge_relay_relay_persistence.dart';
import 'package:merge_relay/src/merge_relay_service_outcome.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_fake_gateway.dart';

typedef _Case = (Object, MergeRelayOutcomeKind, MergeRelayOutcomeAction);

MergeRelayApiException _api(int status, String code) => MergeRelayApiException(
  statusCode: status,
  code: code,
  message: 'server text',
  diagnosticId: 'diag',
);

MergeRelayRelayController _controller(FakeRelayGateway gateway) =>
    MergeRelayRelayController(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      gateway: gateway,
      authStore: MemoryMergeRelayAuthStore(),
      stateStore: MemoryMergeRelayRelayStateStore(),
      keyFactory: (prefix) => '$prefix-fixed',
    );

void main() {
  group('mergeRelayOutcomeFor', () {
    final cases = <String, _Case>{
      'transport': (
        const MergeRelayTransportException('x'),
        MergeRelayOutcomeKind.offline,
        MergeRelayOutcomeAction.reconnect,
      ),
      'protocol': (
        const MergeRelayProtocolException('x'),
        MergeRelayOutcomeKind.unsupportedClient,
        MergeRelayOutcomeAction.updateApp,
      ),
      'expired token': (
        _api(401, 'game_token_expired'),
        MergeRelayOutcomeKind.tokenExpired,
        MergeRelayOutcomeAction.retry,
      ),
      'missing config revision': (
        _api(404, 'config_revision_not_found'),
        MergeRelayOutcomeKind.missingConfig,
        MergeRelayOutcomeAction.home,
      ),
      'daily unavailable': (
        _api(503, 'daily_unavailable'),
        MergeRelayOutcomeKind.missingConfig,
        MergeRelayOutcomeAction.home,
      ),
      'provider disabled': (
        _api(403, 'rewards_disabled'),
        MergeRelayOutcomeKind.providerDisabled,
        MergeRelayOutcomeAction.home,
      ),
      'retired challenge': (
        _api(409, 'challenge_retired'),
        MergeRelayOutcomeKind.challengeRetired,
        MergeRelayOutcomeAction.home,
      ),
      'window closed': (
        _api(409, 'reservation_expired'),
        MergeRelayOutcomeKind.windowClosed,
        MergeRelayOutcomeAction.home,
      ),
      'sync conflict': (
        _api(409, 'attempt_version_conflict'),
        MergeRelayOutcomeKind.syncConflict,
        MergeRelayOutcomeAction.reconnect,
      ),
      'scope mismatch': (
        _api(403, 'client_app_scope_mismatch'),
        MergeRelayOutcomeKind.unsupportedClient,
        MergeRelayOutcomeAction.updateApp,
      ),
      'service down': (
        _api(503, 'merge_relay_unavailable'),
        MergeRelayOutcomeKind.serviceUnavailable,
        MergeRelayOutcomeAction.retry,
      ),
      'validation': (
        _api(422, 'validation_rejected'),
        MergeRelayOutcomeKind.rejected,
        MergeRelayOutcomeAction.retry,
      ),
      'non service error': (
        StateError('x'),
        MergeRelayOutcomeKind.unknown,
        MergeRelayOutcomeAction.retry,
      ),
    };
    cases.forEach((name, expected) {
      test(name, () {
        final outcome = mergeRelayOutcomeFor(expected.$1);
        expect(outcome.kind, expected.$2);
        expect(outcome.action, expected.$3);
        expect(outcome.actionLabel, isNotEmpty);
        expect(outcome.title, isNotEmpty);
      });
    });

    test('actionable copy tells the player solo play still works', () {
      for (final code in [
        'game_token_expired',
        'daily_unavailable',
        'rewards_disabled',
        'merge_relay_unavailable',
      ]) {
        final status = code == 'game_token_expired' ? 401 : 503;
        expect(
          mergeRelayOutcomeFor(_api(status, code)).message,
          contains('Solo play still works'),
        );
      }
    });
  });

  group('controller surfaces outcomes', () {
    test('missing relay config blocks reserve with a home action', () async {
      final fake = FakeRelayGateway();
      final controller = _controller(fake);
      await controller.bootstrap();
      await controller.openChallenge(fake.challenge.challengeId);
      fake.configError = _api(503, 'config_unavailable');
      await controller.reserve();

      final outcome = controller.snapshot.outcome!;
      expect(outcome.kind, MergeRelayOutcomeKind.missingConfig);
      expect(outcome.action, MergeRelayOutcomeAction.home);
      expect(controller.snapshot.attempt, isNull);
      controller.dispose();
    });

    test('guest bootstrap with an expired token offers retry', () async {
      final fake = FakeRelayGateway()
        ..guestError = _api(401, 'game_token_expired');
      final controller = _controller(fake);
      await controller.bootstrap();

      expect(
        controller.snapshot.outcome?.kind,
        MergeRelayOutcomeKind.tokenExpired,
      );
      expect(controller.snapshot.phase, MergeRelayRelayPhase.error);
      fake.guestError = null;
      await controller.retry();
      expect(controller.snapshot.guestReady, isTrue);
      expect(controller.snapshot.outcome, isNull);
      controller.dispose();
    });

    test('a retired challenge preview offers a way home', () async {
      final fake = FakeRelayGateway()
        ..resolveError = _api(409, 'challenge_retired');
      final controller = _controller(fake);
      await controller.bootstrap();
      await controller.openChallenge('ch_gone');

      expect(
        controller.snapshot.outcome?.kind,
        MergeRelayOutcomeKind.challengeRetired,
      );
      expect(controller.snapshot.preview, isNull);
      controller.dispose();
    });

    test('offline resolve reports reconnect and recovers on retry', () async {
      final fake = FakeRelayGateway()
        ..resolveError = const MergeRelayTransportException('down');
      final controller = _controller(fake);
      await controller.bootstrap();
      await controller.openChallenge(fake.challenge.challengeId);
      expect(controller.snapshot.phase, MergeRelayRelayPhase.offline);
      expect(
        controller.snapshot.outcome?.action,
        MergeRelayOutcomeAction.reconnect,
      );

      fake.resolveError = null;
      await controller.retry();
      expect(controller.snapshot.phase, MergeRelayRelayPhase.preview);
      expect(controller.snapshot.outcome, isNull);
      controller.dispose();
    });
  });
}
