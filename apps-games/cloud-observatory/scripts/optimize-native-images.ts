/**
 * Shrinks the Android and iOS splash and icon PNGs that `capacitor-assets` writes from the painted
 * key art. The tool saves them as untuned 8-bit truecolour, so a 2732 px splash is 1.8 MB and the
 * iOS set alone is 12 MB. Dimensions, filenames and PNG format are unchanged.
 *
 *   bun scripts/optimize-native-images.ts             re-encode what is on disk (safe to re-run)
 *   bun scripts/optimize-native-images.ts --generate  run capacitor-assets first, then re-encode
 *
 * Splash images, and any other PNG over LARGE_BYTES (the iOS app icon), are re-encoded as a
 * dithered palette PNG. Every result is compared with its original and only kept when it is smaller,
 * its mean absolute difference stays under MAX_MEAN_ERROR (0-255 scale) and its low-pass error, which
 * is what banding in a smooth sky looks like, stays at or under MAX_BAND_ERROR at the 99th
 * percentile. An image that fails a check falls back to lossless truecolour when that is smaller.
 * Launcher mipmaps are small and are left alone. A PNG that is already a palette image is left
 * alone too, so running the script twice never re-quantises (and never degrades) its own output.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import sharp from "sharp";

const APP = resolve(import.meta.dirname, "..");
const ANDROID_RES = join(APP, "android/app/src/main/res");
const IOS_ASSETS = join(APP, "ios/App/App/Assets.xcassets");
const ANDROID_MANIFEST = join(APP, "android/app/src/main/AndroidManifest.xml");

/** The colours the committed native projects were generated with (see `native:assets`). */
const BRAND = "#101A33";
const BRAND_DARK = "#0B1226";

/** Palette qualities to try, lowest (smallest file) first; the first that passes the checks wins. */
export const PALETTE_QUALITIES = [84, 90, 100] as const;
export const palette = (quality: number) =>
  ({ palette: true, quality, effort: 10, dither: 0.2 }) as const;
export const LOSSLESS = { compressionLevel: 9, adaptiveFiltering: true, palette: false } as const;
export const MAX_MEAN_ERROR = 3;
export const MAX_BAND_ERROR = 3;
/** Only non-splash PNGs above this size are re-encoded, so launcher mipmaps stay as generated. */
export const LARGE_BYTES = 256 * 1024;
/** The low-pass image is downscaled by this factor: dither noise averages out, banding does not. */
const LOWPASS_FACTOR = 8;

export type Encoding = "palette" | "lossless";

export interface Result {
  file: string;
  before: number;
  after: number;
  encoding: Encoding | "kept";
  meanError: number;
  bandError: number;
}

export function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

export function isSplash(path: string): boolean {
  return /\/drawable[^/]*\/splash\.png$/.test(path) || /\/Splash\.imageset\/[^/]+\.png$/.test(path);
}

async function pixels(png: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Mean and 99th-percentile absolute channel difference between two equal-size 8-bit buffers. */
function difference(a: Buffer, b: Buffer): { mean: number; p99: number } {
  const histogram = new Array<number>(256).fill(0);
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = Math.abs((a[i] ?? 0) - (b[i] ?? 0));
    sum += d;
    histogram[d] = (histogram[d] ?? 0) + 1;
  }
  let seen = 0;
  let p99 = 255;
  for (let d = 0; d < 256; d += 1) {
    seen += histogram[d] ?? 0;
    if (seen >= a.length * 0.99) {
      p99 = d;
      break;
    }
  }
  return { mean: sum / a.length, p99 };
}

/** Mean difference over all channels, and the 99th-percentile difference between low-pass copies. */
export async function compare(
  original: Buffer,
  candidate: Buffer,
): Promise<{ meanError: number; bandError: number }> {
  const [a, b] = await Promise.all([pixels(original), pixels(candidate)]);
  if (a.width !== b.width || a.height !== b.height) {
    return { meanError: Number.POSITIVE_INFINITY, bandError: Number.POSITIVE_INFINITY };
  }
  const [la, lb] = await Promise.all([reduce(original), reduce(candidate)]);
  return { meanError: difference(a.data, b.data).mean, bandError: difference(la, lb).p99 };
}

