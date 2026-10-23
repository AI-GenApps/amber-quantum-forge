/**
 * Writes the five Capacitor asset sources into `resources/` (the single source for
 * `capacitor-assets`). Deterministic and re-runnable.
 *
 *   bun scripts/render-brand-sources.ts [--fallback]
 *
 * Accepted path (default): the accepted `icon` master gives `icon.png`; the accepted
 * `lantern-amber` master (transparent) gives the adaptive foreground and the splash motif. Both read
 * the evidence masters, never the inbox. `--fallback` draws the code-drawn lantern on indigo instead
 * (the same drawing as the in-app placeholder), for when no accepted art exists.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP = resolve(import.meta.dirname, "..");
const RESOURCES = join(APP, "resources");
const MASTERS = resolve(
  APP,
  "../../.agents/resources/2026-10-23/web-games/lantern-loops/art/masters",
);

export const INDIGO = "#12132E";
export const INDIGO_RGB = { r: 0x12, g: 0x13, b: 0x2e } as const;
export const ICON_SIZE = 1024;
export const SPLASH_SIZE = 2732;
/** Android adaptive icons keep the motif inside the central 66% (the safe zone). */
export const FOREGROUND_SAFE = Math.round(ICON_SIZE * 0.66);
/** The splash motif stays inside the central 1200 px square of the 2732 px canvas. */
export const SPLASH_SAFE = 1200;
/**
 * The splash lantern is posterised to this many colours: the paper-fibre texture is invisible at
 * splash scale and would otherwise add about 1 MB per splash copy, 12 copies across both platforms.
 */
export const SPLASH_COLOURS = 32;

export const SOURCE_FILES = [
  "icon.png",
  "icon-foreground.png",
  "icon-background.png",
  "splash.png",
  "splash-dark.png",
] as const;

const FALLBACK_LANTERN = (size: number, withBackground: boolean): string => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  ${withBackground ? `<rect width="100" height="100" fill="${INDIGO}"/>` : ""}
  <circle cx="50" cy="50" r="46" fill="#F2A33A" fill-opacity="0.3"/>
  <rect x="37" y="19" width="26" height="9" rx="3" fill="#241B2F"/>
  <rect x="37" y="72" width="26" height="9" rx="3" fill="#241B2F"/>
  <rect x="29" y="25" width="42" height="50" rx="17" fill="#F2A33A" stroke="#241B2F" stroke-width="3.5"/>
  <circle cx="50" cy="50" r="12" fill="#241B2F"/>
</svg>`;

async function loadMotif(useFallback: boolean): Promise<Buffer> {
  const lantern = join(MASTERS, "lantern-amber.webp");
  if (!useFallback && existsSync(lantern)) {
    return sharp(readFileSync(lantern)).ensureAlpha().trim().png().toBuffer();
  }
  return sharp(Buffer.from(FALLBACK_LANTERN(1024, false)))
    .png()
    .toBuffer();
}

async function loadIcon(useFallback: boolean, motif: Buffer): Promise<Buffer> {
  const master = join(MASTERS, "icon.webp");
  if (!useFallback && existsSync(master)) {
    return sharp(readFileSync(master))
      .resize(ICON_SIZE, ICON_SIZE, { fit: "cover" })
      .removeAlpha()
      .png()
      .toBuffer();
  }
  const scaled = await sharp(motif)
    .resize(Math.round(ICON_SIZE * 0.8), Math.round(ICON_SIZE * 0.8), { fit: "inside" })
    .toBuffer();
  return sharp({
    create: { width: ICON_SIZE, height: ICON_SIZE, channels: 3, background: INDIGO_RGB },
  })
    .composite([{ input: scaled, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function fitCentred(
  motif: Buffer,
  box: number,
  canvas: number,
  background: { r: number; g: number; b: number; alpha: number },
): Promise<Buffer> {
  const fitted = await sharp(motif)
    .resize(box, box, { fit: "inside", kernel: "lanczos3" })
    .toBuffer();
  const composed = sharp({
    create: { width: canvas, height: canvas, channels: 4, background },
  }).composite([{ input: fitted, gravity: "centre" }]);
  return (background.alpha === 1 ? composed.removeAlpha() : composed).png().toBuffer();
}

export async function renderBrandSources(useFallback: boolean): Promise<Record<string, Buffer>> {
  const motif = await loadMotif(useFallback);
  const opaque = { ...INDIGO_RGB, alpha: 1 };
  const splashMotif = await sharp(motif)
    .median(5)
    .png({ palette: true, colours: SPLASH_COLOURS, dither: 0 })
    .toBuffer();
  const splash = await fitCentred(splashMotif, SPLASH_SAFE, SPLASH_SIZE, opaque);
  return {
    "icon.png": await loadIcon(useFallback, motif),
    "icon-foreground.png": await fitCentred(motif, FOREGROUND_SAFE, ICON_SIZE, {
      r: 0,
      g: 0,
      b: 0,
      alpha: 0,
    }),
    "icon-background.png": await sharp({
      create: { width: ICON_SIZE, height: ICON_SIZE, channels: 3, background: INDIGO_RGB },
    })
      .png()
      .toBuffer(),
    "splash.png": splash,
    "splash-dark.png": splash,
  };
}

async function main(): Promise<void> {
  const useFallback = process.argv.includes("--fallback");
  const files = await renderBrandSources(useFallback);
  mkdirSync(RESOURCES, { recursive: true });
  for (const [name, data] of Object.entries(files)) {
    writeFileSync(join(RESOURCES, name), data);
    const meta = await sharp(data).metadata();
    console.log(`${name}: ${meta.width}x${meta.height} ${meta.channels}ch ${data.length} bytes`);
  }
  console.log(useFallback ? "path: code-drawn fallback" : "path: accepted art masters");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
