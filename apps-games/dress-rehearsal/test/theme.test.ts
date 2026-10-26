import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CHAPTERS, THEME_IDS } from "@web-games/dress-rehearsal-core";
import { TOKEN_VARS } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { FONT_FACES, FONT_FAMILIES, FONT_FILES } from "../src/fonts";
import {
  contrastRatio,
  mixHex,
  parseHex,
  relativeLuminance,
  TEXT_CONTRAST_MIN,
  UI_CONTRAST_MIN,
} from "../src/theme/contrast";
import { COLOUR_HEX, COLOUR_NAME, garmentPaint } from "../src/theme/garment";
import { installTheme, PAPER_STYLE_ID } from "../src/theme/install";
import {
  ACCENT_VAR,
  ACCENTS,
  accentFor,
  accentPairs,
  applyGameTheme,
  BORDER_ON_NIGHT,
  chromePairs,
  FONT_BODY,
  FONT_DISPLAY,
  gameTokens,
  HIT_MIN_PX,
  HIT_MIN_VAR,
  NIGHT_RAISED,
  NIGHT_SURFACE,
  PALETTE,
  PALETTE_VARS,
  paperTokens,
  SLOT_MIN_PX,
} from "../src/theme/tokens";
import { GAME_CSS } from "./helpers";

const APP_DIR = join(import.meta.dirname, "..");

describe("contrast maths", () => {
  it("matches the values measured in the art bible", () => {
    const p = PALETTE;
    const expected: [string, string, number][] = [
      [p.ink, p.paper, 14.57],
      [p.ink, p.paper2, 12.73],
      [p.ink, p.linen, 11.48],
      [p.inkSoft, p.paper, 7.04],
      [p.inkSoft, p.linen, 5.55],
      [p.paper, p.night, 15.43],
      [p.good, p.paper, 6.06],
      [p.bad, p.paper, 6.03],
      [p.warn, p.paper, 6.24],
      [p.paper, p.good, 6.06],
      [p.paper, p.bad, 6.03],
      [p.focus, p.paper, 5.65],
      [p.hairline, p.paper, 4.77],
      [p.hairline, p.linen, 3.76],
      [p.star, p.night, 5.89],
      [p.ink, p.star, 5.56],
      [p.star, p.paper, 2.62],
    ];
    for (const [fg, bg, ratio] of expected) expect(contrastRatio(fg, bg)).toBeCloseTo(ratio, 1);
  });

  it("parses, mixes and rejects colours", () => {
    expect(parseHex("#231d1a")).toEqual([35, 29, 26]);
    expect(() => parseHex("red")).toThrow();
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(TEXT_CONTRAST_MIN).toBe(4.5);
    expect(UI_CONTRAST_MIN).toBe(3);
  });
});

