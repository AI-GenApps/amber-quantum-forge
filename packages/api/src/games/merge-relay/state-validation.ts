import type {
  MergeAttempt,
  MergeChallenge,
  MergeConfigRevision,
  MergeDailyChallenge,
  MergeEnvironment,
  MergeEvent,
  MergeGuest,
  MergeRelayState,
  MergeResult,
  MergeReward,
  MergeSave,
  MergeSocialRecord,
} from "./contracts";
import {
  MERGE_RELAY_CONTENT_VERSION,
  MERGE_RELAY_MAX_MOVES,
  MERGE_RELAY_RULE_VERSION,
  MERGE_RELAY_SAVE_SCHEMA_VERSION,
  MERGE_RELAY_SCHEMA_VERSION,
} from "./contracts";
import { challengePayloadHash, checkpointHash, validateCheckpoint } from "./engine";
import { requestFingerprint } from "./fingerprint";
import { validateStateRelations } from "./state-relations";
import {
  asRecord,
  isAlias,
  isAttemptStatus,
  isEnvironment,
  isEventType,
  isHex,
  isId,
  isMode,
  isReason,
  isStatus,
  isTimestamp,
  validateAlias,
} from "./state-validation-helpers";
import { cloneMergeState } from "./store";
import { MERGE_MAX_PAYLOAD_BYTES } from "./validation";

export function parseMergeRelayState(
  value: unknown,
  expectedEnvironment?: MergeEnvironment,
): MergeRelayState {
  const record = asRecord(value);
  if (record?.schemaVersion !== MERGE_RELAY_SCHEMA_VERSION)
    throw new Error("Merge Relay state schema is invalid");
  const state = value as MergeRelayState;
  if (
    !Array.isArray(state.challenges) ||
    !Array.isArray(state.attempts) ||
    !Array.isArray(state.results) ||
    !Array.isArray(state.saves) ||
    !Array.isArray(state.guests) ||
    !Array.isArray(state.daily) ||
    !Array.isArray(state.configs) ||
    !Array.isArray(state.events) ||
    !Array.isArray(state.social) ||
    !Array.isArray(state.rewards) ||
    !Array.isArray(state.aliases) ||
    state.configs.length === 0
  ) {
    throw new Error("Merge Relay state collections are invalid");
  }
  state.challenges.forEach((challenge) => {
    validateChallenge(challenge, expectedEnvironment);
  });
  state.attempts.forEach((attempt) => {
    validateAttempt(attempt, expectedEnvironment);
  });
  for (const result of state.results) validateResult(result, expectedEnvironment);
  state.saves.forEach(validateSave);
  state.guests.forEach(validateGuest);
  state.daily.forEach(validateDaily);
  state.configs.forEach(validateConfig);
  state.events.forEach(validateEvent);
  state.social.forEach(validateSocial);
  state.rewards.forEach(validateReward);
  state.aliases.forEach(validateAlias);
  validateStateRelations(state, expectedEnvironment);
  return cloneMergeState(state);
}

