import { createPrng } from "../../../../../../../apps-games/floodplain-dispatch-core/src/prng";
import type { Placement } from "./lib";
import type { Spec } from "./spec";
import { terrain, terrainCone } from "./valley";
import { wetCountsOf, type Design, type K, type Recipe, type Rng } from "./design";

export function nbrIdx(w: number, h: number, i: number): number[] {
  const x = i % w, y = Math.floor(i / w), out: number[] = [];
  if (y > 0) out.push(i - w);
  if (x < w - 1) out.push(i + 1);
  if (y < h - 1) out.push(i + w);
  if (x > 0) out.push(i - 1);
  return out;
}
const DIRN = ["N", "E", "S", "W"] as const;

interface Tree { cells: number[]; parent: Map<number, number>; children: Map<number, number[]> }

function steinerTree(kind: K[], w: number, h: number, targets: number[], inlets: number[], rng: Rng): Tree | null {
  const order = targets.slice();
  for (let i = order.length - 1; i > 0; i--) { const j = rng.int(i + 1); [order[i], order[j]] = [order[j] as number, order[i] as number]; }
  const net = new Set(inlets);
  const tree: Tree = { cells: [], parent: new Map(), children: new Map() };
  for (const tg of order) {
    if (nbrIdx(w, h, tg).some((n) => net.has(n) && kind[n] !== "sea")) continue;
    const goal = new Set(nbrIdx(w, h, tg).filter((n) => kind[n] === "land"));
    const prev = new Map<number, number>();
    let q = [...net].filter((n) => kind[n] !== "sea");
    const seen = new Set(q);
    let found = -1;
    while (q.length && found < 0) {
      const nq: number[] = [];
      for (const c of q) {
        const ns = nbrIdx(w, h, c);
        for (let i = ns.length - 1; i > 0; i--) { const j = rng.int(i + 1); [ns[i], ns[j]] = [ns[j] as number, ns[i] as number]; }
        for (const n of ns) {
          if (seen.has(n) || kind[n] !== "land") continue;
          seen.add(n); prev.set(n, c); nq.push(n);
          if (goal.has(n)) { found = n; break; }
        }
        if (found >= 0) break;
      }
      q = nq;
    }
    if (found < 0) return null;
    const path: number[] = [];
    for (let c = found; !net.has(c); c = prev.get(c) as number) path.push(c);
    path.reverse();
    let par = prev.get(path[0] as number) as number;
    for (const c of path) {
      net.add(c); tree.cells.push(c); tree.parent.set(c, par);
      const arr = tree.children.get(par) ?? []; arr.push(c); tree.children.set(par, arr);
      par = c;
    }
  }
  return tree;
}

export interface MakeOpts { treeFrac: number; spread: number }

