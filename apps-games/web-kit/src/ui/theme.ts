export interface ThemeTokens {
  colorBackground: string;
  colorSurface: string;
  colorSurfaceRaised: string;
  colorText: string;
  colorTextMuted: string;
  colorAccent: string;
  colorAccentText: string;
  colorDanger: string;
  colorSuccess: string;
  colorOverlay: string;
  colorBorder: string;
  colorFocus: string;
  colorStarOn: string;
  colorStarOff: string;
  fontBody: string;
  fontDisplay: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  space: string;
  shadowRaised: string;
  durationFast: string;
  durationBase: string;
}

export type ThemeToken = keyof ThemeTokens;

export const TOKEN_VARS: Readonly<Record<ThemeToken, string>> = {
  colorBackground: "--wg-color-background",
  colorSurface: "--wg-color-surface",
  colorSurfaceRaised: "--wg-color-surface-raised",
  colorText: "--wg-color-text",
  colorTextMuted: "--wg-color-text-muted",
  colorAccent: "--wg-color-accent",
  colorAccentText: "--wg-color-accent-text",
  colorDanger: "--wg-color-danger",
  colorSuccess: "--wg-color-success",
  colorOverlay: "--wg-color-overlay",
  colorBorder: "--wg-color-border",
  colorFocus: "--wg-color-focus",
  colorStarOn: "--wg-color-star-on",
  colorStarOff: "--wg-color-star-off",
  fontBody: "--wg-font-body",
  fontDisplay: "--wg-font-display",
  radiusSm: "--wg-radius-sm",
  radiusMd: "--wg-radius-md",
  radiusLg: "--wg-radius-lg",
  space: "--wg-space",
  shadowRaised: "--wg-shadow-raised",
  durationFast: "--wg-duration-fast",
  durationBase: "--wg-duration-base",
};

/**
 * Structural placeholder values so the primitives render before a game supplies its own theme.
 * Games always pass their own tokens (with their bundled fonts) to `applyTheme`.
 */
export const neutralTheme: Readonly<ThemeTokens> = {
  colorBackground: "#16181d",
  colorSurface: "#21242c",
  colorSurfaceRaised: "#2c303a",
  colorText: "#f3f4f6",
  colorTextMuted: "#a3a8b4",
  colorAccent: "#f2b134",
  colorAccentText: "#1b1405",
  colorDanger: "#e5584f",
  colorSuccess: "#4cb782",
  colorOverlay: "rgba(0, 0, 0, 0.6)",
  colorBorder: "#3a3f4b",
  colorFocus: "#8ab4ff",
  colorStarOn: "#f2b134",
  colorStarOff: "#454a57",
  fontBody: "sans-serif",
  fontDisplay: "sans-serif",
  radiusSm: "6px",
  radiusMd: "12px",
  radiusLg: "20px",
  space: "8px",
  shadowRaised: "0 4px 12px rgba(0, 0, 0, 0.35)",
  durationFast: "120ms",
  durationBase: "240ms",
};

/** `var(--wg-...)` reference for a token, for inline styles and game CSS. */
export function themeVar(token: ThemeToken): string {
  return `var(${TOKEN_VARS[token]})`;
}

/** CSS rule text that declares the given tokens as custom properties. */
export function themeToCss(tokens: Partial<ThemeTokens>, selector = ":root"): string {
  const lines = (Object.keys(tokens) as ThemeToken[])
    .filter((token) => tokens[token] !== undefined)
    .map((token) => `  ${TOKEN_VARS[token]}: ${tokens[token]};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}

/** Sets the tokens as CSS custom properties on `root` and returns a function that removes them. */
export function applyTheme(
  tokens: Partial<ThemeTokens>,
  root: Pick<HTMLElement, "style"> = document.documentElement,
): () => void {
  const applied: string[] = [];
  for (const token of Object.keys(tokens) as ThemeToken[]) {
    const value = tokens[token];
    if (value === undefined) continue;
    root.style.setProperty(TOKEN_VARS[token], value);
    applied.push(TOKEN_VARS[token]);
  }
  return () => {
    for (const name of applied) root.style.removeProperty(name);
  };
}
