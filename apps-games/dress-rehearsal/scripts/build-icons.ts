/**
 * Writes the Capacitor asset sources into `assets/` (read by `capacitor-assets`). Deterministic and
 * re-runnable:
 *
 *   bun scripts/build-icons.ts [--fallback]
 *
 * `icon-only.png` is the accepted `icon` master (evidence masters, never the inbox). The `key-art`
 * slot is rejected, so the splash is the code-drawn hanger-and-ribbon badge on the `night` colour,
 * inside the central 1200 px safe box. `--fallback` also draws the icon in code.
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
} from "./draw-fallback-icon";

const APP = resolve(import.meta.dirname, "..");
const ASSETS = join(APP, "assets");
const ICON_MASTER = resolve(
  APP,
  "../../.agents/resources/2026-10-23/web-games/dress-rehearsal/art/masters/icon.webp",
);

export const SOURCE_FILES = [
  "icon-only.png",
  "icon-foreground.png",
  "icon-background.png",
  "splash.png",
  "splash-dark.png",
] as const;

async function loadIcon(useFallback: boolean): Promise<{ png: Buffer; path: string }> {
  if (!useFallback && existsSync(ICON_MASTER)) {
    const png = await sharp(readFileSync(ICON_MASTER))
      .resize(ICON_SIZE, ICON_SIZE, { fit: "cover" })
      .removeAlpha()
      .png()
      .toBuffer();
    return { png, path: "accepted icon master" };
  }
  return { png: await renderFallbackIcon(), path: "code-drawn fallback badge" };
}

async function foreground(icon: Buffer, useFallback: boolean): Promise<Buffer> {
  const motif = useFallback ? await renderBadge(ICON_SIZE) : icon;
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
  const splash = await renderFallbackSplash();
  writeFileSync(join(ASSETS, "icon-only.png"), icon.png);
  writeFileSync(join(ASSETS, "icon-foreground.png"), await foreground(icon.png, useFallback));
  writeFileSync(join(ASSETS, "icon-background.png"), await background());
  writeFileSync(join(ASSETS, "splash.png"), splash);
  writeFileSync(join(ASSETS, "splash-dark.png"), splash);
  console.log(`icon: ${icon.path}; splash: code-drawn badge on night (key-art rejected)`);
}

if (process.argv[1] === import.meta.filename) await main();