export function makeDesign(spec: Spec, seed: number, recipe: Recipe, side = 1.0): Design | null {
  const rng = createPrng(seed * 6007 + 11);
  const t = !process.env.VALLEY ? terrainCone(spec, seed) : terrain(spec, seed, side);
  const { w, h, kind, hgt } = t;
  const fixed = kind.map((k) => k === "inlet" || k === "sea");
  const inlets: number[] = [], seas: number[] = [];
  kind.forEach((k, i) => { if (k === "inlet") inlets.push(i); if (k === "sea") seas.push(i); });
  const base = kind.slice();
  const probe: Design = { spec, w, h, kind: kind.slice(), hgt: hgt.slice(), fixed, ref: [], houseKinds: [], forbidden: [] };
  const wet = wetCountsOf(probe);
  const roots = [...inlets];
  if (process.env.BEDROOT) base.forEach((k, i) => { if (k === "land" && (wet[i] as number) >= Math.floor(0.4 * spec.weeks * 4)) roots.push(i); });
  const nearWet = (i: number) => (wet[i] as number) >= 2 || nbrIdx(w, h, i).some((n) => (wet[n] as number) >= 3 || roots.includes(n));
  const extras = recipe.gates + 2 * recipe.pumps + 3 * recipe.reservoirs + recipe.barriers;
  const wantTree = spec.par - extras;
  const nearSE = (i: number) => nbrIdx(w, h, i).some((n) => base[n] === "inlet" || base[n] === "sea");
  for (let attempt = 0; attempt < 300; attempt++) {
    for (let i = 0; i < kind.length; i++) kind[i] = base[i] as K;
    const targets: number[] = [];
    let ok = true;
    const put = (k: K, n: number) => {
      let tries = 0, placed = 0;
      while (placed < n && tries++ < 300) {
        const coast = spec.tide !== null && k === "house" && rng.int(2) === 0;
        let x = rng.int(w), y = coast ? h - 8 + rng.int(5) : 1 + rng.int(h - 3);
        if (attempt >= 60 && (targets.length > 0 || inlets.length > 0) && rng.int(3) > 0) {
          const anchor = rng.int(3) === 0 ? (inlets[rng.int(inlets.length)] as number) : targets.length ? (targets[rng.int(targets.length)] as number) : (inlets[0] as number);
          x = Math.max(0, Math.min(w - 1, (anchor % w) + rng.int(7) - 3));
          y = Math.max(1, Math.min(h - 3, Math.floor(anchor / w) + rng.int(7) - 3));
        }
        const i = y * w + x;
        if (kind[i] !== "land" || nearSE(i) || (process.env.NEARWET && nearWet(i))) continue;
        if (nbrIdx(w, h, i).some((q) => kind[q] === "house" || kind[q] === "field")) continue;
        kind[i] = k; targets.push(i); placed++;
      }
      return placed === n;
    };
    ok = put("house", spec.houseKinds.length) && put("field", spec.fields);
    if (!ok) continue;
    const tree = steinerTree(kind, w, h, targets, roots, rng);
    if (!tree || tree.cells.length !== wantTree) continue;
    // roles
    const role = new Map<number, Placement["kind"]>();
    const cellPl = new Map<number, Placement>();
    const coord = (i: number) => ({ x: i % w, y: Math.floor(i / w) });
    const kids = (c: number) => tree.children.get(c) ?? [];
    const free = tree.cells.slice();
    for (let i = free.length - 1; i > 0; i--) { const j = rng.int(i + 1); [free[i], free[j]] = [free[j] as number, free[i] as number]; }
    const used = new Set<number>();
    let good = true;
    for (let n = 0; n < recipe.pumps && good; n++) {
      const c = free.find((q) => !used.has(q) && kids(q).length === 1 && !used.has(tree.parent.get(q) as number) && !used.has(kids(q)[0] as number));
      if (c === undefined) { good = false; break; }
      used.add(c);
      const k = kids(c)[0] as number;
      const dir = DIRN[nbrIdx(w, h, c).indexOf(k) < 0 ? 0 : (() => { const dx = k - c; return dx === -w ? 0 : dx === 1 ? 1 : dx === w ? 2 : 3; })()];
      cellPl.set(c, { ...coord(c), kind: "pump", dir });
    }
    for (let n = 0; n < recipe.reservoirs && good; n++) {
      const c = free.find((q) => !used.has(q) && kids(q).length <= 1 && nbrIdx(w, h, q).some((z) => kind[z] === "house") && !used.has(tree.parent.get(q) as number));
      if (c === undefined) { good = false; break; }
      used.add(c); cellPl.set(c, { ...coord(c), kind: "reservoir" });
    }
    for (let n = 0; n < recipe.gates && good; n++) {
      const c = free.find((q) => !used.has(q) && !used.has(tree.parent.get(q) as number));
      if (c === undefined) { good = false; break; }
      used.add(c);
      const ev = spec.events.filter((e) => e.type === "surge").sort((a, b) => b.delta - a.delta);
      let opens = 0, closes = spec.weeks;
      if (ev.length > 0) {
        const e = ev[rng.int(Math.min(2, ev.length))] as (typeof ev)[number];
        const mode = rng.int(3);
        if (mode === 0 && e.week >= 2) closes = e.week;
        else if (mode === 1 && spec.weeks - (e.week + e.weeks) >= 2) opens = e.week + e.weeks;
        else if (e.week >= 2) closes = e.week;
        else opens = e.week + e.weeks;
      } else { opens = 2 + rng.int(4); closes = spec.weeks - rng.int(4); }
      cellPl.set(c, { ...coord(c), kind: "gate", opensWeek: opens, closesWeek: closes });
    }
    if (!good) continue;
    for (const c of tree.cells) if (!cellPl.has(c)) cellPl.set(c, { ...coord(c), kind: "canal" });
    const ref: Placement[] = [...cellPl.values()];
    const houses: number[] = []; kind.forEach((k, i) => { if (k === "house") houses.push(i); });
    const cands: number[] = [];
    for (const hs of houses) for (const n of nbrIdx(w, h, hs)) if (kind[n] === "land" && !cellPl.has(n) && !nearSE(n)) cands.push(n);
    const bset = new Set<number>();
    for (let n = 0; n < recipe.barriers && good; n++) {
      const c = cands.filter((q) => !bset.has(q))[rng.int(Math.max(1, cands.length - bset.size))];
      if (c === undefined) { good = false; break; }
      bset.add(c); ref.push({ ...coord(c), kind: "barrier" });
    }
    if (!good) continue;
    // scenery
    for (let i = 0; i < w * h; i++) {
      if (kind[i] === "land" && !cellPl.has(i) && !bset.has(i) && !nearSE(i) && rng.next() < 0.06) kind[i] = "scenery";
    }
    // shuffle house kinds
    const kinds = [...spec.houseKinds];
    for (let i = kinds.length - 1; i > 0; i--) { const j = rng.int(i + 1); [kinds[i], kinds[j]] = [kinds[j] as string, kinds[i] as string]; }
    // init heights along tree
    const hg = hgt.slice();
    const walk = (c: number, ph: number) => {
      const hh = Math.max(1, ph - (rng.int(3) === 0 ? 0 : 1));
      hg[c] = hh;
      for (const k of kids(c)) walk(k, hh);
    };
    for (const inl of roots) for (const k of kids(inl)) walk(k, hg[inl] as number);
    for (const hs of houses) {
      const adj = nbrIdx(w, h, hs).filter((n) => cellPl.has(n));
      if (adj.length) hg[hs] = Math.min(7, Math.max(...adj.map((n) => hg[n] as number)) + 1);
    }
    kind.forEach((k, i) => { if (k === "field") { const adj = nbrIdx(w, h, i).filter((n) => cellPl.has(n)); if (adj.length) hg[i] = Math.min(...adj.map((n) => hg[n] as number)); } });
    return { spec, w, h, kind: kind.slice(), hgt: hg, fixed, ref, houseKinds: kinds, forbidden: [] };
  }
  return null;
}
