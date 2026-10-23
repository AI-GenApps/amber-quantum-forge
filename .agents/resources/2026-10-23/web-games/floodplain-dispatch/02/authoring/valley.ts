import { createPrng } from "../../../../../../../apps-games/floodplain-dispatch-core/src/prng";
import type { MapDef } from "./lib";
import type { Spec } from "./spec";

export type K = "land" | "house" | "field" | "scenery" | "inlet" | "sea";
export interface Terrain { w: number; h: number; kind: K[]; hgt: number[]; bed: number[]; }

export function terrain(spec: Spec, seed: number, side = 1): Terrain {
  const rng = createPrng(seed * 104729 + 7);
  const { w, h } = spec;
  const kind: K[] = new Array(w * h).fill("land");
  const hgt: number[] = new Array(w * h).fill(0);
  const estuary = spec.tide !== null;
  // bed centerlines for each inlet
  const beds: number[][] = [];
  const inletXs: number[] = [];
  const minGap = Math.max(3, Math.floor(w / (spec.inlets + 1)));
  let guard = 0;
  while (inletXs.length < spec.inlets && guard++ < 200) {
    const x = 1 + rng.int(w - 2);
    if (inletXs.every((q) => Math.abs(q - x) >= minGap)) inletXs.push(x);
  }
  if (inletXs.length < spec.inlets) throw new Error("inlet spacing");
  inletXs.sort((a, b) => a - b);
  // sea target x per bed
  const seaX = inletXs.map((x) => Math.max(1, Math.min(w - 2, x + rng.int(5) - 2)));
  for (let b = 0; b < inletXs.length; b++) {
    const line: number[] = [];
    let x = inletXs[b] as number;
    for (let y = 0; y < h; y++) {
      const t = y / (h - 1);
      const target = (inletXs[b] as number) * (1 - t) + (seaX[b] as number) * t;
      x += (target - x) * 0.4 + (rng.next() - 0.5) * 1.6;
      x = Math.max(0.5, Math.min(w - 1.5, x));
      line.push(Math.round(x));
    }
    beds.push(line);
  }
  const bed = new Array(w * h).fill(0);
  const inletH = 6 + rng.int(2);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let best = 99;
      for (const line of beds) best = Math.min(best, Math.abs(x - (line[y] as number)));
      const bedH = Math.max(0, (inletH - 1) * (1 - y / (h - 1.5)));
      const v = bedH + Math.min(best, 4) * side + (rng.next() - 0.5) * 0.3;
      hgt[y * w + x] = Math.max(1, Math.min(7, Math.round(v)));
      bed[y * w + x] = best;
    }
  const seaN = estuary ? 4 + rng.int(3) : 1 + rng.int(2);
  for (let b = 0; b < beds.length; b++) {
    const sx = (beds[b] as number[])[h - 1] as number;
    for (let i = 0; i < seaN; i++) {
      const x = Math.max(0, Math.min(w - 1, sx - Math.floor(seaN / 2) + i));
      kind[(h - 1) * w + x] = "sea"; hgt[(h - 1) * w + x] = 0;
      if (estuary) { kind[(h - 2) * w + x] = "sea"; hgt[(h - 2) * w + x] = 0; }
    }
  }
  inletXs.forEach((x, b) => {
    kind[x] = "inlet"; hgt[x] = inletH;
    const line = beds[b] as number[];
    void line;
  });
  return { w, h, kind, hgt, bed };
}

export function layoutOf(t: Terrain): string[] {
  const ch: Record<K, string> = { land: ".", house: "H", field: "F", scenery: "T", inlet: "I", sea: "S" };
  const out: string[] = [];
  for (let y = 0; y < t.h; y++) {
    const row: string[] = [];
    for (let x = 0; x < t.w; x++) row.push(`${ch[t.kind[y * t.w + x] as K]}${t.hgt[y * t.w + x]}`);
    out.push(row.join(" "));
  }
  return out;
}

export function defOf(spec: Spec, t: Terrain, kinds: string[]): MapDef {
  return {
    layout: layoutOf(t), inlets: Array.from({ length: spec.inlets }, () => spec.rate), houseKinds: kinds,
    events: spec.events, tide: spec.tide, weeks: spec.weeks, pieces: spec.pieces, par: spec.par, budget: spec.budget,
  };
}

