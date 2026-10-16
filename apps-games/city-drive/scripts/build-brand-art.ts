/**
 * Builds the brand art from the chosen icon master and the keyed hero-car foreground.
 *
 *   bun scripts/build-brand-art.ts
 *
 * Inputs (committed, under .agents/resources/2026-10-15/city-drive-art/icon/source):
 *   1b-hero-car-sunset.png        the icon the owner picked at task 19
 *   foreground-raw-magenta.png    the hero car on flat #FF00FF (generate-image, see its prompt log)
 * Outputs:
 *   resources/{icon,icon-foreground,icon-background,splash,splash-dark}.png  (@capacitor/assets input)
 *   public/{favicon.png,apple-touch-icon.png,manifest.webmanifest,icons/*}   (web + PWA)
 *   the same files copied beside the sources under the art folder
 * Idempotent. Run `bunx capacitor-assets generate` afterwards (the `brand:assets` script does both).
 */
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { GAME_TITLE } from "../src/ui/brand";
import {
  ACCENT_COLOR,
  ADAPTIVE_SAFE_WIDTH,
  BRAND_COLOR,
  BRAND_COLOR_DARK,
  ICON_SIZE,
  SPLASH_SIZE,
  TEXT_COLOR,
  WEB_ICON_FILES,
} from "./brand-art/constants";
import { keyOutMagenta } from "./brand-art/key";

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ART = resolve(APP, "../../.agents/resources/2026-10-15/city-drive-art/icon");
const FONT = join(APP, "public/fonts/russo-one/RussoOne-Regular.ttf");

function out(dir: "resources" | "public", name: string): string {
  const path = join(APP, dir, name);
  mkdirSync(dirname(path), { recursive: true });
  return path;
}

async function buildMark(): Promise<Buffer> {
  const keyed = await keyOutMagenta(join(ART, "source/foreground-raw-magenta.png"));
  return keyed.png().toBuffer();
}

async function foreground(mark: Buffer): Promise<Buffer> {
  const car = await sharp(mark)
    .trim({ threshold: 1 })
    .resize({ width: ADAPTIVE_SAFE_WIDTH })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: car, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function wordmark(width: number): Promise<Buffer> {
  const [first, second] = GAME_TITLE.toUpperCase().split(" ");
  const markup = `<span foreground="${TEXT_COLOR}">${first}</span> <span foreground="${ACCENT_COLOR}">${second ?? ""}</span>`;
  return sharp({
    text: { text: markup, rgba: true, font: "Russo One", fontfile: FONT, width, dpi: 900 },
  })
    .png()
    .toBuffer();
}

async function splash(mark: Buffer, background: string): Promise<Buffer> {
  const car = await sharp(mark).trim({ threshold: 1 }).resize({ width: 1100 }).png().toBuffer();
  const carMeta = await sharp(car).metadata();
  const word = await sharp(await wordmark(2600))
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
  const wordMeta = await sharp(word).metadata();
  const gap = 120;
  const total = (carMeta.height ?? 0) + gap + (wordMeta.height ?? 0);
  const top = Math.round((SPLASH_SIZE - total) / 2);
  return sharp({
    create: { width: SPLASH_SIZE, height: SPLASH_SIZE, channels: 3, background },
  })
    .composite([
      { input: car, left: Math.round((SPLASH_SIZE - (carMeta.width ?? 0)) / 2), top },
      {
        input: word,
        left: Math.round((SPLASH_SIZE - (wordMeta.width ?? 0)) / 2),
        top: top + (carMeta.height ?? 0) + gap,
      },
    ])
    .removeAlpha()
    .png()
    .toBuffer();
}

async function write(buffer: Buffer, dir: "resources" | "public", name: string, alpha: boolean) {
  const image = sharp(buffer);
  const flat = alpha ? image.ensureAlpha() : image.removeAlpha();
  await flat.png({ compressionLevel: 9 }).toFile(out(dir, name));
}

function webManifest(): string {
  const icon = (src: string, size: number, purpose: string) => ({
    src,
    sizes: `${size}x${size}`,
    type: "image/png",
    purpose,
  });
  return `${JSON.stringify(
    {
      name: GAME_TITLE,
      short_name: GAME_TITLE,
      description: "Free-roam the city and take on missions.",
      start_url: "/",
      display: "fullscreen",
      orientation: "landscape",
      background_color: BRAND_COLOR_DARK,
      theme_color: BRAND_COLOR,
      icons: [
        icon("/icons/icon-192.png", 192, "any"),
        icon("/icons/icon-512.png", 512, "any"),
        icon("/icons/icon-512-maskable.png", 512, "maskable"),
      ],
    },
    null,
    2,
  )}\n`;
}

async function main() {
  const master = await sharp(join(ART, "source/1b-hero-car-sunset.png"))
    .resize(ICON_SIZE, ICON_SIZE)
    .flatten({ background: BRAND_COLOR_DARK })
    .removeAlpha()
    .png()
    .toBuffer();
  const mark = await buildMark();
  const fg = await foreground(mark);
  const bg = await sharp({
    create: { width: ICON_SIZE, height: ICON_SIZE, channels: 3, background: BRAND_COLOR },
  })
    .png()
    .toBuffer();

  await write(master, "resources", "icon.png", false);
  await write(fg, "resources", "icon-foreground.png", true);
  await write(bg, "resources", "icon-background.png", false);
  await write(await splash(mark, BRAND_COLOR), "resources", "splash.png", false);
  await write(await splash(mark, BRAND_COLOR_DARK), "resources", "splash-dark.png", false);

  const maskable = await sharp(bg)
    .composite([{ input: fg }])
    .removeAlpha()
    .png()
    .toBuffer();
  for (const [name, size] of Object.entries(WEB_ICON_FILES)) {
    const source = name.includes("maskable") ? maskable : master;
    const resized = await sharp(source).resize(size, size).png().toBuffer();
    await write(resized, "public", name, false);
  }
  writeFileSync(out("public", "manifest.webmanifest"), webManifest());

  for (const name of ["icon.png", "icon-foreground.png", "icon-background.png"]) {
    copyFileSync(join(APP, "resources", name), join(ART, name.replace("icon", "final-icon")));
  }
  for (const name of ["splash.png", "splash-dark.png"]) {
    copyFileSync(join(APP, "resources", name), join(ART, name));
  }
}

await main();
console.log(`brand art built for "${GAME_TITLE}"`);
