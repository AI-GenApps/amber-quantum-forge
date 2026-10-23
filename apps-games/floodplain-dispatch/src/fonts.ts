import type { FontFaceSpec } from "@web-games/kit";

export const DISPLAY_FAMILY = "Bricolage Grotesque" as const;
export const BODY_FAMILY = "Atkinson Hyperlegible" as const;

export const FONT_FAMILIES: readonly string[] = [DISPLAY_FAMILY, BODY_FAMILY];

export const FONT_FACES: readonly FontFaceSpec[] = [
  {
    family: DISPLAY_FAMILY,
    src: "/fonts/bricolage-grotesque/BricolageGrotesque-Variable.woff2",
    weight: "400 800",
  },
  {
    family: BODY_FAMILY,
    src: "/fonts/atkinson-hyperlegible/AtkinsonHyperlegible-Regular.woff2",
    weight: 400,
  },
  {
    family: BODY_FAMILY,
    src: "/fonts/atkinson-hyperlegible/AtkinsonHyperlegible-Bold.woff2",
    weight: 700,
  },
];
