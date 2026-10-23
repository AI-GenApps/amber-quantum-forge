import { defOfDesign, type Design } from "./design";
import { solve } from "./solver";
import type { Placement } from "./lib";

export function cheaper(d: Design, runs: number, iters: number, seed0 = 100, firstOnly = false, tol = 1): Placement[][] {
  const def = defOfDesign(d);
  const found: Placement[][] = [];
  const COST: Record<string, number> = { canal: 1, barrier: 1, gate: 2, pump: 3, reservoir: 4 };
  const par = d.ref.reduce((a, p) => a + (COST[p.kind] as number), 0);
  for (let r = 0; r < runs; r++) {
    const o = r % 2 === 1 ? { init: d.ref.map((p) => ({ ...p })), t0: 0.9 } : {};
    const res = solve({ ...def, budget: par + 3 }, { iters, seed: seed0 + r, stopBelow: par - tol + 1, ...o });
    if (res && res.cost < par - tol + 1) { found.push(res.pl); if (firstOnly) break; }
  }
  return found;
}

export function minFound(d: Design, runs: number, iters: number, seed0 = 100, tol = 1): number {
  const def = defOfDesign(d);
  const COST: Record<string, number> = { canal: 1, barrier: 1, gate: 2, pump: 3, reservoir: 4 };
  const par = d.ref.reduce((a, p) => a + (COST[p.kind] as number), 0);
  let best = par;
  for (let r = 0; r < runs; r++) {
    const o = r % 2 === 1 ? { init: d.ref.map((p) => ({ ...p })), t0: 0.9 } : {};
    const res = solve({ ...def, budget: par + 3 }, { iters, seed: seed0 + r, stopBelow: par - tol, ...o });
    if (res && res.cost < best) { best = res.cost; if (best < par - tol) break; }
  }
  return best;
}
