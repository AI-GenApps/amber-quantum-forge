export type PaletteToken =
  | "ink"
  | "night"
  | "cream"
  | "cream2"
  | "mustard"
  | "mustardDeep"
  | "mustardLight"
  | "teal"
  | "tealDeep"
  | "tealLight"
  | "brick"
  | "brickDeep"
  | "line";

export const PALETTE: Readonly<Record<PaletteToken, string>> = {
  ink: "#1c2330",
  night: "#141a22",
  cream: "#f3e9d2",
  cream2: "#e4d6b4",
  mustard: "#d9a21b",
  mustardDeep: "#7a5200",
  mustardLight: "#f0cf7a",
  teal: "#1f7a7a",
  tealDeep: "#135a5c",
  tealLight: "#8fd0c8",
  brick: "#a8382a",
  brickDeep: "#7d2519",
  line: "#8a7a52",
};

export const PALETTE_VARS: Readonly<Record<PaletteToken, string>> = {
  ink: "--lp-ink",
  night: "--lp-night",
  cream: "--lp-cream",
  cream2: "--lp-cream-2",
  mustard: "--lp-mustard",
  mustardDeep: "--lp-mustard-deep",
  mustardLight: "--lp-mustard-light",
  teal: "--lp-teal",
  tealDeep: "--lp-teal-deep",
  tealLight: "--lp-teal-light",
  brick: "--lp-brick",
  brickDeep: "--lp-brick-deep",
  line: "--lp-line",
};

/** Neutrals derived from the palette for muted text, raised dark surfaces and functional borders. */
export const DERIVED = {
  mutedOnLight: "#3d4658",
  mutedOnDark: "#d6cdb4",
  raisedDark: "#252e3d",
  lineStrong: "#6e6040",
} as const;

export const FONT_BODY = '"IBM Plex Sans", system-ui, sans-serif' as const;
export const FONT_DISPLAY = '"Courier Prime", "Courier New", monospace' as const;

export const HIT_MIN_PX = 44 as const;
export const HOTSPOT_PX = 48 as const;
export const HIT_MIN_VAR = "--wg-hit-min" as const;

export const SPACING = { unit: "8px", gap: "12px", pad: "16px" } as const;
export const RADII = { sm: "4px", md: "8px", lg: "14px" } as const;

export interface TokenPair {
  id: string;
  fg: string;
  bg: string;
  kind: "text" | "ui";
}
