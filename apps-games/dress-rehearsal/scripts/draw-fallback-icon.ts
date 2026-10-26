/**
 * Code-drawn hanger-and-ribbon badge, painted from the palette tokens only. It is the splash motif
 * (the `key-art` slot is rejected) and the icon fallback when the accepted `icon` master is absent.
 */
import sharp from "sharp";
import { PALETTE } from "../src/theme/tokens";

export const ICON_SIZE = 1024;
export const SPLASH_SIZE = 2732;
export const SPLASH_SAFE = 1200;

export function badgeSvg(size: number, withBackground: boolean): string {
  const p = PALETTE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  ${withBackground ? `<rect width="100" height="100" fill="${p.night}"/>` : ""}
  <circle cx="50" cy="50" r="46" fill="${p.night}" stroke="${p.star}" stroke-width="2.5"/>
  <path d="M50 34 L50 29 C50 24 56 22 58 26 C60 30 55 31 52 31" fill="none" stroke="${p.star}" stroke-width="3.6" stroke-linecap="round"/>
  <polygon points="50,35 80,60 20,60" fill="none" stroke="${p.paper}" stroke-width="4.5" stroke-linejoin="round"/>
  <polygon points="50,60 38,76 45,74" fill="${p.bad}" stroke="${p.ink}" stroke-width="2" stroke-linejoin="round"/>
  <polygon points="50,60 62,76 55,74" fill="${p.bad}" stroke="${p.ink}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M50 60 L35 52 L35 68 Z" fill="${p.bad}" stroke="${p.ink}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M50 60 L65 52 L65 68 Z" fill="${p.bad}" stroke="${p.ink}" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="50" cy="60" r="4" fill="${p.bad}" stroke="${p.ink}" stroke-width="2"/>
</svg>`;
}

export function renderBadge(size: number): Promise<Buffer> {
  return sharp(Buffer.from(badgeSvg(size, false)))
    .png()
    .toBuffer();
}

export function renderFallbackIcon(): Promise<Buffer> {
  return sharp(Buffer.from(badgeSvg(ICON_SIZE, true)))
    .removeAlpha()
    .png()
    .toBuffer();
}

export function renderFallbackSplash(): Promise<Buffer> {
  return renderBadge(SPLASH_SAFE).then((badge) =>
    sharp({
      create: { width: SPLASH_SIZE, height: SPLASH_SIZE, channels: 3, background: PALETTE.night },
    })
      .composite([{ input: badge, gravity: "centre" }])
      .removeAlpha()
      .png()
      .toBuffer(),
  );
}
