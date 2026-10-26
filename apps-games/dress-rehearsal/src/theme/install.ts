import { themeToCss } from "@web-games/kit";
import { applyGameTheme, PAPER_SELECTOR, paperTokens } from "./tokens";

export const PAPER_STYLE_ID = "dr-paper-tokens" as const;

export interface ThemeDocument {
  documentElement: HTMLElement;
  head: Pick<HTMLElement, "appendChild">;
  createElement(tag: "style"): HTMLStyleElement;
  getElementById(id: string): HTMLElement | null;
}

export interface ThemeState {
  highContrast: boolean;
  reducedMotion: boolean;
}

/** Applies chrome tokens, the paper-surface overrides and the contrast and motion flags. */
export function installTheme(state: ThemeState, doc: ThemeDocument = document): void {
  applyGameTheme({ highContrast: state.highContrast }, doc.documentElement);
  let style = doc.getElementById(PAPER_STYLE_ID);
  if (!style) {
    style = doc.createElement("style");
    style.id = PAPER_STYLE_ID;
    doc.head.appendChild(style);
  }
  style.textContent = themeToCss(paperTokens({ highContrast: state.highContrast }), PAPER_SELECTOR);
  doc.documentElement.dataset.contrast = state.highContrast ? "high" : "normal";
  doc.documentElement.dataset.motion = state.reducedMotion ? "reduced" : "full";
}
