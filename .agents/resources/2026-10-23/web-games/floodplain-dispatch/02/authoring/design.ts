import { createPrng } from "../../../../../../../apps-games/floodplain-dispatch-core/src/prng";
import type { MapDef, Placement } from "./lib";
import { runSeason } from "./lib";
import { fitness } from "./solver";
import type { Spec } from "./spec";

export type K = "land" | "house" | "field" | "scenery" | "inlet" | "sea";
export type Rng = ReturnType<typeof createPrng>;

export interface Recipe { barriers: number; pumps: number; gates: number; reservoirs: number }
export interface Design {
  spec: Spec;
  w: number;
  h: number;
  kind: K[];
  hgt: number[];
  fixed: boolean[];
  ref: Placement[];
  houseKinds: string[];
  forbidden: Placement[][];
}

export const COST: Record<string, number> = { canal: 1, barrier: 1, gate: 2, pump: 3, reservoir: 4 };
export const costOf = (pl: readonly Placement[]) => pl.reduce((a, p) => a + (COST[p.kind] as number), 0);

export function layoutOf(d: Design): string[] {
  const ch: Record<K, string> = { land: ".", house: "H", field: "F", scenery: "T", inlet: "I", sea: "S" };
  const out: string[] = [];
  for (let y = 0; y < d.h; y++) {
    const row: string[] = [];
    for (let x = 0; x < d.w; x++) row.push(`${ch[d.kind[y * d.w + x] as K]}${d.hgt[y * d.w + x]}`);
    out.push(row.join(" "));
  }
  return out;
}

export function defOfDesign(d: Design): MapDef {
  const s = d.spec;
  return {
    layout: layoutOf(d), inlets: Array.from({ length: s.inlets }, () => s.rate), houseKinds: d.houseKinds,
    events: s.events, tide: s.tide, weeks: s.weeks, pieces: s.pieces, par: s.par, budget: s.budget,
  };
}

export function nbrIdx(w: number, h: number, i: number): number[] {
  const x = i % w, y = Math.floor(i / w), out: number[] = [];
  if (y > 0) out.push(i - w);
  if (x < w - 1) out.push(i + 1);
  if (y < h - 1) out.push(i + w);
  if (x > 0) out.push(i - 1);
  return out;
}

export function wetCountsOf(d: Design): number[] {
  const r = runSeason(defOfDesign(d), [], { keepSteps: true });
  const wet = new Array(d.w * d.h).fill(0);
  for (const f of r.stepFrames as Uint8Array[]) f.forEach((v, i) => { if (v >= 1) wet[i]++; });
  return wet;
}

export function steinerEst(d: Design, roots: Set<number>): number {
  const { w, h, kind } = d;
  const targets: number[] = [];
  kind.forEach((k, i) => { if (k === "house" || k === "field") targets.push(i); });
  let best = 1e9;
  for (let trial = 0; trial < 3; trial++) {
    const order = targets.slice();
    if (trial === 1) order.reverse();
    if (trial === 2) order.sort((a, b) => (a % w) - (b % w));
    const net = new Set(roots);
    let cost = 0, fail = false;
    for (const tg of order) {
      if (nbrIdx(w, h, tg).some((n) => net.has(n))) continue;
      const goal = new Set(nbrIdx(w, h, tg).filter((n) => kind[n] === "land"));
      const prev = new Map<number, number>();
      let q = [...net];
      const seen = new Set(q);
      let found = -1;
      while (q.length && found < 0) {
        const nq: number[] = [];
        for (const c of q) {
          for (const n of nbrIdx(w, h, c)) {
            if (seen.has(n) || kind[n] !== "land") continue;
            seen.add(n); prev.set(n, c); nq.push(n);
            if (goal.has(n)) { found = n; break; }
          }
          if (found >= 0) break;
        }
        q = nq;
      }
      if (found < 0) { fail = true; break; }
      for (let c = found; !net.has(c); c = prev.get(c) as number) { net.add(c); cost++; }
    }
    if (!fail) best = Math.min(best, cost);
  }
  return best;
}

