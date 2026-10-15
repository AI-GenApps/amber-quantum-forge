import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

/**
 * Sizes the built JS. "Initial" = the entry script plus every chunk index.html preloads; "lazy" =
 * every other chunk (loaded on demand). Rapier is reported separately (its inlined wasm is ~4 MB).
 * Usage: bun scripts/bundle-report.ts [outFile]
 */
const dist = join(import.meta.dirname, "..", "dist");
const assetsDir = join(dist, "assets");
const html = readFileSync(join(dist, "index.html"), "utf8");
const initialNames = new Set(
  [...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/g)].flatMap((m) => (m[1] ? [m[1]] : [])),
);

interface Chunk {
  name: string;
  bytes: number;
  gzip: number;
  initial: boolean;
  rapier: boolean;
}

const stripHash = (file: string) => file.replace(/-[A-Za-z0-9_-]{8}\.js$/, ".js");
const chunks: Chunk[] = readdirSync(assetsDir)
  .filter((file) => file.endsWith(".js") && statSync(join(assetsDir, file)).isFile())
  .map((file) => {
    const data = readFileSync(join(assetsDir, file));
    return {
      name: stripHash(file),
      bytes: data.length,
      gzip: gzipSync(data).length,
      initial: initialNames.has(file),
      rapier: data.includes("rapier") && data.length > 1_000_000 && !initialNames.has(file),
    };
  })
  .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));

const sum = (list: Chunk[], key: "bytes" | "gzip") => list.reduce((s, c) => s + c[key], 0);
const initial = chunks.filter((c) => c.initial);
const lazy = chunks.filter((c) => !c.initial && !c.rapier);
const rapier = chunks.filter((c) => c.rapier);
const report = {
  budgetBytes: 1.5 * 1024 * 1024,
  appJsExcludingRapier: {
    bytes: sum([...initial, ...lazy], "bytes"),
    chunks: initial.length + lazy.length,
  },
  initial: { bytes: sum(initial, "bytes"), gzip: sum(initial, "gzip"), chunks: initial.length },
  lazy: { bytes: sum(lazy, "bytes"), gzip: sum(lazy, "gzip"), chunks: lazy.length },
  rapier: { bytes: sum(rapier, "bytes"), chunks: rapier.length },
  largestInitial: initial.slice(0, 8).map(({ name, bytes, gzip }) => ({ name, bytes, gzip })),
  largestLazy: lazy.slice(0, 8).map(({ name, bytes, gzip }) => ({ name, bytes, gzip })),
};
const out = process.argv[2];
const text = `${JSON.stringify(report, null, 2)}\n`;
if (out) writeFileSync(out, text);
process.stdout.write(text);
