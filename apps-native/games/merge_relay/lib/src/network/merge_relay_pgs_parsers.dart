import 'merge_relay_pgs_models.dart';
import 'merge_relay_parser_helpers.dart';
import 'merge_relay_wire.dart';

MergeRelayPgsIdentity parsePgsIdentityLink(Object? value) {
  final json = asJsonObject(value, 'Play Games identity link');
  requireFields(json, {'identity'}, 'Play Games identity link');
  final identity = parsePgsIdentity(json['identity']);
  if (identity.status == MergeRelayPgsIdentityLinkStatus.unlinked) {
    throw const MergeRelayProtocolException('Invalid linked identity status');
  }
  return identity;
}

MergeRelayPgsIdentitySnapshot parsePgsIdentityStatus(Object? value) {
  final json = asJsonObject(value, 'Play Games identity status');
  requireFields(json, {'identity'}, 'Play Games identity status');
  final identity = asJsonObject(json['identity'], 'Play Games identity status');
  requireFields(identity, {
    'provider',
    'configured',
    'status',
  }, 'Play Games identity status');
  return MergeRelayPgsIdentitySnapshot(
    provider: _provider(identity),
    configured: readBoolean(identity, 'configured'),
    status: _status(identity),
  );
}

MergeRelayPgsIdentity parsePgsIdentity(Object? value) {
  final json = asJsonObject(value, 'Play Games identity');
  requireFields(json, {
    'identity_id',
    'provider',
    'player_id',
    'status',
    'verified_at',
  }, 'Play Games identity');
  final playerId = readText(json, 'player_id', 256);
  if (!RegExp(r'^[A-Za-z0-9._:-]{1,256}$').hasMatch(playerId)) {
    throw const MergeRelayProtocolException('Invalid player_id');
  }
  return MergeRelayPgsIdentity(
    identityId: relayId(json, 'identity_id'),
    provider: _provider(json),
    playerId: playerId,
    status: _status(json),
    verifiedAt: readDate(json, 'verified_at'),
  );
}

String _provider(MergeRelayJson json) {
  final provider = readText(json, 'provider', 64);
  if (provider != 'google_play_games') {
    throw const MergeRelayProtocolException('Unsupported Play Games provider');
  }
  return provider;
}

MergeRelayPgsIdentityLinkStatus _status(MergeRelayJson json) {
  final status = readText(json, 'status', 32);
  return switch (status) {
    'unlinked' => MergeRelayPgsIdentityLinkStatus.unlinked,
    'active' => MergeRelayPgsIdentityLinkStatus.active,
    'reauthorization_required' =>
      MergeRelayPgsIdentityLinkStatus.reauthorizationRequired,
    'revoked' => MergeRelayPgsIdentityLinkStatus.revoked,
    _ => throw const MergeRelayProtocolException(
      'Unsupported Play Games identity status',
    ),
  };
}
