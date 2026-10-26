import { CHAPTERS, type ThemeId } from "@web-games/dress-rehearsal-core";
import { applyTheme, type ThemeTokens } from "@web-games/kit";

export type PaletteToken =
  | "ink"
  | "inkSoft"
  | "paper"
  | "paper2"
  | "night"
  | "linen"
  | "hairline"
  | "good"
  | "warn"
  | "bad"
  | "star"
  | "focus"
  | "blush"
  | "mist";

export const PALETTE: Readonly<Record<PaletteToken, string>> = {
  ink: "#231d1a",
  inkSoft: "#5a4e46",
  paper: "#f6efe4",
  paper2: "#ebe0cc",
  night: "#1c1816",
  linen: "#e2d5be",
  hairline: "#78674f",
  good: "#2a6540",
  warn: "#7a4f00",
  bad: "#a3322b",
  star: "#c58a12",
  focus: "#1d5fa8",
  blush: "#e9c9bf",
  mist: "#d3dde0",
};

export const PALETTE_VARS: Readonly<Record<PaletteToken, string>> = {
  ink: "--dr-ink",
  inkSoft: "--dr-ink-soft",
  paper: "--dr-paper",
  paper2: "--dr-paper-2",
  night: "--dr-night",
  linen: "--dr-linen",
  hairline: "--dr-hairline",
  good: "--dr-good",
  warn: "--dr-warn",
  bad: "--dr-bad",
  star: "--dr-star",
  focus: "--dr-focus",
  blush: "--dr-blush",
  mist: "--dr-mist",
};

export const NIGHT_SURFACE = "#26201d" as const;
export const NIGHT_RAISED = "#322a26" as const;
export const BORDER_ON_NIGHT = "#a08c6e" as const;

export const ACCENT_VAR = "--dr-accent" as const;

export const ACCENTS: Readonly<Record<ThemeId, string>> = Object.fromEntries(
  CHAPTERS.map((chapter) => [chapter.themeId, chapter.accent]),
) as Record<ThemeId, string>;

export const FONT_BODY = '"DM Sans", sans-serif' as const;
export const FONT_DISPLAY = '"Playfair Display", serif' as const;

export const HIT_MIN_PX = 44 as const;
export const HIT_MIN_VAR = "--wg-hit-min" as const;
export const SLOT_MIN_PX = 88 as const;

export const SPACING = { unit: "8px", gap: "12px", pad: "16px" } as const;
export const RADII = { sm: "6px", md: "10px", lg: "16px" } as const;

export interface ThemeOptions {
  readonly highContrast?: boolean;
}

