import { readFileSync } from "node:fs";
import type { PieceKind, SeasonEvent, TideSpec } from "./lib";

export interface Spec {
  id: string;
  name: string;
  w: number;
  h: number;
  weeks: number;
  rate: number;
  houseKinds: string[];
  fields: number;
  inlets: number;
  pieces: PieceKind[];
  par: number;
  budget: number;
  tide: TideSpec | null;
  events: SeasonEvent[];
  brief: string;
}

const PIECE_CODES: Record<string, PieceKind> = { C: "canal", B: "barrier", P: "pump", S: "gate", R: "reservoir" };
import { join as joinPath } from "node:path";
const PLAN = joinPath(import.meta.dirname, "..", "..", "..", "..", "..", "..", "games", "floodplain-dispatch", "content-plan.md");

function parseHouses(text: string): string[] {
  const out: string[] = [];
  for (const part of text.replace(/\(\d+\)\s*$/, "").split(",")) {
    const m = part.trim().match(/^(\d+)\s+(\w+)$/) ?? part.trim().match(/^(\w+)$/);
    if (!m) throw new Error(`bad houses ${text}`);
    if (m.length === 3) for (let i = 0; i < Number(m[1]); i++) out.push(m[2] as string);
    else out.push(m[1] as string);
  }
  return out;
}
function parseEvents(text: string): SeasonEvent[] {
  if (text.trim() === "none") return [];
  return text.split(";").map((s) => {
    const m = s.trim().match(/^(surge|drought|storm tide) ([+-])(\d+) wk(\d+) x(\d+)$/);
    if (!m) throw new Error(`bad event ${s}`);
    return { type: (m[1] === "storm tide" ? "storm-tide" : m[1]) as SeasonEvent["type"], delta: Number(m[3]), week: Number(m[4]), weeks: Number(m[5]) };
  });
}
export function loadSpecs(): Spec[] {
  const specs: Spec[] = [];
  for (const line of readFileSync(PLAN, "utf8").split("\n")) {
    if (!/^\| [vdhe]\d\d \|/.test(line)) continue;
    const c = line.split("|").slice(1, -1).map((s) => s.trim());
    const [id, name, size, weeks, rate, houses, fields, inlets, pieces, par, budget, tide, events, brief] = c as string[];
    const sz = (size as string).match(/^(\d+) x (\d+)$/) as RegExpMatchArray;
    const tm = (tide as string).match(/^period (\d+), amp (\d+)$/);
    specs.push({
      id: id as string, name: name as string, w: Number(sz[1]), h: Number(sz[2]), weeks: Number(weeks), rate: Number(rate),
      houseKinds: parseHouses(houses as string), fields: Number(fields), inlets: Number(inlets),
      pieces: [...(pieces as string)].map((ch) => PIECE_CODES[ch] as PieceKind), par: Number(par), budget: Number(budget),
      tide: tm ? { period: Number(tm[1]), amp: Number(tm[2]) } : null, events: parseEvents(events as string), brief: brief as string,
    });
  }
  return specs;
}
if (import.meta.main) {
  const s = loadSpecs();
  console.log(s.length, s.reduce((a, b) => a + b.houseKinds.length, 0), s.reduce((a, b) => a + b.fields, 0));
  console.log(JSON.stringify(s.find((x) => x.id === "e03")));
}