describe("design tokens", () => {
  it("holds the 14 art-bible palette tokens", () => {
    expect(Object.keys(PALETTE)).toHaveLength(14);
    expect(PALETTE).toEqual({
      ink: "#231d1a",
      inkSoft: "#5a4e46",
      paper: "#f6efe4",
      paper2: "#ebe0cc",
      night: "#1c1816",
      linen: "#e2d5be",
      hairline: "#78674f",
      good: "#2a6540",
      warn: "#7a4f00",
      bad: "#a3322b",
      star: "#c58a12",
      focus: "#1d5fa8",
      blush: "#e9c9bf",
      mist: "#d3dde0",
    });
    expect(Object.keys(PALETTE_VARS).sort()).toEqual(Object.keys(PALETTE).sort());
  });

  it("holds the six chapter accents from the content", () => {
    expect(ACCENTS).toEqual({
      riviera: "#2b6a9a",
      "rainy-city": "#7f5f00",
      gala: "#a1281f",
      mountain: "#2c6a48",
      studio: "#6a3fa0",
      vintage: "#a4491a",
    });
    expect(THEME_IDS.map((id) => accentFor(id))).toEqual(CHAPTERS.map((chapter) => chapter.accent));
    expect(ACCENT_VAR).toBe("--dr-accent");
  });

  it("overrides every kit theme token with game values and the bundled font stacks", () => {
    const tokens = gameTokens();
    for (const name of Object.keys(TOKEN_VARS)) expect(tokens).toHaveProperty(name);
    expect(tokens.fontBody).toBe(FONT_BODY);
    expect(tokens.fontDisplay).toBe(FONT_DISPLAY);
    expect(FONT_BODY).toBe('"DM Sans", sans-serif');
    expect(FONT_DISPLAY).toBe('"Playfair Display", serif');
    expect(tokens.colorBackground).toBe(PALETTE.night);
    expect(tokens.colorAccent).toBe(PALETTE.star);
  });

  it("applies the palette, the hit token and the paper surface overrides", () => {
    const root = document.createElement("div");
    const remove = applyGameTheme({}, root);
    for (const [token, name] of Object.entries(PALETTE_VARS)) {
      expect(root.style.getPropertyValue(name)).toBe(PALETTE[token as keyof typeof PALETTE]);
    }
    expect(root.style.getPropertyValue(HIT_MIN_VAR)).toBe("44px");
    expect(HIT_MIN_PX).toBe(44);
    expect(SLOT_MIN_PX).toBe(88);
    remove();
    expect(root.style.getPropertyValue(PALETTE_VARS.ink)).toBe("");
    expect(paperTokens().colorText).toBe(PALETTE.ink);
    expect(paperTokens().colorSurface).toBe(PALETTE.paper);
  });

  it("installs flags and a single paper style element, and high contrast changes the output", () => {
    installTheme({ highContrast: false, reducedMotion: false });
    const normal = document.getElementById(PAPER_STYLE_ID)?.textContent ?? "";
    installTheme({ highContrast: true, reducedMotion: true });
    const high = document.getElementById(PAPER_STYLE_ID)?.textContent ?? "";
    expect(document.querySelectorAll(`#${PAPER_STYLE_ID}`)).toHaveLength(1);
    expect(normal).not.toBe(high);
    expect(normal).toContain(`--wg-color-text-muted: ${PALETTE.inkSoft}`);
    expect(high).toContain(`--wg-color-text-muted: ${PALETTE.ink}`);
    expect(document.documentElement.dataset.contrast).toBe("high");
    expect(document.documentElement.dataset.motion).toBe("reduced");
    expect(gameTokens({ highContrast: true }).colorBorder).toBe(PALETTE.paper);
    expect(gameTokens({ highContrast: false }).colorBorder).toBe(BORDER_ON_NIGHT);
    installTheme({ highContrast: false, reducedMotion: false });
    expect(document.documentElement.dataset.contrast).toBe("normal");
  });
});

describe("contrast of every token pair", () => {
  const pairs = chromePairs();

  it("lists the pairs the app uses", () => {
    expect(pairs.length).toBeGreaterThanOrEqual(40);
    expect(new Set(pairs.map((pair) => pair.id)).size).toBe(pairs.length);
    expect(pairs.some((pair) => pair.kind === "text")).toBe(true);
    expect(pairs.some((pair) => pair.kind === "ui")).toBe(true);
  });

  it.each(pairs.map((pair) => [pair.id, pair] as const))("%s", (_id, pair) => {
    const min = pair.kind === "text" ? TEXT_CONTRAST_MIN : UI_CONTRAST_MIN;
    expect(contrastRatio(pair.fg, pair.bg)).toBeGreaterThanOrEqual(min);
  });

  it("derives the dark surfaces and border from the palette", () => {
    for (const surface of [PALETTE.night, NIGHT_SURFACE, NIGHT_RAISED]) {
      expect(contrastRatio(PALETTE.paper, surface)).toBeGreaterThanOrEqual(TEXT_CONTRAST_MIN);
      expect(contrastRatio(BORDER_ON_NIGHT, surface)).toBeGreaterThanOrEqual(UI_CONTRAST_MIN);
    }
  });

  it("keeps the star unreadable on paper without its ink outline", () => {
    expect(contrastRatio(PALETTE.star, PALETTE.paper)).toBeLessThan(UI_CONTRAST_MIN);
    expect(GAME_CSS).toMatch(/\.wg-star\s*\{[^}]*stroke:\s*var\(--dr-ink\)/);
  });
});

