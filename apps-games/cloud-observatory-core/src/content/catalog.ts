import type { BoonDef, Catalog, ConstellationDef, InstrumentDef, UpgradeDef } from "../types";
import { ACHIEVEMENTS } from "./achievements";
import { BOONS } from "./boons";
import { CONSTELLATIONS } from "./constellations";
import { INSTRUMENTS } from "./instruments";
import { LORE, LORE_CHAPTERS } from "./lore";
import type { AchievementDef, LoreEntry } from "./types";
import { UPGRADES } from "./upgrades";

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function indexById<T extends { readonly id: string }>(rows: readonly T[]): ReadonlyMap<string, T> {
  return new Map(rows.map((row) => [row.id, row]));
}

export const CATALOG: Catalog = deepFreeze({
  instruments: INSTRUMENTS,
  upgrades: UPGRADES,
  constellations: CONSTELLATIONS,
  boons: BOONS,
});

deepFreeze(ACHIEVEMENTS);
deepFreeze(LORE);
deepFreeze(LORE_CHAPTERS);

export const instrumentById: ReadonlyMap<string, InstrumentDef> = indexById(CATALOG.instruments);
export const upgradeById: ReadonlyMap<string, UpgradeDef> = indexById(CATALOG.upgrades);
export const constellationById: ReadonlyMap<string, ConstellationDef> = indexById(
  CATALOG.constellations,
);
export const boonById: ReadonlyMap<string, BoonDef> = indexById(CATALOG.boons);
export const achievementById: ReadonlyMap<string, AchievementDef> = indexById(ACHIEVEMENTS);
export const loreById: ReadonlyMap<string, LoreEntry> = indexById(LORE);

export function loreForTrigger(kind: LoreEntry["trigger"]["kind"], id: string) {
  return LORE.find((entry) => entry.trigger.kind === kind && entry.trigger.id === id);
}
