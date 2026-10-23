import { CHALLENGE_BY_ID } from "../content";
import { PIECE_BY_ID } from "../content/pieces";
import {
  CLIENT_IDS,
  type ClientId,
  type RuleCardId,
  THEME_IDS,
  type ThemeId,
} from "../content/types";
import { SLOT_ORDER } from "../slots";
import type { Look, Stars } from "../types";
import { isDateKey } from "./dates";
import {
  type AffinityLevel,
  type BestResult,
  type DailyRecord,
  type DailyResult,
  type Flags,
  FRAME_IDS,
  type FrameId,
  type GalleryEntry,
  type HistoryEntry,
  type Profile,
  type ResultKind,
  type Stats,
} from "./types";

export const PROFILE_VERSION = 1;
export const PROFILE_KEY = "dress-rehearsal.profile";
export const START_COINS = 40;
export const MAX_COINS = 999_999;
export const MAX_FREEZES = 2;
export const MAX_HISTORY = 50;
export const MAX_DAILY_RESULTS = 60;
export const MAX_GALLERY = 24;
export const MAX_STREAK = 99_999;
export const MAX_COUNTER = 1_000_000_000;

export const RULE_CARD_IDS: readonly RuleCardId[] = [
  "brief",
  "warmth",
  "features",
  "colour-wheel",
  "budget",
  "one-piece",
  "dress-codes",
  "must-not",
  "eras",
];

export function defaultProfile(): Profile {
  return {
    coins: START_COINS,
    stars: {},
    best: {},
    chapterBonusClaimed: {},
    affinityPaid: {},
    streakFreezes: 0,
    framesOwned: ["plain"],
    frameSelected: "plain",
    daily: { lastKey: null, streak: 0, bestStreak: 0, results: {} },
    gallery: [],
    history: [],
    flags: { tutorial: false, howTo: false, ruleCards: {} },
    stats: { looksFinished: 0, starsEarned: 0, hintsUsed: 0, boardsExported: 0 },
  };
}

type Obj = Record<string, unknown>;

function isObj(value: unknown): value is Obj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function readNumber(value: unknown, fallback: number, min: number, max: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return clampInt(value, min, max);
}

function numberOr(value: unknown, fallback: number, min: number, max: number): number {
  return readNumber(value, fallback, min, max) ?? fallback;
}

export function toStars(value: unknown): Stars {
  return numberOr(value, 0, 0, 3) as Stars;
}

function readStars(value: unknown): Stars | null {
  const stars = readNumber(value, 0, 0, 3);
  return stars === null ? null : (stars as Stars);
}

function isFrame(value: unknown): value is FrameId {
  return typeof value === "string" && (FRAME_IDS as readonly string[]).includes(value);
}

function isKind(value: unknown): value is ResultKind {
  return value === "campaign" || value === "daily";
}

function cleanStars(input: unknown): Record<string, Stars> | null {
  if (input === undefined) return {};
  if (!isObj(input)) return null;
  const out: Record<string, Stars> = {};
  for (const [id, raw] of Object.entries(input)) {
    if (!CHALLENGE_BY_ID.has(id)) continue;
    const stars = readStars(raw);
    if (stars !== null && stars > 0) out[id] = stars;
  }
  return out;
}

function cleanBest(
  input: unknown,
  stars: Record<string, Stars>,
): Record<string, BestResult> | null {
  if (input === undefined) return {};
  if (!isObj(input)) return null;
  const out: Record<string, BestResult> = {};
  for (const [id, raw] of Object.entries(input)) {
    const known = stars[id];
    if (known === undefined || !isObj(raw)) continue;
    out[id] = {
      stars: known,
      harmony: numberOr(raw.harmony, 0, 0, 100),
      spend: numberOr(raw.spend, 0, 0, MAX_COINS),
    };
  }
  return out;
}

function cleanBonus(input: unknown): Partial<Record<ThemeId, true>> | null {
  if (input === undefined) return {};
  if (!isObj(input)) return null;
  const out: Partial<Record<ThemeId, true>> = {};
  for (const theme of THEME_IDS) if (input[theme] === true) out[theme] = true;
  return out;
}

function cleanAffinity(input: unknown): Partial<Record<ClientId, AffinityLevel>> | null {
  if (input === undefined) return {};
  if (!isObj(input)) return null;
  const out: Partial<Record<ClientId, AffinityLevel>> = {};
  for (const client of CLIENT_IDS) {
    const level = numberOr(input[client], 0, 0, 3);
    if (level > 0) out[client] = level as AffinityLevel;
  }
  return out;
}

function cleanFrames(input: unknown): FrameId[] | null {
  if (input === undefined) return ["plain"];
  if (!Array.isArray(input)) return null;
  const owned = new Set<FrameId>(["plain"]);
  for (const frame of input) if (isFrame(frame)) owned.add(frame);
  return FRAME_IDS.filter((frame) => owned.has(frame));
}

