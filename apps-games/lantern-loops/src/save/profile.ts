import {
  createSaveStore,
  type Migration,
  type SaveSchema,
  type SaveStore,
  type StorageAdapter,
} from "@web-games/kit";
import {
  type Brush,
  CHAPTER_IDS,
  type ChapterId,
  chaptersCleared,
  type DailyRecord,
  isDateKey,
  MILESTONE_DAYS,
  TOKEN_CONFIG,
} from "@web-games/lantern-loops-core";

export const PROFILE_KEY = "lantern-loops.profile";
export const PROFILE_VERSION = 1;
export const LEGACY_BACKUP_SUFFIX = ".v0";

export const BRUSHES: readonly Brush[] = ["straight", "corner", "erase"];

export interface Profile {
  /** Best stars per puzzle id: campaign ids, 1 to 3. Unsolved ids are absent. */
  stars: Record<string, number>;
  /** Fastest solve in seconds per campaign puzzle id. */
  bestTimes: Record<string, number>;
  tokens: number;
  freezes: number;
  /** ISO week key of the last freeze refill check, "" before the first open. */
  freezeWeek: string;
  streak: number;
  bestStreak: number;
  lastDailyDate: string | null;
  /** Milestone days already paid in the current streak run. */
  milestonesGranted: number[];
  /** Archive dates that already paid their one token. */
  archiveRewarded: string[];
  chaptersCleared: ChapterId[];
  /** Daily and archive solves: date key to best stars and fastest seconds. */
  dailiesSolved: Record<string, DailyRecord>;
  hintsUsed: number;
  playSeconds: number;
  onboardingDone: boolean;
  showTimer: boolean;
  showConflicts: boolean;
  hidePathInShare: boolean;
  brush: Brush;
}

export function defaults(): Profile {
  return {
    stars: {},
    bestTimes: {},
    tokens: TOKEN_CONFIG.start,
    freezes: 1,
    freezeWeek: "",
    streak: 0,
    bestStreak: 0,
    lastDailyDate: null,
    milestonesGranted: [],
    archiveRewarded: [],
    chaptersCleared: [],
    dailiesSolved: {},
    hintsUsed: 0,
    playSeconds: 0,
    onboardingDone: false,
    showTimer: false,
    showConflicts: true,
    hidePathInShare: true,
    brush: "straight",
  };
}

type Obj = Record<string, unknown>;

const isObject = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isWhole = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;
const isPositive = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0;

function mapOf<T>(value: unknown, check: (v: unknown) => v is T): Record<string, T> | null {
  if (!isObject(value)) return null;
  const out: Record<string, T> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!check(item)) return null;
    out[key] = item;
  }
  return out;
}

function listOf<T>(value: unknown, check: (v: unknown) => v is T): T[] | null {
  if (!Array.isArray(value)) return null;
  return value.every(check) ? [...(value as T[])] : null;
}

const isStars = (v: unknown): v is number => typeof v === "number" && [1, 2, 3].includes(v);
const isMapStars = (v: unknown): v is number => v === 0 || isStars(v);
const isChapter = (v: unknown): v is ChapterId =>
  typeof v === "string" && (CHAPTER_IDS as readonly string[]).includes(v);
const isMilestone = (v: unknown): v is number =>
  typeof v === "number" && MILESTONE_DAYS.includes(v);
const isBrush = (v: unknown): v is Brush =>
  typeof v === "string" && (BRUSHES as readonly string[]).includes(v);
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isString = (v: unknown): v is string => typeof v === "string";

function isDaily(v: unknown): v is DailyRecord {
  return isObject(v) && isStars(v.stars) && isPositive(v.seconds);
}

const BAD: unique symbol = Symbol("invalid");
type Read<T> = (v: unknown) => T | typeof BAD;

/** Wraps a type guard (or a checker returning null for "invalid") as a reader. */
const guard =
  <T>(check: (v: unknown) => v is T): Read<T> =>
  (v) =>
    check(v) ? v : BAD;

/**
 * Validates a profile at version 1. A missing field takes its default; a field with the wrong
 * type rejects the whole save (the kit then keeps a backup and starts fresh). Numbers that are
 * only out of range are repaired: tokens above the cap drop to the cap, freezes above 1 to 1.
 */
