import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cells, headingIndex, tableAfter } from "./plan";

const GAME_DIR = join(import.meta.dirname, "..", "..", "..", "..", ".agents", "games", "lost-parcel-desk");

export function docLines(name: string): string[] {
  return readFileSync(join(GAME_DIR, name), "utf8").split("\n");
}

export function docTable(name: string, heading: string): string[][] {
  const lines = docLines(name);
  return tableAfter(lines, headingIndex(lines, heading));
}

export function numbers(text: string): number[] {
  return [...text.matchAll(/\d+/g)].map((match) => Number(match[0]));
}

export function row(rows: string[][], label: string): string[] {
  const found = rows.find((candidate) => candidate[0]?.startsWith(label));
  if (found === undefined) throw new Error(`no row starting with ${label}`);
  return found;
}

export function tableWithHeader(name: string, header: string[]): string[][] {
  const lines = docLines(name);
  const at = lines.findIndex(
    (line) => line.startsWith("|") && header.every((title, index) => cells(line)[index] === title),
  );
  if (at === -1) throw new Error(`no table headed ${header.join(" | ")}`);
  return tableAfter(lines, at);
}
