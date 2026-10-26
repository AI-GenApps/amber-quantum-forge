import { buyBoon, buyInstrument, buyUpgrade, gather, tick } from "./actions";
import { canChart, completeChart, startChart, tapStar } from "./chart";
import { RULES } from "./constants";
import { eclipse, pendingShards } from "./eclipse";
import { gatherValue, starlightPerSecond } from "./economy";
import { createInitialState } from "./state";
import type { BoonId, Catalog, ConstellationDef, ConstellationId, GameState } from "./types";

export interface SimulationOptions {
  readonly cycles?: number;
  readonly shardsTarget?: number;
  readonly maxSecondsPerCycle?: number;
  readonly startBoons?: readonly BoonId[];
  readonly startCharted?: readonly ConstellationId[];
}

export interface CycleReport {
  readonly cycle: number;
  readonly boonsAtStart: readonly BoonId[];
  readonly firstChartSeconds: number | null;
  readonly secondsToShards: number | null;
  readonly longestGap: number;
  readonly chartedAtEclipse: number;
  readonly purchases: number;
  readonly shardsGained: number;
  readonly boonsBought: readonly BoonId[];
}

export interface SimulationReport {
  readonly cycles: readonly CycleReport[];
}

const DECISION_INTERVAL = 5;
const FAST_TAP_SECONDS = 600;
const DEFAULT_MAX_SECONDS = 12 * 3600;

interface Purchase {
  readonly state: GameState;
  readonly charted: boolean;
}

function chartPerfectly(
  state: GameState,
  constellation: ConstellationDef,
  catalog: Catalog,
): GameState | null {
  let session = startChart(constellation);
  for (let index = 0; index < constellation.stars.length; index++) {
    session = tapStar(session, index).session;
  }
  const completion = completeChart(state, session, catalog);
  return completion.ok ? completion.state : null;
}

function tryChart(state: GameState, catalog: Catalog): GameState | null {
  for (const constellation of catalog.constellations) {
    if (state.charted.includes(constellation.id)) continue;
    if (!canChart(state, constellation.id, catalog).ok) continue;
    return chartPerfectly(state, constellation, catalog);
  }
  return null;
}

function tapGain(state: GameState, catalog: Catalog, tapsPerSecond: number): number {
  return gatherValue(state, catalog) * tapsPerSecond;
}

function bestPurchase(state: GameState, catalog: Catalog, tapsPerSecond: number): GameState | null {
  const baseline = starlightPerSecond(state, catalog) + tapGain(state, catalog, tapsPerSecond);
  let best: GameState | null = null;
  let bestRatio = 0;
  const consider = (next: GameState, cost: number): void => {
    if (!(cost > 0)) return;
    const gain =
      starlightPerSecond(next, catalog) + tapGain(next, catalog, tapsPerSecond) - baseline;
    const ratio = gain / cost;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = next;
    }
  };
  for (const instrument of catalog.instruments) {
    const result = buyInstrument(state, instrument.id, 1, catalog);
    if (result.ok) consider(result.state, result.cost);
  }
  for (const upgrade of catalog.upgrades) {
    const result = buyUpgrade(state, upgrade.id, catalog);
    if (result.ok) consider(result.state, state.starlight - result.state.starlight);
  }
  return best;
}

function nextPurchase(state: GameState, catalog: Catalog, tapsPerSecond: number): Purchase | null {
  const charted = tryChart(state, catalog);
  if (charted !== null) return { state: charted, charted: true };
  const bought = bestPurchase(state, catalog, tapsPerSecond);
  return bought === null ? null : { state: bought, charted: false };
}

function startState(catalog: Catalog, options: SimulationOptions): GameState {
  const boons = options.startBoons ?? [];
  const charted = options.startCharted ?? [];
  const fresh = createInitialState(catalog);
  if (boons.length === 0 && charted.length === 0) return fresh;
  const seeded: GameState = {
    ...fresh,
    boons: [...boons],
    charted: [...charted],
    cycleStarlight: RULES.ECLIPSE_DIVISOR * RULES.ECLIPSE_MIN_SHARDS ** 2,
  };
  const result = eclipse(seeded, catalog);
  if (!result.ok) return fresh;
  return { ...result.state, shards: 0, shardsEarned: 0, eclipses: 0 };
}

function buyBoonsAscending(state: GameState, catalog: Catalog): [GameState, BoonId[]] {
  const bought: BoonId[] = [];
  let current = state;
  const ordered = [...catalog.boons].sort((a, b) => a.cost - b.cost);
  for (const boon of ordered) {
    if (current.boons.includes(boon.id)) continue;
    const result = buyBoon(current, boon.id, catalog);
    if (!result.ok) break;
    current = result.state;
    bought.push(boon.id);
  }
  return [current, bought];
}

interface CycleRun {
  readonly state: GameState;
  readonly report: Omit<CycleReport, "cycle" | "boonsBought">;
  readonly reached: boolean;
}

function runCycle(
  initial: GameState,
  catalog: Catalog,
  target: number,
  maxSeconds: number,
): CycleRun {
  let state = initial;
  const boonsAtStart = [...state.boons];
  let lastPurchase = 0;
  let longestGap = 0;
  let purchases = 0;
  let firstChartSeconds: number | null = null;
  let secondsToShards: number | null = null;
  for (let second = 1; second <= maxSeconds; second++) {
    state = tick(state, 1, catalog);
    const fast = second <= FAST_TAP_SECONDS;
    const tapsPerSecond = fast ? 2 : 0.5;
    if (fast) {
      state = gather(gather(state, catalog), catalog);
    } else if (second % 2 === 0) {
      state = gather(state, catalog);
    }
    if (pendingShards(state.cycleStarlight) >= target) {
      secondsToShards = second;
      break;
    }
    if (second % DECISION_INTERVAL !== 0) continue;
    for (let guard = 0; guard < 200; guard++) {
      const purchase = nextPurchase(state, catalog, tapsPerSecond);
      if (purchase === null) break;
      state = purchase.state;
      purchases += 1;
      longestGap = Math.max(longestGap, second - lastPurchase);
      lastPurchase = second;
      if (purchase.charted && firstChartSeconds === null) firstChartSeconds = second;
    }
  }
  return {
    state,
    reached: secondsToShards !== null,
    report: {
      boonsAtStart,
      firstChartSeconds,
      secondsToShards,
      longestGap,
      chartedAtEclipse: state.charted.length,
      purchases,
      shardsGained: pendingShards(state.cycleStarlight),
    },
  };
}

export function simulate(catalog: Catalog, options: SimulationOptions = {}): SimulationReport {
  const cycles = options.cycles ?? 3;
  const target = options.shardsTarget ?? RULES.ECLIPSE_MIN_SHARDS;
  const maxSeconds = options.maxSecondsPerCycle ?? DEFAULT_MAX_SECONDS;
  let state = startState(catalog, options);
  const reports: CycleReport[] = [];
  for (let cycle = 1; cycle <= cycles; cycle++) {
    const run = runCycle(state, catalog, target, maxSeconds);
    if (!run.reached) {
      reports.push({ ...run.report, cycle, boonsBought: [] });
      break;
    }
    const result = eclipse(run.state, catalog);
    if (!result.ok) {
      reports.push({ ...run.report, cycle, boonsBought: [] });
      break;
    }
    const [next, boonsBought] = buyBoonsAscending(result.state, catalog);
    reports.push({ ...run.report, cycle, boonsBought });
    state = next;
  }
  return { cycles: reports };
}
