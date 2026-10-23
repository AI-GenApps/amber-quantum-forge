import { applyTheme, type ThemeTokens } from "@web-games/kit";
import type { Colour } from "@web-games/lantern-loops-core";
import { LANTERN_HEX, PALETTE, UNLIT_HEX } from "./palette";

export const HIT_PX = 44;
export const FONT_DISPLAY = '"Fraunces", serif';
export const FONT_BODY = '"Nunito", sans-serif';

/** Dark UI tokens in the art-bible palette. */
export const darkTheme: Readonly<ThemeTokens> = {
  colorBackground: PALETTE.indigoDeep,
  colorSurface: PALETTE.indigo,
  colorSurfaceRaised: PALETTE.indigoRaised,
  colorText: PALETTE.paper,
  colorTextMuted: "#B9BBD6",
  colorAccent: LANTERN_HEX.amber,
  colorAccentText: PALETTE.ink,
  colorDanger: LANTERN_HEX.rose,
  colorSuccess: LANTERN_HEX.jade,
  colorOverlay: "rgba(10, 10, 30, 0.72)",
  colorBorder: "#7C83C4",
  colorFocus: "#8FD0FF",
  colorStarOn: LANTERN_HEX.amber,
  colorStarOff: UNLIT_HEX,
  fontBody: FONT_BODY,
  fontDisplay: FONT_DISPLAY,
  radiusSm: "8px",
  radiusMd: "14px",
  radiusLg: "24px",
  space: "8px",
  shadowRaised: "0 6px 16px rgba(4, 4, 20, 0.5)",
  durationFast: "120ms",
  durationBase: "240ms",
};

export const highContrastTheme: Readonly<ThemeTokens> = {
  ...darkTheme,
  colorBackground: "#0A0B1F",
  colorSurface: "#14163D",
  colorSurfaceRaised: "#20235A",
  colorText: "#FFFFFF",
  colorTextMuted: "#DADCF0",
  colorAccent: "#FFB84D",
  colorAccentText: "#000000",
  colorDanger: "#FF8FA6",
  colorSuccess: "#5EE0B6",
  colorBorder: "#C2C8F0",
  colorFocus: "#FFFFFF",
  colorStarOn: "#FFB84D",
  colorStarOff: "#A9B1E0",
};

export interface GameTokens {
  boardPlate: string;
  boardLine: string;
  ribbon: string;
  ribbonOutline: string;
  unlit: string;
  stoneFill: string;
  stoneText: string;
  ink: string;
  conflict: string;
  lantern: Readonly<Record<Colour, string>>;
  /** Extra outline width in cell units (percent of a 100 unit cell). */
  outline: number;
  glyphsOnTiles: boolean;
}

export const darkGame: Readonly<GameTokens> = {
  boardPlate: PALETTE.indigo,
  boardLine: "#3A3E80",
  ribbon: PALETTE.paper,
  ribbonOutline: PALETTE.ink,
  unlit: UNLIT_HEX,
  stoneFill: PALETTE.paper,
  stoneText: PALETTE.ink,
  ink: PALETTE.ink,
  conflict: LANTERN_HEX.rose,
  lantern: LANTERN_HEX,
  outline: 0,
  glyphsOnTiles: false,
};

export const highContrastGame: Readonly<GameTokens> = {
  ...darkGame,
  boardPlate: "#14163D",
  boardLine: "#8A91C2",
  ribbon: "#FFFFFF",
  ribbonOutline: "#000000",
  unlit: "#A9B1E0",
  stoneFill: "#FFFFFF",
  stoneText: "#000000",
  ink: "#000000",
  conflict: "#FF8FA6",
  lantern: {
    amber: "#FFB84D",
    rose: "#FF8FA6",
    jade: "#5EE0B6",
    azure: "#7CC4FF",
    violet: "#B9A2FF",
  },
  outline: 7,
  glyphsOnTiles: true,
};

export function themeFor(highContrast: boolean): Readonly<ThemeTokens> {
  return highContrast ? highContrastTheme : darkTheme;
}

export function gameTokensFor(highContrast: boolean): Readonly<GameTokens> {
  return highContrast ? highContrastGame : darkGame;
}

export interface ThemeRoot {
  style: CSSStyleDeclaration;
  dataset: DOMStringMap;
}

/** Applies the UI and game custom properties; returns a function that removes them. */
export function applyGameTheme(
  highContrast: boolean,
  root: ThemeRoot = document.documentElement,
): () => void {
  const undo = applyTheme(themeFor(highContrast), root);
  const game = gameTokensFor(highContrast);
  root.style.setProperty("--ll-hit", `${HIT_PX}px`);
  root.style.setProperty("--ll-board-plate", game.boardPlate);
  root.style.setProperty("--ll-board-line", game.boardLine);
  root.style.setProperty("--ll-ribbon", game.ribbon);
  root.style.setProperty("--ll-unlit", game.unlit);
  root.dataset.contrast = highContrast ? "high" : "normal";
  return () => {
    undo();
    for (const name of [
      "--ll-hit",
      "--ll-board-plate",
      "--ll-board-line",
      "--ll-ribbon",
      "--ll-unlit",
    ]) {
      root.style.removeProperty(name);
    }
    delete root.dataset.contrast;
  };
}
