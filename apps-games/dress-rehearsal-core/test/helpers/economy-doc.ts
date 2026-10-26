import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tableAfter } from "./plan";

const DOC_PATH = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".agents",
  "games",
  "dress-rehearsal",
  "economy.md",
);

export const ECONOMY_LINES: readonly string[] = readFileSync(DOC_PATH, "utf8").split("\n");

export function economyTable(firstHeader: string): string[][] {
  return tableAfter(ECONOMY_LINES, firstHeader);
}

export function numbersIn(text: string): number[] {
  return (text.match(/\d+/g) ?? []).map(Number);
}

export function rowStartingWith(rows: readonly string[][], prefix: string): string[] {
  const row = rows.find((cells) => (cells[0] ?? "").startsWith(prefix));
  if (row === undefined) throw new Error(`economy row not found: ${prefix}`);
  return row;
}
