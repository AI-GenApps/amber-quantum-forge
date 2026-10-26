import type { FontFaceSpec } from "@web-games/kit";

export const DISPLAY_FAMILY = "Playfair Display" as const;
export const BODY_FAMILY = "DM Sans" as const;

export const FONT_FAMILIES: readonly string[] = [DISPLAY_FAMILY, BODY_FAMILY];

export const FONT_FACES: readonly FontFaceSpec[] = [
  {
    family: DISPLAY_FAMILY,
    src: "/fonts/playfair-display/PlayfairDisplay-Variable.woff2",
    weight: "400 900",
  },
  {
    family: DISPLAY_FAMILY,
    src: "/fonts/playfair-display/PlayfairDisplay-Italic-Variable.woff2",
    weight: "400 900",
    style: "italic",
  },
  {
    family: BODY_FAMILY,
    src: "/fonts/dm-sans/DMSans-Variable.woff2",
    weight: "400 700",
  },
];

export const FONT_FILES: readonly string[] = FONT_FACES.map((face) => face.src);
