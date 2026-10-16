import {
  CONTROL_LAYOUTS,
  GRAPHICS_QUALITIES,
  type MissionRecord,
  SAVE_SCHEMA_VERSION,
  SaveCorruptError,
  type SaveData,
  type SaveSettings,
} from "./types";

type Raw = Record<string, unknown>;

const isRecord = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;

function oneOf<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === "string" && (list as readonly string[]).includes(v);
}

function parseSettings(raw: unknown, problems: string[]): SaveSettings {
  const s = isRecord(raw) ? raw : {};
  if (!isRecord(raw)) problems.push("settings must be an object");
  if (typeof s.audio !== "boolean") problems.push("settings.audio must be a boolean");
  if (typeof s.haptics !== "boolean") problems.push("settings.haptics must be a boolean");
  if (!oneOf(CONTROL_LAYOUTS, s.control_layout))
    problems.push("settings.control_layout is unknown");
  if (!oneOf(GRAPHICS_QUALITIES, s.graphics_quality)) {
    problems.push("settings.graphics_quality is unknown");
  }
  return {
    audio: s.audio === true,
    haptics: s.haptics === true,
    control_layout: oneOf(CONTROL_LAYOUTS, s.control_layout) ? s.control_layout : "standard",
    graphics_quality: oneOf(GRAPHICS_QUALITIES, s.graphics_quality) ? s.graphics_quality : "auto",
  };
}

function parseRecord(id: string, raw: unknown, problems: string[]): MissionRecord | undefined {
  if (!isRecord(raw)) {
    problems.push(`missions.${id} must be an object`);
    return undefined;
  }
  const { stars, best_time_s: time } = raw;
  if (stars !== 1 && stars !== 2 && stars !== 3) {
    problems.push(`missions.${id}.stars must be 1, 2 or 3`);
    return undefined;
  }
  if (time !== null && !(typeof time === "number" && Number.isFinite(time) && time > 0)) {
    problems.push(`missions.${id}.best_time_s must be a positive number or null`);
    return undefined;
  }
  return { stars, best_time_s: time };
}

function parseMissions(raw: unknown, problems: string[]): Record<string, MissionRecord> {
  const out: Record<string, MissionRecord> = {};
  if (!isRecord(raw)) {
    problems.push("missions must be an object");
    return out;
  }
  for (const [id, value] of Object.entries(raw)) {
    const record = parseRecord(id, value, problems);
    if (record) out[id] = record;
  }
  return out;
}

function parseOnboarding(raw: unknown, problems: string[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!isRecord(raw)) {
    problems.push("onboarding must be an object");
    return out;
  }
  for (const [flag, value] of Object.entries(raw)) {
    if (typeof value === "boolean") out[flag] = value;
    else problems.push(`onboarding.${flag} must be a boolean`);
  }
  return out;
}

function parseCars(raw: Raw, problems: string[]): { owned: string[]; selected: string } {
  const owned = Array.isArray(raw.owned_cars) ? raw.owned_cars : [];
  if (!Array.isArray(raw.owned_cars) || owned.length === 0) {
    problems.push("owned_cars must be a non-empty array");
  }
  const ids = owned.filter((id): id is string => typeof id === "string" && id.length > 0);
  if (ids.length !== owned.length) problems.push("owned_cars must hold non-empty strings");
  if (new Set(ids).size !== ids.length) problems.push("owned_cars must not repeat a car");
  const selected = typeof raw.selected_car === "string" ? raw.selected_car : "";
  if (!ids.includes(selected)) problems.push("selected_car must be one of owned_cars");
  return { owned: ids, selected };
}

/**
 * Check untrusted JSON against SaveData v1 and return a clean copy. Throws SaveCorruptError that
 * lists every problem, so a truncated or hand-edited save is rejected instead of half-used.
 */
export function parseSave(input: unknown): SaveData {
  if (!isRecord(input)) throw new SaveCorruptError(["save must be a JSON object"]);
  const problems: string[] = [];
  if (input.schema_version !== SAVE_SCHEMA_VERSION) {
    problems.push(`schema_version must be ${SAVE_SCHEMA_VERSION}`);
  }
  if (!isCount(input.coins)) problems.push("coins must be a non-negative integer");
  const cars = parseCars(input, problems);
  const save: SaveData = {
    schema_version: SAVE_SCHEMA_VERSION,
    coins: isCount(input.coins) ? input.coins : 0,
    owned_cars: cars.owned,
    selected_car: cars.selected,
    missions: parseMissions(input.missions, problems),
    settings: parseSettings(input.settings, problems),
    onboarding: parseOnboarding(input.onboarding, problems),
  };
  if (problems.length > 0) throw new SaveCorruptError(problems);
  return save;
}
