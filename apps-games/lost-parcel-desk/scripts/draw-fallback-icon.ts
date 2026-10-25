/**
 * Code-drawn stamp-and-envelope badge, painted from the palette tokens only. It is the splash motif
 * (the `key-art` slot is rejected) and the icon fallback when the accepted `icon` master is absent.
 */
import sharp from "sharp";
import { PALETTE } from "../src/theme/tokens";

export const ICON_SIZE = 1024;
export const SPLASH_SIZE = 2732;
export const SPLASH_SAFE = 1200;

function scallops(x: number, y: number, size: number): string {
  const step = size / 5;
  const holes: string[] = [];
  for (let i = 0; i <= 5; i++) {
    const t = i * step;
    holes.push(
      `<circle cx="${x + t}" cy="${y}" r="1.7"/>`,
      `<circle cx="${x + t}" cy="${y + size}" r="1.7"/>`,
    );
    holes.push(
      `<circle cx="${x}" cy="${y + t}" r="1.7"/>`,
      `<circle cx="${x + size}" cy="${y + t}" r="1.7"/>`,
    );
  }
  return holes.join("");
}

export function badgeSvg(size: number, withBackground: boolean): string {
  const p = PALETTE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  ${withBackground ? `<rect width="100" height="100" fill="${p.tealDeep}"/>` : ""}
  <circle cx="50" cy="50" r="46" fill="${p.cream}" stroke="${p.ink}" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="41" fill="none" stroke="${p.ink}" stroke-width="1.2"/>
  <rect x="26" y="37" width="50" height="34" fill="${p.ink}" fill-opacity="0.22" transform="translate(2.5 2.5)"/>
  <rect x="24" y="35" width="50" height="34" fill="${p.cream2}" stroke="${p.ink}" stroke-width="2.4" stroke-linejoin="round"/>
  <polygon points="24,35 49,54 74,35" fill="${p.mustardLight}" stroke="${p.ink}" stroke-width="2.4" stroke-linejoin="round"/>
  <polyline points="24,69 40,52" fill="none" stroke="${p.ink}" stroke-width="1.6" stroke-linecap="round"/>
  <polyline points="74,69 58,52" fill="none" stroke="${p.ink}" stroke-width="1.6" stroke-linecap="round"/>
  <g transform="rotate(8 62 42)">
    <rect x="52" y="30" width="20" height="20" fill="${p.brick}" stroke="${p.ink}" stroke-width="2"/>
    <rect x="56" y="34" width="12" height="12" fill="none" stroke="${p.cream}" stroke-width="1.4"/>
    <g fill="${p.cream}">${scallops(52, 30, 20)}</g>
  </g>
  <circle cx="64" cy="62" r="9.5" fill="${p.tealLight}" stroke="${p.mustard}" stroke-width="3"/>
  <circle cx="64" cy="62" r="11.4" fill="none" stroke="${p.ink}" stroke-width="1.4"/>
  <line x1="71" y1="69" x2="78" y2="76" stroke="${p.mustardDeep}" stroke-width="3.4" stroke-linecap="round"/>
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
