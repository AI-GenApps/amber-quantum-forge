import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';

import 'merge_relay_network_test_support.dart';

void main() {
  test('http gateway posts the documented event DTO', () async {
    final transport = FixtureTransport({
      'POST events': fixtureResponse({
        'contract_version': mergeRelayContractVersion,
        'data': {
          'event': {'event_id': 'ev_1'},
        },
      }),
    });
    final gateway = MergeRelayHttpGateway(
      config: MergeRelayNetworkConfig(
        apiBaseUri: Uri.parse('https://relay.example/api/'),
        environment: 'debug',
      ),
      transport: transport,
      authStore: MemoryMergeRelayAuthStore()..accessToken = 'guest-token',
    );
    await gateway.postEvent(
      MergeRelayEventRequest(
        idempotencyKey: 'tel.9',
        type: MergeRelayClientEventType.challengeOpened,
        artifactId: 'ch_1',
        payload: {'mode': 'rescue', 'email': 'a@b.co'},
      ),
    );
    expect(transport.requests.single.key, 'POST events');
    expect(transport.requests.single.body, {
      'idempotency_key': 'tel.9',
      'type': 'challenge_opened',
      'artifact_id': 'ch_1',
      'payload': {'mode': 'rescue'},
    });
  });
}
