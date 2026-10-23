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
  "dress-rehearsal",
  "content-plan.md",
);

export const PLAN_LINES: readonly string[] = readFileSync(PLAN_PATH, "utf8").split("\n");

export function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function unquote(value: string): string {
  return value.replace(/^`|`$/g, "");
}

export function sectionLines(heading: string): string[] {
  const start = PLAN_LINES.findIndex((line) => line.trim() === heading);
  if (start === -1) throw new Error(`plan heading not found: ${heading}`);
  const out: string[] = [];
  for (let at = start + 1; at < PLAN_LINES.length; at += 1) {
    const line = PLAN_LINES[at] ?? "";
    if (/^#{1,3} /.test(line)) break;
    out.push(line);
  }
  return out;
}

export function tableAfter(lines: readonly string[], firstHeader: string): string[][] {
  const start = lines.findIndex((line) => line.startsWith(`| ${firstHeader} |`));
  if (start === -1) throw new Error(`plan table not found: ${firstHeader}`);
  const rows: string[][] = [];
  for (let at = start + 2; at < lines.length; at += 1) {
    const line = lines[at] ?? "";
    if (!line.startsWith("|")) break;
    rows.push(cells(line));
  }
  return rows;
}

export function table(heading: string, firstHeader: string): string[][] {
  return tableAfter(sectionLines(heading), firstHeader);
}

export function toNumber(value: string): number {
  return Number(value.replace(/,/g, "").replace(/%$/, ""));
}