export function parse(data: unknown): Profile | null {
  if (!isObject(data)) return null;
  const out = defaults();
  const read = <K extends keyof Profile>(key: K, reader: Read<Profile[K]>): boolean => {
    if (data[key] === undefined) return true;
    const value = reader(data[key]);
    if (value === BAD) return false;
    out[key] = value;
    return true;
  };
  const ok =
    read("stars", (v) => mapOf(v, isMapStars) ?? BAD) &&
    read("bestTimes", (v) => mapOf(v, isPositive) ?? BAD) &&
    read("tokens", guard(isWhole)) &&
    read("freezes", guard(isWhole)) &&
    read("freezeWeek", guard(isString)) &&
    read("streak", guard(isWhole)) &&
    read("bestStreak", guard(isWhole)) &&
    read("lastDailyDate", (v) => (v === null || isDateKey(v) ? (v as string | null) : BAD)) &&
    read("milestonesGranted", (v) => listOf(v, isMilestone) ?? BAD) &&
    read("archiveRewarded", (v) => listOf(v, (x): x is string => isDateKey(x)) ?? BAD) &&
    read("chaptersCleared", (v) => listOf(v, isChapter) ?? BAD) &&
    read("dailiesSolved", (v) => {
      const map = mapOf(v, isDaily);
      return map !== null && Object.keys(map).every((k) => isDateKey(k)) ? map : BAD;
    }) &&
    read("hintsUsed", guard(isWhole)) &&
    read("playSeconds", guard(isWhole)) &&
    read("onboardingDone", guard(isBool)) &&
    read("showTimer", guard(isBool)) &&
    read("showConflicts", guard(isBool)) &&
    read("hidePathInShare", guard(isBool)) &&
    read("brush", guard(isBrush));
  if (!ok) return null;
  out.tokens = Math.min(out.tokens, TOKEN_CONFIG.cap);
  out.freezes = Math.min(out.freezes, 1);
  out.bestStreak = Math.max(out.bestStreak, out.streak);
  return out;
}

/**
 * v0 (development preview): `{ solvedIds: string[], hintsLeft: number }`, no streak, no stars.
 * Every solved puzzle becomes a 3-star solve (the preview recorded no hints), `hintsLeft`
 * becomes the token balance (clamped to the cap), cleared chapters are recorded without paying
 * the +5 retroactively, and everything else takes its default. Returns null for data that is
 * not a v0 profile.
 */
export function migrateV0ToV1(data: unknown): unknown {
  if (!isObject(data)) return null;
  const solved = listOf(data.solvedIds, isString);
  if (solved === null) return null;
  const hints = data.hintsLeft;
  const next = defaults();
  for (const id of solved) next.stars[id] = 3;
  next.tokens = isWhole(hints) ? Math.min(hints, TOKEN_CONFIG.cap) : TOKEN_CONFIG.start;
  next.chaptersCleared = chaptersCleared(next.stars);
  next.onboardingDone = solved.length > 0;
  return next;
}

/** Migrations by source version. The kit only accepts versions >= 1, so version 0 lives here. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = { 0: migrateV0ToV1 };

function upgradeLegacy(raw: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(parsed)) return null;
  const hasEnvelope = "v" in parsed;
  if (hasEnvelope ? parsed.v !== 0 : !Array.isArray(parsed.solvedIds)) return null;
  let data: unknown = hasEnvelope ? parsed.data : parsed;
  for (let from = 0; from < PROFILE_VERSION; from++) {
    const step = MIGRATIONS[from];
    if (!step) return null;
    data = step(data);
    if (data === null) return null;
  }
  return JSON.stringify({ v: PROFILE_VERSION, data });
}

/**
 * Presents a version-0 profile (an envelope with `v: 0` or a bare preview object) to the kit as
 * a version-1 envelope, keeping the original under `<key>.v0`. Everything else passes through.
 */
export function withLegacyProfile(adapter: StorageAdapter, key = PROFILE_KEY): StorageAdapter {
  return {
    name: adapter.name,
    set: (k, value) => adapter.set(k, value),
    remove: (k) => adapter.remove(k),
    async get(k) {
      const raw = await adapter.get(k);
      if (k !== key || raw === null) return raw;
      const upgraded = upgradeLegacy(raw);
      if (upgraded === null) return raw;
      try {
        await adapter.set(`${key}${LEGACY_BACKUP_SUFFIX}`, raw);
        await adapter.set(key, upgraded);
      } catch {
        // The upgraded copy is still returned; the next save writes it.
      }
      return upgraded;
    },
  };
}

export const profileSchema: SaveSchema<Profile> = {
  key: PROFILE_KEY,
  version: PROFILE_VERSION,
  defaults,
  parse,
};

export function createProfileStore(adapter: StorageAdapter): SaveStore<Profile> {
  return createSaveStore(withLegacyProfile(adapter), profileSchema);
}
