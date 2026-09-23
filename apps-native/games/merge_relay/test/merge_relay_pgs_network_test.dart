import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';

import 'merge_relay_network_test_support.dart';

MergeRelayHttpGateway _gateway(
  MergeRelayHttpTransport transport, {
  MemoryMergeRelayAuthStore? auth,
}) => MergeRelayHttpGateway(
  config: MergeRelayNetworkConfig(
    apiBaseUri: Uri.parse('https://relay.example/api/'),
    environment: 'debug',
  ),
  transport: transport,
  authStore: auth ?? (MemoryMergeRelayAuthStore()..accessToken = 'guest-token'),
);

Map<String, Object?> _envelope(Object data) => {
  'contract_version': mergeRelayContractVersion,
  'data': data,
};

Map<String, Object?> _identity({String status = 'active'}) => {
  'identity_id': 'pgs_identity_test',
  'provider': 'google_play_games',
  'player_id': 'player_test',
  'status': status,
  'verified_at': '2026-09-17T00:00:00Z',
};

void main() {
  test('decodes status and link responses with strict route shapes', () async {
    final transport = FixtureTransport({
      'GET platform/google-play-games/identity': fixtureResponse(
        _envelope({
          'identity': {
            'provider': 'google_play_games',
            'configured': true,
            'status': 'unlinked',
          },
        }),
      ),
      'POST platform/google-play-games/identity': fixtureResponse(
        _envelope({'identity': _identity()}),
      ),
    });
    final gateway = _gateway(transport);

    final status = await gateway.getPgsIdentityStatus();
    expect(status.provider, 'google_play_games');
    expect(status.configured, isTrue);
    expect(status.status, MergeRelayPgsIdentityLinkStatus.unlinked);

    final identity = await gateway.linkPgsIdentity('auth-code_123');
    expect(identity.status, MergeRelayPgsIdentityLinkStatus.active);
    expect(transport.requests.last.body, {'server_auth_code': 'auth-code_123'});
  });

  test('does not recover or retry a one-shot server auth code', () async {
    final auth = MemoryMergeRelayAuthStore()
      ..accessToken = 'expired-token'
      ..recoveryToken = 'recovery-token';
    final transport = QueueTransport({
      'POST platform/google-play-games/identity': [
        fixtureResponse(fixtureError('invalid_game_token'), statusCode: 401),
      ],
    });

    await expectLater(
      _gateway(transport, auth: auth).linkPgsIdentity('auth-code_123'),
      throwsA(
        isA<MergeRelayApiException>().having(
          (error) => error.code,
          'code',
          'invalid_game_token',
        ),
      ),
    );
    expect(transport.requests.map((request) => request.key), [
      'POST platform/google-play-games/identity',
    ]);
  });

  test('rejects malformed auth codes and mismatched PGS responses', () async {
    final transport = FixtureTransport({
      'POST platform/google-play-games/identity': fixtureResponse(
        _envelope({
          'identity': {..._identity(), 'provider': 'other'},
        }),
      ),
    });
    final gateway = _gateway(transport);

    expect(() => gateway.linkPgsIdentity('auth code'), throwsArgumentError);
    await expectLater(
      gateway.linkPgsIdentity('auth-code_123'),
      throwsA(isA<MergeRelayProtocolException>()),
    );
  });
}
