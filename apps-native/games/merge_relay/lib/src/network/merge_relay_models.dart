import 'package:merge_rules/merge_rules.dart';

enum MergeRelayChallengeStatus { open, retired }

enum MergeRelayAttemptStatus { reserved, completed, abandoned, cancelled }

enum MergeRelayResultOutcome {
  complete,
  tie,
  unfinished,
  earlyFinish,
  terminal,
}

final class MergeRelayCheckpoint {
  MergeRelayCheckpoint({
    required this.state,
    required this.maxLegalMoves,
    this.contentId,
    this.contentVersion,
    this.spawnWeights,
  });

  factory MergeRelayCheckpoint.fromDomain(MergeCheckpoint value) =>
      MergeRelayCheckpoint(
        state: value.state,
        maxLegalMoves: value.maxLegalMoves,
        contentId: value.contentId,
        contentVersion: value.contentVersion,
        spawnWeights: value.spawnWeights,
      );

  final MergeGameState state;
  final int maxLegalMoves;
  final String? contentId;
  final String? contentVersion;
  final MergeSpawnWeights? spawnWeights;

  Map<String, Object?> toWireJson() => {
    ...state.toWireJson(),
    'max_legal_moves': maxLegalMoves,
    if (contentId != null) 'content_id': contentId,
    if (contentVersion != null) 'content_version': contentVersion,
    if (spawnWeights != null) ...spawnWeights!.toJson(),
  };

  String get checkpointHash => sha256Hex(state.toWireJson());
}

final class MergeRelayChallenge {
  const MergeRelayChallenge({
    required this.challengeId,
    required this.creatorAlias,
    required this.mode,
    required this.originMode,
    required this.configRevision,
    required this.checkpoint,
    required this.checkpointHash,
    required this.payloadHash,
    required this.parentChallengeId,
    required this.status,
    required this.createdAt,
  });

  final String challengeId;
  final String creatorAlias;
  final MergeRelayMode mode;
  final MergeRelayMode originMode;
  final int configRevision;
  final MergeRelayCheckpoint checkpoint;
  final String checkpointHash;
  final String? payloadHash;
  final String? parentChallengeId;
  final MergeRelayChallengeStatus status;
  final DateTime createdAt;
}

final class MergeRelayAttempt {
  const MergeRelayAttempt({
    required this.attemptId,
    required this.challengeId,
    required this.environment,
    required this.recipientSubject,
    required this.checkpoint,
    required this.moves,
    required this.maxLegalMoves,
    required this.status,
    required this.reservationKey,
    required this.reservedAt,
    required this.expiresAt,
    required this.version,
    required this.resultId,
    required this.updatedAt,
  });

  final String attemptId;
  final String challengeId;
  final String environment;
  final String recipientSubject;
  final MergeRelayCheckpoint checkpoint;
  final List<MergeDirection> moves;
  final int maxLegalMoves;
  final MergeRelayAttemptStatus status;
  final String reservationKey;
  final DateTime reservedAt;
  final DateTime expiresAt;
  final int version;
  final String? resultId;
  final DateTime updatedAt;
}

final class MergeRelayResultEnvelope {
  const MergeRelayResultEnvelope({
    required this.resultId,
    required this.attemptId,
    required this.challengeId,
    required this.environment,
    required this.recipientSubject,
    required this.scoreDelta,
    required this.finalScore,
    required this.maxTile,
    required this.movesUsed,
    required this.outcome,
    required this.mode,
    required this.originMode,
    required this.configRevision,
    required this.challengePayloadHash,
    required this.returnChallengeId,
    required this.createdAt,
    this.returnChallenge,
  });

  final String resultId;
  final String attemptId;
  final String challengeId;
  final String environment;
  final String recipientSubject;
  final int scoreDelta;
  final int finalScore;
  final int maxTile;
  final int movesUsed;
  final MergeRelayResultOutcome outcome;
  final MergeRelayMode mode;
  final MergeRelayMode originMode;
  final int configRevision;
  final String? challengePayloadHash;
  final String? returnChallengeId;
  final DateTime createdAt;
  final MergeRelayChallenge? returnChallenge;
}

final class MergeRelayGuestSession {
  const MergeRelayGuestSession({
    required this.guestId,
    required this.subject,
    required this.recoveryToken,
    required this.accessToken,
    required this.createdAt,
    this.upgradedSubject,
    this.upgradedAt,
  });

  final String guestId;
  final String subject;
  final String recoveryToken;
  final String? accessToken;
  final DateTime? createdAt;
  final String? upgradedSubject;
  final DateTime? upgradedAt;
}

final class MergeRelayDailyChallenge {
  const MergeRelayDailyChallenge({
    required this.date,
    required this.checkpoint,
    required this.maxLegalMoves,
    required this.contentRevision,
    required this.generated,
    required this.updatedAt,
  });

  final String date;
  final MergeRelayCheckpoint checkpoint;
  final int maxLegalMoves;
  final String contentRevision;
  final bool generated;
  final DateTime updatedAt;
}

final class MergeRelayFeatureFlags {
  const MergeRelayFeatureFlags({
    required this.daily,
    required this.endless,
    required this.rankedRelay,
    required this.rewardedAds,
    required this.cosmetics,
  });

  final bool daily;
  final bool endless;
  final bool rankedRelay;
  final bool rewardedAds;
  final bool cosmetics;
}

final class MergeRelayConfigRevision {
  const MergeRelayConfigRevision({
    required this.revision,
    required this.rulesVersion,
    required this.contentRevision,
    required this.spawnWeights,
    required this.features,
    required this.active,
    required this.createdAt,
  });

  final int revision;
  final String rulesVersion;
  final String contentRevision;
  final MergeSpawnWeights spawnWeights;
  final MergeRelayFeatureFlags features;
  final bool active;
  final DateTime createdAt;
}

final class MergeRelaySave {
  const MergeRelaySave({
    required this.saveId,
    required this.schemaVersion,
    required this.version,
    required this.payload,
    required this.updatedAt,
    this.payloadFingerprint,
  });

  final String saveId;
  final int schemaVersion;
  final int version;
  final Map<String, Object?> payload;
  final DateTime updatedAt;
  final String? payloadFingerprint;
}
