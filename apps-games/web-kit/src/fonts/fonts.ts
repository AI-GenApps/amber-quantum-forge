export interface FontFaceSpec {
  family: string;
  /** URL of the bundled woff2 file, for example `/fonts/Fraunces-Variable.woff2`. */
  src: string;
  /** A weight or a variable-font range such as `"300 900"`. */
  weight?: string | number;
  style?: "normal" | "italic";
  display?: "swap" | "block" | "fallback" | "optional" | "auto";
  unicodeRange?: string;
}

export interface FontsDocument {
  head: Pick<HTMLElement, "appendChild">;
  createElement(tag: "style"): HTMLStyleElement;
  getElementById?(id: string): HTMLElement | null;
  fonts?: { load(font: string, text?: string): Promise<unknown> } | undefined;
}

export const FONT_STYLE_ID = "wg-fonts";

const quote = (family: string): string => `"${family.replace(/["\\]/g, "")}"`;

/** One `@font-face` rule per spec, woff2 only. */
export function fontFaceCss(faces: readonly FontFaceSpec[]): string {
  return faces
    .map((face) => {
      const lines = [
        `font-family: ${quote(face.family)};`,
        `src: url("${face.src}") format("woff2");`,
        `font-weight: ${face.weight ?? 400};`,
        `font-style: ${face.style ?? "normal"};`,
        `font-display: ${face.display ?? "swap"};`,
      ];
      if (face.unicodeRange) lines.push(`unicode-range: ${face.unicodeRange};`);
      return `@font-face {\n  ${lines.join("\n  ")}\n}`;
    })
    .join("\n");
}

export interface RegisterFontsResult {
  families: string[];
  /** Families whose `document.fonts.load` failed; empty where the API is missing. */
  failed: string[];
}

/**
 * Injects the `@font-face` rules once into `<head>` and waits for each family to load where the
 * CSS Font Loading API exists. Never rejects: a missing font is reported in `failed`.
 */
export async function registerFonts(
  faces: readonly FontFaceSpec[],
  doc: FontsDocument = document,
): Promise<RegisterFontsResult> {
  const families = [...new Set(faces.map((face) => face.family))];
  const css = fontFaceCss(faces);
  const existing = doc.getElementById?.(FONT_STYLE_ID);
  if (existing) {
    existing.textContent = css;
  } else {
    const style = doc.createElement("style");
    style.id = FONT_STYLE_ID;
    style.textContent = css;
    doc.head.appendChild(style);
  }
  const failed: string[] = [];
  const loader = doc.fonts;
  if (loader) {
    await Promise.all(
      faces.map(async (face) => {
        try {
          await loader.load(
            `${face.style ?? "normal"} ${face.weight ?? 400} 1em ${quote(face.family)}`,
          );
        } catch {
          if (!failed.includes(face.family)) failed.push(face.family);
        }
      }),
    );
  }
  return { families, failed };
}
