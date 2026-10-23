import { appendFileSync, readFileSync } from "node:fs";
import { decorate } from "./deco";
import { costOf, evalDesign, polish, sa, type Design } from "./design";
import type { Placement } from "./lib";
import { loadSpecs } from "./spec";
import { cheaper } from "./verify";

const id = process.argv[2] as string;
const batches = Number(process.argv[3] ?? 3);
const rec = JSON.parse(readFileSync(`merged_out/${id}.jsonl`, "utf8").trim().split("\n")[0] as string);
const spec = loadSpecs().find((s) => s.id === id)!;
const layout0: string[] = rec.layout;
const rows: string[][] = layout0.map((r) => r.split(" "));
const h = rows.length;
const w = rows[0]!.length;
const kindOf: Record<string, Design["kind"][number]> = {
  ".": "land",
  H: "house",
  F: "field",
  T: "scenery",
  I: "inlet",
  S: "sea",
};
const d: Design = {
  spec,
  w,
  h,
  kind: [],
  hgt: [],
  fixed: [],
  ref: rec.ref,
  houseKinds: rec.houseKinds,
  forbidden: [],
};
for (const r of rows) {
  for (const t of r) {
    d.kind.push(kindOf[t.charAt(0)]!);
    d.hgt.push(Number(t.charAt(1)));
    d.fixed.push(t.charAt(0) === "S" || t.charAt(0) === "I");
  }
}
const refCells = new Set((rec.ref as Placement[]).map((q) => q.y * w + q.x));
const tol = spec.par >= 20 ? 2 : 1;
let clean = 0;
let round = 0;
let blocked = 0;
let terrain = 0;
let fail = "";
while (clean < batches && round < 200) {
  const alt = cheaper(d, 8, 60000, Number(process.env.SEEDBASE ?? 9000) + 101 * round, true, tol + 1);
  round++;
  if (alt.length === 0) {
    clean++;
    continue;
  }
  clean = 0;
  const cand = (alt[0] as Placement[])
    .map((q) => q.y * w + q.x)
    .filter((i) => !refCells.has(i) && d.kind[i] === "land");
  if (cand.length === 0) {
    terrain++;
    if (terrain > 12) { fail = "terrain rounds"; break; }
    d.forbidden.push(alt[0] as Placement[]);
    const prior = d.hgt.slice();
    const e2 = sa(d, 6000, 77 + terrain * 13 + round, 0.5);
    if (!e2.ok) { fail = `terrain sa ${e2.pen.toFixed(2)} ${e2.notes.join(";")}`; break; }
    polish(d, 6000, 5 + terrain, prior);
    if (!evalDesign(d).ok) { fail = "polish broke"; break; }
    clean = 0;
    continue;
  }
  d.kind[cand[round % cand.length] as number] = "scenery";
  blocked++;
}
if (clean < batches) {
  console.log(id, "REFINE FAILED", fail || "rounds", "blocked", blocked);
  process.exit(0);
}
const ch: Record<string, string> = {
  land: ".",
  house: "H",
  field: "F",
  scenery: "T",
  inlet: "I",
  sea: "S",
};
const layout: string[] = [];
for (let y = 0; y < h; y++) {
  layout.push(
    Array.from({ length: w }, (_, x) => `${ch[d.kind[y * w + x]!]}${d.hgt[y * w + x]}`).join(" "),
  );
}
appendFileSync(
  `final_out2/${id}.jsonl`,
  `${JSON.stringify({ id, seed: rec.seed, layout, houseKinds: d.houseKinds, ref: d.ref, cost: costOf(d.ref) })}\n`,
);
console.log(id, "REFINED blocked", blocked, "rounds", round, "tol", tol);
