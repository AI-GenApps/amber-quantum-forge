import { applyTheme, type ThemeTokens } from "@web-games/kit";
import { mixHex } from "./contrast";

export type PaletteToken =
  | "paper"
  | "paperDark"
  | "ink"
  | "inkSoft"
  | "night"
  | "nightMid"
  | "lamp"
  | "lampDeep"
  | "brick"
  | "teal"
  | "sage"
  | "rain";

export type Palette = Readonly<Record<PaletteToken, string>>;

export const PALETTE: Palette = {
  paper: "#FBF1DC",
  paperDark: "#EAD9B8",
  ink: "#3A2A1E",
  inkSoft: "#5E4A3A",
  night: "#1F2F45",
  nightMid: "#2D4560",
  lamp: "#E8A33D",
  lampDeep: "#9A5F0E",
  brick: "#A03F30",
  teal: "#1F6F6C",
  sage: "#4F6B47",
  rain: "#8FA9BC",
};

const HIGH_INK = "#1B1209" as const;
const HIGH_NIGHT = "#0F1826" as const;

/** High contrast swaps ink and night, drops the paperDark fills and deepens the status fills. */
export const HIGH_PALETTE: Palette = {
  ...PALETTE,
  paperDark: PALETTE.paper,
  ink: HIGH_INK,
  inkSoft: HIGH_INK,
  night: HIGH_NIGHT,
  nightMid: HIGH_NIGHT,
  lampDeep: HIGH_INK,
  brick: "#7A2A1E",
  teal: "#144B49",
  sage: "#364D31",
  rain: PALETTE.paper,
};

export const PALETTE_VARS: Readonly<Record<PaletteToken, string>> = {
  paper: "--tlw-paper",
  paperDark: "--tlw-paper-dark",
  ink: "--tlw-ink",
  inkSoft: "--tlw-ink-soft",
  night: "--tlw-night",
  nightMid: "--tlw-night-mid",
  lamp: "--tlw-lamp",
  lampDeep: "--tlw-lamp-deep",
  brick: "--tlw-brick",
  teal: "--tlw-teal",
  sage: "--tlw-sage",
  rain: "--tlw-rain",
};

export interface Derived {
  nightRaised: string;
  tealLight: string;
  brickLight: string;
  starOffPaper: string;
}

export function palette(highContrast = false): Palette {
  return highContrast ? HIGH_PALETTE : PALETTE;
}

/** Colours mixed from palette tokens, used where a token alone misses its contrast target. */
export function derived(highContrast = false): Derived {
  const p = palette(highContrast);
  return {
    nightRaised: highContrast ? p.night : mixHex(p.nightMid, p.paper, 0.1),
    tealLight: mixHex(p.teal, p.paper, highContrast ? 0.75 : 0.5),
    brickLight: mixHex(p.brick, p.paper, highContrast ? 0.75 : 0.5),
    starOffPaper: mixHex(p.inkSoft, p.paper, highContrast ? 0 : 0.3),
  };
}

export const DERIVED_VARS: Readonly<Record<keyof Derived, string>> = {
  nightRaised: "--tlw-night-raised",
  tealLight: "--tlw-teal-light",
  brickLight: "--tlw-brick-light",
  starOffPaper: "--tlw-star-off-paper",
};

export const FONT_BODY = '"Nunito Sans", sans-serif' as const;
export const FONT_DISPLAY = '"Young Serif", serif' as const;

export const HIT_MIN_PX = 44 as const;
export const HIT_MIN_VAR = "--wg-hit-min" as const;
export const TEXT_SCALE_VAR = "--tlw-text-scale" as const;
export const TEXT_SCALES = { normal: 1, large: 1.25 } as const;

export const SPACING = { unit: "8px", gap: "12px", pad: "16px" } as const;
export const RADII = { sm: "6px", md: "12px", lg: "18px" } as const;

export function gameTokens(highContrast = false): Partial<ThemeTokens> {
  const p = palette(highContrast);
  const d = derived(highContrast);
  return {
    colorBackground: p.night,
    colorSurface: p.nightMid,
    colorSurfaceRaised: d.nightRaised,
    colorText: p.paper,
    colorTextMuted: p.paperDark,
    colorAccent: p.lamp,
    colorAccentText: p.ink,
    colorDanger: p.brick,
    colorSuccess: d.tealLight,
    colorOverlay: "rgba(15, 24, 38, 0.78)",
    colorBorder: p.rain,
    colorFocus: p.lamp,
    colorStarOn: p.lamp,
    colorStarOff: p.rain,
    fontBody: FONT_BODY,
    fontDisplay: FONT_DISPLAY,
    radiusSm: RADII.sm,
    radiusMd: RADII.md,
    radiusLg: RADII.lg,
    space: SPACING.unit,
    shadowRaised: "0 4px 12px rgba(0, 0, 0, 0.35)",
    durationFast: "120ms",
    durationBase: "240ms",
  };
}

