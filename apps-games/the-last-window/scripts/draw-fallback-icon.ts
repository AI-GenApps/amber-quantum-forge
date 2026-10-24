/**
 * Code-drawn lamp-in-window badge, painted from the palette tokens only. It is the icon fallback
 * when the accepted `icon` master is absent and the splash fallback when `key-art` is absent.
 */
import sharp from "sharp";
import { PALETTE } from "../src/theme/tokens";

export const ICON_SIZE = 1024;
export const SPLASH_SIZE = 2732;
export const SPLASH_SAFE = 1200;

export function badgeSvg(size: number, withBackground: boolean): string {
  const p = PALETTE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="glow" cx="50%" cy="62%" r="55%">
      <stop offset="0" stop-color="${p.lamp}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${p.lampDeep}" stop-opacity="0.95"/>
    </radialGradient>
  </defs>
  ${withBackground ? `<rect width="100" height="100" fill="${p.night}"/>` : ""}
  <path d="M24 82 V42 a26 26 0 0 1 52 0 V82 Z" fill="${p.paper}" stroke="${p.paperDark}" stroke-width="2"/>
  <path d="M29 77 V42 a21 21 0 0 1 42 0 V77 Z" fill="url(#glow)"/>
  <rect x="29" y="52" width="42" height="2.4" fill="${p.paper}" fill-opacity="0.85"/>
  <rect x="21" y="80" width="58" height="5" rx="1" fill="${p.paperDark}" stroke="${p.paper}" stroke-width="1"/>
  <g stroke="${p.ink}" stroke-width="1.6" stroke-linejoin="round">
    <rect x="43" y="72" width="14" height="8" rx="1.5" fill="${p.lampDeep}"/>
    <rect x="45" y="58" width="10" height="14" rx="3" fill="${p.paper}" fill-opacity="0.9"/>
    <path d="M44 58 q6 -6 12 0" fill="none"/>
    <rect x="47" y="52" width="6" height="3" rx="1" fill="${p.lampDeep}"/>
  </g>
  <rect x="62" y="72" width="6" height="8" rx="1" fill="${p.paper}" stroke="${p.ink}" stroke-width="1.2"/>
  <rect x="31" y="75" width="12" height="2.5" fill="${p.brick}"/>
  <rect x="32" y="72.5" width="10" height="2.5" fill="${p.teal}"/>
</svg>`;
}

export function renderBadge(size: number): Promise<Buffer> {
  return sharp(Buffer.from(badgeSvg(size, false)))
    .png()
    .toBuffer();
}

export async function renderFallbackIcon(): Promise<Buffer> {
  return sharp(Buffer.from(badgeSvg(ICON_SIZE, true)))
    .removeAlpha()
    .png()
    .toBuffer();
}

export async function renderFallbackSplash(): Promise<Buffer> {
  const badge = await renderBadge(SPLASH_SAFE);
  return sharp({
    create: { width: SPLASH_SIZE, height: SPLASH_SIZE, channels: 3, background: PALETTE.night },
  })
    .composite([{ input: badge, gravity: "centre" }])
    .removeAlpha()
    .png()
    .toBuffer();
}
