import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_safety_sheet.dart';

import 'merge_relay_fake_gateway.dart';
import 'merge_relay_network_test_support.dart';

Future<void> _open(WidgetTester tester, FakeRelayGateway gateway) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: Builder(
          builder: (context) => TextButton(
            onPressed: () => showMergeRelaySafetySheet(
              context,
              gateway: gateway,
              challengeId: 'ch_abc',
              alias: 'Mina',
            ),
            child: const Text('open'),
          ),
        ),
      ),
    ),
  );
  await tester.tap(find.text('open'));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('report needs a confirm step and sends the challenge id', (
    tester,
  ) async {
    final gateway = FakeRelayGateway();
    await _open(tester, gateway);
    await tester.tap(find.text('Spam'));
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.text('Report Mina?'), findsOneWidget);
    expect(gateway.socialRequests, isEmpty);
    await tester.tap(find.byKey(const ValueKey('mr-safety-confirm')));
    await tester.pumpAndSettle();
    final request = gateway.socialRequests.single;
    expect(request.action, MergeRelaySocialAction.report);
    expect(request.targetChallengeId, 'ch_abc');
    expect(request.reason, 'Spam');
    expect(find.text('Report sent.'), findsOneWidget);
  });

  testWidgets('block shows its own confirm and success copy', (tester) async {
    final gateway = FakeRelayGateway();
    await _open(tester, gateway);
    await tester.tap(find.text('Block'));
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.text('Block Mina?'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('mr-safety-confirm')));
    await tester.pumpAndSettle();
    expect(gateway.socialRequests.single.action, MergeRelaySocialAction.block);
    expect(find.byKey(const ValueKey('mr-safety-done')), findsOneWidget);
  });

  testWidgets('offline and ambiguous errors keep the confirm for a retry', (
    tester,
  ) async {
    final gateway = FakeRelayGateway()
      ..socialError = const MergeRelayTransportException('x');
    await _open(tester, gateway);
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('mr-safety-confirm')));
    await tester.pumpAndSettle();
    expect(find.textContaining('You are offline.'), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
    gateway.socialError = const MergeRelayApiException(
      statusCode: 409,
      code: 'ambiguous_target_alias',
      message: 'server text',
      diagnosticId: 'diag',
    );
    await tester.tap(find.byKey(const ValueKey('mr-safety-confirm')));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('mr-safety-error')), findsOneWidget);
    gateway.socialError = null;
    await tester.tap(find.byKey(const ValueKey('mr-safety-confirm')));
    await tester.pumpAndSettle();
    expect(find.text('Report sent.'), findsOneWidget);
  });

  test('request validation and wire shape', () {
    expect(
      () => MergeRelaySocialRequest(
        action: MergeRelaySocialAction.report,
        reason: 'spam',
      ),
      throwsArgumentError,
    );
    expect(
      MergeRelaySocialRequest(
        action: MergeRelaySocialAction.block,
        reason: 'spam',
        targetChallengeId: 'ch_abc',
        targetAlias: 'Mina',
      ).toWireJson(),
      {'reason': 'spam', 'target_challenge_id': 'ch_abc'},
    );
  });

  test('the HTTP gateway posts the report and parses the record', () async {
    final transport = FixtureTransport({
      'POST social/report': fixtureResponse({
        'contract_version': mergeRelayContractVersion,
        'data': {
          'record': {
            'record_id': 'social_1',
            'target_subject': 'sub_1',
            'target_alias': null,
            'action': 'report',
            'created_at': '2026-10-22T00:00:00.000Z',
          },
        },
      }, statusCode: 201),
    });
    final gateway = MergeRelayHttpGateway(
      config: MergeRelayNetworkConfig(
        apiBaseUri: Uri.parse('https://relay.example/api/'),
        environment: 'debug',
      ),
      transport: transport,
      authStore: MemoryMergeRelayAuthStore()..accessToken = 'guest-token',
    );
    final record = await gateway.submitSocial(
      MergeRelaySocialRequest(
        action: MergeRelaySocialAction.report,
        reason: 'spam',
        targetChallengeId: 'ch_abc',
      ),
    );
    expect(record.recordId, 'social_1');
    expect(transport.requests.single.body, {
      'reason': 'spam',
      'target_challenge_id': 'ch_abc',
    });
  });
}
