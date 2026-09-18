import type { GameEnvironment, GameSession, JsonObject } from "../contracts";

export const MERGE_RELAY_APP_ID = "merge_relay" as const;
export const MERGE_RELAY_CONTRACT_VERSION = "merge-relay.v1" as const;
export const MERGE_RELAY_RULE_VERSION = "MR-2D-1" as const;
export const MERGE_RELAY_CONTENT_VERSION = "MR-CONTENT-1" as const;
export const MERGE_RELAY_SCHEMA_VERSION = 1 as const;
export const MERGE_RELAY_SAVE_SCHEMA_VERSION = 1 as const;
export const MERGE_RELAY_MAX_MOVES = 3 as const;
export const MERGE_RELAY_RESERVATION_HOURS = 24 as const;

export type MergeDirection = "up" | "down" | "left" | "right";
export type MergeMode = "rescue" | "daily" | "endless";
export type MergeEnvironment = GameEnvironment;
export type MergeSession = GameSession & { appId: typeof MERGE_RELAY_APP_ID };
type MergeChallengeStatus = "open" | "retired";
type MergeAttemptStatus = "reserved" | "completed" | "abandoned" | "cancelled";
type MergeResultOutcome = "complete" | "tie" | "unfinished" | "early_finish" | "terminal";
type MergeEventType =
  | "challenge_created"
  | "challenge_opened"
  | "challenge_retired"
  | "checkpoint_saved"
  | "relay_attempt_reserved"
  | "relay_attempt_abandoned"
  | "relay_attempt_cancelled"
  | "attempt_reserved"
  | "attempt_abandoned"
  | "attempt_completed"
  | "relay_return_created"
  | "replay_viewed"
  | "validation_rejected"
  | "daily_run_complete"
  | "practice_rewind_used";

export interface MergeCheckpoint {
  board: number[];
  score: number;
  moveCount: number;
  seed: number;
  rngState: number;
  ruleVersion: typeof MERGE_RELAY_RULE_VERSION;
  maxLegalMoves?: number;
  contentId?: string;
  contentVersion?: string;
  spawnTwoWeight?: number;
  spawnFourWeight?: number;
}

export interface MergeChallenge {
  challengeId: string;
  environment: MergeEnvironment;
  ownerSubject: string;
  creatorAlias: string;
  mode: MergeMode;
  originMode: MergeMode;
  configRevision: number;
  checkpoint: MergeCheckpoint;
  checkpointHash: string;
  payloadHash?: string;
  parentChallengeId: string | null;
  idempotencyKey: string;
  requestFingerprint?: string;
  status: MergeChallengeStatus;
  createdAt: string;
}

export interface MergeAttempt {
  attemptId: string;
  challengeId: string;
  environment: MergeEnvironment;
  recipientSubject: string;
  checkpoint: MergeCheckpoint;
  maxLegalMoves: number;
  moves: MergeDirection[];
  status: MergeAttemptStatus;
  reservationKey: string;
  reservedAt: string;
  expiresAt: string;
  version: number;
  resultId: string | null;
  updatedAt: string;
}

export interface MergeResult {
  resultId: string;
  attemptId: string;
  challengeId: string;
  environment: MergeEnvironment;
  recipientSubject: string;
  scoreDelta: number;
  finalScore: number;
  maxTile: number;
  movesUsed: number;
  outcome: MergeResultOutcome;
  mode: MergeMode;
  originMode: MergeMode;
  configRevision: number;
  challengePayloadHash?: string;
  returnChallengeId: string | null;
  idempotencyKey: string;
  requestFingerprint?: string;
  createdAt: string;
}

export interface MergeSave {
  saveId: string;
  subject: string;
  schemaVersion: number;
  version: number;
  payload: JsonObject;
  updatedAt: string;
}

export interface MergeGuest {
  guestId: string;
  subject: string;
  recoveryTokenHash: string;
  upgradedSubject: string | null;
  createdAt: string;
  upgradedAt: string | null;
}

export interface MergeDailyChallenge {
  date: string;
  configRevision: number;
  checkpoint: MergeCheckpoint;
  mode: "daily";
  maxLegalMoves: number;
  contentRevision: string;
  generated: boolean;
  updatedAt: string;
}

