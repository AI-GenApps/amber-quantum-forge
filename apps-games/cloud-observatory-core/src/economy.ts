import { boonEffects, findInstrument, ownedCount } from "./catalog";
import { RULES } from "./constants";
import { clampValue } from "./numbers";
import type {
  BoonEffect,
  Catalog,
  ConstellationDef,
  GameState,
  InstrumentDef,
  InstrumentId,
} from "./types";

function productOf(effects: readonly BoonEffect[], pick: (effect: BoonEffect) => number): number {
  let product = 1;
  for (const effect of effects) product *= pick(effect);
  return product;
}

export function instrumentUnitCost(def: InstrumentDef, owned: number, costMult = 1): number {
  return clampValue(def.baseCost * def.growth ** owned * costMult);
}

export function bulkCost(def: InstrumentDef, owned: number, count: number, costMult = 1): number {
  if (!(count > 0)) return 0;
  const first = def.baseCost * def.growth ** owned;
  const total = (first * (def.growth ** count - 1)) / (def.growth - 1);
  return clampValue(total * costMult);
}

export function maxAffordable(
  def: InstrumentDef,
  owned: number,
  budget: number,
  costMult = 1,
): number {
  if (!(budget > 0)) return 0;
  const first = instrumentUnitCost(def, owned, costMult);
  if (!(first <= budget) || first >= RULES.MAX_VALUE) return 0;
  const estimate = Math.log((budget * (def.growth - 1)) / first + 1) / Math.log(def.growth);
  let count = Math.max(0, Math.floor(estimate));
  for (
    let step = 0;
    step < 4 && count > 0 && bulkCost(def, owned, count, costMult) > budget;
    step++
  ) {
    count -= 1;
  }
  for (let step = 0; step < 4; step++) {
    const next = bulkCost(def, owned, count + 1, costMult);
    if (next > budget || next >= RULES.MAX_VALUE) break;
    count += 1;
  }
  return count;
}

export function costMultiplier(state: GameState, catalog: Catalog): number {
  return productOf(boonEffects(state, catalog), (e) => (e.kind === "cost-mult" ? e.factor : 1));
}

export function upgradeCostMultiplier(state: GameState, catalog: Catalog): number {
  return productOf(boonEffects(state, catalog), (e) =>
    e.kind === "upgrade-cost-mult" ? e.factor : 1,
  );
}

export function upgradeCost(def: InstrumentDef, tier: number, upgradeCostMult = 1): number {
  const factor = RULES.UPGRADE_COST_FACTORS[tier - 1];
  if (factor === undefined) return RULES.MAX_VALUE;
  return clampValue(def.baseCost * factor * upgradeCostMult);
}

export function upgradeThreshold(tier: number): number {
  return RULES.UPGRADE_THRESHOLDS[tier - 1] ?? Number.POSITIVE_INFINITY;
}

function upgradeProduct(state: GameState, catalog: Catalog, instrumentId: InstrumentId): number {
  let product = 1;
  for (const upgrade of catalog.upgrades) {
    if (upgrade.instrumentId !== instrumentId || !state.upgrades.includes(upgrade.id)) continue;
    product *= RULES.UPGRADE_MULTIPLIERS[upgrade.tier - 1] ?? 1;
  }
  return product;
}

export function instrumentMultiplier(
  state: GameState,
  instrumentId: InstrumentId,
  catalog: Catalog,
): number {
  const boons = productOf(boonEffects(state, catalog), (e) =>
    e.kind === "instrument-mult" && e.instrumentId === instrumentId ? e.factor : 1,
  );
  return upgradeProduct(state, catalog, instrumentId) * boons;
}

export function gatherMultiplier(state: GameState, catalog: Catalog): number {
  const first = catalog.instruments[0];
  return first === undefined ? 1 : upgradeProduct(state, catalog, first.id);
}

export function atlasFactor(state: GameState, catalog: Catalog): number {
  return productOf(boonEffects(state, catalog), (e) => (e.kind === "atlas-factor" ? e.factor : 1));
}

export function globalMultiplier(state: GameState, catalog: Catalog): number {
  const additive =
    1 +
    RULES.ATLAS_BONUS * atlasFactor(state, catalog) * state.charted.length +
    RULES.ACHIEVEMENT_BONUS * state.achievements.length;
  const boon = productOf(boonEffects(state, catalog), (e) =>
    e.kind === "global-mult" ? e.factor : 1,
  );
  return additive * boon;
}

export function starlightPerSecond(state: GameState, catalog: Catalog): number {
  let sum = 0;
  for (const def of catalog.instruments) {
    const owned = ownedCount(state, def.id);
    if (owned > 0) sum += owned * def.baseSps * instrumentMultiplier(state, def.id, catalog);
  }
  return clampValue(sum * globalMultiplier(state, catalog));
}

export function gatherValue(state: GameState, catalog: Catalog): number {
  return clampValue(gatherMultiplier(state, catalog) * globalMultiplier(state, catalog));
}

export function chartCost(
  constellation: ConstellationDef,
  state: GameState,
  catalog: Catalog,
): number {
  return clampValue(constellation.cost * costMultiplier(state, catalog));
}

export function offlineEfficiency(state: GameState, catalog: Catalog): number {
  let best: number = RULES.OFFLINE_EFFICIENCY_BASE;
  for (const effect of boonEffects(state, catalog)) {
    if (effect.kind === "offline-efficiency" && effect.value > best) best = effect.value;
  }
  return Math.min(1, best);
}

export function instrumentRate(state: GameState, id: InstrumentId, catalog: Catalog): number {
  const def = findInstrument(catalog, id);
  if (def === undefined) return 0;
  return ownedCount(state, id) * def.baseSps * instrumentMultiplier(state, id, catalog);
}
