/**
 * Converts the accepted designer art into masters (WebP q90, original size) and shipped files
 * (WebP q82, 2x display size). Deterministic and idempotent.
 *
 *   bun scripts/convert-art.ts [--inbox <dir>]
 *
 * The inbox defaults to the accepted folder of the designer inbox; only files listed in its
 * manifest.json are read. Never touches any other image.
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { centreEdgeDensity, specOf } from "./art-spec";

const DEFAULT_INBOX = "/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/lantern-loops/accepted";
const APP = resolve(import.meta.dirname, "..");
const EVIDENCE = resolve(APP, "../../.agents/resources/2026-10-23/web-games/lantern-loops/art");
const SHIPPED_DIR = join(APP, "src/art/files");
const MASTER_DIR = join(EVIDENCE, "masters");
const MASTER_QUALITY = 90;
const SHIPPED_QUALITY = 82;

interface ManifestEntry {
  assetId: string;
  file: string;
  round: number;
  batch: string;
}

interface FileInfo {
  path: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
}

const sha256 = (data: Uint8Array): string => createHash("sha256").update(data).digest("hex");

async function describeFile(path: string, relativeTo: string): Promise<FileInfo> {
  const data = readFileSync(path);
  const meta = await sharp(data).metadata();
  return {
    path: path.slice(relativeTo.length + 1),
    bytes: data.length,
    sha256: sha256(data),
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
}

async function cornerAlpha(data: Buffer): Promise<number[]> {
  const raw = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = raw.info;
  const alphaAt = (x: number, y: number): number => raw.data[(y * width + x) * 4 + 3] ?? 255;
  return [
    alphaAt(0, 0),
    alphaAt(width - 1, 0),
    alphaAt(0, height - 1),
    alphaAt(width - 1, height - 1),
  ];
}

async function centreDensity(data: Buffer): Promise<number> {
  const raw = await sharp(data).greyscale().raw().toBuffer({ resolveWithObject: true });
  return centreEdgeDensity(raw.data, raw.info.width, raw.info.height);
}

async function convert(entry: ManifestEntry, inbox: string) {
  const spec = specOf(entry.assetId);
  if (spec === undefined) throw new Error(`Unknown slot id in manifest: ${entry.assetId}`);
  if (entry.file !== `${entry.assetId}.png`) throw new Error(`Unexpected file ${entry.file}`);
  const sourcePath = join(inbox, entry.file);
  const source = readFileSync(sourcePath);
  const sourceMeta = await sharp(source).metadata();
  if (sourceMeta.width !== spec.masterWidth || sourceMeta.height !== spec.masterHeight) {
    throw new Error(
      `${entry.assetId}: ${sourceMeta.width}x${sourceMeta.height}, expected ${spec.masterWidth}x${spec.masterHeight}`,
    );
  }
  const base = spec.transparent ? sharp(source).ensureAlpha() : sharp(source).removeAlpha();
  const master = await base
    .clone()
    .webp({ quality: MASTER_QUALITY, effort: 6, smartSubsample: true })
    .toBuffer();
  const masterPath = join(MASTER_DIR, `${entry.assetId}.webp`);
  writeFileSync(masterPath, master);

  let shippedPath: string | null = null;
  let shipped: Buffer = master;
  if (spec.shipped !== null) {
    shipped = await base
      .clone()
      .resize(spec.shipped.width, spec.shipped.height, { kernel: "lanczos3" })
      .webp({ quality: SHIPPED_QUALITY, effort: 6, smartSubsample: true })
      .toBuffer();
    shippedPath = join(SHIPPED_DIR, `${entry.assetId}.webp`);
    writeFileSync(shippedPath, shipped);
  } else {
    rmSync(join(SHIPPED_DIR, `${entry.assetId}.webp`), { force: true });
  }

  return {
    slot: entry.assetId,
    batch: entry.batch,
    round: entry.round,
    transparent: spec.transparent,
    source: { ...(await describeFile(sourcePath, inbox)), path: entry.file },
    master: await describeFile(masterPath, EVIDENCE),
    shipped: shippedPath === null ? null : await describeFile(shippedPath, APP),
    cornerAlpha: await cornerAlpha(shipped),
    ...(spec.id.startsWith("backdrop-") ? { centreEdgeDensity: await centreDensity(master) } : {}),
  };
}

async function main(): Promise<void> {
  const flag = process.argv.indexOf("--inbox");
  const inbox = resolve(flag >= 0 ? (process.argv[flag + 1] ?? DEFAULT_INBOX) : DEFAULT_INBOX);
  const manifestPath = join(inbox, "manifest.json");
  if (!existsSync(manifestPath)) throw new Error(`No manifest at ${manifestPath}`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ManifestEntry[];
  mkdirSync(MASTER_DIR, { recursive: true });
  mkdirSync(SHIPPED_DIR, { recursive: true });
  copyFileSync(manifestPath, join(EVIDENCE, "accepted-manifest.json"));

  const rows = [];
  for (const entry of manifest) rows.push(await convert(entry, inbox));
  rows.sort((a, b) => a.slot.localeCompare(b.slot));
  const report = { masterQuality: MASTER_QUALITY, shippedQuality: SHIPPED_QUALITY, slots: rows };
  writeFileSync(join(EVIDENCE, "report.json"), `${JSON.stringify(report, null, 2)}\n`);

  console.table(
    rows.map((row) => ({
      slot: row.slot,
      source: `${row.source.width}x${row.source.height} ${row.source.bytes}`,
      "shipped bytes": row.shipped?.bytes ?? "not bundled",
      "source sha256": row.source.sha256.slice(0, 12),
      "master sha256": row.master.sha256.slice(0, 12),
    })),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