export function gameTokens(options: ThemeOptions = {}): Partial<ThemeTokens> {
  const high = options.highContrast === true;
  return {
    colorBackground: PALETTE.night,
    colorSurface: NIGHT_SURFACE,
    colorSurfaceRaised: NIGHT_RAISED,
    colorText: PALETTE.paper,
    colorTextMuted: high ? PALETTE.paper : PALETTE.paper2,
    colorAccent: PALETTE.star,
    colorAccentText: PALETTE.ink,
    colorDanger: PALETTE.bad,
    colorSuccess: PALETTE.good,
    colorOverlay: "rgba(28, 24, 22, 0.72)",
    colorBorder: high ? PALETTE.paper : BORDER_ON_NIGHT,
    colorFocus: PALETTE.star,
    colorStarOn: PALETTE.star,
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
  options: ThemeOptions = {},
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

/** Token overrides for surfaces that sit on paper: cards, sheets and panels. */
export function paperTokens(options: ThemeOptions = {}): Partial<ThemeTokens> {
  const high = options.highContrast === true;
  return {
    colorText: PALETTE.ink,
    colorTextMuted: high ? PALETTE.ink : PALETTE.inkSoft,
    colorSurface: PALETTE.paper,
    colorSurfaceRaised: PALETTE.paper2,
    colorBorder: high ? PALETTE.ink : PALETTE.hairline,
    colorFocus: PALETTE.focus,
    colorStarOn: PALETTE.star,
    colorStarOff: PALETTE.hairline,
    colorAccentText: PALETTE.ink,
  };
}

export const PAPER_SELECTOR =
  ".wg-sheet, .wg-card, .dr-paper, .dr-panel, .dr-card, .dr-tray, .dr-meter, .dr-board, .dr-chip" as const;

export function accentFor(themeId: ThemeId): string {
  return ACCENTS[themeId];
}

export interface TokenPair {
  readonly id: string;
  readonly fg: string;
  readonly bg: string;
  readonly kind: "text" | "ui";
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
    pair("ink-on-paper", p.ink, p.paper, "text"),
    pair("ink-on-paper2", p.ink, p.paper2, "text"),
    pair("ink-on-linen", p.ink, p.linen, "text"),
    pair("ink-on-blush", p.ink, p.blush, "text"),
    pair("ink-on-mist", p.ink, p.mist, "text"),
    pair("ink-soft-on-paper", p.inkSoft, p.paper, "text"),
    pair("ink-soft-on-paper2", p.inkSoft, p.paper2, "text"),
    pair("ink-soft-on-linen", p.inkSoft, p.linen, "text"),
    pair("ink-soft-on-blush", p.inkSoft, p.blush, "text"),
    pair("ink-soft-on-mist", p.inkSoft, p.mist, "text"),
    pair("paper-on-night", p.paper, p.night, "text"),
    pair("paper-on-night-surface", p.paper, NIGHT_SURFACE, "text"),
    pair("paper-on-night-raised", p.paper, NIGHT_RAISED, "text"),
    pair("paper2-on-night", p.paper2, p.night, "text"),
    pair("paper2-on-night-surface", p.paper2, NIGHT_SURFACE, "text"),
    pair("paper2-on-night-raised", p.paper2, NIGHT_RAISED, "text"),
    pair("good-on-paper", p.good, p.paper, "text"),
    pair("good-on-paper2", p.good, p.paper2, "text"),
    pair("bad-on-paper", p.bad, p.paper, "text"),
    pair("bad-on-paper2", p.bad, p.paper2, "text"),
    pair("warn-on-paper", p.warn, p.paper, "text"),
    pair("warn-on-paper2", p.warn, p.paper2, "text"),
    pair("paper-on-good", p.paper, p.good, "text"),
    pair("paper-on-bad", p.paper, p.bad, "text"),
    pair("paper-on-warn", p.paper, p.warn, "text"),
    pair("ink-on-star", p.ink, p.star, "text"),
    pair("star-on-night", p.star, p.night, "text"),
    pair("star-on-night-surface", p.star, NIGHT_SURFACE, "text"),
    pair("focus-on-paper", p.focus, p.paper, "ui"),
    pair("focus-on-paper2", p.focus, p.paper2, "ui"),
    pair("focus-on-linen", p.focus, p.linen, "ui"),
    pair("focus-ring-on-night", p.star, p.night, "ui"),
    pair("hairline-on-paper", p.hairline, p.paper, "ui"),
    pair("hairline-on-paper2", p.hairline, p.paper2, "ui"),
    pair("hairline-on-linen", p.hairline, p.linen, "ui"),
    pair("border-on-night", BORDER_ON_NIGHT, p.night, "ui"),
    pair("border-on-night-surface", BORDER_ON_NIGHT, NIGHT_SURFACE, "ui"),
    pair("border-on-night-raised", BORDER_ON_NIGHT, NIGHT_RAISED, "ui"),
    pair("star-outline-on-star", p.ink, p.star, "ui"),
    pair("star-on-night-ui", p.star, p.night, "ui"),
    pair("good-icon-on-paper", p.good, p.paper, "ui"),
    pair("bad-icon-on-paper", p.bad, p.paper, "ui"),
    pair("toggle-thumb-on", p.ink, p.star, "ui"),
    pair("toggle-thumb-off", p.ink, p.hairline, "ui"),
    pair("toggle-outline-on-paper", p.ink, p.paper, "ui"),
  ];
}

export function accentPairs(themeId: ThemeId): TokenPair[] {
  const accent = ACCENTS[themeId];
  const p = PALETTE;
  return [
    { id: `${themeId}-paper-on-accent`, fg: p.paper, bg: accent, kind: "text" },
    { id: `${themeId}-accent-on-paper`, fg: accent, bg: p.paper, kind: "text" },
    { id: `${themeId}-accent-on-linen`, fg: accent, bg: p.linen, kind: "ui" },
    { id: `${themeId}-accent-border-on-paper`, fg: accent, bg: p.paper, kind: "ui" },
  ];
}
