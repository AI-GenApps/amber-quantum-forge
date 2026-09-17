import type {
  ChallengeRecord,
  EntitlementRecord,
  GameNamespace,
  GameStorageSnapshot,
  JsonObject,
  SaveRecord,
} from "./contracts";
import { GAME_CONTRACT_VERSION } from "./contracts";
import {
  hasBoundedJsonSize,
  isBoundedMemberList,
  isJsonObject,
  isSafeIdentifier,
} from "./validation";

export interface FileSnapshotEnvelope {
  contract_version: string;
  app_id: string;
  environment: string;
  saves: SaveRecord[];
  challenges: ChallengeRecord[];
  entitlements: EntitlementRecord[];
}

export function emptySnapshot(namespace: GameNamespace): FileSnapshotEnvelope {
  return {
    contract_version: GAME_CONTRACT_VERSION,
    app_id: namespace.appId,
    environment: namespace.environment,
    saves: [],
    challenges: [],
    entitlements: [],
  };
}

export function snapshotEnvelope(
  namespace: GameNamespace,
  snapshot: GameStorageSnapshot,
): FileSnapshotEnvelope {
  return {
    contract_version: GAME_CONTRACT_VERSION,
    app_id: namespace.appId,
    environment: namespace.environment,
    ...snapshot,
  };
}

export function parseSnapshot(value: unknown, namespace: GameNamespace): GameStorageSnapshot {
  if (!isJsonObject(value)) throw new Error("Snapshot must be an object");
  if (
    value.contract_version !== GAME_CONTRACT_VERSION ||
    value.app_id !== namespace.appId ||
    value.environment !== namespace.environment
  ) {
    throw new Error("Snapshot scope or version is invalid");
  }
  const saves = parseArray(value.saves, parseSave);
  const challenges = parseArray(value.challenges, parseChallenge);
  const entitlements = parseArray(value.entitlements, parseEntitlement);
  return { saves, challenges, entitlements };
}

function parseArray<T>(value: unknown, parser: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value) || value.length > 100_000) throw new Error("Snapshot array is invalid");
  const parsed = value.map(parser);
  if (parsed.some((item) => item === null)) throw new Error("Snapshot record is invalid");
  return parsed as T[];
}

function parseSave(value: unknown): SaveRecord | null {
  if (!isJsonObject(value)) return null;
  if (
    !isSafeIdentifier(value.saveId) ||
    !isSafeIdentifier(value.ownerUserId) ||
    !isIntegerInRange(value.schemaVersion, 1, 100) ||
    !isIntegerInRange(value.version, 1, 2_147_483_647) ||
    !isJsonObject(value.payload) ||
    !hasBoundedJsonSize(value.payload) ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }
  return {
    saveId: value.saveId,
    ownerUserId: value.ownerUserId,
    schemaVersion: value.schemaVersion,
    version: value.version,
    payload: value.payload,
    updatedAt: value.updatedAt,
  };
}

function parseChallenge(value: unknown): ChallengeRecord | null {
  if (!isJsonObject(value)) return null;
  if (
    !isSafeIdentifier(value.challengeId) ||
    !isSafeIdentifier(value.ownerUserId) ||
    !isBoundedMemberList(value.memberUserIds) ||
    !isJsonObject(value.payload) ||
    !hasBoundedJsonSize(value.payload) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }
  return {
    challengeId: value.challengeId,
    ownerUserId: value.ownerUserId,
    memberUserIds: value.memberUserIds,
    payload: value.payload,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function parseEntitlement(value: unknown): EntitlementRecord | null {
  if (!isJsonObject(value)) return null;
  if (
    !isSafeIdentifier(value.entitlementId) ||
    !isSafeIdentifier(value.productId) ||
    !isSafeIdentifier(value.purchaseId) ||
    !isSafeIdentifier(value.userId) ||
    typeof value.grantedAt !== "string"
  ) {
    return null;
  }
  return {
    entitlementId: value.entitlementId,
    productId: value.productId,
    purchaseId: value.purchaseId,
    userId: value.userId,
    grantedAt: value.grantedAt,
  };
}

function isIntegerInRange(value: JsonObject[string], min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}
