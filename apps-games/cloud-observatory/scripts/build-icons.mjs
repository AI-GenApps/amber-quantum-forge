/**
 * Writes the five Capacitor asset sources into `resources/` (the input of `capacitor-assets`).
 * Deterministic and re-runnable:
 *
 *   bun scripts/build-icons.mjs
 *
 * Icon: the accepted designer `icon` master (retry round 1, 1024 square, opaque painted scene), read
 * from the evidence masters, never the designer inbox. The same painting is the iOS icon, the legacy
 * Android icon and, scaled into the adaptive safe zone with a feathered edge, the adaptive
 * foreground over a blurred enlarged copy of itself, so no hard box shows inside the launcher mask.
 * Splash: the accepted `key-art` master, feathered into a flat ink field.
 */
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";

const APP = resolve(import.meta.dirname, "..");
const RESOURCES = join(APP, "resources");
const MASTERS = resolve(
  APP,
  "../../.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters",
);
const ICON = join(MASTERS, "icon.webp");
const KEY_ART = join(MASTERS, "key-art.webp");

export const ICON_SIZE = 1024;
export const SPLASH_SIZE = 2732;
export const FOREGROUND_SAFE = 0.66;
export const FOREGROUND_FEATHER = 0.07;
export const SPLASH_ART_WIDTH = 0.4;
export const FIELD = "#101A33";
export const FIELD_DARK = "#0B1226";

/** A white box with blurred edges, as a one-channel alpha mask of the given size. */
async function featherMask(width, height, feather) {
  const inner = await sharp({
    create: {
      width: width - feather * 2,
      height: height - feather * 2,
      channels: 3,
      background: "#ffffff",
    },
  })
    .png()
    .toBuffer();
  const box = await sharp({ create: { width, height, channels: 3, background: "#000000" } })
    .composite([{ input: inner, left: feather, top: feather }])
    .png()
    .toBuffer();
  return sharp(box)
    .blur(feather / 2.2)
    .extractChannel(0)
    .raw()
    .toBuffer();
}

async function writeIcons() {
  const iconOnly = await sharp(ICON)
    .resize(ICON_SIZE, ICON_SIZE)
    .flatten({ background: FIELD })
    .removeAlpha()
    .png()
    .toBuffer();
  await sharp(iconOnly).toFile(join(RESOURCES, "icon-only.png"));

  const size = Math.round(ICON_SIZE * FOREGROUND_SAFE);
  const feather = Math.round(size * FOREGROUND_FEATHER);
  const mask = await featherMask(size, size, feather);
  const mark = await sharp(iconOnly)
    .resize(size, size)
    .joinChannel(mask, { raw: { width: size, height: size, channels: 1 } })
    .png()
    .toBuffer();
  const offset = Math.round((ICON_SIZE - size) / 2);
  await sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, left: offset, top: offset }])
    .png()
    .toFile(join(RESOURCES, "icon-foreground.png"));

  const enlarged = Math.round(ICON_SIZE * 1.6);
  const shift = Math.round((enlarged - ICON_SIZE) / 2);
  await sharp(iconOnly)
    .resize(enlarged, enlarged)
    .blur(40)
    .extract({ left: shift, top: shift, width: ICON_SIZE, height: ICON_SIZE })
    .flatten({ background: FIELD })
    .removeAlpha()
    .png()
    .toFile(join(RESOURCES, "icon-background.png"));
}

/** The key art, resized to 40% of the splash width, with its edges feathered into transparency. */
async function featheredKeyArt() {
  const width = Math.round(SPLASH_SIZE * SPLASH_ART_WIDTH);
  const height = Math.round((width * 3) / 2);
  const feather = Math.round(width * 0.09);
  const art = await sharp(KEY_ART).resize(width, height).removeAlpha().png().toBuffer();
  const mask = await featherMask(width, height, feather);
  return sharp(art)
    .joinChannel(mask, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
}

async function writeSplash(file, field) {
  const art = await featheredKeyArt();
  const meta = await sharp(art).metadata();
  await sharp({
    create: { width: SPLASH_SIZE, height: SPLASH_SIZE, channels: 3, background: field },
  })
    .composite([
      {
        input: art,
        left: Math.round((SPLASH_SIZE - (meta.width ?? 0)) / 2),
        top: Math.round((SPLASH_SIZE - (meta.height ?? 0)) / 2),
      },
    ])
    .removeAlpha()
    .png({ palette: true, colours: 128, quality: 90 })
    .toFile(join(RESOURCES, file));
}

mkdirSync(RESOURCES, { recursive: true });
await writeIcons();
await writeSplash("splash.png", FIELD);
await writeSplash("splash-dark.png", FIELD_DARK);
console.log("resources/ written: icon-only, icon-foreground, icon-background, splash, splash-dark");
