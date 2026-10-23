/**
 * Writes the five Capacitor asset sources into `resources/` (the input of `capacitor-assets`).
 * Deterministic and re-runnable:
 *
 *   bun scripts/build-icons.mjs
 *
 * Icon: the designer `icon` was rejected in the last review round of batch b1 (see
 * `.agents/games/cloud-observatory/open-questions.md` row 15), so the launcher icon is a code-drawn
 * stopgap, a gold-foil four-point star on `#101A33` in the art-bible palette. Splash: the accepted
 * `key-art` master (read from the evidence masters, never the designer inbox), feathered into a flat
 * ink field so no hard box shows.
 */
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";

const APP = resolve(import.meta.dirname, "..");
const RESOURCES = join(APP, "resources");
const KEY_ART = resolve(
  APP,
  "../../.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/key-art.webp",
);

export const ICON_SIZE = 1024;
export const SPLASH_SIZE = 2732;
export const FOREGROUND_SAFE = 0.66;
export const SPLASH_ART_WIDTH = 0.4;
export const FIELD = "#101A33";
export const FIELD_DARK = "#0B1226";
const GOLD = "#D8A94B";
const GOLD_LIGHT = "#EBCB85";
const GOLD_SHADE = "#A47C30";
const WASH_TEAL = "#6FB3BD";

/** A concave four-point star: long rays on the axes, short pinched shoulders on the diagonals. */
function starPath(cx, cy, outer, inner) {
  const points = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? outer : inner;
    points.push(
      `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`,
    );
  }
  return `M${points.join("L")}Z`;
}

function markSvg(scale) {
  const c = ICON_SIZE / 2;
  const big = starPath(c, c, 360, 74);
  const small = starPath(c, c, 205, 52);
  return `
    <g transform="translate(${c} ${c}) scale(${scale}) translate(${-c} ${-c})">
      <defs>
        <clipPath id="star"><path d="${big}"/></clipPath>
        <clipPath id="upperLeft"><rect x="0" y="0" width="${c}" height="${c}"/></clipPath>
        <clipPath id="lowerRight"><rect x="${c}" y="${c}" width="${c}" height="${c}"/></clipPath>
      </defs>
      <g clip-path="url(#star)">
        <rect width="${ICON_SIZE}" height="${ICON_SIZE}" fill="${GOLD}"/>
        <rect width="${ICON_SIZE}" height="${ICON_SIZE}" fill="${GOLD_LIGHT}" clip-path="url(#upperLeft)"/>
        <rect width="${ICON_SIZE}" height="${ICON_SIZE}" fill="${GOLD_SHADE}" clip-path="url(#lowerRight)"/>
      </g>
      <path d="${small}" transform="rotate(45 ${c} ${c})" fill="${GOLD_LIGHT}" opacity="0.9"/>
      <circle cx="${c}" cy="${c}" r="34" fill="${GOLD_LIGHT}"/>
      <circle cx="${c}" cy="${c}" r="14" fill="${FIELD}" opacity="0.55"/>
    </g>`;
}

function iconSvg() {
  const c = ICON_SIZE / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}">
    <defs>
      <radialGradient id="field" cx="50%" cy="46%" r="62%">
        <stop offset="0" stop-color="#22335C"/>
        <stop offset="0.55" stop-color="#172445"/>
        <stop offset="1" stop-color="${FIELD}"/>
      </radialGradient>
    </defs>
    <rect width="${ICON_SIZE}" height="${ICON_SIZE}" fill="url(#field)"/>
    <circle cx="${c}" cy="${c}" r="420" fill="none" stroke="${GOLD}" stroke-width="6" opacity="0.55"/>
    <circle cx="${c}" cy="${c}" r="436" fill="none" stroke="${WASH_TEAL}" stroke-width="3" opacity="0.35"/>
    ${markSvg(1)}
  </svg>`;
}

function foregroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}">
    ${markSvg(FOREGROUND_SAFE)}
  </svg>`;
}

async function writeIcons() {
  const iconOnly = await sharp(Buffer.from(iconSvg())).png().toBuffer();
  await sharp(iconOnly)
    .flatten({ background: FIELD })
    .removeAlpha()
    .png()
    .toFile(join(RESOURCES, "icon-only.png"));
  await sharp(Buffer.from(foregroundSvg()))
    .ensureAlpha()
    .png()
    .toFile(join(RESOURCES, "icon-foreground.png"));
  const enlarged = Math.round(ICON_SIZE * 1.6);
  const offset = Math.round((enlarged - ICON_SIZE) / 2);
  await sharp(iconOnly)
    .resize(enlarged, enlarged)
    .blur(40)
    .extract({ left: offset, top: offset, width: ICON_SIZE, height: ICON_SIZE })
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
  const mask = await sharp(box)
    .blur(feather / 2.2)
    .extractChannel(0)
    .raw()
    .toBuffer();
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
