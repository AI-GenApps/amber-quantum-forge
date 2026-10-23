import type {
  BoonEffect,
  BoonId,
  Catalog,
  ConstellationDef,
  GameState,
  InstrumentDef,
  InstrumentId,
  UpgradeDef,
} from "./types";

export function findInstrument(catalog: Catalog, id: InstrumentId): InstrumentDef | undefined {
  return catalog.instruments.find((def) => def.id === id);
}

export function findUpgrade(catalog: Catalog, id: string): UpgradeDef | undefined {
  return catalog.upgrades.find((def) => def.id === id);
}

export function findConstellation(catalog: Catalog, id: string): ConstellationDef | undefined {
  return catalog.constellations.find((def) => def.id === id);
}

export function findBoon(catalog: Catalog, id: BoonId) {
  return catalog.boons.find((def) => def.id === id);
}

export function ownedCount(state: GameState, id: InstrumentId): number {
  return state.owned[id] ?? 0;
}

export function boonEffects(state: GameState, catalog: Catalog): BoonEffect[] {
  const effects: BoonEffect[] = [];
  for (const def of catalog.boons) {
    if (state.boons.includes(def.id)) effects.push(def.effect);
  }
  return effects;
}

export function isInstrumentUnlocked(
  state: GameState,
  id: InstrumentId,
  catalog: Catalog,
): boolean {
  const index = catalog.instruments.findIndex((def) => def.id === id);
  if (index < 0) return false;
  if (index === 0) return true;
  const previous = catalog.instruments[index - 1];
  return previous !== undefined && ownedCount(state, previous.id) >= 1;
}
