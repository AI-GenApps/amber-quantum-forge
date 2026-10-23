import { CAMPAIGN_COMPLETE_DAY, MAX_COINS } from "../constants";
import { SCENE_BY_ID } from "../content";
import { defaultProfile, type Profile, type RegularRecord } from "./profileTypes";
import { readDaysDone, readDiary, readOwned, readPending, readStock } from "./readCollections";
import { readFlags, readLate, readRegulars, readSettings, readStats } from "./readParts";
import { isRecord, read, readCount } from "./sanitize";

export * from "./profileTypes";

function readDay(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(1, Math.min(CAMPAIGN_COMPLETE_DAY, Math.floor(value)));
}

function isPending(id: string, regulars: Record<number, RegularRecord>): boolean {
  const scene = SCENE_BY_ID.get(id);
  if (scene === undefined) return false;
  const row = regulars[scene.regular];
  return row !== undefined && scene.index === row.scenesDone + 1;
}

export function sanitizeProfile(data: unknown): Profile | null {
  if (!isRecord(data)) return null;
  const base = defaultProfile();
  const coins = readCount(data, "coins", base.coins, MAX_COINS);
  const day = read(data, "day", base.day, readDay);
  const daysDone = read(data, "daysDone", base.daysDone, readDaysDone);
  const owned = read(data, "owned", base.owned, readOwned);
  const stock = read(data, "stock", base.stock, readStock);
  const regulars = read(data, "regulars", base.regulars, readRegulars);
  const pending = read(data, "pendingEvening", base.pendingEvening, readPending);
  const diary = read(data, "diary", base.diary, readDiary);
  const late = read(data, "late", base.late, readLate);
  const flags = read(data, "flags", base.flags, readFlags);
  const settings = read(data, "settings", base.settings, readSettings);
  const stats = read(data, "stats", base.stats, readStats);
  if (
    coins === null ||
    day === null ||
    daysDone === null ||
    owned === null ||
    stock === null ||
    regulars === null ||
    pending === null ||
    diary === null ||
    late === null ||
    flags === null ||
    settings === null ||
    stats === null
  ) {
    return null;
  }
  return {
    coins,
    day,
    daysDone,
    owned,
    stock,
    regulars,
    pendingEvening: pending.filter((id) => isPending(id, regulars)),
    diary,
    late,
    flags,
    settings,
    stats,
  };
}