async function reduce(png: Buffer): Promise<Buffer> {
  const { width, height } = await sharp(png)
    .metadata()
    .then((m) => ({
      width: m.width ?? 1,
      height: m.height ?? 1,
    }));
  return sharp(png)
    .ensureAlpha()
    .resize(
      Math.max(1, Math.round(width / LOWPASS_FACTOR)),
      Math.max(1, Math.round(height / LOWPASS_FACTOR)),
      {
        fit: "fill",
      },
    )
    .raw()
    .toBuffer();
}

/** PNG colour type 3 is a palette image: what this script writes, so there is nothing left to do. */
export function isPalettePng(png: Buffer): boolean {
  return png[25] === 3;
}

/** The smallest acceptable re-encoding of one PNG, or the original bytes when none is. */
export async function optimizeBuffer(
  original: Buffer,
): Promise<{ png: Buffer; encoding: Encoding | "kept"; meanError: number; bandError: number }> {
  if (isPalettePng(original)) {
    return { png: original, encoding: "kept", meanError: 0, bandError: 0 };
  }
  for (const quality of PALETTE_QUALITIES) {
    const candidate = await sharp(original).png(palette(quality)).toBuffer();
    if (candidate.length >= original.length) break;
    const error = await compare(original, candidate);
    if (error.meanError < MAX_MEAN_ERROR && error.bandError <= MAX_BAND_ERROR) {
      return { png: candidate, encoding: "palette", ...error };
    }
  }
  const lossless = await sharp(original).png(LOSSLESS).toBuffer();
  if (lossless.length < original.length) {
    return { png: lossless, encoding: "lossless", ...(await compare(original, lossless)) };
  }
  return { png: original, encoding: "kept", meanError: 0, bandError: 0 };
}

export async function optimizeNativeImages(
  dirs: string[] = [ANDROID_RES, IOS_ASSETS],
): Promise<Result[]> {
  const results: Result[] = [];
  for (const path of dirs
    .flatMap(walk)
    .filter((p) => p.endsWith(".png"))
    .sort()) {
    const splash = isSplash(path);
    const original = readFileSync(path);
    if (!splash && original.length < LARGE_BYTES) continue;
    const out = await optimizeBuffer(original);
    if (out.encoding !== "kept") writeFileSync(path, out.png);
    results.push({
      file: relative(APP, path),
      before: original.length,
      after: out.encoding === "kept" ? original.length : out.png.length,
      encoding: out.encoding,
      meanError: out.meanError,
      bandError: out.bandError,
    });
  }
  return results;
}

/** Runs `capacitor-assets`, which also reformats AndroidManifest.xml; the manifest is put back. */
function generate(): void {
  const manifest = readFileSync(ANDROID_MANIFEST);
  const args = [
    "capacitor-assets",
    "generate",
    "--android",
    "--ios",
    "--iconBackgroundColor",
    BRAND,
    "--iconBackgroundColorDark",
    BRAND,
    "--splashBackgroundColor",
    BRAND,
    "--splashBackgroundColorDark",
    BRAND_DARK,
  ];
  console.log(`$ bunx ${args.join(" ")}`);
  try {
    const run = spawnSync("bunx", args, { cwd: APP, stdio: "inherit" });
    if (run.status !== 0)
      throw new Error(`capacitor-assets exited with ${run.status ?? "a signal"}`);
  } finally {
    writeFileSync(ANDROID_MANIFEST, manifest);
  }
}

function megabytes(bytes: number): string {
  return `${(bytes / 1e6).toFixed(2)} MB`;
}

async function main(): Promise<void> {
  if (process.argv.includes("--generate")) generate();
  const results = await optimizeNativeImages();
  for (const r of results) {
    if (r.encoding === "kept") continue;
    console.log(
      `${r.encoding.padEnd(8)} ${r.file}: ${r.before} -> ${r.after} bytes (mean error ${r.meanError.toFixed(2)}, band error ${r.bandError})`,
    );
  }
  for (const dir of [ANDROID_RES, IOS_ASSETS]) {
    const total = walk(dir).reduce((sum, p) => sum + statSync(p).size, 0);
    console.log(`${relative(APP, dir)}: ${megabytes(total)}`);
  }
}

if (process.argv[1] === import.meta.filename) await main();
