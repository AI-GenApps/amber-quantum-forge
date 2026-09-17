import {
  GAME_APP_IDS,
  GAME_ENVIRONMENTS,
  GAME_ROLES,
  type GameAppId,
  type GameEnvironment,
  type GameRole,
  type JsonObject,
  type JsonValue,
} from "./contracts";

export const MAX_JSON_BYTES = 64 * 1024;
export const MAX_IDENTIFIER_LENGTH = 128;
export const MAX_MEMBER_COUNT = 32;

export function isGameAppId(value: string): value is GameAppId {
  return (GAME_APP_IDS as readonly string[]).includes(value);
}

export function isGameEnvironment(value: string): value is GameEnvironment {
  return (GAME_ENVIRONMENTS as readonly string[]).includes(value);
}

export function isGameRole(value: unknown): value is GameRole {
  return typeof value === "string" && (GAME_ROLES as readonly string[]).includes(value);
}

export function isSafeIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_IDENTIFIER_LENGTH &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
  );
}

export function isJsonValue(value: unknown, depth = 0): value is JsonValue {
  if (depth > 8 || value === null) return value === null;
  if (typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every((item) => isJsonValue(item, depth + 1));
  if (typeof value !== "object") return false;
  return Object.values(value).every((item) => isJsonValue(item, depth + 1));
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value) && isJsonValue(value);
}

export function hasBoundedJsonSize(value: JsonValue): boolean {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength <= MAX_JSON_BYTES;
  } catch {
    return false;
  }
}

export function isBoundedMemberList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_MEMBER_COUNT &&
    value.every((item) => isSafeIdentifier(item))
  );
}
