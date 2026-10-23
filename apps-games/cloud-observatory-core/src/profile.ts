import { ACHIEVEMENTS } from "./content/achievements";
import { CATALOG } from "./content/catalog";
import { LORE } from "./content/lore";
import { createStats, STAT_KEYS, type Stats } from "./progression";
import { createInitialState, isRecord, readAmount, readCount, sanitizeState } from "./state";
import type { Catalog, GameState } from "./types";

export const PROFILE_VERSION = 1;

export interface Tutorial {
  readonly observe: boolean;
  readonly build: boolean;
  readonly atlas: boolean;
  readonly chart: boolean;
  readonly skipped: boolean;
}

export interface Profile {
  readonly game: GameState;
  readonly stats: Stats;
  readonly cometLastKey: string | null;
  readonly cometStreak: number;
  readonly cometDays: number;
  readonly loreUnlocked: readonly string[];
  readonly loreSeen: readonly string[];
  readonly tutorial: Tutorial;
  readonly eclipseIntroSeen: boolean;
  readonly lastSeenMs: number;
  readonly createdMs: number;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const TUTORIAL_KEYS = ["observe", "build", "atlas", "chart", "skipped"] as const;

export function createTutorial(): Tutorial {
  return { observe: false, build: false, atlas: false, chart: false, skipped: false };
}

export function createProfile(nowMs = 0, catalog: Catalog = CATALOG): Profile {
  const stamp = readAmount(nowMs) ?? 0;
  return {
    game: createInitialState(catalog),
    stats: createStats(),
    cometLastKey: null,
    cometStreak: 0,
    cometDays: 0,
    loreUnlocked: [],
    loreSeen: [],
    tutorial: createTutorial(),
    eclipseIntroSeen: false,
    lastSeenMs: stamp,
    createdMs: stamp,
  };
}

function readStats(raw: unknown): Stats | null {
  if (!isRecord(raw)) return null;
  const out: Record<string, number> = {};
  for (const key of STAT_KEYS) {
    const value = readAmount(raw[key]);
    if (value === null) return null;
    out[key] = value;
  }
  return out as unknown as Stats;
}

function readTutorial(raw: unknown): Tutorial | null {
  if (!isRecord(raw)) return null;
  const out: Record<string, boolean> = {};
  for (const key of TUTORIAL_KEYS) {
    const value = raw[key];
    if (typeof value !== "boolean") return null;
    out[key] = value;
  }
  return out as unknown as Tutorial;
}

function readKnownIds(raw: unknown, known: ReadonlySet<string>): string[] | null {
  if (!Array.isArray(raw)) return null;
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !known.has(item)) return null;
    if (!ids.includes(item)) ids.push(item);
  }
  return ids;
}

const LORE_IDS: ReadonlySet<string> = new Set(LORE.map((entry) => entry.id));
const ACHIEVEMENT_IDS: ReadonlySet<string> = new Set(ACHIEVEMENTS.map((def) => def.id));

function readCometKey(raw: unknown): string | null | undefined {
  if (raw === null) return null;
  if (typeof raw !== "string" || !DATE_KEY.test(raw)) return undefined;
  return raw;
}

export function sanitizeProfile(raw: unknown, catalog: Catalog = CATALOG): Profile | null {
  if (!isRecord(raw)) return null;
  const game = sanitizeState(raw.game, catalog);
  const stats = readStats(raw.stats);
  const cometLastKey = readCometKey(raw.cometLastKey);
  const cometStreak = readCount(raw.cometStreak);
  const cometDays = readCount(raw.cometDays);
  const loreUnlocked = readKnownIds(raw.loreUnlocked, LORE_IDS);
  const loreSeen = readKnownIds(raw.loreSeen, LORE_IDS);
  const tutorial = readTutorial(raw.tutorial);
  const lastSeenMs = readAmount(raw.lastSeenMs);
  const createdMs = readAmount(raw.createdMs);
  if (
    game === null ||
    stats === null ||
    cometLastKey === undefined ||
    cometStreak === null ||
    cometDays === null ||
    loreUnlocked === null ||
    loreSeen === null ||
    tutorial === null ||
    typeof raw.eclipseIntroSeen !== "boolean" ||
    lastSeenMs === null ||
    createdMs === null
  ) {
    return null;
  }
  if (!game.achievements.every((id) => ACHIEVEMENT_IDS.has(id))) return null;
  return {
    game,
    stats,
    cometLastKey,
    cometStreak,
    cometDays,
    loreUnlocked,
    loreSeen: loreSeen.filter((id) => loreUnlocked.includes(id)),
    tutorial,
    eclipseIntroSeen: raw.eclipseIntroSeen,
    lastSeenMs,
    createdMs,
  };
}
