import { findBoon, findInstrument, findUpgrade, isInstrumentUnlocked, ownedCount } from "./catalog";
import { RULES } from "./constants";
import {
  bulkCost,
  costMultiplier,
  gatherValue,
  maxAffordable,
  offlineEfficiency,
  starlightPerSecond,
  upgradeCost,
  upgradeCostMultiplier,
  upgradeThreshold,
} from "./economy";
import { clampValue } from "./numbers";
import type {
  BoonId,
  Catalog,
  GameEvent,
  GameState,
  InstrumentId,
  Rejection,
  UpgradeId,
} from "./types";

export interface PurchaseSuccess {
  readonly ok: true;
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

export interface InstrumentPurchase extends PurchaseSuccess {
  readonly quantity: number;
  readonly cost: number;
}

export interface OfflineResult {
  readonly state: GameState;
  readonly gained: number;
  readonly secondsCounted: number;
  readonly capped: boolean;
}

function earn(state: GameState, amount: number): GameState {
  return {
    ...state,
    starlight: clampValue(state.starlight + amount),
    cycleStarlight: clampValue(state.cycleStarlight + amount),
    lifetimeStarlight: clampValue(state.lifetimeStarlight + amount),
  };
}

export function gather(state: GameState, catalog: Catalog): GameState {
  const gained = gatherValue(state, catalog);
  return { ...earn(state, gained), taps: state.taps + 1 };
}

export function tick(state: GameState, seconds: number, catalog: Catalog): GameState {
  if (!Number.isFinite(seconds) || seconds <= 0) return state;
  const gained = starlightPerSecond(state, catalog) * seconds;
  return { ...earn(state, gained), cycleSeconds: clampValue(state.cycleSeconds + seconds) };
}

export function applyOffline(state: GameState, elapsed: number, catalog: Catalog): OfflineResult {
  const valid = Number.isFinite(elapsed) && elapsed > 0;
  const secondsCounted = valid ? Math.min(elapsed, RULES.OFFLINE_CAP_SECONDS) : 0;
  const capped = valid && elapsed > RULES.OFFLINE_CAP_SECONDS;
  const gained = clampValue(
    starlightPerSecond(state, catalog) * secondsCounted * offlineEfficiency(state, catalog),
  );
  if (!(gained > 0)) return { state, gained: 0, secondsCounted, capped };
  return { state: earn(state, gained), gained, secondsCounted, capped };
}

function spend(state: GameState, cost: number): number {
  return clampValue(Math.max(0, state.starlight - cost));
}

export function buyInstrument(
  state: GameState,
  id: InstrumentId,
  quantity: number | "max",
  catalog: Catalog,
): InstrumentPurchase | Rejection {
  const def = findInstrument(catalog, id);
  if (def === undefined) return { ok: false, reason: "unknown-id" };
  if (!isInstrumentUnlocked(state, id, catalog)) return { ok: false, reason: "not-unlocked" };
  if (quantity !== "max" && (!Number.isInteger(quantity) || quantity < 1)) {
    return { ok: false, reason: "invalid-quantity" };
  }
  const owned = ownedCount(state, id);
  const costMult = costMultiplier(state, catalog);
  const count =
    quantity === "max" ? maxAffordable(def, owned, state.starlight, costMult) : quantity;
  if (count < 1) return { ok: false, reason: "insufficient-starlight" };
  const cost = bulkCost(def, owned, count, costMult);
  if (cost > state.starlight || cost >= RULES.MAX_VALUE) {
    return { ok: false, reason: "insufficient-starlight" };
  }
  const next: GameState = {
    ...state,
    starlight: spend(state, cost),
    owned: { ...state.owned, [id]: owned + count },
  };
  return {
    ok: true,
    state: next,
    events: [{ type: "purchased", instrumentId: id, quantity: count, cost }],
    quantity: count,
    cost,
  };
}

export function buyUpgrade(
  state: GameState,
  id: UpgradeId,
  catalog: Catalog,
): PurchaseSuccess | Rejection {
  const upgrade = findUpgrade(catalog, id);
  if (upgrade === undefined) return { ok: false, reason: "unknown-id" };
  const def = findInstrument(catalog, upgrade.instrumentId);
  if (def === undefined) return { ok: false, reason: "unknown-id" };
  if (state.upgrades.includes(id)) return { ok: false, reason: "already-owned" };
  if (ownedCount(state, def.id) < upgradeThreshold(upgrade.tier)) {
    return { ok: false, reason: "threshold-not-met" };
  }
  const cost = upgradeCost(def, upgrade.tier, upgradeCostMultiplier(state, catalog));
  if (cost > state.starlight) return { ok: false, reason: "insufficient-starlight" };
  return {
    ok: true,
    state: { ...state, starlight: spend(state, cost), upgrades: [...state.upgrades, id] },
    events: [{ type: "upgraded", upgradeId: id, cost }],
  };
}

export function buyBoon(
  state: GameState,
  id: BoonId,
  catalog: Catalog,
): PurchaseSuccess | Rejection {
  const boon = findBoon(catalog, id);
  if (boon === undefined) return { ok: false, reason: "unknown-id" };
  if (state.boons.includes(id)) return { ok: false, reason: "already-owned" };
  if (state.shards < boon.cost) return { ok: false, reason: "insufficient-shards" };
  return {
    ok: true,
    state: { ...state, shards: state.shards - boon.cost, boons: [...state.boons, id] },
    events: [{ type: "boon-bought", boonId: id, cost: boon.cost }],
  };
}
