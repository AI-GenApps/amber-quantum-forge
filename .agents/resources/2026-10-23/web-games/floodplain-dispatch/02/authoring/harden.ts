import { appendFileSync, readFileSync } from "node:fs";
import { costOf, seal, type Design } from "./design";
import { loadSpecs } from "./spec";
import { cheaper, minFound } from "./verify";
import type { Placement } from "./lib";

const id = process.argv[2] as string;
const rec = JSON.parse(readFileSync(`out_old/${id}.jsonl`, "utf8").trim().split("\n")[0] as string);
const spec = loadSpecs().find((s) => s.id === id)!;
const rows: string[][] = rec.layout.map((r: string) => r.split(" "));
const h = rows.length, w = rows[0]!.length;
const kindOf: Record<string, Design["kind"][number]> = { ".": "land", H: "house", F: "field", T: "scenery", I: "inlet", S: "sea" };
const d: Design = { spec, w, h, kind: [], hgt: [], fixed: [], ref: rec.ref, houseKinds: rec.houseKinds, forbidden: [] };
for (const r of rows) for (const t of r) { d.kind.push(kindOf[t.charAt(0)]!); d.hgt.push(Number(t.charAt(1))); d.fixed.push(false); }
const sealed = seal(d, 2);
const refCells = new Set((rec.ref as Placement[]).map((q) => q.y * w + q.x));
const maxBlock = Math.floor(0.6 * d.kind.filter((k) => k === "land").length);
let blocked = 0, ok = false;
for (let round = 0; round < 150; round++) {
  let alt = cheaper(d, 3, 40000, 300 + 17 * round, true);
  if (alt.length === 0) alt = cheaper(d, 8, 60000, 9000 + 31 * round, true);
  if (alt.length === 0) { ok = true; break; }
  const cand = (alt[0] as Placement[]).map((q) => q.y * w + q.x).filter((i) => !refCells.has(i) && d.kind[i] === "land");
  if (cand.length === 0 || blocked >= maxBlock) break;
  d.kind[cand[(round * 7) % cand.length] as number] = "scenery";
  blocked++;
}
if (!ok) { console.log(id, "harden failed", "sealed", sealed, "blocked", blocked); process.exit(0); }
const strong = minFound(d, 8, 60000, 9000);
if (strong < spec.par - 1) { console.log(id, "strong cheaper", strong); process.exit(0); }
const ch: Record<string, string> = { land: ".", house: "H", field: "F", scenery: "T", inlet: "I", sea: "S" };
const layout: string[] = [];
for (let y = 0; y < h; y++) layout.push(Array.from({ length: w }, (_, x) => `${ch[d.kind[y * w + x]!]}${d.hgt[y * w + x]}`).join(" "));
appendFileSync(`out/${id}.jsonl`, JSON.stringify({ id, seed: rec.seed, layout, houseKinds: d.houseKinds, ref: d.ref, cost: costOf(d.ref) }) + "\n");
console.log(id, "HARDENED sealed", sealed, "blocked", blocked, "strong", strong);
