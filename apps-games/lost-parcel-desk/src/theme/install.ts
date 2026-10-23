import { applyTheme } from "@web-games/kit";
import { deskPalette, deskTokens } from "./deskThemes";
import { HIT_MIN_PX, HIT_MIN_VAR, PALETTE, PALETTE_VARS, type PaletteToken } from "./tokens";

export interface ThemeState {
  themeId: string;
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface ThemeRoot {
  style: CSSStyleDeclaration;
  dataset: DOMStringMap;
}

const DESK_VARS = {
  blotter: "--lp-blotter",
  blotterEdge: "--lp-blotter-edge",
  stamp: "--lp-stamp",
  thumbOn: "--lp-thumb-on",
  thumbOff: "--lp-thumb-off",
  warn: "--lp-warn",
  muted: "--lp-muted",
  raised: "--lp-raised",
  surface: "--lp-surface",
  background: "--lp-background",
  text: "--lp-text",
  accent: "--lp-accent",
  border: "--lp-border",
} as const;

/** Sets the kit tokens, the palette and desk properties, the hit token and the contrast and motion flags. */
export function installTheme(
  state: ThemeState,
  root: ThemeRoot = document.documentElement,
): () => void {
  const desk = deskPalette(state.themeId);
  const removeKit = applyTheme(deskTokens(state.themeId, state.highContrast), root);
  for (const token of Object.keys(PALETTE) as PaletteToken[]) {
    root.style.setProperty(PALETTE_VARS[token], PALETTE[token]);
  }
  for (const key of Object.keys(DESK_VARS) as (keyof typeof DESK_VARS)[]) {
    root.style.setProperty(DESK_VARS[key], desk[key]);
  }
  root.style.setProperty(HIT_MIN_VAR, `${HIT_MIN_PX}px`);
  root.dataset.contrast = state.highContrast ? "high" : "normal";
  root.dataset.motion = state.reducedMotion ? "reduced" : "full";
  root.dataset.desk = desk.id;
  root.dataset.tone = desk.dark ? "dark" : "light";
  return () => {
    removeKit();
    for (const name of [...Object.values(PALETTE_VARS), ...Object.values(DESK_VARS)]) {
      root.style.removeProperty(name);
    }
    root.style.removeProperty(HIT_MIN_VAR);
  };
}
