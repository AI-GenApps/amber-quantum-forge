import { RULES } from "./constants";
import { clampValue } from "./numbers";
import type { Catalog, GameState } from "./types";

export function createInitialState(_catalog: Catalog): GameState {
  return {
    starlight: RULES.STARTING_STARLIGHT,
    cycleStarlight: 0,
    lifetimeStarlight: 0,
    shards: 0,
    shardsEarned: 0,
    owned: {},
    upgrades: [],
    charted: [],
    boons: [],
    achievements: [],
    eclipses: 0,
    taps: 0,
    cycleSeconds: 0,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readAmount(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) return null;
  return clampValue(value);
}

function readCount(value: unknown): number | null {
  const amount = readAmount(value);
  return amount === null || !Number.isInteger(amount) ? null : amount;
}

function readIds(value: unknown, known: ((id: string) => boolean) | null): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    if (known !== null && !known(item)) return null;
    if (!ids.includes(item)) ids.push(item);
  }
  return ids;
}

function readOwned(value: unknown, catalog: Catalog): Record<string, number> | null {
  if (!isRecord(value)) return null;
  const owned: Record<string, number> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!catalog.instruments.some((def) => def.id === id)) return null;
    const count = readCount(raw);
    if (count === null) return null;
    owned[id] = count;
  }
  return owned;
}

export function sanitizeState(raw: unknown, catalog: Catalog): GameState | null {
  if (!isRecord(raw)) return null;
  const starlight = readAmount(raw.starlight);
  const cycleStarlight = readAmount(raw.cycleStarlight);
  const lifetimeStarlight = readAmount(raw.lifetimeStarlight);
  const shards = readCount(raw.shards);
  const shardsEarned = readCount(raw.shardsEarned);
  const eclipses = readCount(raw.eclipses);
  const taps = readCount(raw.taps);
  const cycleSeconds = readAmount(raw.cycleSeconds);
  const owned = readOwned(raw.owned, catalog);
  const upgrades = readIds(raw.upgrades, (id) => catalog.upgrades.some((def) => def.id === id));
  const charted = readIds(raw.charted, (id) => catalog.constellations.some((def) => def.id === id));
  const boons = readIds(raw.boons, (id) => catalog.boons.some((def) => def.id === id));
  const achievements = readIds(raw.achievements, null);
  if (
    starlight === null ||
    cycleStarlight === null ||
    lifetimeStarlight === null ||
    shards === null ||
    shardsEarned === null ||
    eclipses === null ||
    taps === null ||
    cycleSeconds === null ||
    owned === null ||
    upgrades === null ||
    charted === null ||
    boons === null ||
    achievements === null
  ) {
    return null;
  }
  return {
    starlight,
    cycleStarlight,
    lifetimeStarlight,
    shards,
    shardsEarned,
    owned,
    upgrades,
    charted,
    boons,
    achievements,
    eclipses,
    taps,
    cycleSeconds,
  };
}
