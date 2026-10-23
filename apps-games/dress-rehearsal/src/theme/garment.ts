import type { Colour } from "@web-games/dress-rehearsal-core";
import { mixHex } from "./contrast";
import { PALETTE } from "./tokens";

/** Fill colour for each piece colour tag; neutrals first, then the 12-step wheel. */
export const COLOUR_HEX: Readonly<Record<Colour, string>> = {
  black: "#3a332f",
  white: "#fbf8f2",
  cream: "#f1e6cc",
  grey: "#9a9893",
  navy: "#26385e",
  tan: "#c2a07a",
  red: "#c0392b",
  orange: "#e07b2a",
  yellow: "#e8b82e",
  lime: "#9bb83a",
  green: "#3f8f5a",
  mint: "#7fcfb0",
  teal: "#2f9a9a",
  sky: "#6fb4e0",
  blue: "#2f5fb8",
  violet: "#7a52b8",
  magenta: "#c2318c",
  pink: "#ef9bb5",
};

export const COLOUR_NAME: Readonly<Record<Colour, string>> = {
  black: "Black",
  white: "White",
  cream: "Cream",
  grey: "Grey",
  navy: "Navy",
  tan: "Tan",
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  lime: "Lime",
  green: "Green",
  mint: "Mint",
  teal: "Teal",
  sky: "Sky",
  blue: "Blue",
  violet: "Violet",
  magenta: "Magenta",
  pink: "Pink",
};

export interface GarmentPaint {
  readonly main: string;
  readonly shade: string;
  readonly light: string;
  readonly ink: string;
}

export function garmentPaint(colour: Colour): GarmentPaint {
  const main = COLOUR_HEX[colour];
  return {
    main,
    shade: mixHex(main, PALETTE.ink, 0.22),
    light: mixHex(main, PALETTE.paper, 0.35),
    ink: PALETTE.ink,
  };
}
