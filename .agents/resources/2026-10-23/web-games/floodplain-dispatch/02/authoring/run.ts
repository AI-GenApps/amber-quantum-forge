import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { costOf, defOfDesign, evalDesign, polish, sa, layoutOf, seal } from "./design";
import { makeDesign } from "./make";
import { RECIPES } from "./recipes";
import { loadSpecs } from "./spec";
import { cheaper, minFound } from "./verify";
import type { Placement } from "./lib";

const id = process.argv[2] as string;
const [s0, s1] = [Number(process.argv[3]), Number(process.argv[4])];
const spec = loadSpecs().find((s) => s.id === id)!;
const recipe = process.env.RECIPE ? JSON.parse(process.env.RECIPE) : RECIPES[id]!;
const quickRuns = Number(process.env.QR ?? 3), quickIters = Number(process.env.QI ?? 25000);
const deepRuns = Number(process.env.DR ?? 6), deepIters = Number(process.env.DI ?? 50000);
const saIters = Number(process.env.SAI ?? 8000), polIters = Number(process.env.PI ?? 12000);
const out = `${process.env.OUTDIR ?? "out"}/${id}.jsonl`;
const cegis = Number(process.env.CEGIS ?? 2);
const maxAcc = Number(process.env.MAXACC ?? 2);
let acc = existsSync(out) ? readFileSync(out, 'utf8').trim().split('\n').filter(Boolean).length : 0;
for (let seed = s0; seed <= s1 && acc < maxAcc; seed++) {
  const t0 = performance.now();
  let d: ReturnType<typeof makeDesign> = null;
  try { d = makeDesign(spec, seed, recipe); } catch (err) { console.log(id, seed, 'design error', String(err)); continue; }
  if (!d) { console.log(id, seed, "no design"); continue; }
  const prior = d.hgt.slice();
  let e = sa(d, saIters, seed);
  if (!e.ok) { console.log(id, seed, "sa fail", e.pen.toFixed(2), e.viol.toFixed(2), e.notes.join(";")); continue; }
  polish(d, polIters, seed + 1, prior);
  if (!evalDesign(d).ok) { console.log(id, seed, "polish broke"); continue; }
  const sealed = seal(d, 2);
  const maxBlock = Math.floor(0.6 * d.kind.filter((k) => k === "land").length);
  let blocked = 0, gaveUp = false;
  const refCells = new Set(d.ref.map((q) => q.y * d.w + q.x));
  let finalOk = false;
  let terrainRounds = 0;
  for (let round = 0; round < 140; round++) {
    let alt = cheaper(d, quickRuns, quickIters, 300 + 17 * round, true);
    let deep = false;
    if (alt.length === 0) { alt = cheaper(d, 8, 60000, 9000 + 31 * round, true); deep = true; }
    if (alt.length === 0) { finalOk = true; break; }
    const cand = (alt[0] as Placement[]).map((q) => q.y * d.w + q.x).filter((i) => !refCells.has(i) && d.kind[i] === "land");
    if (cand.length === 0 && terrainRounds < 5) {
      terrainRounds++;
      d.forbidden.push(alt[0] as Placement[]);
      const e2 = sa(d, Math.floor(saIters / 2), seed * 11 + terrainRounds, 0.5);
      if (!e2.ok) { gaveUp = true; break; }
      polish(d, Math.floor(polIters / 2), seed + 3 + terrainRounds, prior);
      if (!evalDesign(d).ok) { gaveUp = true; break; }
      if (process.env.VERB) console.log(id, seed, "terrain cegis", terrainRounds);
      continue;
    }
    if (cand.length === 0 || blocked >= maxBlock) { gaveUp = true; break; }
    const pick = cand[(round * 7 + seed) % cand.length] as number;
    d.kind[pick] = "scenery";
    blocked++;
    if (process.env.VERB) console.log(id, seed, "block round", round, deep ? "deep" : "quick", "cost", costOf(alt[0] as Placement[]), "blocked", blocked);
  }
  const tol = spec.par >= 20 ? 2 : 1;
  if (gaveUp || !finalOk) {
    const fb = minFound(d, 8, 60000, 9000, tol);
    if (fb < spec.par - tol) { console.log(id, seed, "cannot block", blocked, "search min", fb); continue; }
    console.log(id, seed, "accepting within tolerance", tol, "search min", fb);
  }
  const strong = minFound(d, 8, 60000, 9000, tol);
  if (strong < spec.par - tol) { console.log(id, seed, "strong cheaper", strong); continue; }
  console.log(id, seed, "ACCEPT cost", costOf(d.ref), "blocked", blocked, Math.round(performance.now() - t0), "ms");
  acc++;
  appendFileSync(out, JSON.stringify({ id, seed, layout: layoutOf(d), houseKinds: d.houseKinds, ref: d.ref, cost: costOf(d.ref) }) + "\n");
}
