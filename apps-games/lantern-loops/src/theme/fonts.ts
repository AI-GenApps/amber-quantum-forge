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

export interface FontCredit {
  family: string;
  role: "display" | "body";
  licence: string;
  url: string;
  licenceFile: string;
}

/** Where each bundled font comes from, for the About screen. */
export const FONT_CREDITS: readonly FontCredit[] = [
  {
    family: "Fraunces",
    role: "display",
    licence: "SIL Open Font License 1.1",
    url: "https://github.com/google/fonts/tree/main/ofl/fraunces",
    licenceFile: "/fonts/fraunces/OFL.txt",
  },
  {
    family: "Nunito",
    role: "body",
    licence: "SIL Open Font License 1.1",
    url: "https://github.com/google/fonts/tree/main/ofl/nunito",
    licenceFile: "/fonts/nunito/OFL.txt",
  },
];
