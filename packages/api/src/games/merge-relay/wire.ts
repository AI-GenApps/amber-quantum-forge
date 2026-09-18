import type {
  MergeAttempt,
  MergeCheckpoint,
  MergeConfigRevision,
  MergeDailyChallenge,
  MergeEvent,
  MergeGuest,
  MergeResult,
  MergeReward,
  MergeSave,
  MergeSocialRecord,
  PublicChallenge,
} from "./contracts";

export interface WireCheckpoint {
  board: number[];
  score: number;
  move_count: number;
  seed: number;
  rng_state: number;
  rule_version: string;
  max_legal_moves?: number;
  content_id?: string;
  content_version?: string;
  spawn_two_weight?: number;
  spawn_four_weight?: number;
}

function checkpointToWire(value: MergeCheckpoint): WireCheckpoint {
  return {
    board: [...value.board],
    score: value.score,
    move_count: value.moveCount,
    seed: value.seed,
    rng_state: value.rngState,
    rule_version: value.ruleVersion,
    ...(value.maxLegalMoves === undefined ? {} : { max_legal_moves: value.maxLegalMoves }),
    ...(value.contentId === undefined ? {} : { content_id: value.contentId }),
    ...(value.contentVersion === undefined ? {} : { content_version: value.contentVersion }),
    ...(value.spawnTwoWeight === undefined ? {} : { spawn_two_weight: value.spawnTwoWeight }),
    ...(value.spawnFourWeight === undefined ? {} : { spawn_four_weight: value.spawnFourWeight }),
  };
}

export function publicChallengeToWire(value: PublicChallenge) {
  return {
    challenge_id: value.challengeId,
    creator_alias: value.creatorAlias,
    mode: value.mode,
    origin_mode: value.originMode,
    config_revision: value.configRevision,
    checkpoint: checkpointToWire(value.checkpoint),
    checkpoint_hash: value.checkpointHash,
    ...(value.payloadHash === undefined ? {} : { payload_hash: value.payloadHash }),
    parent_challenge_id: value.parentChallengeId,
    status: value.status,
    created_at: value.createdAt,
  };
}

export function attemptToWire(value: MergeAttempt) {
  return {
    attempt_id: value.attemptId,
    challenge_id: value.challengeId,
    environment: value.environment,
    recipient_subject: value.recipientSubject,
    checkpoint: checkpointToWire(value.checkpoint),
    moves: [...value.moves],
    max_legal_moves: value.maxLegalMoves,
    status: value.status,
    reservation_key: value.reservationKey,
    reserved_at: value.reservedAt,
    expires_at: value.expiresAt,
    version: value.version,
    result_id: value.resultId,
    updated_at: value.updatedAt,
  };
}

export function resultToWire(value: MergeResult) {
  return {
    result_id: value.resultId,
    attempt_id: value.attemptId,
    challenge_id: value.challengeId,
    recipient_subject: value.recipientSubject,
    environment: value.environment,
    score_delta: value.scoreDelta,
    final_score: value.finalScore,
    max_tile: value.maxTile,
    moves_used: value.movesUsed,
    outcome: value.outcome,
    mode: value.mode,
    origin_mode: value.originMode,
    config_revision: value.configRevision,
    ...(value.challengePayloadHash === undefined
      ? {}
      : { challenge_payload_hash: value.challengePayloadHash }),
    return_challenge_id: value.returnChallengeId,
    created_at: value.createdAt,
  };
}

export function saveToWire(value: MergeSave) {
  return {
    save_id: value.saveId,
    schema_version: value.schemaVersion,
    version: value.version,
    payload: value.payload,
    updated_at: value.updatedAt,
  };
}

export function dailyToWire(value: MergeDailyChallenge) {
  return {
    date: value.date,
    mode: value.mode,
    max_legal_moves: value.maxLegalMoves,
    checkpoint: checkpointToWire(value.checkpoint),
    content_revision: value.contentRevision,
    generated: value.generated,
    updated_at: value.updatedAt,
  };
}

export function configToWire(value: MergeConfigRevision) {
  return {
    revision: value.revision,
    rules_version: value.rulesVersion,
    content_revision: value.contentRevision,
    spawn_two_weight: value.spawnTwoWeight,
    spawn_four_weight: value.spawnFourWeight,
    features: {
      daily: value.features.daily,
      endless: value.features.endless,
      ranked_relay: value.features.rankedRelay,
      rewarded_ads: value.features.rewardedAds,
      cosmetics: value.features.cosmetics,
    },
    active: value.active,
    created_at: value.createdAt,
  };
}

export function guestToWire(value: MergeGuest) {
  return {
    guest_id: value.guestId,
    subject: value.subject,
    upgraded_subject: value.upgradedSubject,
    created_at: value.createdAt,
    upgraded_at: value.upgradedAt,
  };
}

export function eventToWire(value: MergeEvent) {
  return {
    event_id: value.eventId,
    idempotency_key: value.idempotencyKey,
    type: value.type,
    artifact_id: value.artifactId,
    payload: value.payload,
    request_fingerprint: value.requestFingerprint,
    created_at: value.createdAt,
  };
}

export function socialToWire(value: MergeSocialRecord) {
  return {
    record_id: value.recordId,
    target_subject: value.targetSubject,
    target_alias: value.targetAlias,
    action: value.action,
    created_at: value.createdAt,
  };
}

export function rewardToWire(value: MergeReward) {
  return {
    reward_id: value.rewardId,
    result_id: value.resultId,
    subject: value.subject,
    kind: value.kind,
    product_id: value.productId,
    provider_transaction_id: value.providerTransactionId,
    status: value.status,
    created_at: value.createdAt,
  };
}
