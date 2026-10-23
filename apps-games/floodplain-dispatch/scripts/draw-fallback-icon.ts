/**
 * Code-drawn roof-and-wave badge, painted from the palette tokens only. It is the splash motif
 * (the `key-art` slot is rejected) and the icon fallback when the accepted `icon` master is absent.
 */
import sharp from "sharp";
import { PALETTE } from "../src/theme/tokens";

export const ICON_SIZE = 1024;
export const SPLASH_SIZE = 2732;
export const SPLASH_SAFE = 1200;

export function badgeSvg(size: number, withBackground: boolean): string {
  const p = PALETTE;
  const wave = (y: number, colour: string, width: number): string =>
    `<path d="M2 ${y} q9 -7 18 0 t18 0 t18 0 t18 0 t18 0 t18 0" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  ${withBackground ? `<rect width="100" height="100" fill="${p.meadow}"/>` : ""}
  <defs><clipPath id="disc"><circle cx="50" cy="50" r="44.5"/></clipPath></defs>
  <circle cx="50" cy="50" r="46" fill="${p.paper}" stroke="${p.ochre}" stroke-width="3"/>
  <ellipse cx="53" cy="76" rx="26" ry="3.2" fill="${p.ink}" fill-opacity="0.18"/>
  <rect x="26" y="44" width="48" height="30" fill="${p.paper2}" stroke="${p.ink}" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="19,48 50,19 81,48" fill="${p.clay}" stroke="${p.ink}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="45" y="56" width="10" height="18" fill="${p.ochreDeep}" stroke="${p.ink}" stroke-width="2.5"/>
  <rect x="31" y="52" width="9" height="9" fill="${p.waterLight}" stroke="${p.ink}" stroke-width="2"/>
  <rect x="60" y="52" width="9" height="9" fill="${p.waterLight}" stroke="${p.ink}" stroke-width="2"/>
  <g clip-path="url(#disc)">
    ${wave(79, p.waterDeep, 6)}
    ${wave(79, p.water, 3.5)}
    ${wave(88, p.waterDeep, 5)}
    ${wave(88, p.waterLight, 2.5)}
  </g>
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
    create: {
      width: SPLASH_SIZE,
      height: SPLASH_SIZE,
      channels: 3,
      background: PALETTE.night,
    },
  })
    .composite([{ input: badge, gravity: "centre" }])
    .removeAlpha()
    .png()
    .toBuffer();
}
