// Usage: bun apps-games/cloud-observatory/scripts/build-art.mjs <inbox-accepted-dir>
// Reads <dir>/manifest.json, checks every accepted image against scripts/art-slots.json, and only
// then writes masters (WebP q90), bundled files (WebP at 2x, q82) and src/ui/art-entries.ts.
// It never generates, retouches or upscales an image; it only resizes and encodes.
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import {
  checkSource,
  loadSlotTable,
  readSourceInfo,
  renderEntriesModule,
  sha256,
  targetSize,
  toHex,
} from "./art-lib.ts";

const appDir = resolve(import.meta.dirname, "..");
const repoRoot = resolve(appDir, "..", "..");
const evidenceDir = join(repoRoot, ".agents/resources/2026-10-23/web-games/cloud-observatory/art");
const mastersDir = join(evidenceDir, "masters");
const publicArt = join(appDir, "public/art");
const entriesFile = join(appDir, "src/ui/art-entries.ts");

const inboxDir = process.argv[2] ? resolve(process.argv[2]) : "";
if (!inboxDir || !existsSync(join(inboxDir, "manifest.json"))) {
  console.error("usage: bun scripts/build-art.mjs <inbox-accepted-dir> (needs manifest.json)");
  process.exit(2);
}

const table = loadSlotTable(join(import.meta.dirname, "art-slots.json"));
const slotById = new Map(table.slots.map((slot) => [slot.id, slot]));
const accepted = JSON.parse(readFileSync(join(inboxDir, "manifest.json"), "utf8"));

const problems = [];
const plans = [];
const seen = new Set();
for (const entry of accepted) {
  const slot = slotById.get(entry.assetId);
  if (!slot) {
    problems.push(`${entry.assetId}: not one of the ${table.slots.length} art slots`);
    continue;
  }
  if (seen.has(entry.assetId)) {
    problems.push(`${entry.assetId}: listed twice in the inbox manifest`);
    continue;
  }
  seen.add(entry.assetId);
  const file = join(inboxDir, entry.file);
  if (!existsSync(file)) {
    problems.push(`${entry.assetId}: ${entry.file} is missing from the accepted folder`);
    continue;
  }
  const bytes = readFileSync(file);
  const info = await readSourceInfo(sharp(bytes));
  const failures = checkSource(slot, info, table.scale);
  if (entry.transparent !== slot.transparent) {
    failures.push(
      `${slot.id}: manifest says transparent=${entry.transparent}, slot table says ${slot.transparent}`,
    );
  }
  problems.push(...failures);
  plans.push({ slot, entry, bytes, info });
}
for (const name of readdirSync(inboxDir)) {
  if (name !== "manifest.json" && !accepted.some((entry) => entry.file === name)) {
    problems.push(
      `${name}: in the accepted folder but not in its manifest.json, refusing to use it`,
    );
  }
}
if (problems.length > 0) {
  console.error(`Refusing to write anything:\n${problems.map((p) => `- ${p}`).join("\n")}`);
  process.exit(1);
}

rmSync(mastersDir, { recursive: true, force: true });
rmSync(publicArt, { recursive: true, force: true });
mkdirSync(mastersDir, { recursive: true });
mkdirSync(publicArt, { recursive: true });

const entries = [];
const report = [];
for (const { slot, bytes, info } of plans.sort((a, b) => a.slot.id.localeCompare(b.slot.id))) {
  const masterPath = join(mastersDir, `${slot.id}.webp`);
  await sharp(bytes)
    .webp({ quality: table.masterQuality, alphaQuality: 100, effort: 6 })
    .toFile(masterPath);
  const row = {
    id: slot.id,
    batch: slot.batch,
    transparent: slot.transparent,
    sourceSha256: sha256(bytes),
    sourceBytes: bytes.length,
    source: `${info.width}x${info.height}`,
    masterBytes: statSync(masterPath).size,
    bundled: null,
  };
  const target = slot.bundled ? targetSize(slot, table.scale) : null;
  if (target) {
    const appPath = join(publicArt, `${slot.id}.webp`);
    await sharp(bytes)
      .resize(target[0], target[1], { kernel: "lanczos3", fit: "fill", withoutEnlargement: true })
      .webp({ quality: table.bundledQuality, alphaQuality: table.bundledAlphaQuality, effort: 6 })
      .toFile(appPath);
    let background = "transparent";
    if (!slot.transparent) {
      const stats = await sharp(appPath).stats();
      const [r, g, b] = stats.channels.map((channel) => channel.mean);
      background = toHex(r, g, b);
    }
    entries.push({
      id: slot.id,
      src: `/art/${slot.id}.webp`,
      width: target[0],
      height: target[1],
      background,
    });
    row.bundled = {
      file: `public/art/${slot.id}.webp`,
      size: `${target[0]}x${target[1]}`,
      bytes: statSync(appPath).size,
      background,
    };
  }
  report.push(row);
}

writeFileSync(entriesFile, renderEntriesModule(entries));
cpSync(join(inboxDir, "manifest.json"), join(evidenceDir, "accepted-manifest.json"));
writeFileSync(join(evidenceDir, "build-report.json"), `${JSON.stringify(report, null, 2)}\n`);

let total = 0;
console.log(
  "slot".padEnd(24),
  "source".padEnd(10),
  "master".padStart(9),
  "bundled".padStart(9),
  "size".padStart(9),
  "background",
);
for (const row of report) {
  total += row.bundled?.bytes ?? 0;
  console.log(
    row.id.padEnd(24),
    row.source.padEnd(10),
    String(row.masterBytes).padStart(9),
    String(row.bundled?.bytes ?? "-").padStart(9),
    String(row.bundled?.size ?? "-").padStart(9),
    row.bundled?.background ?? "",
  );
}
console.log(`\n${report.length} slots, ${entries.length} bundled, ${total} bundled bytes`);
