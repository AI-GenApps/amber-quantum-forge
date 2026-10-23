import { applyTheme, type ThemeTokens } from "@web-games/kit";

export type PaletteToken =
  | "ink"
  | "paper"
  | "paper2"
  | "night"
  | "meadow"
  | "meadowDeep"
  | "ochre"
  | "ochreDeep"
  | "clay"
  | "water"
  | "waterDeep"
  | "waterLight"
  | "rock"
  | "sea";

export const PALETTE: Readonly<Record<PaletteToken, string>> = {
  ink: "#1f2b22",
  paper: "#f4ecd8",
  paper2: "#e8dcc0",
  night: "#18231d",
  meadow: "#8aa468",
  meadowDeep: "#4f6b3c",
  ochre: "#c8923a",
  ochreDeep: "#7d5516",
  clay: "#a7432c",
  water: "#3b8dc4",
  waterDeep: "#1f5f8f",
  waterLight: "#a5d3ee",
  rock: "#7d776b",
  sea: "#2a6c9c",
};

export const PALETTE_VARS: Readonly<Record<PaletteToken, string>> = {
  ink: "--fd-ink",
  paper: "--fd-paper",
  paper2: "--fd-paper-2",
  night: "--fd-night",
  meadow: "--fd-meadow",
  meadowDeep: "--fd-meadow-deep",
  ochre: "--fd-ochre",
  ochreDeep: "--fd-ochre-deep",
  clay: "--fd-clay",
  water: "--fd-water",
  waterDeep: "--fd-water-deep",
  waterLight: "--fd-water-light",
  rock: "--fd-rock",
  sea: "--fd-sea",
};

export const NIGHT_RAISED = "#26382d" as const;
export const NIGHT_SURFACE = "#1e2b24" as const;
export const BORDER_ON_NIGHT = "#a29c8d" as const;
export const MUTED_ON_PAPER = "#3b5430" as const;

export const FONT_BODY = '"Atkinson Hyperlegible", sans-serif' as const;
export const FONT_DISPLAY = '"Bricolage Grotesque", sans-serif' as const;

export const HIT_MIN_PX = 44 as const;
export const HIT_MIN_VAR = "--wg-hit-min" as const;

export const SPACING = { unit: "8px", gap: "12px", pad: "16px" } as const;
export const RADII = { sm: "6px", md: "12px", lg: "18px" } as const;

export function gameTokens(
  options: { highContrast?: boolean; background?: string } = {},
): Partial<ThemeTokens> {
  const high = options.highContrast === true;
  return {
    colorBackground: options.background ?? PALETTE.night,
    colorSurface: NIGHT_SURFACE,
    colorSurfaceRaised: NIGHT_RAISED,
    colorText: PALETTE.paper,
    colorTextMuted: high ? PALETTE.paper : PALETTE.paper2,
    colorAccent: PALETTE.ochre,
    colorAccentText: PALETTE.ink,
    colorDanger: PALETTE.clay,
    colorSuccess: PALETTE.meadow,
    colorOverlay: "rgba(24, 35, 29, 0.72)",
    colorBorder: high ? PALETTE.paper : BORDER_ON_NIGHT,
    colorFocus: PALETTE.waterLight,
    colorStarOn: PALETTE.ochre,
    colorStarOff: BORDER_ON_NIGHT,
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

export type RootLike = Pick<HTMLElement, "style">;

export function applyGameTheme(
  options: { highContrast?: boolean; background?: string } = {},
  root: RootLike = document.documentElement,
): () => void {
  const removeKit = applyTheme(gameTokens(options), root);
  for (const token of Object.keys(PALETTE) as PaletteToken[]) {
    root.style.setProperty(PALETTE_VARS[token], PALETTE[token]);
  }
  root.style.setProperty(HIT_MIN_VAR, `${HIT_MIN_PX}px`);
  return () => {
    removeKit();
    for (const name of Object.values(PALETTE_VARS)) root.style.removeProperty(name);
    root.style.removeProperty(HIT_MIN_VAR);
  };
}

export function paperTokens(highContrast = false): Partial<ThemeTokens> {
  return {
    colorText: PALETTE.ink,
    colorTextMuted: highContrast ? PALETTE.ink : MUTED_ON_PAPER,
    colorSurface: PALETTE.paper,
    colorSurfaceRaised: PALETTE.paper2,
    colorBorder: highContrast ? PALETTE.ink : PALETTE.rock,
    colorFocus: PALETTE.waterDeep,
    colorStarOn: PALETTE.ochreDeep,
    colorStarOff: PALETTE.rock,
  };
}

export const PAPER_SELECTOR =
  ".wg-sheet, .wg-card, .fd-paper, .fd-card, .fd-tile, .fd-panel, .fd-row" as const;

export interface TokenPair {
  id: string;
  fg: string;
  bg: string;
  kind: "text" | "ui";
}

export function chromePairs(): TokenPair[] {
  const p = PALETTE;
  const pair = (id: string, fg: string, bg: string, kind: "text" | "ui"): TokenPair => ({
    id,
    fg,
    bg,
    kind,
  });
  return [
    pair("text-on-night", p.paper, p.night, "text"),
    pair("muted-on-night", p.paper2, p.night, "text"),
    pair("text-on-surface", p.paper, NIGHT_SURFACE, "text"),
    pair("muted-on-surface", p.paper2, NIGHT_SURFACE, "text"),
    pair("text-on-raised", p.paper, NIGHT_RAISED, "text"),
    pair("success-on-night", p.meadow, p.night, "text"),
    pair("accent-text", p.ink, p.ochre, "text"),
    pair("danger-text", p.paper, p.clay, "text"),
    pair("ink-on-paper", p.ink, p.paper, "text"),
    pair("ink-on-paper2", p.ink, p.paper2, "text"),
    pair("muted-on-paper", MUTED_ON_PAPER, p.paper, "text"),
    pair("muted-on-paper2", MUTED_ON_PAPER, p.paper2, "text"),
    pair("warning-on-paper", p.ochreDeep, p.paper, "text"),
    pair("paper-on-meadow-deep", p.paper, p.meadowDeep, "text"),
    pair("paper-on-water-deep", p.paper, p.waterDeep, "text"),
    pair("paper-on-ochre-deep", p.paper, p.ochreDeep, "text"),
    pair("border-on-night", BORDER_ON_NIGHT, p.night, "ui"),
    pair("border-on-surface", BORDER_ON_NIGHT, NIGHT_SURFACE, "ui"),
    pair("border-on-raised", BORDER_ON_NIGHT, NIGHT_RAISED, "ui"),
    pair("border-on-paper", p.rock, p.paper, "ui"),
    pair("focus-on-night", p.waterLight, p.night, "ui"),
    pair("focus-on-paper", p.waterDeep, p.paper, "ui"),
    pair("toggle-track-on", p.ochre, p.night, "ui"),
    pair("toggle-thumb-on", p.ink, p.ochre, "ui"),
    pair("toggle-thumb-off", p.ink, p.rock, "ui"),
    pair("star-on-night", p.ochre, p.night, "ui"),
    pair("star-on-paper", p.ochreDeep, p.paper, "ui"),
    pair("star-off-night", BORDER_ON_NIGHT, p.night, "ui"),
    pair("star-off-paper", p.rock, p.paper, "ui"),
  ];
}
