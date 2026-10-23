import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadSpecs, type Spec } from "./spec";

const CORE = new URL("../../../../../../../apps-games/floodplain-dispatch-core/src/content", import.meta.url).pathname;
const REGIONS: [string, string, string, string][] = [
  ["v", "valley", "VALLEY_MAPS", "valley"],
  ["d", "delta", "DELTA_MAPS", "delta"],
  ["h", "highland", "HIGHLAND_MAPS", "highland"],
  ["e", "estuary", "ESTUARY_MAPS", "estuary"],
];
import { createPrng } from "../../../../../../../apps-games/floodplain-dispatch-core/src/prng";

import { decorate } from "./deco";

const picks: Record<string, number> = existsSync("picks.json") ? JSON.parse(readFileSync("picks.json", "utf8")) : {};

interface Rec { layout: string[]; houseKinds: string[]; ref: { x: number; y: number; kind: string; dir?: string; opensWeek?: number; closesWeek?: number }[] }

function refExpr(p: Rec["ref"][number]): string {
  switch (p.kind) {
    case "canal": return `c(${p.x}, ${p.y})`;
    case "barrier": return `b(${p.x}, ${p.y})`;
    case "pump": return `p(${p.x}, ${p.y}, "${p.dir}")`;
    case "gate": return `g(${p.x}, ${p.y}, ${p.opensWeek}, ${p.closesWeek})`;
    case "reservoir": return `r(${p.x}, ${p.y})`;
    default: throw new Error(p.kind);
  }
}
const evFn: Record<string, string> = { surge: "surge", drought: "drought", "storm-tide": "stormTide" };

function mapExpr(spec: Spec, region: string, rec: Rec): string {
  const lines: string[] = [];
  lines.push("  {");
  lines.push(`    id: ${JSON.stringify(spec.id)},`);
  lines.push(`    name: ${JSON.stringify(spec.name)},`);
  lines.push(`    region: ${JSON.stringify(region)},`);
  lines.push(`    brief: ${JSON.stringify(spec.brief)},`);
  lines.push("    layout: [");
  for (const row of rec.layout) lines.push(`      ${JSON.stringify(row)},`);
  lines.push("    ],");
  lines.push(`    inlets: [${Array.from({ length: spec.inlets }, () => spec.rate).join(", ")}],`);
  lines.push(`    houseKinds: [${rec.houseKinds.map((k) => JSON.stringify(k)).join(", ")}],`);
  lines.push(`    events: [${spec.events.map((e) => `${evFn[e.type]}(${e.delta}, ${e.week}, ${e.weeks})`).join(", ")}],`);
  lines.push(`    tide: ${spec.tide ? `{ period: ${spec.tide.period}, amp: ${spec.tide.amp} }` : "null"},`);
  lines.push(`    weeks: ${spec.weeks},`);
  lines.push(`    pieces: [${spec.pieces.map((k) => JSON.stringify(k)).join(", ")}],`);
  lines.push(`    par: ${spec.par},`);
  lines.push(`    budget: ${spec.budget},`);
  lines.push(`    reference: [${rec.ref.map(refExpr).join(", ")}],`);
  lines.push("  },");
  return lines.join("\n");
}

const specs = loadSpecs();
for (const [prefix, region, constName, file] of REGIONS) {
  const parts: string[] = [];
  let used = new Set<string>();
  for (const spec of specs.filter((s) => s.id.startsWith(prefix))) {
    const path = `${process.env.OUTDIR ?? "out"}/${spec.id}.jsonl`;
    if (!existsSync(path)) { console.log("missing", spec.id); continue; }
    const recs = readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec);
    const rec0 = recs[picks[spec.id] ?? 0] as Rec & { seed: number };
    const rec = process.env.NODECOR ? rec0 : { ...rec0, layout: decorate(rec0, rec0.seed) };
    parts.push(mapExpr(spec, region, rec));
    used.add("c");
    for (const p of rec.ref) used.add({ canal: "c", barrier: "b", pump: "p", gate: "g", reservoir: "r" }[p.kind] as string);
    for (const e of spec.events) used.add(evFn[e.type] as string);
  }
  used.delete("c"); 
  const names = [...new Set(parts.join("\n").match(/\b(c|b|p|g|r|surge|drought|stormTide)\(/g)?.map((s) => s.slice(0, -1)) ?? [])].sort();
  const imp = names.length ? `import { ${names.join(", ")} } from "./dsl";\n` : "";
  const src = `${imp}import type { CampaignMap } from "./types";\n\nexport const ${constName}: readonly CampaignMap[] = [\n${parts.join("\n")}\n];\n`;
  writeFileSync(`${CORE}/${file}.ts`, src);
  console.log("wrote", file, parts.length);
}
