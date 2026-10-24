/**
 * Writes the Capacitor asset sources into `assets/` (read by `capacitor-assets`). Deterministic and
 * re-runnable:
 *
 *   bun scripts/build-icons.ts [--fallback]
 *
 * `icon-only.png` is the accepted `icon` master and the splash is the accepted `key-art` master,
 * both read from the evidence masters (never the inbox), centred on the `night` colour with soft
 * edges inside the central safe box. `--fallback` draws the icon and splash in code instead.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { PALETTE } from "../src/theme/tokens";
import {
  ICON_SIZE,
  renderBadge,
  renderFallbackIcon,
  renderFallbackSplash,
  SPLASH_SIZE,
} from "./draw-fallback-icon";

const APP = resolve(import.meta.dirname, "..");
const ASSETS = join(APP, "assets");
const MASTERS = resolve(
  APP,
  "../../.agents/resources/2026-10-23/web-games/the-last-window/art/masters",
);

export const SOURCE_FILES = [
  "icon-only.png",
  "icon-foreground.png",
  "icon-background.png",
  "splash.png",
  "splash-dark.png",
] as const;

/** Key art is 2:3; at this width it is 1200 x 1800 and the cottage sits inside the 1200 px safe box. */
export const KEY_ART_WIDTH = 1200;
const FEATHER = 220;
const FOREGROUND_FEATHER = 200;

async function loadIcon(useFallback: boolean): Promise<{ png: Buffer; path: string }> {
  const master = join(MASTERS, "icon.webp");
  if (!useFallback && existsSync(master)) {
    const png = await sharp(readFileSync(master))
      .resize(ICON_SIZE, ICON_SIZE, { fit: "cover" })
      .removeAlpha()
      .png()
      .toBuffer();
    return { png, path: "accepted icon master" };
  }
  return { png: await renderFallbackIcon(), path: "code-drawn fallback badge" };
}

function ramp(i: number, length: number, feather: number): number {
  return Math.min(1, i / feather, (length - 1 - i) / feather);
}

function featherMask(width: number, height: number, feather: number): Buffer {
  const alpha = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const vertical = ramp(y, height, feather);
    for (let x = 0; x < width; x++) {
      const t = Math.min(1, vertical, ramp(x, width, feather));
      alpha[(y * width + x) * 4 + 3] = Math.round(255 * t * t * (3 - 2 * t));
    }
  }
  return alpha;
}

/** Softens an image into transparency at its edges so it melts into the flat adaptive background. */
async function feathered(
  input: Buffer,
  width: number,
  height: number,
  feather: number,
): Promise<Buffer> {
  const mask = await sharp(featherMask(width, height, feather), {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();
  return sharp(input)
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function keyArtSplash(): Promise<Buffer | null> {
  const master = join(MASTERS, "key-art.webp");
  if (!existsSync(master)) return null;
  const art = await sharp(readFileSync(master)).resize({ width: KEY_ART_WIDTH }).toBuffer();
  const meta = await sharp(art).metadata();
  const width = meta.width ?? KEY_ART_WIDTH;
  const height = meta.height ?? 1800;
  const soft = await feathered(art, width, height, FEATHER);
  return sharp({
    create: { width: SPLASH_SIZE, height: SPLASH_SIZE, channels: 3, background: PALETTE.night },
  })
    .composite([{ input: soft, gravity: "centre" }])
    .removeAlpha()
    .png()
    .toBuffer();
}

/**
 * `capacitor-assets` insets the adaptive layers by 16.7%. The icon's wall edge is feathered into
 * transparency so it melts into the flat `night` background layer without a visible square.
 */
async function foreground(icon: Buffer, useFallback: boolean): Promise<Buffer> {
  const motif = useFallback
    ? await renderBadge(ICON_SIZE)
    : await feathered(icon, ICON_SIZE, ICON_SIZE, FOREGROUND_FEATHER);
  return sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: motif, gravity: "centre" }])
    .png()
    .toBuffer();
}

function background(): Promise<Buffer> {
  return sharp({
    create: { width: ICON_SIZE, height: ICON_SIZE, channels: 3, background: PALETTE.night },
  })
    .png()
    .toBuffer();
}

async function main(): Promise<void> {
  const useFallback = process.argv.includes("--fallback");
  mkdirSync(ASSETS, { recursive: true });
  const icon = await loadIcon(useFallback);
  const keyArt = useFallback ? null : await keyArtSplash();
  const splash = keyArt ?? (await renderFallbackSplash());
  writeFileSync(join(ASSETS, "icon-only.png"), icon.png);
  writeFileSync(join(ASSETS, "icon-foreground.png"), await foreground(icon.png, useFallback));
  writeFileSync(join(ASSETS, "icon-background.png"), await background());
  writeFileSync(join(ASSETS, "splash.png"), splash);
  writeFileSync(join(ASSETS, "splash-dark.png"), splash);
  const splashPath = keyArt ? "accepted key-art master on night" : "code-drawn badge on night";
  console.log(`icon: ${icon.path}; splash: ${splashPath}`);
}

if (process.argv[1] === import.meta.filename) await main();
