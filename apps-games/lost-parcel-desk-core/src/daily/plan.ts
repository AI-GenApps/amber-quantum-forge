import { FACETS } from "../constants";
import { PEOPLE } from "../content";
import type { Prng } from "../prng";
import type { FacetId, Person } from "../types";
import { FLAVOUR_POOL } from "./templates";
import type { DailyKind, DailyTier } from "./tiers";
import type { DailyPlan } from "./types";

export function personById(id: string): Person {
  const found = PEOPLE.find((person) => person.id === id);
  if (found === undefined) throw new Error(`unknown person ${id}`);
  return found;
}

export function dailyValue(kind: DailyKind, facet: FacetId, owner: Person, target: Person): string {
  return kind === "direct" ? owner.facets[facet] : target.facets[facet];
}

export function dailyHolds(
  person: Person,
  kind: DailyKind,
  facet: FacetId,
  value: string,
): boolean {
  const same = person.facets[facet] === value;
  return kind === "direct" ? same : !same;
}

/** Decoy X must be the only one D1 rules out and decoy Y the only one D2 rules out. */
export function planIsSound(plan: DailyPlan): boolean {
  const owner = personById(plan.ownerId);
  const x = personById(plan.xId);
  const y = personById(plan.yId);
  if (new Set([owner.id, x.id, y.id]).size !== 3) return false;
  const [f1, f2] = plan.facets;
  const [k1, k2] = plan.kinds;
  const v1 = dailyValue(k1, f1, owner, x);
  const v2 = dailyValue(k2, f2, owner, y);
  return (
    dailyHolds(owner, k1, f1, v1) &&
    dailyHolds(y, k1, f1, v1) &&
    !dailyHolds(x, k1, f1, v1) &&
    dailyHolds(owner, k2, f2, v2) &&
    dailyHolds(x, k2, f2, v2) &&
    !dailyHolds(y, k2, f2, v2)
  );
}

function indexes(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

export function makePlan(rng: Prng, tier: DailyTier): DailyPlan | null {
  const owner = rng.pick(PEOPLE);
  const [f1, f2] = rng.shuffle(FACETS).slice(0, 2) as [FacetId, FacetId];
  const [k1, k2] = tier.kinds;
  const others = PEOPLE.filter((person) => person.id !== owner.id);
  const yPool = k1 === "direct" ? others.filter((p) => p.facets[f1] === owner.facets[f1]) : others;
  const y = yPool.length === 0 ? undefined : rng.pick(yPool);
  if (y === undefined) return null;
  const xBase = k2 === "direct" ? others.filter((p) => p.facets[f2] === owner.facets[f2]) : others;
  const xPool = xBase.filter((person) => person.id !== y.id);
  const x = xPool.length === 0 ? undefined : rng.pick(xPool);
  if (x === undefined) return null;
  const plan: DailyPlan = {
    ownerId: owner.id,
    xId: x.id,
    yId: y.id,
    candidateIds: rng.shuffle([owner.id, x.id, y.id]) as [string, string, string],
    facets: [f1, f2],
    kinds: [k1, k2],
    sides: [rng.int(2) as 0 | 1, rng.int(2) as 0 | 1],
    flavour: rng.shuffle(indexes(FLAVOUR_POOL.length)).slice(0, tier.flavour),
    order: rng.shuffle(indexes(tier.objects)),
    faces: indexes(tier.objects).map(() => (rng.int(2) === 0 ? "front" : "back")),
  };
  return planIsSound(plan) ? plan : null;
}