export function terrainCone(spec: Spec, seed: number): Terrain {
  const rng = createPrng(seed * 15485863 + 3);
  const { w, h } = spec;
  const kind: K[] = new Array(w * h).fill("land");
  const hgt: number[] = new Array(w * h).fill(1);
  const inlets: number[] = [];
  const minGap = Math.max(3, Math.floor(w / (spec.inlets + 1)));
  let guard = 0;
  while (inlets.length < spec.inlets && guard++ < 500) {
    const x = 1 + rng.int(w - 2);
    if (inlets.every((q) => Math.abs(q - x) >= minGap)) inlets.push(x);
  }
  if (inlets.length < spec.inlets) {
    inlets.length = 0;
    const n = spec.inlets;
    for (let i = 0; i < n; i++) inlets.push(Math.max(1, Math.min(w - 2, Math.round(((i + 0.5) * w) / n - 0.5) + rng.int(3) - 1)));
    for (let i = 1; i < n; i++) if ((inlets[i] as number) - (inlets[i - 1] as number) < 3) inlets[i] = Math.min(w - 2, (inlets[i - 1] as number) + 3);
  }
  inlets.sort((a, b) => a - b);
  const inletH = 6 + rng.int(2);
  for (const x of inlets) { kind[x] = "inlet"; hgt[x] = inletH; }
  // distance field
  const dist = new Array(w * h).fill(99);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (const ix of inlets) dist[y * w + x] = Math.min(dist[y * w + x], Math.abs(x - ix) + y);
  for (let i = 0; i < w * h; i++) {
    if (kind[i] === "inlet") continue;
    hgt[i] = Math.max(1, Math.min(7, Math.round(inletH + 1 - dist[i] + (rng.next() - 0.5) * 0.9)));
  }
  const nHills = 2 + rng.int(3);
  for (let n = 0; n < nHills; n++) {
    const cx = rng.int(w), cy = 3 + rng.int(Math.max(1, h - 3)), rr = 1.3 + rng.next() * 1.8, amp = 1 + rng.int(3);
    for (let i = 0; i < w * h; i++) {
      if (kind[i] === "inlet" || dist[i] <= 2) continue;
      const x = i % w, y = Math.floor(i / w);
      hgt[i] = Math.max(1, Math.min(7, Math.round((hgt[i] as number) + amp * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * rr * rr)))));
    }
  }
  // drain strips
  for (const ix of inlets) {
    const opts: [number, number][] = [];
    for (let dy = 0; dy <= 3; dy++) { const dx = 3 - dy; for (const sx of dx === 0 ? [0] : [dx, -dx]) { const x = ix + sx, y = dy; if (x >= 0 && x < w && y < h && kind[y * w + x] === "land") opts.push([x, y]); } }
    const pick = opts[rng.int(opts.length)] as [number, number];
    // L path: first horizontal then vertical, or reverse
    const path: number[] = [];
    let x = ix, y = 0;
    const horizFirst = rng.int(2) === 0;
    const step = (dx: number, dy: number) => { x += dx; y += dy; path.push(y * w + x); };
    const hx = Math.sign(pick[0] - ix), vy = Math.sign(pick[1]);
    const segs = horizFirst ? [["h", Math.abs(pick[0] - ix)], ["v", pick[1]]] as const : [["v", pick[1]], ["h", Math.abs(pick[0] - ix)]] as const;
    for (const [t, n] of segs) for (let k = 0; k < n; k++) step(t === "h" ? hx : 0, t === "v" ? vy : 0);
    const last = path.length - 1;
    path.forEach((c, i) => { if (i === last) { kind[c] = "sea"; hgt[c] = 0; } else hgt[c] = Math.max(1, inletH - 2 - 2 * i); });
  }
  if (spec.tide) {
    const bw = 4 + rng.int(3);
    const bx = 1 + rng.int(Math.max(1, w - bw - 1));
    for (let x = bx; x < bx + bw; x++) { kind[(h - 1) * w + x] = "sea"; hgt[(h - 1) * w + x] = 0; }
    for (let x = bx + 1; x < bx + bw - 1; x++) { kind[(h - 2) * w + x] = "sea"; hgt[(h - 2) * w + x] = 0; }
    for (let i = 0; i < w * h; i++) {
      if (kind[i] !== "land") continue;
      const y = Math.floor(i / w);
      if (y >= h - 4) hgt[i] = Math.min(hgt[i] as number, y < h - 3 ? 2 : 1);
    }
  }
  const bed = new Array(w * h).fill(0);
  return { w, h, kind, hgt, bed };
}
