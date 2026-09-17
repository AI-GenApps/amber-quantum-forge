export const GAME_APP_IDS = [
  "merge_relay",
  "pocket_biome",
  "sixty_second_heist",
  "meme_court",
  "snapquest",
] as const;

export type GameAppId = (typeof GAME_APP_IDS)[number];

export const GAME_ENVIRONMENTS = ["debug", "staging", "production"] as const;

export type GameEnvironment = (typeof GAME_ENVIRONMENTS)[number];

export const GAME_ROLES = ["player", "moderator", "game_admin", "service"] as const;

export type GameRole = (typeof GAME_ROLES)[number];

export const GAME_CONTRACT_VERSION = "games.v1";
export const GAME_NAMESPACE_PREFIX = "games";

export interface GameNamespace {
  appId: GameAppId;
  environment: GameEnvironment;
}

export interface GameSession extends GameNamespace {
  subject: string;
  role: GameRole;
}

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface SaveRecord {
  saveId: string;
  ownerUserId: string;
  schemaVersion: number;
  version: number;
  payload: JsonObject;
  updatedAt: string;
}

export interface SaveWriteInput {
  saveId: string;
  ownerUserId: string;
  schemaVersion: number;
  expectedVersion: number;
  payload: JsonObject;
}

export interface ChallengeRecord {
  challengeId: string;
  ownerUserId: string;
  memberUserIds: string[];
  payload: JsonObject;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeWriteInput {
  challengeId: string;
  ownerUserId: string;
  memberUserIds: string[];
  payload: JsonObject;
}

export interface EntitlementRecord {
  entitlementId: string;
  productId: string;
  purchaseId: string;
  userId: string;
  grantedAt: string;
}

export interface PurchaseGrantInput {
  entitlementId: string;
  productId: string;
  purchaseId: string;
  userId: string;
}

export interface AdminSummary {
  appId: GameAppId;
  environment: GameEnvironment;
  saveCount: number;
  challengeCount: number;
  entitlementCount: number;
}

export interface SaveConflict {
  kind: "conflict";
  current: SaveRecord | null;
}

export interface SaveWriteSuccess {
  kind: "saved";
  record: SaveRecord;
}

export interface GameStorageSnapshot {
  saves: SaveRecord[];
  challenges: ChallengeRecord[];
  entitlements: EntitlementRecord[];
}
