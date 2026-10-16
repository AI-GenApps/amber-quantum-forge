import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

/**
 * Sizes the built game by kind, raw and gzip: app JS, the Rapier chunk (its wasm is inlined, so
 * there is no separate .wasm file), models, audio, fonts. Exits 1 when a budget is broken.
 * Usage (after `bun run build`): bun scripts/report-bundle.ts [outFile]
 */
const JS_BUDGET_BYTES = 1.5 * 1024 * 1024;
const PAYLOAD_BUDGET_BYTES = 20 * 1024 * 1024;

const dist = join(import.meta.dirname, "..", "dist");
if (!existsSync(join(dist, "index.html"))) {
  throw new Error(
    `report-bundle: ${dist} has no build; run "bun run build" in apps-games/city-drive`,
  );
}

interface Entry {
  file: string;
  bytes: number;
  gzip: number;
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const entries: Entry[] = walk(dist).map((path) => {
  const data = readFileSync(path);
  return { file: relative(dist, path), bytes: statSync(path).size, gzip: gzipSync(data).length };
});

const html = readFileSync(join(dist, "index.html"), "utf8");
const preloaded = new Set(
  [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].flatMap((m) => (m[1] ? [m[1]] : [])),
);

const isJs = (e: Entry) => e.file.startsWith("assets/") && e.file.endsWith(".js");
const isRapier = (e: Entry) => isJs(e) && /^assets\/rapier-/.test(e.file);
const group = {
  appJsInitial: entries.filter((e) => isJs(e) && !isRapier(e) && preloaded.has(e.file)),
  appJsLazy: entries.filter((e) => isJs(e) && !isRapier(e) && !preloaded.has(e.file)),
  rapier: entries.filter(isRapier),
  models: entries.filter((e) => e.file.startsWith("assets/models/")),
  audio: entries.filter((e) => e.file.startsWith("assets/audio/")),
  fonts: entries.filter((e) => e.file.startsWith("fonts/")),
};
const grouped = new Set(Object.values(group).flat());
const other = entries.filter((e) => !grouped.has(e));

const sum = (list: Entry[], key: "bytes" | "gzip") => list.reduce((total, e) => total + e[key], 0);
const size = (list: Entry[]) => ({
  files: list.length,
  bytes: sum(list, "bytes"),
  gzip: sum(list, "gzip"),
});
const largest = (list: Entry[], count = 6) =>
  [...list].sort((a, b) => b.bytes - a.bytes).slice(0, count);

const appJs = [...group.appJsInitial, ...group.appJsLazy];
const total = size(entries);
const report = {
  note: "Rapier's wasm is inlined in its JS chunk (compat build), so 'rapier' is the wasm. Models load per district on demand; the payload total counts every file of the build, the worst case.",
  budgets: { appJsMinifiedBytes: JS_BUDGET_BYTES, totalPayloadBytes: PAYLOAD_BUDGET_BYTES },
  appJsInitial: size(group.appJsInitial),
  appJsLazy: size(group.appJsLazy),
  appJs: size(appJs),
  rapier: size(group.rapier),
  models: size(group.models),
  audio: size(group.audio),
  fonts: size(group.fonts),
  other: size(other),
  total,
  largest: { appJsInitial: largest(group.appJsInitial), rapier: largest(group.rapier, 2) },
  checks: {
    appJsInitialWithinBudget: sum(group.appJsInitial, "bytes") <= JS_BUDGET_BYTES,
    totalPayloadWithinBudget: total.bytes <= PAYLOAD_BUDGET_BYTES,
  },
};

const text = `${JSON.stringify(report, null, 2)}\n`;
const out = process.argv[2];
if (out) writeFileSync(out, text);
process.stdout.write(text);
if (!report.checks.appJsInitialWithinBudget || !report.checks.totalPayloadWithinBudget) {
  console.error("report-bundle: a size budget is broken (see checks above)");
  process.exit(1);
}
