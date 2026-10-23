import type { FontFaceSpec } from "@web-games/kit";

/** The two bundled families. Both are variable fonts, Latin subset, SIL OFL 1.1. */
export const FONT_FACES: readonly FontFaceSpec[] = [
  {
    family: "Fraunces",
    src: "/fonts/fraunces/Fraunces-Variable.woff2",
    weight: "100 900",
    display: "swap",
  },
  {
    family: "Nunito",
    src: "/fonts/nunito/Nunito-Variable.woff2",
    weight: "200 1000",
    display: "swap",
  },
];

export const FONT_FAMILIES: readonly string[] = ["Fraunces", "Nunito"];
