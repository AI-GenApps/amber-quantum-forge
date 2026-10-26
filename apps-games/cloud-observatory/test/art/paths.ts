import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const APP = join(import.meta.dirname, "..", "..");
export const REPO = join(APP, "..", "..");
export const PUBLIC = join(APP, "public");
export const ART_DIR = join(PUBLIC, "art");
export const EVIDENCE = join(REPO, ".agents/resources/2026-10-23/web-games/cloud-observatory/art");
export const MASTERS = join(EVIDENCE, "masters");
export const ASSETS_INDEX = join(REPO, ".agents/games/cloud-observatory/assets-index.md");

export interface AcceptedEntry {
  assetId: string;
  file: string;
  size: string;
  transparent: boolean;
  round: number;
  batch: string;
}

export interface BuildRow {
  id: string;
  transparent: boolean;
  sourceBytes: number;
  source: string;
  masterBytes: number;
  bundled: { file: string; size: string; bytes: number; background: string } | null;
}

export const acceptedEntries = (): AcceptedEntry[] =>
  JSON.parse(readFileSync(join(EVIDENCE, "accepted-manifest.json"), "utf8")) as AcceptedEntry[];

export const buildReport = (): BuildRow[] =>
  JSON.parse(readFileSync(join(EVIDENCE, "build-report.json"), "utf8")) as BuildRow[];

export function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

export function isWebp(path: string): boolean {
  const head = readFileSync(path).subarray(0, 12);
  return (
    head.subarray(0, 4).toString("latin1") === "RIFF" &&
    head.subarray(8, 12).toString("latin1") === "WEBP"
  );
}

export interface SlotRowDoc {
  slot: string;
  cells: string[];
}

/** Rows of the 33-slot table in assets-index.md. */
export function slotTableRows(): SlotRowDoc[] {
  const text = readFileSync(ASSETS_INDEX, "utf8");
  return Array.from(text.matchAll(/^\| B\d \| ([a-z0-9-]+) \|.*$/gm), (m) => ({
    slot: m[1] as string,
    cells: m[0].split("|").map((cell) => cell.trim()),
  }));
}

/** Rows of the art provenance table, keyed by the backticked slot id in the first cell. */
export function provenanceRows(): SlotRowDoc[] {
  const text = readFileSync(ASSETS_INDEX, "utf8");
  const section = text.split("### Art provenance")[1] ?? "";
  const body = section.split(/\n#{2,3} /)[0] ?? "";
  return Array.from(body.matchAll(/^\| `([a-z0-9-]+)` \|.*$/gm), (m) => ({
    slot: m[1] as string,
    cells: m[0].split("|").map((cell) => cell.trim()),
  }));
}