export function validateChallenge(
  value: MergeChallenge,
  expectedEnvironment?: MergeEnvironment,
): void {
  if (
    !isId(value.challengeId) ||
    !isId(value.ownerSubject) ||
    !isAlias(value.creatorAlias) ||
    !isEnvironment(value.environment) ||
    (expectedEnvironment !== undefined && value.environment !== expectedEnvironment) ||
    !isStatus(value.status) ||
    !isMode(value.mode) ||
    !isMode(value.originMode) ||
    !Number.isSafeInteger(value.configRevision) ||
    value.configRevision < 1 ||
    (value.requestFingerprint !== undefined && !isHex(value.requestFingerprint))
  )
    throw new Error("Merge Relay challenge is invalid");
  validateCheckpoint(value.checkpoint);
  if (
    value.checkpoint.spawnTwoWeight !== undefined &&
    value.checkpoint.spawnFourWeight !== undefined &&
    value.checkpoint.spawnTwoWeight + value.checkpoint.spawnFourWeight !== 100
  )
    throw new Error("Merge Relay challenge spawn weights are invalid");
  if (checkpointHash(value.checkpoint) !== value.checkpointHash)
    throw new Error("Merge Relay challenge hash is invalid");
  if (
    value.payloadHash !== undefined &&
    (!isHex(value.payloadHash) ||
      value.payloadHash !==
        challengePayloadHash({
          checkpoint: value.checkpoint,
          configRevision: value.configRevision,
          mode: value.mode,
          originMode: value.originMode,
          parentChallengeId: value.parentChallengeId,
        }))
  )
    throw new Error("Merge Relay challenge payload hash is invalid");
  if (
    !isHex(value.checkpointHash) ||
    (value.parentChallengeId !== null && !isId(value.parentChallengeId)) ||
    !isId(value.idempotencyKey) ||
    !isTimestamp(value.createdAt)
  )
    throw new Error("Merge Relay challenge is invalid");
}

export function validateAttempt(value: MergeAttempt, expectedEnvironment?: MergeEnvironment): void {
  if (
    !isId(value.attemptId) ||
    !isId(value.challengeId) ||
    !isEnvironment(value.environment) ||
    (expectedEnvironment !== undefined && value.environment !== expectedEnvironment) ||
    !isId(value.recipientSubject) ||
    !Number.isSafeInteger(value.maxLegalMoves) ||
    value.maxLegalMoves < 1 ||
    value.maxLegalMoves > MERGE_RELAY_MAX_MOVES ||
    !isAttemptStatus(value.status) ||
    !isId(value.reservationKey) ||
    !isTimestamp(value.reservedAt) ||
    !isTimestamp(value.expiresAt) ||
    !Number.isSafeInteger(value.version) ||
    value.version < 0 ||
    !Array.isArray(value.moves) ||
    value.moves.length > value.maxLegalMoves ||
    !value.moves.every((move) => ["up", "down", "left", "right"].includes(move)) ||
    (value.resultId !== null && !isId(value.resultId)) ||
    !isTimestamp(value.updatedAt)
  )
    throw new Error("Merge Relay attempt is invalid");
  validateCheckpoint(value.checkpoint);
}

export function validateResult(value: MergeResult, expectedEnvironment?: MergeEnvironment): void {
  if (
    !isId(value.resultId) ||
    !isId(value.attemptId) ||
    !isId(value.challengeId) ||
    !isEnvironment(value.environment) ||
    (expectedEnvironment !== undefined && value.environment !== expectedEnvironment) ||
    !isId(value.recipientSubject) ||
    !Number.isSafeInteger(value.scoreDelta) ||
    !Number.isSafeInteger(value.finalScore) ||
    !Number.isSafeInteger(value.maxTile) ||
    !Number.isSafeInteger(value.movesUsed) ||
    value.movesUsed < 0 ||
    value.movesUsed > MERGE_RELAY_MAX_MOVES ||
    !["complete", "tie", "unfinished", "early_finish", "terminal"].includes(value.outcome) ||
    !isMode(value.mode) ||
    !isMode(value.originMode) ||
    !Number.isSafeInteger(value.configRevision) ||
    value.configRevision < 1 ||
    (value.challengePayloadHash !== undefined && !isHex(value.challengePayloadHash)) ||
    (value.returnChallengeId !== null && !isId(value.returnChallengeId)) ||
    !isId(value.idempotencyKey) ||
    (value.requestFingerprint !== undefined && !isHex(value.requestFingerprint)) ||
    !isTimestamp(value.createdAt)
  )
    throw new Error("Merge Relay result is invalid");
}

