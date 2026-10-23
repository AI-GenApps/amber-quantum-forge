import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..", "..", "..");
const KB = join(ROOT, ".agents", "games", "cloud-observatory");

export function readDoc(name: string): string {
  return readFileSync(join(KB, name), "utf8");
}

export function sectionOf(markdown: string, heading: string): string {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.startsWith(heading));
  if (start < 0) throw new Error(`heading not found: ${heading}`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^#{1,3} /.test(line));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

export function tableRows(markdown: string): string[][] {
  return markdown
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .map((line) =>
      line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim()),
    )
    .filter((cells) => !cells.every((cell) => /^:?-+:?$/.test(cell)))
    .slice(1);
}

export function parseNumber(text: string): number {
  return Number(text.replace(/,/g, "").replace(/\s/g, ""));
}
