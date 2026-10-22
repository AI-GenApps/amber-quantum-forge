import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_features.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_relay_controller.dart';
import 'package:merge_relay/src/merge_relay_relay_persistence.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_fake_gateway.dart';

MergeRelayApiException _api(int status, String code) => MergeRelayApiException(
  statusCode: status,
  code: code,
  message: 'server text',
  diagnosticId: 'diag',
);

Future<FakeRelayGateway> _openEntry(
  WidgetTester tester, {
  void Function(FakeRelayGateway gateway)? setup,
  bool social = true,
}) async {
  final gateway = FakeRelayGateway();
  setup?.call(gateway);
  final relay = MergeRelayRelayController(
    context: runtimeAppContext(identity: mergeRelayIdentity),
    gateway: gateway,
    authStore: MemoryMergeRelayAuthStore(),
    stateStore: MemoryMergeRelayRelayStateStore(),
  );
  await tester.pumpWidget(
    MergeRelayApp(
      relayController: relay,
      features: MergeRelayFeatures(socialEnabled: social),
    ),
  );
  await tester.pumpAndSettle();
  if (!social) return gateway;
  await tester.ensureVisible(find.text('Join a relay'));
  await tester.tap(find.text('Join a relay'));
  await tester.pumpAndSettle();
  return gateway;
}

Future<void> _submit(WidgetTester tester, String code) async {
  await tester.enterText(find.byKey(const ValueKey('mr-manual-code')), code);
  await tester.tap(find.byKey(const ValueKey('mr-manual-code-submit')));
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 500));
  await tester.pump(const Duration(milliseconds: 500));
}

void main() {
  testWidgets('manual code entry is absent when the social gate is off', (
    tester,
  ) async {
    await _openEntry(tester, social: false);
    expect(find.text('Join a relay'), findsNothing);
    expect(find.byKey(const ValueKey('mr-manual-code')), findsNothing);
  });

  testWidgets('validates empty and malformed codes before any request', (
    tester,
  ) async {
    final gateway = await _openEntry(tester);
    await _submit(tester, '');
    expect(find.text('Enter a challenge code or link.'), findsOneWidget);
    await _submit(tester, 'not a code!');
    expect(
      find.text('That is not a valid challenge code or link.'),
      findsOneWidget,
    );
    expect(find.text('Accept relay'), findsNothing);
    expect(gateway.getAttemptCalls, 0);
  });

  testWidgets('a valid code opens the preview', (tester) async {
    final gateway = await _openEntry(tester);
    await _submit(tester, gateway.challenge.challengeId);
    expect(find.text('Incoming relay'), findsOneWidget);
    expect(find.text('Accept relay', skipOffstage: false), findsOneWidget);
    expect(
      find.byKey(const ValueKey('mr-report-block'), skipOffstage: false),
      findsOneWidget,
    );
  });

  final failures = <String, (Object, String)>{
    'not found': (_api(404, 'challenge_not_found'), 'This challenge is gone.'),
    'retired': (_api(409, 'challenge_retired'), 'This challenge is gone.'),
    'offline': (const MergeRelayTransportException('x'), 'You are offline.'),
    'unsupported version': (
      const MergeRelayProtocolException('Unsupported content_version'),
      'Update needed.',
    ),
    'unsupported client': (_api(400, 'unsupported_contract'), 'Update needed.'),
  };
  for (final entry in failures.entries) {
    testWidgets('shows the ${entry.key} state and allows another code', (
      tester,
    ) async {
      await _openEntry(
        tester,
        setup: (gateway) => gateway.resolveError = entry.value.$1,
      );
      await _submit(tester, 'ch_abc');
      expect(find.text(entry.value.$2), findsOneWidget);
      await tester.tap(find.byKey(const ValueKey('mr-enter-another-code')));
      await tester.pumpAndSettle();
      expect(find.byKey(const ValueKey('mr-manual-code')), findsOneWidget);
      expect(find.text('ch_abc'), findsOneWidget);
    });
  }
}
