import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "../../..");
export const APP_ROOT = join(import.meta.dirname, "..");
export const KB_DIR = join(ROOT, ".agents/games/the-last-window");
export const EVIDENCE_DIR = join(ROOT, ".agents/resources/2026-10-23/web-games/the-last-window");
export const TASKS_DIR = join(ROOT, "tasks/epics/22-web-the-last-window");

export const KB_FILES = [
  "README.md",
  "product.md",
  "economy.md",
  "content-plan.md",
  "store-listing.md",
  "assets-index.md",
  "decisions-log.md",
  "open-questions.md",
] as const;

export type KbFile = (typeof KB_FILES)[number];

export function readKb(name: KbFile): string {
  return readFileSync(join(KB_DIR, name), "utf8");
}

export function bytesOf(path: string): number {
  return statSync(path).size;
}

export function totalBytes(dir: string, extension: string): number {
  return readdirSync(dir)
    .filter((name) => name.endsWith(extension))
    .reduce((sum, name) => sum + bytesOf(join(dir, name)), 0);
}

export function group(value: number): string {
  return value.toLocaleString("en-US");
}

export function tableRows(doc: string, anchor: string): string[][] {
  const lines = doc.split("\n");
  const start = lines.findIndex((line) => line.startsWith(anchor));
  if (start < 0) throw new Error(`anchor not found: ${anchor}`);
  const rows: string[][] = [];
  const headerIsAnchor = (lines[start] ?? "").startsWith("|");
  let inTable = false;
  for (const line of lines.slice(headerIsAnchor ? start : start + 1)) {
    if (!line.startsWith("|")) {
      if (inTable) break;
      continue;
    }
    inTable = true;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replaceAll("`", ""));
    if (cells.every((cell) => /^-+$/.test(cell))) continue;
    rows.push(cells);
  }
  return rows.slice(1);
}