export function paperTokens(highContrast = false): Partial<ThemeTokens> {
  const p = palette(highContrast);
  const d = derived(highContrast);
  return {
    colorText: p.ink,
    colorTextMuted: p.inkSoft,
    colorSurface: p.paper,
    colorSurfaceRaised: p.paperDark,
    colorBorder: p.inkSoft,
    colorFocus: p.lampDeep,
    colorStarOn: p.lampDeep,
    colorStarOff: d.starOffPaper,
  };
}

export const PAPER_SELECTOR = ".wg-sheet, .wg-card, .tlw-paper" as const;

export type RootLike = Pick<HTMLElement, "style">;

export function applyGameTheme(
  options: { highContrast?: boolean; textSize?: keyof typeof TEXT_SCALES } = {},
  root: RootLike = document.documentElement,
): () => void {
  const high = options.highContrast === true;
  const p = palette(high);
  const d = derived(high);
  const removeKit = applyTheme(gameTokens(high), root);
  for (const token of Object.keys(PALETTE_VARS) as PaletteToken[]) {
    root.style.setProperty(PALETTE_VARS[token], p[token]);
  }
  for (const token of Object.keys(DERIVED_VARS) as Array<keyof Derived>) {
    root.style.setProperty(DERIVED_VARS[token], d[token]);
  }
  root.style.setProperty(HIT_MIN_VAR, `${HIT_MIN_PX}px`);
  root.style.setProperty(TEXT_SCALE_VAR, String(TEXT_SCALES[options.textSize ?? "normal"]));
  return () => {
    removeKit();
    for (const name of [...Object.values(PALETTE_VARS), ...Object.values(DERIVED_VARS)]) {
      root.style.removeProperty(name);
    }
    root.style.removeProperty(HIT_MIN_VAR);
    root.style.removeProperty(TEXT_SCALE_VAR);
  };
}

export interface TokenPair {
  id: string;
  fg: string;
  bg: string;
  kind: "text" | "ui";
}

/** Every text and UI colour pairing the stylesheet and components use. */
export function tokenPairs(highContrast = false): TokenPair[] {
  const p = palette(highContrast);
  const d = derived(highContrast);
  const pair = (id: string, fg: string, bg: string, kind: "text" | "ui"): TokenPair => ({
    id,
    fg,
    bg,
    kind,
  });
  return [
    pair("text-on-night", p.paper, p.night, "text"),
    pair("muted-on-night", p.paperDark, p.night, "text"),
    pair("text-on-night-mid", p.paper, p.nightMid, "text"),
    pair("muted-on-night-mid", p.paperDark, p.nightMid, "text"),
    pair("text-on-raised", p.paper, d.nightRaised, "text"),
    pair("muted-on-raised", p.paperDark, d.nightRaised, "text"),
    pair("accent-text-on-lamp", p.ink, p.lamp, "text"),
    pair("lamp-text-on-night", p.lamp, p.night, "text"),
    pair("lamp-text-on-night-mid", p.lamp, p.nightMid, "text"),
    pair("paper-on-brick", p.paper, p.brick, "text"),
    pair("paper-on-teal", p.paper, p.teal, "text"),
    pair("paper-on-sage", p.paper, p.sage, "text"),
    pair("ink-on-paper", p.ink, p.paper, "text"),
    pair("ink-on-paper-dark", p.ink, p.paperDark, "text"),
    pair("ink-soft-on-paper", p.inkSoft, p.paper, "text"),
    pair("ink-soft-on-paper-dark", p.inkSoft, p.paperDark, "text"),
    pair("lamp-deep-on-paper", highContrast ? p.ink : p.lampDeep, p.paper, "text"),
    pair("brick-on-paper", highContrast ? p.ink : p.brick, p.paper, "text"),
    pair("border-on-night", p.rain, p.night, "ui"),
    pair("border-on-night-mid", p.rain, p.nightMid, "ui"),
    pair("border-on-raised", p.rain, d.nightRaised, "ui"),
    pair("border-on-paper", p.inkSoft, p.paper, "ui"),
    pair("border-on-paper-dark", p.inkSoft, p.paperDark, "ui"),
    pair("focus-on-night", p.lamp, p.night, "ui"),
    pair("focus-on-night-mid", p.lamp, p.nightMid, "ui"),
    pair("focus-on-paper", p.lampDeep, p.paper, "ui"),
    pair("lamp-on-night-mid", p.lamp, p.nightMid, "ui"),
    pair("ink-on-lamp-thumb", p.ink, p.lamp, "ui"),
    pair("toggle-thumb-off", p.night, p.rain, "ui"),
    pair("heart-on-paper", p.brick, p.paper, "ui"),
    pair("status-brick-light-on-night-mid", d.brickLight, p.nightMid, "ui"),
    pair("status-teal-light-on-night-mid", d.tealLight, p.nightMid, "ui"),
    pair("star-on-paper", p.lampDeep, p.paper, "ui"),
    pair("star-off-paper", d.starOffPaper, p.paper, "ui"),
    pair("star-on-night", p.lamp, p.night, "ui"),
    pair("star-off-night", p.rain, p.night, "ui"),
  ];
}
