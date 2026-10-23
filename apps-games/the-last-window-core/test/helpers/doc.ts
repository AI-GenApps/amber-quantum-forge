import { readFileSync } from "node:fs";
import { join } from "node:path";

const KB_DIR = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".agents",
  "games",
  "the-last-window",
);

export function readDoc(name: string): string {
  return readFileSync(join(KB_DIR, name), "utf8");
}

export function tableAfter(doc: string, anchor: string): string[][] {
  const lines = doc.split("\n");
  const start = lines.findIndex((line) => line.startsWith(anchor));
  if (start < 0) throw new Error(`anchor not found: ${anchor}`);
  const rows: string[][] = [];
  let inTable = false;
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("|")) {
      inTable = true;
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells.every((cell) => /^-+$/.test(cell))) continue;
      rows.push(cells);
    } else if (inTable) break;
  }
  return rows.slice(1);
}

export function clean(cell: string): string {
  return cell.replace(/`/g, "");
}

export function list(cell: string): string[] {
  return clean(cell)
    .split(",")
    .map((part) => part.trim());
}
