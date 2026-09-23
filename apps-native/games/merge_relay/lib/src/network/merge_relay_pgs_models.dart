enum MergeRelayPgsIdentityLinkStatus {
  unlinked,
  active,
  reauthorizationRequired,
  revoked,
}

final class MergeRelayPgsIdentity {
  const MergeRelayPgsIdentity({
    required this.identityId,
    required this.provider,
    required this.playerId,
    required this.status,
    required this.verifiedAt,
  });

  final String identityId;
  final String provider;
  final String playerId;
  final MergeRelayPgsIdentityLinkStatus status;
  final DateTime verifiedAt;
}

final class MergeRelayPgsIdentitySnapshot {
  const MergeRelayPgsIdentitySnapshot({
    required this.provider,
    required this.configured,
    required this.status,
  });

  final String provider;
  final bool configured;
  final MergeRelayPgsIdentityLinkStatus status;

  bool get isLinked => status == MergeRelayPgsIdentityLinkStatus.active;
}