export interface Eval { J: number; pen: number; viol: number; smooth: number; ok: boolean; notes: string[] }

export function evalDesign(d: Design, full = true): Eval {
  const def = defOfDesign(d);
  const notes: string[] = [];
  const f = fitness(def, d.ref);
  let J = 10 * f.pen;
  let viol = 0;
  if (f.pen === 0 && full) {
    for (let i = 0; i < d.ref.length; i++) {
      const p = d.ref[i] as Placement;
      const rest = d.ref.slice(0, i).concat(d.ref.slice(i + 1));
      const g = fitness(def, rest);
      if (g.pen < 0.5) { viol += 1 - g.pen / 0.5; notes.push(`redundant ${p.kind}@${p.x},${p.y}`); }
      if (p.kind === "gate" || p.kind === "pump" || p.kind === "reservoir") {
        const alt = rest.concat([{ x: p.x, y: p.y, kind: "canal" }]);
        const a = fitness(def, alt);
        if (a.pen < 0.5) { viol += 1 - a.pen / 0.5; notes.push(`downgrade ${p.kind}@${p.x},${p.y}`); }
      }
    }
    for (const fp of d.forbidden) {
      const g = fitness(def, fp);
      if (g.pen < 0.5) { viol += 1 - g.pen / 0.5; notes.push("forbidden solves"); }
    }
  }
  let shortcut = 0;
  if (f.pen === 0 && full && process.env.SHORTCUT) {
    const wet = wetCountsOf(d);
    const roots = new Set<number>();
    d.kind.forEach((k, i) => { if (k === "inlet" || (k === "land" && (wet[i] as number) >= 4)) roots.add(i); });
    const est = steinerEst(d, roots);
    const refCells = d.ref.filter((p) => p.kind !== "barrier").length;
    shortcut = Math.max(0, refCells - est);
    if (shortcut > 0) notes.push(`shortcut ${refCells - est}`);
  }
  J += 4 * viol + 3 * shortcut;
  viol += shortcut;
  let smooth = 0;
  const { w, h } = d;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const a = d.hgt[y * w + x] as number;
      if (x + 1 < w) smooth += Math.max(0, Math.abs(a - (d.hgt[y * w + x + 1] as number)) - 1) * 0.25;
      if (y + 1 < h) smooth += Math.max(0, Math.abs(a - (d.hgt[(y + 1) * w + x] as number)) - 1) * 0.25;
    }
  J += smooth * 0.15;
  return { J, pen: f.pen, viol, smooth, ok: f.pen === 0 && viol === 0, notes };
}

export function sa(d: Design, iters: number, seed: number, t0 = 1.2, t1 = 0.05): Eval {
  const rng = createPrng(seed);
  const { w, h } = d;
  let cur = evalDesign(d);
  let best = cur;
  let bestH = d.hgt.slice();
  for (let it = 0; it < iters; it++) {
    const T = t0 * Math.pow(t1 / t0, it / iters);
    const saved: [number, number][] = [];
    const m = rng.int(10);
    const touch = (i: number, nv: number) => { if (d.fixed[i]) return; const v = Math.max(0, Math.min(7, nv)); if (v === d.hgt[i]) return; saved.push([i, d.hgt[i] as number]); d.hgt[i] = v; };
    const cx = rng.int(w), cy = rng.int(h);
    if (m < 6) {
      touch(cy * w + cx, (d.hgt[cy * w + cx] as number) + (rng.int(2) === 0 ? 1 : -1) * (1 + (rng.int(4) === 0 ? 1 : 0)));
    } else if (m < 9) {
      const dv = rng.int(2) === 0 ? 1 : -1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && y >= 0 && x < w && y < h) touch(y * w + x, (d.hgt[y * w + x] as number) + dv);
      }
    } else {
      const dv = rng.int(2) === 0 ? 1 : -1;
      const len = 2 + rng.int(4);
      const horiz = rng.int(2) === 0;
      for (let k = 0; k < len; k++) {
        const x = cx + (horiz ? k : 0), y = cy + (horiz ? 0 : k);
        if (x < w && y < h) touch(y * w + x, (d.hgt[y * w + x] as number) + dv);
      }
    }
    if (saved.length === 0) continue;
    const next = evalDesign(d);
    if (next.J <= cur.J || rng.next() < Math.exp(-(next.J - cur.J) / T)) {
      cur = next;
      if (cur.J < best.J) { best = cur; bestH = d.hgt.slice(); }
      if (cur.ok && cur.J < 0.15 * 40 + 1e-9 && false) break;
    } else {
      for (const [i, v] of saved) d.hgt[i] = v;
    }
  }
  d.hgt = bestH;
  return evalDesign(d);
}

