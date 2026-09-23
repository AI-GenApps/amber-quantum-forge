part of 'merge_relay_network.dart';

base mixin _MergeRelayPgsOperations on _MergeRelayHttpGatewayBase
    implements MergeRelayGateway {
  @override
  Future<MergeRelayPgsIdentity> linkPgsIdentity(String serverAuthCode) {
    if (!_isValidServerAuthCode(serverAuthCode)) {
      throw ArgumentError('Invalid serverAuthCode');
    }
    return _request(
      method: 'POST',
      path: 'platform/google-play-games/identity',
      body: {'server_auth_code': serverAuthCode},
      authenticated: true,
      allowRecovery: false,
      parser: parsePgsIdentityLink,
    );
  }

  @override
  Future<MergeRelayPgsIdentitySnapshot> getPgsIdentityStatus() => _request(
    method: 'GET',
    path: 'platform/google-play-games/identity',
    authenticated: true,
    parser: parsePgsIdentityStatus,
  );
}

bool _isValidServerAuthCode(String value) =>
    value.isNotEmpty &&
    value.length <= 4096 &&
    RegExp(r'^[A-Za-z0-9._~+/=-]+$').hasMatch(value);