export function validateSave(value: MergeSave): void {
  if (
    !isId(value.saveId) ||
    !isId(value.subject) ||
    !Number.isSafeInteger(value.schemaVersion) ||
    value.schemaVersion !== MERGE_RELAY_SAVE_SCHEMA_VERSION ||
    !Number.isSafeInteger(value.version) ||
    value.version < 1 ||
    !asRecord(value.payload) ||
    Buffer.byteLength(JSON.stringify(value.payload), "utf8") > MERGE_MAX_PAYLOAD_BYTES ||
    (value.payloadFingerprint !== undefined &&
      (value.payloadFingerprint !==
        requestFingerprint({ schemaVersion: value.schemaVersion, payload: value.payload }) ||
        !/^[a-f0-9]{64}$/.test(value.payloadFingerprint))) ||
    !isTimestamp(value.updatedAt)
  )
    throw new Error("Merge Relay save is invalid");
}

export function validateGuest(value: MergeGuest): void {
  if (
    !isId(value.guestId) ||
    !isId(value.subject) ||
    !isHex(value.recoveryTokenHash) ||
    (value.upgradedSubject !== null && !isId(value.upgradedSubject)) ||
    !isTimestamp(value.createdAt) ||
    (value.upgradedAt !== null && !isTimestamp(value.upgradedAt))
  )
    throw new Error("Merge Relay guest is invalid");
}

export function validateDaily(value: MergeDailyChallenge): void {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value.date) ||
    value.mode !== "daily" ||
    !Number.isSafeInteger(value.configRevision) ||
    value.configRevision < 1 ||
    value.maxLegalMoves < 1 ||
    value.maxLegalMoves > MERGE_RELAY_MAX_MOVES ||
    !isId(value.contentRevision) ||
    typeof value.generated !== "boolean" ||
    !isTimestamp(value.updatedAt)
  )
    throw new Error("Merge Relay daily record is invalid");
  validateCheckpoint(value.checkpoint);
}

export function validateConfig(value: MergeConfigRevision): void {
  if (
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1 ||
    value.rulesVersion !== MERGE_RELAY_RULE_VERSION ||
    value.contentRevision !== MERGE_RELAY_CONTENT_VERSION ||
    !Number.isInteger(value.spawnTwoWeight) ||
    !Number.isInteger(value.spawnFourWeight) ||
    value.spawnTwoWeight < 0 ||
    value.spawnFourWeight < 0 ||
    value.spawnTwoWeight + value.spawnFourWeight !== 100 ||
    !value.features ||
    Object.values(value.features).some((feature) => typeof feature !== "boolean") ||
    typeof value.active !== "boolean" ||
    !isTimestamp(value.createdAt)
  )
    throw new Error("Merge Relay config is invalid");
}

export function validateEvent(value: MergeEvent): void {
  if (
    !isId(value.eventId) ||
    !isId(value.idempotencyKey) ||
    !isId(value.subject) ||
    !isEventType(value.type) ||
    (value.artifactId !== null && !isId(value.artifactId)) ||
    (value.requestFingerprint !== undefined && !isHex(value.requestFingerprint)) ||
    !asRecord(value.payload) ||
    !isTimestamp(value.createdAt)
  )
    throw new Error("Merge Relay event is invalid");
}

export function validateSocial(value: MergeSocialRecord): void {
  if (
    !isId(value.recordId) ||
    !isId(value.subject) ||
    (value.targetSubject !== null && !isId(value.targetSubject)) ||
    (value.targetAlias !== null && !isAlias(value.targetAlias)) ||
    (value.action !== "report" && value.action !== "block") ||
    !isReason(value.reason) ||
    !isTimestamp(value.createdAt)
  )
    throw new Error("Merge Relay social record is invalid");
}

export function validateReward(value: MergeReward): void {
  if (
    !isId(value.rewardId) ||
    !isId(value.resultId) ||
    !isId(value.subject) ||
    (value.kind !== "cosmetic" && value.kind !== "ad_reward") ||
    !isId(value.productId) ||
    !isId(value.providerTransactionId) ||
    value.status !== "granted" ||
    !isTimestamp(value.createdAt)
  )
    throw new Error("Merge Relay reward is invalid");
}