export function roughness(d: Design, prior: number[]): number {
  const { w, h } = d;
  let r = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x, a = d.hgt[i] as number;
      if (x + 1 < w) { const q = Math.abs(a - (d.hgt[i + 1] as number)); r += (q + Math.max(0, q - 1) * 2) * 0.5; }
      if (y + 1 < h) { const q = Math.abs(a - (d.hgt[i + w] as number)); r += (q + Math.max(0, q - 1) * 2) * 0.5; }
      r += Math.abs(a - (prior[i] as number)) * 1.0;
    }
  return r;
}

export function polish(d: Design, iters: number, seed: number, prior: number[]): { rough: number; ok: boolean } {
  const rng = createPrng(seed);
  const { w, h } = d;
  if (!evalDesign(d).ok) return { rough: roughness(d, prior), ok: false };
  let rough = roughness(d, prior);
  for (let it = 0; it < iters; it++) {
    const T = 0.6 * Math.pow(0.02 / 0.6, it / iters);
    const saved: [number, number][] = [];
    const cx = rng.int(w), cy = rng.int(h);
    const m = rng.int(10);
    const touch = (i: number, nv: number) => { if (d.fixed[i]) return; const v = Math.max(0, Math.min(7, nv)); if (v === d.hgt[i]) return; saved.push([i, d.hgt[i] as number]); d.hgt[i] = v; };
    if (m < 5) {
      // move toward neighbour mean
      const i = cy * w + cx;
      const ns: number[] = [];
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < w && y < h) ns.push(d.hgt[y * w + x] as number); }
      const mean = ns.reduce((a, b) => a + b, 0) / ns.length;
      const cur = d.hgt[i] as number;
      touch(i, cur + (mean > cur ? 1 : mean < cur ? -1 : 0));
    } else if (m < 8) {
      touch(cy * w + cx, (d.hgt[cy * w + cx] as number) + (rng.int(2) === 0 ? 1 : -1));
    } else {
      const dv = rng.int(2) === 0 ? 1 : -1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < w && y < h) touch(y * w + x, (d.hgt[y * w + x] as number) + dv); }
    }
    if (saved.length === 0) continue;
    const r2 = roughness(d, prior);
    let accept = r2 <= rough || rng.next() < Math.exp(-(r2 - rough) / T);
    if (accept && !evalDesign(d).ok) accept = false;
    if (accept) rough = r2; else for (const [i, v] of saved) d.hgt[i] = v;
  }
  return { rough, ok: true };
}

export function seal(d: Design, radius: number): number {
  const { w, h } = d;
  const keep = new Set(d.ref.map((p) => p.y * w + p.x));
  let sealed = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const k = d.kind[y * w + x];
      if (k !== "house" && k !== "field") continue;
      for (let dy = -radius; dy <= radius; dy++)
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) + Math.abs(dy) > radius) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const i = ny * w + nx;
          if (d.kind[i] === "land" && !keep.has(i)) { d.kind[i] = "scenery"; sealed++; }
        }
    }
  return sealed;
}