function cleanDaily(input: unknown): DailyRecord | null {
  if (input === undefined) return defaultProfile().daily;
  if (!isObj(input)) return null;
  if (input.results !== undefined && !isObj(input.results)) return null;
  const results: Record<string, DailyResult> = {};
  const keys = Object.keys(isObj(input.results) ? input.results : {})
    .filter(isDateKey)
    .sort();
  for (const key of keys.slice(-MAX_DAILY_RESULTS)) {
    const raw = (input.results as Obj)[key];
    if (!isObj(raw)) continue;
    const stars = toStars(raw.stars);
    if (stars > 0) results[key] = { stars, harmony: numberOr(raw.harmony, 0, 0, 100) };
  }
  const streak = numberOr(input.streak, 0, 0, MAX_STREAK);
  const lastKey = isDateKey(input.lastKey) ? input.lastKey : null;
  const bestStreak = Math.max(streak, numberOr(input.bestStreak, 0, 0, MAX_STREAK));
  return { lastKey, streak, bestStreak, results };
}

export function cleanLook(input: unknown): Look | null {
  if (!isObj(input)) return null;
  const look: Look = {};
  for (const slot of SLOT_ORDER) {
    const id = input[slot];
    if (id === undefined) continue;
    const piece = typeof id === "string" ? PIECE_BY_ID.get(id) : undefined;
    if (piece === undefined || piece.category !== slot) return null;
    look[slot] = piece.id;
  }
  return Object.keys(look).length === 0 ? null : look;
}

function validRef(kind: ResultKind, ref: unknown): ref is string {
  return kind === "campaign" ? typeof ref === "string" && CHALLENGE_BY_ID.has(ref) : isDateKey(ref);
}

function cleanGallery(input: unknown): GalleryEntry[] | null {
  if (input === undefined) return [];
  if (!Array.isArray(input)) return null;
  const out: GalleryEntry[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (out.length >= MAX_GALLERY) break;
    if (!isObj(raw) || !isKind(raw.kind) || !validRef(raw.kind, raw.ref)) continue;
    const id = raw.id;
    if (typeof id !== "string" || id === "" || id.length > 64 || seen.has(id)) continue;
    const look = cleanLook(raw.look);
    const stars = toStars(raw.stars);
    if (look === null || stars === 0 || !isDateKey(raw.savedKey)) continue;
    seen.add(id);
    out.push({
      id,
      kind: raw.kind,
      ref: raw.ref,
      look,
      stars,
      harmony: numberOr(raw.harmony, 0, 0, 100),
      savedKey: raw.savedKey,
    });
  }
  return out;
}

function cleanHistory(input: unknown): HistoryEntry[] | null {
  if (input === undefined) return [];
  if (!Array.isArray(input)) return null;
  const out: HistoryEntry[] = [];
  for (const raw of input) {
    if (!isObj(raw) || !isKind(raw.kind) || !validRef(raw.kind, raw.ref)) continue;
    const key =
      typeof raw.key === "string" && (raw.key === "" || isDateKey(raw.key)) ? raw.key : "";
    out.push({
      kind: raw.kind,
      ref: raw.ref,
      stars: toStars(raw.stars),
      harmony: numberOr(raw.harmony, 0, 0, 100),
      key,
    });
  }
  return out.slice(-MAX_HISTORY);
}

function cleanFlags(input: unknown): Flags | null {
  if (input === undefined) return defaultProfile().flags;
  if (!isObj(input)) return null;
  if (input.ruleCards !== undefined && !isObj(input.ruleCards)) return null;
  const cards: Partial<Record<RuleCardId, true>> = {};
  const seen = isObj(input.ruleCards) ? input.ruleCards : {};
  for (const id of RULE_CARD_IDS) if (seen[id] === true) cards[id] = true;
  return { tutorial: input.tutorial === true, howTo: input.howTo === true, ruleCards: cards };
}

function cleanStats(input: unknown): Stats | null {
  if (input === undefined) return defaultProfile().stats;
  if (!isObj(input)) return null;
  return {
    looksFinished: numberOr(input.looksFinished, 0, 0, MAX_COUNTER),
    starsEarned: numberOr(input.starsEarned, 0, 0, MAX_COUNTER),
    hintsUsed: numberOr(input.hintsUsed, 0, 0, MAX_COUNTER),
    boardsExported: numberOr(input.boardsExported, 0, 0, MAX_COUNTER),
  };
}

export function sanitizeProfile(data: unknown): Profile | null {
  if (!isObj(data)) return null;
  const coins = readNumber(data.coins, START_COINS, 0, MAX_COINS);
  const freezes = readNumber(data.streakFreezes, 0, 0, MAX_FREEZES);
  const stars = cleanStars(data.stars);
  const bonus = cleanBonus(data.chapterBonusClaimed);
  const affinity = cleanAffinity(data.affinityPaid);
  const frames = cleanFrames(data.framesOwned);
  const daily = cleanDaily(data.daily);
  const gallery = cleanGallery(data.gallery);
  const history = cleanHistory(data.history);
  const flags = cleanFlags(data.flags);
  const stats = cleanStats(data.stats);
  const best = stars === null ? null : cleanBest(data.best, stars);
  if (coins === null || freezes === null) return null;
  if (stars === null || best === null || bonus === null || affinity === null) return null;
  if (frames === null || daily === null || gallery === null) return null;
  if (history === null || flags === null || stats === null) return null;
  const selected = isFrame(data.frameSelected) ? data.frameSelected : "plain";
  return {
    coins,
    stars,
    best,
    chapterBonusClaimed: bonus,
    affinityPaid: affinity,
    streakFreezes: freezes,
    framesOwned: frames,
    frameSelected: frames.includes(selected) ? selected : "plain",
    daily,
    gallery,
    history,
    flags,
    stats,
  };
}