describe("chapter accents", () => {
  for (const theme of THEME_IDS) {
    const pairs = accentPairs(theme);
    it(`${theme}: accent on paper and linen, paper text on accent`, () => {
      expect(pairs).toHaveLength(4);
      for (const pair of pairs) {
        const min = pair.kind === "text" ? TEXT_CONTRAST_MIN : UI_CONTRAST_MIN;
        expect(contrastRatio(pair.fg, pair.bg), pair.id).toBeGreaterThanOrEqual(min);
      }
    });
  }

  it("matches the measured accent values on paper", () => {
    const measured: Record<string, number> = {
      riviera: 5.06,
      "rainy-city": 5.19,
      gala: 6.48,
      mountain: 5.64,
      studio: 6.49,
      vintage: 5.18,
    };
    for (const theme of THEME_IDS) {
      expect(contrastRatio(PALETTE.paper, accentFor(theme))).toBeCloseTo(measured[theme] ?? 0, 1);
    }
  });

  it("is never paired with the night background in the stylesheet", () => {
    for (const match of GAME_CSS.matchAll(/\{([^}]*)\}/g)) {
      const body = match[1] ?? "";
      if (!body.includes("var(--dr-accent")) continue;
      expect(body, body).not.toMatch(/var\(--dr-night\)|var\(--wg-color-background\)/);
    }
  });
});

describe("garment colours", () => {
  it("has a swatch and a name for each of the 18 colour tags", () => {
    expect(Object.keys(COLOUR_HEX)).toHaveLength(18);
    expect(Object.keys(COLOUR_NAME).sort()).toEqual(Object.keys(COLOUR_HEX).sort());
    for (const hex of Object.values(COLOUR_HEX)) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(new Set(Object.values(COLOUR_HEX)).size).toBe(18);
    const paint = garmentPaint("sky");
    expect(paint.main).toBe(COLOUR_HEX.sky);
    expect(paint.ink).toBe(PALETTE.ink);
    expect(paint.shade).not.toBe(paint.main);
  });
});

describe("fonts", () => {
  const publicDir = join(APP_DIR, "public");

  it("registers Playfair Display (regular and italic) and DM Sans from bundled woff2 files", () => {
    expect(FONT_FAMILIES).toEqual(["Playfair Display", "DM Sans"]);
    expect(FONT_FACES.map((face) => [face.family, face.style ?? "normal", face.weight])).toEqual([
      ["Playfair Display", "normal", "400 900"],
      ["Playfair Display", "italic", "400 900"],
      ["DM Sans", "normal", "400 700"],
    ]);
    for (const src of FONT_FILES) expect(src.endsWith(".woff2")).toBe(true);
  });

  it("ships real woff2 files within the size budgets, each with its OFL text", () => {
    let total = 0;
    for (const src of FONT_FILES) {
      const file = join(publicDir, src);
      const bytes = readFileSync(file);
      expect(bytes.subarray(0, 4).toString("latin1"), src).toBe("wOF2");
      expect(statSync(file).size, src).toBeLessThanOrEqual(120 * 1024);
      total += statSync(file).size;
    }
    expect(total).toBeLessThanOrEqual(300 * 1024);
    for (const dir of ["playfair-display", "dm-sans"]) {
      const licence = readFileSync(join(publicDir, "fonts", dir, "OFL.txt"), "utf8");
      expect(licence).toContain("SIL OPEN FONT LICENSE Version 1.1");
    }
    expect(readFileSync(join(publicDir, "fonts/playfair-display/OFL.txt"), "utf8")).toContain(
      "Playfair Display",
    );
    expect(readFileSync(join(publicDir, "fonts/dm-sans/OFL.txt"), "utf8")).toContain("DM Sans");
  });

  it("preloads both text faces from index.html", () => {
    const html = readFileSync(join(APP_DIR, "index.html"), "utf8");
    expect(html).toContain("/fonts/playfair-display/PlayfairDisplay-Variable.woff2");
    expect(html).toContain("/fonts/dm-sans/DMSans-Variable.woff2");
    expect(html).toContain('<meta name="theme-color" content="#1c1816" />');
  });

  it("references only palette variables that exist in the stylesheet theme", () => {
    const known = new Set<string>([
      ...Object.values(PALETTE_VARS),
      ACCENT_VAR,
      HIT_MIN_VAR,
      ...Object.values(TOKEN_VARS),
    ]);
    for (const match of GAME_CSS.matchAll(/var\((--[a-z0-9-]+)/g)) {
      expect(known.has(match[1] as string), match[1]).toBe(true);
    }
  });
});
