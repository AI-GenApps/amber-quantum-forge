import type { ThemeTokens } from "@web-games/kit";
import {
  DERIVED,
  FONT_BODY,
  FONT_DISPLAY,
  PALETTE,
  RADII,
  SPACING,
  type TokenPair,
} from "./tokens";

export interface DeskPalette {
  id: string;
  dark: boolean;
  background: string;
  surface: string;
  raised: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  border: string;
  focus: string;
  warn: string;
  blotter: string;
  blotterEdge: string;
  stamp: string;
  thumbOn: string;
  thumbOff: string;
}

const P = PALETTE;

function light(
  id: string,
  accent: string,
  blotter: string,
  blotterEdge: string,
  focus: string,
): DeskPalette {
  return {
    id,
    dark: false,
    background: P.cream2,
    surface: P.cream,
    raised: P.cream,
    text: P.ink,
    muted: DERIVED.mutedOnLight,
    accent,
    accentText: P.cream,
    border: DERIVED.lineStrong,
    focus,
    warn: P.mustardDeep,
    blotter,
    blotterEdge,
    stamp: P.brick,
    thumbOn: P.cream,
    thumbOff: P.cream,
  };
}

function dark(id: string, accent: string, blotterEdge: string, stamp: string): DeskPalette {
  return {
    id,
    dark: true,
    background: P.night,
    surface: P.ink,
    raised: DERIVED.raisedDark,
    text: P.cream,
    muted: DERIVED.mutedOnDark,
    accent,
    accentText: P.ink,
    border: P.line,
    focus: P.mustardLight,
    warn: P.mustardLight,
    blotter: P.ink,
    blotterEdge,
    stamp,
    thumbOn: P.ink,
    thumbOff: P.cream,
  };
}

export const DESK_THEMES: Readonly<Record<string, DeskPalette>> = {
  "mustard-riso": light("mustard-riso", P.mustardDeep, P.mustard, P.mustardDeep, P.tealDeep),
  "teal-blotter": light("teal-blotter", P.tealDeep, P.teal, P.tealDeep, P.tealDeep),
  "brick-ledger": light("brick-ledger", P.brickDeep, P.brick, P.brickDeep, P.tealDeep),
  "midnight-sorting-room": dark("midnight-sorting-room", P.mustard, P.mustard, P.mustard),
  "gold-rubber-stamp": dark("gold-rubber-stamp", P.mustardLight, P.mustardLight, P.mustardLight),
};

export function deskPalette(themeId: string): DeskPalette {
  return DESK_THEMES[themeId] ?? (DESK_THEMES["mustard-riso"] as DeskPalette);
}

export function deskTokens(themeId: string, highContrast = false): Partial<ThemeTokens> {
  const d = deskPalette(themeId);
  return {
    colorBackground: d.background,
    colorSurface: d.surface,
    colorSurfaceRaised: d.raised,
    colorText: d.text,
    colorTextMuted: highContrast ? d.text : d.muted,
    colorAccent: d.accent,
    colorAccentText: d.accentText,
    colorDanger: P.brick,
    colorSuccess: P.tealDeep,
    colorOverlay: "rgba(20, 26, 34, 0.74)",
    colorBorder: highContrast ? d.text : d.border,
    colorFocus: d.focus,
    colorStarOn: d.dark ? P.mustardLight : P.mustardDeep,
    colorStarOff: d.border,
    fontBody: FONT_BODY,
    fontDisplay: FONT_DISPLAY,
    radiusSm: RADII.sm,
    radiusMd: RADII.md,
    radiusLg: RADII.lg,
    space: SPACING.unit,
    shadowRaised: "0 3px 0 rgba(20, 26, 34, 0.35)",
    durationFast: "120ms",
    durationBase: "240ms",
  };
}

/** Paper surfaces (cards, notes, labels) are cream with ink text in every desk theme. */
export const PAPER_PAIRS: readonly TokenPair[] = [
  { id: "ink-on-cream", fg: P.ink, bg: P.cream, kind: "text" },
  { id: "ink-on-cream2", fg: P.ink, bg: P.cream2, kind: "text" },
  { id: "warning-on-cream", fg: P.mustardDeep, bg: P.cream, kind: "text" },
  { id: "warning-on-cream2", fg: P.mustardDeep, bg: P.cream2, kind: "text" },
  { id: "muted-on-cream", fg: DERIVED.mutedOnLight, bg: P.cream, kind: "text" },
  { id: "muted-on-cream2", fg: DERIVED.mutedOnLight, bg: P.cream2, kind: "text" },
  { id: "stamp-on-cream", fg: P.brick, bg: P.cream, kind: "text" },
  { id: "cream-on-fits", fg: P.cream, bg: P.tealDeep, kind: "text" },
  { id: "cream-on-rules-out", fg: P.cream, bg: P.brick, kind: "text" },
  { id: "cream-on-danger-deep", fg: P.cream, bg: P.brickDeep, kind: "text" },
  { id: "ink-on-pin", fg: P.ink, bg: P.mustardLight, kind: "text" },
  { id: "ink-on-mustard", fg: P.ink, bg: P.mustard, kind: "text" },
  { id: "ink-on-tealLight", fg: P.ink, bg: P.tealLight, kind: "text" },
  { id: "hairline-on-cream", fg: P.line, bg: P.cream, kind: "ui" },
  { id: "strong-line-on-cream", fg: DERIVED.lineStrong, bg: P.cream, kind: "ui" },
  { id: "strong-line-on-cream2", fg: DERIVED.lineStrong, bg: P.cream2, kind: "ui" },
  { id: "pin-outline-on-pin", fg: P.ink, bg: P.mustardLight, kind: "ui" },
  { id: "hotspot-ring-on-ink", fg: P.mustardLight, bg: P.ink, kind: "ui" },
  { id: "hotspot-ring-on-cream", fg: P.ink, bg: P.cream, kind: "ui" },
];

/** Every foreground and background pair a desk theme puts on screen. */
export function themePairs(themeId: string): TokenPair[] {
  const d = deskPalette(themeId);
  const pair = (id: string, fg: string, bg: string, kind: "text" | "ui"): TokenPair => ({
    id: `${themeId}:${id}`,
    fg,
    bg,
    kind,
  });
  return [
    pair("text-on-background", d.text, d.background, "text"),
    pair("muted-on-background", d.muted, d.background, "text"),
    pair("text-on-surface", d.text, d.surface, "text"),
    pair("muted-on-surface", d.muted, d.surface, "text"),
    pair("text-on-raised", d.text, d.raised, "text"),
    pair("muted-on-raised", d.muted, d.raised, "text"),
    pair("accent-text", d.accentText, d.accent, "text"),
    pair("danger-text", P.cream, P.brick, "text"),
    pair("warn-on-background", d.warn, d.background, "text"),
    pair("warn-on-surface", d.warn, d.surface, "text"),
    pair("border-on-background", d.border, d.background, "ui"),
    pair("border-on-surface", d.border, d.surface, "ui"),
    pair("border-on-raised", d.border, d.raised, "ui"),
    pair("focus-on-background", d.focus, d.background, "ui"),
    pair("focus-on-surface", d.focus, d.surface, "ui"),
    pair("toggle-track-on", d.accent, d.background, "ui"),
    pair("toggle-thumb-on", d.thumbOn, d.accent, "ui"),
    pair("toggle-track-off", d.border, d.background, "ui"),
    pair("toggle-thumb-off", d.thumbOff, d.border, "ui"),
    pair("stamp-on-background", d.stamp, d.background, "ui"),
    pair("blotter-edge-on-background", d.blotterEdge, d.background, "ui"),
  ];
}
