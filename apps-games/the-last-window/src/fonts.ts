import type { FontFaceSpec } from "@web-games/kit";

export const DISPLAY_FAMILY = "Young Serif" as const;
export const BODY_FAMILY = "Nunito Sans" as const;

export const FONT_FAMILIES: readonly string[] = [DISPLAY_FAMILY, BODY_FAMILY];

export const FONT_FACES: readonly FontFaceSpec[] = [
  {
    family: DISPLAY_FAMILY,
    src: "/fonts/young-serif/YoungSerif-Regular.woff2",
    weight: 400,
  },
  {
    family: BODY_FAMILY,
    src: "/fonts/nunito-sans/NunitoSans-Variable.woff2",
    weight: "400 800",
  },
];
