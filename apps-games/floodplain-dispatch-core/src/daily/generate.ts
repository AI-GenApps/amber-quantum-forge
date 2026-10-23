import { BUDGET_SLACK } from "../content";
import { evaluate } from "../evaluate";
import { totalCost } from "../placement";
import { createPrng, type Prng } from "../prng";
import { runSeason } from "../simulate";
import type { MapDef, Placement, SeasonEvent, TideSpec } from "../types";
import { shapeTerrain } from "./anneal";
import { FALLBACK_TEMPLATES } from "./fallbacks";
import { trimLeaves } from "./reference";
import { solveMap } from "./solver";
import { buildDraft, type Terrain, terrainLayout } from "./terrain";
import type { DailyTier, EventPlan } from "./tiers";

export const MAX_ATTEMPTS = 12 as const;
const SHAPE_SIMS = 1200;
const REPAIR_SIMS = 600;
const PAR_SLACK = 2;
const PROVISIONAL = 99;
const EVENT_EARLIEST = 3;

export interface DailyMap extends MapDef {
  reference: readonly Placement[];
}

export interface DailyPuzzle {
  map: DailyMap;
  weekday: number;
  seed: number;
  attempt: number;
  fallback: number | null;
  sims: number;
}

const HOUSE_POOLS: readonly (readonly string[])[] = [
  ["cottage", "barn"],
  ["cottage", "barn"],
  ["cottage", "barn"],
  ["cottage", "townhouse", "mill"],
  ["cottage", "barn", "school"],
  ["cottage", "townhouse", "school", "mill"],
  ["cottage", "townhouse", "school", "mill", "barn"],
];

function planEvents(rng: Prng, tier: DailyTier): SeasonEvent[] {
  const events: SeasonEvent[] = [];
  for (const plan of tier.events) {
    if (plan.type === "storm-tide" && !tier.tide) continue;
    for (let i = 0; i < plan.count; i++) events.push(makeEvent(rng, plan, tier.weeks));
  }
  return events.sort((a, b) => a.week - b.week);
}

function makeEvent(rng: Prng, plan: EventPlan, seasonWeeks: number): SeasonEvent {
  const weeks = plan.minWeeks + rng.int(plan.maxWeeks - plan.minWeeks + 1);
  const delta = plan.minDelta + rng.int(plan.maxDelta - plan.minDelta + 1);
  const week = EVENT_EARLIEST + rng.int(seasonWeeks - plan.maxWeeks - EVENT_EARLIEST + 1);
  return { type: plan.type, week, weeks, delta };
}

function planTide(rng: Prng, tier: DailyTier): TideSpec | null {
  const plan = tier.tide;
  if (!plan) return null;
  const period = plan.minPeriod + 2 * rng.int((plan.maxPeriod - plan.minPeriod) / 2 + 1);
  return { period, amp: plan.minAmp + rng.int(plan.maxAmp - plan.minAmp + 1) };
}

export interface DailyDraft {
  def: MapDef;
  tree: Placement[];
  terrain: Terrain;
}

export function draftMap(rng: Prng, tier: DailyTier): DailyDraft | null {
  const built = buildDraft(rng, tier);
  if (!built) return null;
  const { terrain, tree } = built;
  const pool = HOUSE_POOLS[tier.weekday] ?? HOUSE_POOLS[0] ?? [];
  const houseKinds = Array.from({ length: tier.houses }, () => rng.pick(pool));
  const def: MapDef = {
    layout: terrainLayout(terrain),
    inlets: Array.from({ length: tier.inlets }, () => tier.rate),
    houseKinds,
    events: planEvents(rng, tier),
    tide: planTide(rng, tier),
    weeks: tier.weeks,
    pieces: tier.pieces,
    par: PROVISIONAL,
    budget: PROVISIONAL,
  };
  const cells: Placement[] = tree.map((cell) => ({
    x: cell % terrain.width,
    y: Math.floor(cell / terrain.width),
    kind: "canal",
  }));
  return { def, tree: cells, terrain };
}

export function finishMap(draft: MapDef, placements: readonly Placement[], cost: number): DailyMap {
  return { ...draft, par: cost, budget: cost + BUDGET_SLACK, reference: placements };
}

export function provesThreeStars(map: DailyMap): boolean {
  const result = runSeason(map, map.reference);
  return evaluate(map, result, map.reference).stars === 3;
}

export function generateAttempt(
  seed: number,
  tier: DailyTier,
  attempt: number,
): { map: DailyMap | null; sims: number } {
  const rng = createPrng(seed).fork(`attempt-${attempt}`);
  const draft = draftMap(rng, tier);
  if (!draft) return { map: null, sims: 0 };
  const shaped = shapeTerrain(rng, draft.terrain, draft.def, draft.tree, SHAPE_SIMS);
  const def: MapDef = { ...draft.def, layout: terrainLayout(draft.terrain) };
  let sims = shaped.sims;
  let reference: Placement[] | null = null;
  if (shaped.ok) {
    const trimmed = trimLeaves(def, draft.tree);
    sims += trimmed.sims;
    reference = trimmed.placements;
  } else {
    const repaired = solveMap(def, {
      maxSims: REPAIR_SIMS,
      maxCost: draft.tree.length + PAR_SLACK,
      seed: rng.int(1 << 30),
      starts: [draft.tree],
    });
    sims += repaired ? repaired.sims : REPAIR_SIMS;
    reference = repaired ? repaired.placements : null;
  }
  if (!reference || totalCost(reference) < tier.minPar) return { map: null, sims };
  const map = finishMap(def, reference, totalCost(reference));
  return { map: provesThreeStars(map) ? map : null, sims };
}

export interface DailyOptions {
  maxAttempts?: number;
}

export function generateDaily(
  seed: number,
  tier: DailyTier,
  options: DailyOptions = {},
): DailyPuzzle {
  let sims = 0;
  const attempts = Math.min(MAX_ATTEMPTS, options.maxAttempts ?? MAX_ATTEMPTS);
  for (let attempt = 0; attempt < attempts; attempt++) {
    const made = generateAttempt(seed, tier, attempt);
    sims += made.sims;
    if (made.map) {
      return { map: made.map, weekday: tier.weekday, seed, attempt, fallback: null, sims };
    }
  }
  const choices = FALLBACK_TEMPLATES.filter((entry) => entry.weekday === tier.weekday);
  const index = choices.length > 0 ? (seed >>> 0) % choices.length : 0;
  const template = choices[index] ?? FALLBACK_TEMPLATES[0];
  if (!template) throw new Error("No fallback templates");
  return {
    map: template.map,
    weekday: tier.weekday,
    seed,
    attempt: attempts,
    fallback: FALLBACK_TEMPLATES.indexOf(template),
    sims,
  };
}
