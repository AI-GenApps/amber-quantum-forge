import { existsSync, readFileSync } from "node:fs";
import { MAPS, totalCost } from "../../../../../../../apps-games/floodplain-dispatch-core/src";

const finals = new Map<string, string>();
if (existsSync("final.txt")) {
  for (const line of readFileSync("final.txt", "utf8").trim().split("\n")) {
    const m = line.match(/^(\w+) par (\d+) searchMin (\d+) runs (\d+) iters (\d+)/);
    if (m) finals.set(m[1] as string, `${m[3]} (${m[4]} x ${m[5]})`);
  }
}
const seeds = new Map<string, number>();
for (const id of MAPS.map((m) => m.id)) {
  const path = `out/${id}.jsonl`;
  if (existsSync(path)) seeds.set(id, JSON.parse(readFileSync(path, "utf8").trim().split("\n")[0] as string).seed);
}
const rows = ["| ID | Name | Size | Weeks | Par = reference cost | Reference pieces | Houses | Fields | Search minimum (runs x iterations) | Design seed |", "|---|---|---|---|---|---|---|---|---|---|"];
for (const m of MAPS) {
  const counts: Record<string, number> = {};
  for (const p of m.reference) counts[p.kind] = (counts[p.kind] ?? 0) + 1;
  const letters: Record<string, string> = { canal: "C", barrier: "B", pump: "P", gate: "S", reservoir: "R" };
  const pieces = Object.entries(counts).map(([k, n]) => `${n}${letters[k]}`).join(" ");
  const width = m.layout[0]!.split(" ").length;
  const fields = m.layout.join(" ").split(" ").filter((t) => t.startsWith("F")).length;
  rows.push(`| ${m.id} | ${m.name} | ${width} x ${m.layout.length} | ${m.weeks} | ${m.par} (${totalCost(m.reference)}) | ${pieces} | ${m.houseKinds.length} | ${fields} | ${finals.get(m.id) ?? "not run"} | ${seeds.get(m.id) ?? "?"} |`);
}
console.log(rows.join("\n"));
