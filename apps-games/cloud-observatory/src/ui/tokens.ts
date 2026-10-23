import { applyTheme, type ThemeTokens } from "@web-games/kit";

export const PALETTE = {
  ink950: "#0B1226",
  ink900: "#101A33",
  ink800: "#172445",
  ink700: "#22335C",
  line: "#3A4F86",
  parchment: "#F3E9D2",
  parchmentDim: "#C9BFA4",
  muted: "#A39E8F",
  gold: "#D8A94B",
  goldLight: "#EBCB85",
  teal: "#6FB3BD",
  rose: "#D98BA0",
  danger: "#F08A78",
  success: "#8FCB9B",
  starOff: "#5B6B95",
} as const;

export const FONT_FAMILIES = ["Cormorant Garamond", "Manrope"] as const;

export const FONT_STACKS = {
  display: '"Cormorant Garamond", serif',
  body: '"Manrope", sans-serif',
} as const;

export const SPACING = { unit: "8px", hit: "44px" } as const;
export const RADII = { sm: "6px", md: "12px", lg: "20px" } as const;
export const DURATIONS = { fast: "120ms", base: "240ms" } as const;

export const themeTokens: ThemeTokens = {
  colorBackground: PALETTE.ink900,
  colorSurface: PALETTE.ink800,
  colorSurfaceRaised: PALETTE.ink700,
  colorText: PALETTE.parchment,
  colorTextMuted: PALETTE.parchmentDim,
  colorAccent: PALETTE.gold,
  colorAccentText: PALETTE.ink950,
  colorDanger: PALETTE.danger,
  colorSuccess: PALETTE.success,
  colorOverlay: "rgba(11, 18, 38, 0.8)",
  colorBorder: PALETTE.line,
  colorFocus: PALETTE.goldLight,
  colorStarOn: PALETTE.gold,
  colorStarOff: PALETTE.starOff,
  fontBody: FONT_STACKS.body,
  fontDisplay: FONT_STACKS.display,
  radiusSm: RADII.sm,
  radiusMd: RADII.md,
  radiusLg: RADII.lg,
  space: SPACING.unit,
  shadowRaised: "0 4px 14px rgba(5, 8, 20, 0.5)",
  durationFast: DURATIONS.fast,
  durationBase: DURATIONS.base,
};

/** Parchment on solid navy, no washes behind text, brighter borders. */
export const highContrastTokens: ThemeTokens = {
  ...themeTokens,
  colorBackground: PALETTE.ink950,
  colorSurface: PALETTE.ink950,
  colorSurfaceRaised: PALETTE.ink950,
  colorTextMuted: PALETTE.parchment,
  colorOverlay: "rgba(11, 18, 38, 0.94)",
  colorBorder: PALETTE.parchmentDim,
  colorStarOff: PALETTE.parchmentDim,
};

export function tokensFor(highContrast: boolean): ThemeTokens {
  return highContrast ? highContrastTokens : themeTokens;
}

/** App-level custom properties next to the kit's `--wg-*` tokens. */
export function appVars(highContrast: boolean): Readonly<Record<string, string>> {
  return {
    "--co-hit": SPACING.hit,
    "--co-ink-950": PALETTE.ink950,
    "--co-ink-900": PALETTE.ink900,
    "--co-gold-light": PALETTE.goldLight,
    "--co-teal": PALETTE.teal,
    "--co-rose": PALETTE.rose,
    "--co-muted": highContrast ? PALETTE.parchment : PALETTE.muted,
    "--co-line-width": highContrast ? "3.5" : "2",
    "--co-wash-opacity": highContrast ? "0" : "1",
  };
}

export interface TextPair {
  readonly name: string;
  readonly foreground: string;
  readonly background: string;
}

/** Every foreground and background combination that text is drawn in; the a11y test checks each. */
export function textPairs(tokens: ThemeTokens, highContrast: boolean): TextPair[] {
  const muted = appVars(highContrast)["--co-muted"] as string;
  const pair = (name: string, foreground: string, background: string): TextPair => ({
    name,
    foreground,
    background,
  });
  return [
    pair("text on background", tokens.colorText, tokens.colorBackground),
    pair("text on surface", tokens.colorText, tokens.colorSurface),
    pair("text on raised surface", tokens.colorText, tokens.colorSurfaceRaised),
    pair("muted text on background", tokens.colorTextMuted, tokens.colorBackground),
    pair("muted text on surface", tokens.colorTextMuted, tokens.colorSurface),
    pair("muted text on raised surface", tokens.colorTextMuted, tokens.colorSurfaceRaised),
    pair("tertiary text on background", muted, tokens.colorBackground),
    pair("tertiary text on surface", muted, tokens.colorSurface),
    pair("accent text on accent", tokens.colorAccentText, tokens.colorAccent),
    pair("accent text on danger", tokens.colorAccentText, tokens.colorDanger),
    pair("accent on background", tokens.colorAccent, tokens.colorBackground),
    pair("accent on surface", tokens.colorAccent, tokens.colorSurface),
    pair("danger on background", tokens.colorDanger, tokens.colorBackground),
    pair("danger on surface", tokens.colorDanger, tokens.colorSurface),
    pair("success on background", tokens.colorSuccess, tokens.colorBackground),
    pair("success on surface", tokens.colorSuccess, tokens.colorSurface),
    pair("focus ring on background", tokens.colorFocus, tokens.colorBackground),
    pair("gold light on surface", PALETTE.goldLight, tokens.colorSurface),
    pair("teal on background", PALETTE.teal, tokens.colorBackground),
  ];
}

export function applyAppTheme(
  highContrast: boolean,
  root: HTMLElement = document.documentElement,
): void {
  applyTheme(tokensFor(highContrast), root);
  for (const [name, value] of Object.entries(appVars(highContrast))) {
    root.style.setProperty(name, value);
  }
  root.dataset.contrast = highContrast ? "high" : "normal";
}
