import { readFileSync } from "node:fs";
import { join } from "node:path";

const PLAN_PATH = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".agents",
  "games",
  "lost-parcel-desk",
  "content-plan.md",
);

export const PLAN_LINES: string[] = readFileSync(PLAN_PATH, "utf8").split("\n");

export function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function tableAfter(lines: readonly string[], from: number): string[][] {
  let start = from;
  while (start < lines.length && !(lines[start] ?? "").startsWith("|")) start++;
  const rows: string[][] = [];
  for (let index = start + 2; index < lines.length; index++) {
    const line = lines[index] ?? "";
    if (!line.startsWith("|")) break;
    rows.push(cells(line));
  }
  return rows;
}

export function headingIndex(lines: readonly string[], heading: string): number {
  const index = lines.findIndex((line) => line === heading);
  if (index === -1) throw new Error(`heading not found: ${heading}`);
  return index;
}

export function tableUnder(heading: string): string[][] {
  return tableAfter(PLAN_LINES, headingIndex(PLAN_LINES, heading));
}

export function bulletValue(prefix: string): string {
  const line = PLAN_LINES.find((item) => item.startsWith(prefix));
  if (line === undefined) throw new Error(`line not found: ${prefix}`);
  return line.slice(prefix.length).trim();
}

export interface CaseSection {
  id: string;
  title: string;
  lines: string[];
  objects: string[][];
  clues: string[][];
  deductions: string[][];
}

export function caseSections(): CaseSection[] {
  const starts = PLAN_LINES.flatMap((line, index) => {
    const match = /^### Case (\d\d) - (.*)$/.exec(line);
    return match ? [{ index, id: match[1] ?? "", title: match[2] ?? "" }] : [];
  });
  return starts.map((start, position) => {
    const end = starts[position + 1]?.index ?? PLAN_LINES.findIndex((l) => l.startsWith("## Ledger"));
    const lines = PLAN_LINES.slice(start.index, end);
    const tables: string[][][] = [];
    for (let index = 0; index < lines.length; index++) {
      if ((lines[index] ?? "").startsWith("|") && !(lines[index - 1] ?? "").startsWith("|")) {
        tables.push(tableAfter(lines, index));
      }
    }
    return {
      id: start.id,
      title: start.title,
      lines,
      objects: tables[0] ?? [],
      clues: tables[1] ?? [],
      deductions: tables[2] ?? [],
    };
  });
}

export function lineValue(section: CaseSection, prefix: string): string {
  const line = section.lines.find((item) => item.startsWith(prefix));
  if (line === undefined) throw new Error(`case ${section.id}: missing ${prefix}`);
  return line.slice(prefix.length).trim();
}
