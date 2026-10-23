import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { build } from "vite";

export const BUDGETS = {
  jsGzipBytes: 300 * 1024,
  artBytes: 8 * 1024 * 1024,
  audioBytes: 1.5 * 1024 * 1024,
  fontBytes: 120 * 1024,
} as const;

export const APP_DIR = join(import.meta.dirname, "..", "..");
export const REPO_ROOT = join(APP_DIR, "..", "..");
export const KB_DIR = join(REPO_ROOT, ".agents", "games", "lantern-loops");
export const EVIDENCE_DIR = join(
  REPO_ROOT,
  ".agents",
  "resources",
  "2026-10-23",
  "web-games",
  "lantern-loops",
);

/** Every file below `dir` (recursive, sorted), as absolute paths. Missing dir gives []. */
export function walk(dir: string): string[] {
  let entries: import("node:fs").Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === "node_modules" ? [] : walk(path);
      return [path];
    })
    .sort();
}

export const sizeOf = (path: string): number => statSync(path).size;
export const rel = (path: string): string => relative(REPO_ROOT, path);

export interface BuiltChunk {
  fileName: string;
  code: string;
}

/** The bundle built in memory (`write: false`, silent): JS chunks only. */
export async function buildChunks(
  mode: "production" | "development" = "production",
): Promise<BuiltChunk[]> {
  // Vitest sets NODE_ENV=test, which makes Vite treat the build as development (DEV = true).
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = mode;
  let result: Awaited<ReturnType<typeof build>>;
  try {
    result = await build({
      root: APP_DIR,
      configFile: join(APP_DIR, "vite.config.ts"),
      logLevel: "silent",
      mode,
      build: { write: false, reportCompressedSize: false },
    });
  } finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else process.env.NODE_ENV = previous;
  }
  const outputs = Array.isArray(result) ? result : [result];
  const chunks: BuiltChunk[] = [];
  for (const output of outputs) {
    if (!("output" in output)) continue;
    for (const item of output.output) {
      if (item.type === "chunk") chunks.push({ fileName: item.fileName, code: item.code });
    }
  }
  return chunks;
}
