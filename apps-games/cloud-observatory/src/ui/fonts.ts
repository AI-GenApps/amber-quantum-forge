import {
  type FontFaceSpec,
  type FontsDocument,
  type RegisterFontsResult,
  registerFonts,
} from "@web-games/kit";
import { FONT_FAMILIES } from "./tokens";

const DISPLAY = "Cormorant Garamond";
const BODY = "Manrope";

export const FONT_FACES: readonly FontFaceSpec[] = [
  {
    family: DISPLAY,
    src: "/fonts/cormorant-garamond/CormorantGaramond-Medium.woff2",
    weight: 500,
    style: "normal",
  },
  {
    family: DISPLAY,
    src: "/fonts/cormorant-garamond/CormorantGaramond-Bold.woff2",
    weight: 700,
    style: "normal",
  },
  {
    family: DISPLAY,
    src: "/fonts/cormorant-garamond/CormorantGaramond-MediumItalic.woff2",
    weight: 500,
    style: "italic",
  },
  { family: BODY, src: "/fonts/manrope/Manrope-Variable.woff2", weight: "400 700" },
];

export const FONT_TIMEOUT_MS = 1500;

/**
 * Registers the bundled fonts and waits for them, but never longer than `timeoutMs`, so a slow
 * disk can delay the first text paint a little and can never block the app.
 */
export async function registerAppFonts(
  doc: FontsDocument = document,
  timeoutMs: number = FONT_TIMEOUT_MS,
): Promise<RegisterFontsResult> {
  const pending = registerFonts(FONT_FACES, doc);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<RegisterFontsResult>((resolve) => {
    timer = setTimeout(() => resolve({ families: [...FONT_FAMILIES], failed: [] }), timeoutMs);
  });
  try {
    return await Promise.race([pending, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