export interface MergeConfigRevision {
  revision: number;
  rulesVersion: typeof MERGE_RELAY_RULE_VERSION;
  contentRevision: typeof MERGE_RELAY_CONTENT_VERSION;
  spawnTwoWeight: number;
  spawnFourWeight: number;
  features: {
    daily: boolean;
    endless: boolean;
    rankedRelay: boolean;
    rewardedAds: boolean;
    cosmetics: boolean;
  };
  active: boolean;
  createdAt: string;
}

export interface MergeEvent {
  eventId: string;
  idempotencyKey: string;
  subject: string;
  type: MergeEventType;
  artifactId: string | null;
  payload: JsonObject;
  requestFingerprint?: string;
  createdAt: string;
}

export interface MergeSocialRecord {
  recordId: string;
  subject: string;
  targetSubject: string | null;
  targetAlias: string | null;
  action: "report" | "block";
  reason: string;
  createdAt: string;
}

export interface MergeAlias {
  aliasId: string;
  alias: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
}

export interface MergeReward {
  rewardId: string;
  resultId: string;
  subject: string;
  kind: "cosmetic" | "ad_reward";
  productId: string;
  providerTransactionId: string;
  status: "granted";
  createdAt: string;
}

export interface MergeRelayState {
  schemaVersion: typeof MERGE_RELAY_SCHEMA_VERSION;
  challenges: MergeChallenge[];
  attempts: MergeAttempt[];
  results: MergeResult[];
  saves: MergeSave[];
  guests: MergeGuest[];
  daily: MergeDailyChallenge[];
  configs: MergeConfigRevision[];
  events: MergeEvent[];
  social: MergeSocialRecord[];
  rewards: MergeReward[];
  aliases: MergeAlias[];
}

export interface CreateChallengeRequest {
  idempotencyKey: string;
  creatorAlias: string;
  checkpoint: MergeCheckpoint;
  mode?: MergeMode;
  maxLegalMoves?: number;
  contentId?: string;
  contentVersion?: string;
  originMode?: MergeMode;
  parentChallengeId?: string;
}

export interface ReserveAttemptRequest {
  reservationKey: string;
}
export interface SubmitMovesRequest {
  expectedVersion: number;
  moves: MergeDirection[];
}
export interface FinalizeAttemptRequest {
  idempotencyKey: string;
  finishEarly?: boolean;
  returnAlias?: string;
}
export interface SaveRequest {
  expectedVersion: number;
  schemaVersion: number;
  payload: JsonObject;
}

export interface GuestRecoveryRequest {
  recoveryToken: string;
}

export interface GuestUpgradeRequest {
  recoveryToken: string;
}

export interface RewardGrantRequest {
  resultId: string;
  kind: MergeReward["kind"];
  productId: string;
  providerTransactionId: string;
}

export interface EventRequest {
  idempotencyKey: string;
  type: MergeEventType;
  artifactId?: string;
  payload: JsonObject;
}

export interface SocialRequest {
  targetSubject?: string;
  targetAlias?: string;
  reason: string;
}

export interface ConfigUpdateRequest {
  expectedRevision: number;
  features: MergeConfigRevision["features"];
  spawnTwoWeight: number;
  spawnFourWeight: number;
  contentRevision?: typeof MERGE_RELAY_CONTENT_VERSION;
}

export interface ConfigRollbackRequest {
  targetRevision: number;
  expectedRevision: number;
}

export interface PublicChallenge {
  challengeId: string;
  creatorAlias: string;
  mode: MergeMode;
  originMode: MergeMode;
  configRevision: number;
  checkpoint: MergeCheckpoint;
  checkpointHash: string;
  payloadHash?: string;
  parentChallengeId: string | null;
  status: MergeChallengeStatus;
  createdAt: string;
}

export interface MergeErrorResponse {
  contract_version: typeof MERGE_RELAY_CONTRACT_VERSION;
  error: {
    code: string;
    message: string;
    diagnostic_id: string;
  };
}
