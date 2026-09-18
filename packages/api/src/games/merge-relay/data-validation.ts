import type { JsonObject } from "../contracts";
import type {
  ConfigRollbackRequest,
  ConfigUpdateRequest,
  EventRequest,
  RewardGrantRequest,
  SocialRequest,
} from "./contracts";
import { MERGE_RELAY_CONTENT_VERSION } from "./contracts";

const maxAliasLength = 40;
const eventTypes = new Set<EventRequest["type"]>([
  "challenge_created",
  "challenge_opened",
  "challenge_retired",
  "checkpoint_saved",
  "relay_attempt_reserved",
  "relay_attempt_abandoned",
  "relay_attempt_cancelled",
  "attempt_reserved",
  "attempt_abandoned",
  "attempt_completed",
  "relay_return_created",
  "replay_viewed",
  "validation_rejected",
  "daily_run_complete",
  "practice_rewind_used",
]);

export function parseReward(value: unknown): RewardGrantRequest | null {
  if (
    !isObject(value) ||
    !isSafeId(value.result_id) ||
    !isSafeId(value.provider_transaction_id) ||
    !isSafeId(value.product_id) ||
    (value.kind !== "cosmetic" && value.kind !== "ad_reward")
  )
    return null;
  return {
    resultId: value.result_id,
    kind: value.kind,
    productId: value.product_id,
    providerTransactionId: value.provider_transaction_id,
  };
}

export function parseEvent(value: unknown): EventRequest | null {
  if (
    !isObject(value) ||
    !isIdempotencyKey(value.idempotency_key) ||
    typeof value.type !== "string" ||
    !eventTypes.has(value.type as EventRequest["type"]) ||
    !isObject(value.payload)
  )
    return null;
  if (value.artifact_id !== undefined && !isSafeId(value.artifact_id)) return null;
  if (Buffer.byteLength(JSON.stringify(value.payload), "utf8") > 32 * 1024) return null;
  return {
    idempotencyKey: value.idempotency_key,
    type: value.type as EventRequest["type"],
    artifactId: value.artifact_id,
    payload: value.payload,
  };
}

export function parseSocial(value: unknown): SocialRequest | null {
  if (!isObject(value) || !isSafeText(value.reason, 256)) return null;
  if (value.target_subject !== undefined && !isSafeText(value.target_subject, 128)) return null;
  if (value.target_alias !== undefined && !isSafeText(value.target_alias, maxAliasLength))
    return null;
  if (value.target_subject === undefined && value.target_alias === undefined) return null;
  return {
    targetSubject: value.target_subject,
    targetAlias: value.target_alias,
    reason: value.reason,
  };
}

export function parseConfigUpdate(value: unknown): ConfigUpdateRequest | null {
  if (!isObject(value) || !isObject(value.features)) return null;
  const expectedRevision = integerField(value.expected_revision);
  const spawnTwoWeight = integerField(value.spawn_two_weight);
  const spawnFourWeight = integerField(value.spawn_four_weight);
  if (
    expectedRevision === null ||
    spawnTwoWeight === null ||
    spawnFourWeight === null ||
    spawnTwoWeight < 0 ||
    spawnFourWeight < 0 ||
    spawnTwoWeight + spawnFourWeight !== 100 ||
    (value.content_revision !== undefined && value.content_revision !== MERGE_RELAY_CONTENT_VERSION)
  )
    return null;
  const features = value.features;
  const keys = ["daily", "endless", "ranked_relay", "rewarded_ads", "cosmetics"] as const;
  if (!keys.every((key) => typeof features[key] === "boolean")) return null;
  return {
    expectedRevision,
    spawnTwoWeight,
    spawnFourWeight,
    features: {
      daily: features.daily as boolean,
      endless: features.endless as boolean,
      rankedRelay: features.ranked_relay as boolean,
      rewardedAds: features.rewarded_ads as boolean,
      cosmetics: features.cosmetics as boolean,
    },
    contentRevision: (value.content_revision ??
      MERGE_RELAY_CONTENT_VERSION) as typeof MERGE_RELAY_CONTENT_VERSION,
  };
}

export function parseConfigRollback(value: unknown): ConfigRollbackRequest | null {
  if (!isObject(value)) return null;
  const targetRevision = integerField(value.target_revision);
  const expectedRevision = integerField(value.expected_revision);
  if (
    targetRevision === null ||
    targetRevision < 1 ||
    expectedRevision === null ||
    expectedRevision < 1
  )
    return null;
  return { targetRevision, expectedRevision };
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function isSafeId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

function isIdempotencyKey(value: unknown): value is string {
  return isSafeText(value, 128) && /^[A-Za-z0-9._:-]+$/.test(value);
}

function integerField(value: JsonObject[string]): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}
