import { evaluate, runSeason, createBoard, type MapDef, type Placement } from "./lib";
import { createPrng } from "../../../../../../../apps-games/floodplain-dispatch-core/src/prng";

export interface Fit { stars: number; pen: number; cost: number; flooded: number }

const COST: Record<string, number> = { canal: 1, barrier: 1, gate: 2, pump: 3, reservoir: 4 };

export function fitness(def: MapDef, pl: Placement[], w = 1): Fit {
  const r = runSeason(def, pl);
  let pen = 0;
  let flooded = 0;
  let sup = 0;
  for (const h of r.metrics.houses) {
    if (h.suppliedSteps < 6) pen += 1 + (6 - h.suppliedSteps) / 6; else sup++;
    if (h.floodedSteps > 0) { flooded++; pen += 1.5 + Math.min(h.floodedSteps, 6) / 6; }
  }
  let irr = 0;
  for (const f of r.metrics.fields) {
    if (f.wetSteps < 6) pen += 0.8 + (6 - f.wetSteps) / 8; else irr++;
  }
  const cost = pl.reduce((a, p) => a + (COST[p.kind] as number), 0);
  const ok = sup === r.metrics.houses.length && irr === r.metrics.fields.length;
  const stars = ok ? (flooded === 0 ? (cost <= def.par ? 3 : 2) : 1) : 0;
  return { stars: ok && flooded === 0 ? 3 : stars, pen: pen * w, cost, flooded };
}

export interface SolveOpts { iters: number; seed: number; init?: Placement[]; t0?: number; stopBelow?: number }

export function solve(def: MapDef, opts: SolveOpts): { pl: Placement[]; cost: number } | null {
  const rng = createPrng(opts.seed);
  const board = createBoard(def);
  const { width: W, height: H } = board;
  const buildable: number[] = [];
  for (let i = 0; i < W * H; i++) if (board.kinds[i] === "land") buildable.push(i);
  const allowed = def.pieces;
  const weightsRaw: Record<string, number> = { canal: 70, barrier: 10, pump: 7, gate: 7, reservoir: 6 };
  const kinds = allowed.filter((k) => weightsRaw[k]);
  const pickKind = (): Placement["kind"] => {
    let tot = 0;
    for (const k of kinds) tot += weightsRaw[k] as number;
    let r = rng.int(tot);
    for (const k of kinds) { r -= weightsRaw[k] as number; if (r < 0) return k; }
    return "canal";
  };
  const dirs = ["N", "E", "S", "W"] as const;
  const mk = (idx: number, kind: Placement["kind"]): Placement => {
    const p: Placement = { x: idx % W, y: Math.floor(idx / W), kind };
    if (kind === "pump") p.dir = dirs[rng.int(4)] as Placement["dir"];
    if (kind === "gate") {
      const a = rng.int(3) === 0 ? 0 : rng.int(def.weeks - 1);
      const b = rng.int(3) === 0 ? def.weeks : a + 1 + rng.int(def.weeks - a);
      p.opensWeek = a; p.closesWeek = Math.min(def.weeks, Math.max(b, a + 1));
    }
    return p;
  };
  const has = (pl: Placement[], idx: number) => pl.findIndex((p) => p.y * W + p.x === idx);
  const costOf = (pl: Placement[]) => pl.reduce((a, p) => a + (COST[p.kind] as number), 0);
  let cur: Placement[] = opts.init ? opts.init.map((p) => ({ ...p })) : [];
  let curF = fitness(def, cur);
  let curJ = curF.cost + 3 * curF.pen;
  let best: { pl: Placement[]; cost: number } | null = curF.pen === 0 && curF.stars === 3 ? { pl: cur.map((p) => ({ ...p })), cost: curF.cost } : null;
  const T0 = opts.t0 ?? 1.6, T1 = 0.08;
  for (let it = 0; it < opts.iters; it++) {
    const T = T0 * Math.pow(T1 / T0, it / opts.iters);
    const next = cur.slice();
    const m = rng.int(100);
    if (m < 38 || next.length === 0) {
      let idx: number;
      if (next.length > 0 && rng.int(10) < 6) {
        const base = next[rng.int(next.length)] as Placement;
        const d = rng.int(4);
        const nx = base.x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = base.y + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        idx = ny * W + nx;
      } else if (rng.int(10) < 4) {
        const ic = board.inletCells[rng.int(board.inletCells.length)] as number;
        const d = rng.int(4);
        const nx = (ic % W) + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = Math.floor(ic / W) + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        idx = ny * W + nx;
      } else idx = buildable[rng.int(buildable.length)] as number;
      if (board.kinds[idx] !== "land" || has(next, idx) >= 0) continue;
      next.push(mk(idx, pickKind()));
    } else if (m < 62) {
      next.splice(rng.int(next.length), 1);
    } else if (m < 80) {
      const i = rng.int(next.length);
      const p = next[i] as Placement;
      const d = rng.int(4);
      const nx = p.x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = p.y + (d === 2 ? 1 : d === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const idx = ny * W + nx;
      if (board.kinds[idx] !== "land" || has(next, idx) >= 0) continue;
      next[i] = { ...p, x: nx, y: ny };
    } else if (m < 90) {
      const i = rng.int(next.length);
      const p = next[i] as Placement;
      next[i] = mk(p.y * W + p.x, pickKind());
    } else {
      const i = rng.int(next.length);
      const p = next[i] as Placement;
      if (p.kind === "pump") next[i] = { ...p, dir: dirs[rng.int(4)] as Placement["dir"] };
      else if (p.kind === "gate") next[i] = mk(p.y * W + p.x, "gate");
      else continue;
    }
    if (costOf(next) > def.budget + 6) continue;
    const f = fitness(def, next);
    const J = f.cost + 3 * f.pen;
    if (J <= curJ || rng.next() < Math.exp(-(J - curJ) / T)) {
      cur = next; curF = f; curJ = J;
      if (f.pen === 0 && f.stars === 3 && (!best || f.cost < best.cost)) {
        best = { pl: next.map((p) => ({ ...p })), cost: f.cost };
        if (opts.stopBelow !== undefined && f.cost < opts.stopBelow) break;
      }
    }
  }
  return best ? prune(def, best.pl) : null;
}

export function prune(def: MapDef, pl0: Placement[]): { pl: Placement[]; cost: number } {
  let pl = pl0.slice();
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < pl.length; i++) {
      const t = pl.slice(0, i).concat(pl.slice(i + 1));
      const f = fitness(def, t);
      if (f.pen === 0 && f.stars === 3) { pl = t; changed = true; break; }
    }
  }
  return { pl, cost: pl.reduce((a, p) => a + (COST[p.kind] as number), 0) };
}
