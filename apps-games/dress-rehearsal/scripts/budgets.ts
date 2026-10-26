import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "vite";
import { type SlotId, slotDef } from "../src/art/slots";
import { BYTE_LIMITS } from "./art-checks";

export const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const BUNDLE_OUT_DIR = join(APP_ROOT, "node_modules/.cache/bundle-check");

export const BUDGET = {
  jsGzipBytes: 300 * 1000,
  artBytes: 8_000_000,
  fontBytes: 300 * 1024,
  audioBytes: 2 * 1024 * 1024,
  artFileBytes: 400_000,
} as const;

export interface FileSize {
  readonly path: string;
  readonly bytes: number;
}

export interface BundleReport {
  readonly files: readonly (FileSize & { readonly gzipBytes: number })[];
  readonly rawBytes: number;
  readonly gzipBytes: number;
}

export interface BudgetReport {
  readonly bundle: BundleReport;
  readonly art: readonly FileSize[];
  readonly fonts: readonly FileSize[];
  readonly audio: readonly FileSize[];
}

export function filesUnder(dir: string, accept: (name: string) => boolean): FileSize[] {
  const names = readdirSync(dir, { recursive: true }) as string[];
  return names
    .filter((name) => accept(name) && statSync(join(dir, name)).isFile())
    .sort()
    .map((name) => ({ path: name, bytes: statSync(join(dir, name)).size }));
}

export const sumBytes = (files: readonly { readonly bytes: number }[]): number =>
  files.reduce((total, file) => total + file.bytes, 0);

export async function measureBundle(): Promise<BundleReport> {
  await build({
    root: APP_ROOT,
    logLevel: "silent",
    publicDir: false,
    build: { outDir: BUNDLE_OUT_DIR, emptyOutDir: true, reportCompressedSize: false },
  });
  const files = filesUnder(BUNDLE_OUT_DIR, (name) => name.endsWith(".js")).map((file) => ({
    ...file,
    gzipBytes: gzipSync(readFileSync(join(BUNDLE_OUT_DIR, file.path))).byteLength,
  }));
  return {
    files,
    rawBytes: sumBytes(files),
    gzipBytes: files.reduce((total, file) => total + file.gzipBytes, 0),
  };
}

export function measureAssets(): Omit<BudgetReport, "bundle"> {
  const pub = join(APP_ROOT, "public");
  return {
    art: filesUnder(join(pub, "art"), (name) => name.endsWith(".webp")),
    fonts: filesUnder(join(pub, "fonts"), (name) => name.endsWith(".woff2")),
    audio: filesUnder(join(pub, "audio"), (name) => name.endsWith(".ogg")),
  };
}

export async function measureBudgets(): Promise<BudgetReport> {
  return { bundle: await measureBundle(), ...measureAssets() };
}

export function artFileLimit(file: FileSize): number {
  const kind = slotDef(file.path.replace(/\.webp$/, "") as SlotId).kind;
  if (kind === "item") return BYTE_LIMITS.item;
  if (kind === "client") return BYTE_LIMITS.client;
  return BUDGET.artFileBytes;
}

export interface Violation {
  readonly what: string;
  readonly actual: number;
  readonly limit: number;
}

export function violations(report: BudgetReport): Violation[] {
  const out: Violation[] = [];
  const check = (what: string, actual: number, limit: number): void => {
    if (actual > limit) out.push({ what, actual, limit });
  };
  check("js gzip", report.bundle.gzipBytes, BUDGET.jsGzipBytes);
  check("art total", sumBytes(report.art), BUDGET.artBytes);
  check("fonts total", sumBytes(report.fonts), BUDGET.fontBytes);
  check("audio total", sumBytes(report.audio), BUDGET.audioBytes);
  for (const file of report.art) check(`art ${file.path}`, file.bytes, artFileLimit(file));
  return out;
}

const kb = (bytes: number): string => (bytes / 1000).toFixed(1);

export function formatReport(report: BudgetReport): string {
  const row = (what: string, actual: number, limit: number, count: string): string =>
    `${what.padEnd(14)}${`${kb(actual)} KB`.padStart(12)}${`${actual} B`.padStart(12)}${`${kb(limit)} KB`.padStart(12)}${count.padStart(10)}  ${actual <= limit ? "ok" : "OVER"}`;
  const lines = [
    `${"budget".padEnd(14)}${"actual".padStart(12)}${"bytes".padStart(12)}${"limit".padStart(12)}${"files".padStart(10)}`,
    row("js gzip", report.bundle.gzipBytes, BUDGET.jsGzipBytes, String(report.bundle.files.length)),
    row("art", sumBytes(report.art), BUDGET.artBytes, String(report.art.length)),
    row("fonts", sumBytes(report.fonts), BUDGET.fontBytes, String(report.fonts.length)),
    row("audio", sumBytes(report.audio), BUDGET.audioBytes, String(report.audio.length)),
  ];
  const largest = [...report.art].sort((a, b) => b.bytes - a.bytes)[0];
  if (largest) lines.push(`largest art file: ${largest.path} ${kb(largest.bytes)} KB`);
  for (const file of report.bundle.files) {
    lines.push(`  ${file.path}: ${kb(file.bytes)} KB raw, ${kb(file.gzipBytes)} KB gzip`);
  }
  return lines.join("\n");
}
