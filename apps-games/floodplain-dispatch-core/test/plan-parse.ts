import { readFileSync } from "node:fs";
import { join } from "node:path";

const PLAN_PATH = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  ".agents",
  "games",
  "floodplain-dispatch",
  "content-plan.md",
);

export interface PlanMapRow {
  id: string;
  name: string;
  width: number;
  height: number;
  weeks: number;
  rate: number;
  houses: Record<string, number>;
  housesTotal: number;
  fields: number;
  inlets: number;
  pieces: string;
  par: number;
  budget: number;
  tide: { period: number; amp: number } | null;
  events: { type: string; delta: number; week: number; weeks: number }[];
  brief: string;
}

export interface PlanCard {
  index: number;
  title: string;
  shownOn: string;
  text: string;
}

export const PLAN_TEXT = readFileSync(PLAN_PATH, "utf8");

function cells(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function parseHouses(text: string): { counts: Record<string, number>; total: number } {
  const totalMatch = text.match(/\((\d+)\)\s*$/);
  const counts: Record<string, number> = {};
  for (const part of text.replace(/\(\d+\)\s*$/, "").split(",")) {
    const match = part.trim().match(/^(?:(\d+) )?(\w+)$/);
    if (!match) throw new Error(`Unparseable houses cell: ${text}`);
    counts[match[2] as string] = Number(match[1] ?? 1);
  }
  return { counts, total: Number(totalMatch?.[1]) };
}

function parseEvents(text: string): PlanMapRow["events"] {
  if (text === "none") return [];
  return text.split(";").map((part) => {
    const match = part.trim().match(/^(surge|drought|storm tide) [+-](\d+) wk(\d+) x(\d+)$/);
    if (!match) throw new Error(`Unparseable event: ${part}`);
    return {
      type: match[1] === "storm tide" ? "storm-tide" : (match[1] as string),
      delta: Number(match[2]),
      week: Number(match[3]),
      weeks: Number(match[4]),
    };
  });
}

export function parseMapRows(text: string = PLAN_TEXT): PlanMapRow[] {
  const rows: PlanMapRow[] = [];
  for (const line of text.split("\n")) {
    if (!/^\| [vdhe]\d\d \|/.test(line)) continue;
    const col = cells(line);
    const [id = "", name = "", size = "", weeks = "", rate = ""] = col;
    const [houses = "", fields = "", inlets = "", pieces = "", par = ""] = col.slice(5);
    const [budget = "", tide = "", events = "", brief = ""] = col.slice(10);
    const sizeMatch = size.match(/^(\d+) x (\d+)$/) as RegExpMatchArray;
    const tideMatch = tide.match(/^period (\d+), amp (\d+)$/);
    const parsedHouses = parseHouses(houses);
    rows.push({
      id,
      name,
      width: Number(sizeMatch[1]),
      height: Number(sizeMatch[2]),
      weeks: Number(weeks),
      rate: Number(rate),
      houses: parsedHouses.counts,
      housesTotal: parsedHouses.total,
      fields: Number(fields),
      inlets: Number(inlets),
      pieces,
      par: Number(par),
      budget: Number(budget),
      tide: tideMatch ? { period: Number(tideMatch[1]), amp: Number(tideMatch[2]) } : null,
      events: parseEvents(events),
      brief,
    });
  }
  return rows;
}

export function parseUnlocks(text: string = PLAN_TEXT): Record<string, number> {
  const out: Record<string, number> = {};
  for (const line of text.split("\n")) {
    const match = line.match(
      /^\| (Valley|Delta|Highland|Estuary) \| [^|]+ \| [^|]+ \| (open|\d+) stars? \|/,
    );
    const open = line.match(/^\| (Valley) \| [^|]+ \| [^|]+ \| open \|/);
    if (open) out.Valley = 0;
    else if (match) out[match[1] as string] = Number(match[2]);
  }
  return out;
}

export function parseThemes(text: string = PLAN_TEXT): { name: string; stars: number }[] {
  const out: { name: string; stars: number }[] = [];
  for (const line of text.split("\n")) {
    const match = line.match(/^\| \d \| ([^|]+) \| (\d+) \|/);
    if (match) out.push({ name: (match[1] as string).trim(), stars: Number(match[2]) });
  }
  return out;
}

export function parseCards(text: string = PLAN_TEXT): PlanCard[] {
  const out: PlanCard[] = [];
  for (const line of text.split("\n")) {
    const match = line.match(/^\| (\d) \| ([^|]+) \| ([vdhe]\d\d)[^|]*\| ([^|]+) \|$/);
    if (match) {
      out.push({
        index: Number(match[1]),
        title: (match[2] as string).trim(),
        shownOn: match[3] as string,
        text: (match[4] as string).trim(),
      });
    }
  }
  return out;
}

export function parseChapters(
  text: string = PLAN_TEXT,
): { title: string; intro: string; outro: string }[] {
  const out: { title: string; intro: string; outro: string }[] = [];
  const sections = text.split(/^## /m).slice(1);
  for (const section of sections) {
    const title = section.match(/- (Chapter \d - [^\n]+)/);
    const intro = section.match(/^Intro text: (.+)$/m);
    const outro = section.match(/^Outro text: (.+)$/m);
    if (title && intro && outro) {
      out.push({
        title: title[1] as string,
        intro: intro[1] as string,
        outro: outro[1] as string,
      });
    }
  }
  return out;
}
