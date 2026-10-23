import type { FontFaceSpec } from "@web-games/kit";

export const DISPLAY_FAMILY = "Courier Prime" as const;
export const BODY_FAMILY = "IBM Plex Sans" as const;

export const FONT_FAMILIES: readonly string[] = [DISPLAY_FAMILY, BODY_FAMILY];

export const FONT_FACES: readonly FontFaceSpec[] = [
  {
    family: DISPLAY_FAMILY,
    src: "/fonts/courier-prime/CourierPrime-Regular.woff2",
    weight: 400,
  },
  {
    family: DISPLAY_FAMILY,
    src: "/fonts/courier-prime/CourierPrime-Bold.woff2",
    weight: 700,
  },
  {
    family: BODY_FAMILY,
    src: "/fonts/ibm-plex-sans/IBMPlexSans.woff2",
    weight: "100 700",
  },
];
