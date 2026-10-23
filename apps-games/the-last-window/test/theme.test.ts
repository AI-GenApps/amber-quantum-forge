import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { TOKEN_VARS } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { FONT_FACES, FONT_FAMILIES } from "../src/fonts";
import {
  contrastRatio,
  mixHex,
  parseHex,
  relativeLuminance,
  TEXT_CONTRAST_MIN,
  UI_CONTRAST_MIN,
} from "../src/theme/contrast";
import { installTheme, PAPER_STYLE_ID } from "../src/theme/install";
import {
  applyGameTheme,
  DERIVED_VARS,
  derived,
  FONT_BODY,
  FONT_DISPLAY,
  gameTokens,
  HIGH_PALETTE,
  HIT_MIN_PX,
  PALETTE,
  PALETTE_VARS,
  paperTokens,
  tokenPairs,
} from "../src/theme/tokens";
import { GAME_CSS } from "./helpers";

const APP_DIR = join(import.meta.dirname, "..");
const TEXT_HIGH = 7;

describe("contrast maths", () => {
  it("matches the measured values in the art bible", () => {
    const r = (a: string, b: string): number => contrastRatio(a, b);
    expect(r("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(r(PALETTE.ink, PALETTE.paper)).toBeCloseTo(12.23, 1);
    expect(r(PALETTE.inkSoft, PALETTE.paper)).toBeCloseTo(7.44, 1);
    expect(r(PALETTE.inkSoft, PALETTE.paperDark)).toBeCloseTo(6.01, 1);
    expect(r(PALETTE.paper, PALETTE.night)).toBeCloseTo(12.07, 1);
    expect(r(PALETTE.paper, PALETTE.nightMid)).toBeCloseTo(8.78, 1);
    expect(r(PALETTE.lamp, PALETTE.night)).toBeCloseTo(6.28, 1);
    expect(r(PALETTE.ink, PALETTE.lamp)).toBeCloseTo(6.36, 1);
    expect(r(PALETTE.lampDeep, PALETTE.paper)).toBeCloseTo(4.66, 1);
    expect(r(PALETTE.paper, PALETTE.brick)).toBeCloseTo(5.76, 1);
    expect(r(PALETTE.paper, PALETTE.teal)).toBeCloseTo(5.27, 1);
    expect(r(PALETTE.paper, PALETTE.sage)).toBeCloseTo(5.31, 1);
    expect(r(PALETTE.rain, PALETTE.night)).toBeCloseTo(5.53, 1);
  });

  it("parses, mixes and rejects colours", () => {
    expect(parseHex("#1f2b22")).toEqual([31, 43, 34]);
    expect(() => parseHex("red")).toThrow();
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("design tokens", () => {
  it("holds the 12 palette tokens of product.md", () => {
    expect(PALETTE).toEqual({
      paper: "#FBF1DC",
      paperDark: "#EAD9B8",
      ink: "#3A2A1E",
      inkSoft: "#5E4A3A",
      night: "#1F2F45",
      nightMid: "#2D4560",
      lamp: "#E8A33D",
      lampDeep: "#9A5F0E",
      brick: "#A03F30",
      teal: "#1F6F6C",
      sage: "#4F6B47",
      rain: "#8FA9BC",
    });
  });

  it("defines the high contrast variant as ink, night and no paperDark fill", () => {
    expect(HIGH_PALETTE.ink).toBe("#1B1209");
    expect(HIGH_PALETTE.night).toBe("#0F1826");
    expect(HIGH_PALETTE.paperDark).toBe(HIGH_PALETTE.paper);
  });

  it("overrides every kit theme token with a game value and bundled font stacks", () => {
    for (const high of [false, true]) {
      const tokens = gameTokens(high);
      for (const name of Object.keys(TOKEN_VARS)) expect(tokens).toHaveProperty(name);
      expect(tokens.fontBody).toBe(FONT_BODY);
      expect(tokens.fontDisplay).toBe(FONT_DISPLAY);
    }
    expect(FONT_BODY).toBe('"Nunito Sans", sans-serif');
    expect(FONT_DISPLAY).toBe('"Young Serif", serif');
    expect(Object.keys(paperTokens())).toContain("colorSurface");
  });

  it("applies palette variables, the hit-area token and the text scale, and removes them", () => {
    const root = document.createElement("div");
    const remove = applyGameTheme({ textSize: "large" }, root);
    expect(root.style.getPropertyValue("--wg-hit-min")).toBe(`${HIT_MIN_PX}px`);
    expect(HIT_MIN_PX).toBe(44);
    expect(root.style.getPropertyValue(PALETTE_VARS.lamp)).toBe(PALETTE.lamp);
    expect(root.style.getPropertyValue(DERIVED_VARS.tealLight)).toBe(derived().tealLight);
    expect(root.style.getPropertyValue("--wg-color-background")).toBe(PALETTE.night);
    expect(root.style.getPropertyValue("--tlw-text-scale")).toBe("1.25");
    remove();
    expect(root.style.getPropertyValue("--wg-hit-min")).toBe("");
    expect(root.style.getPropertyValue("--tlw-text-scale")).toBe("");
  });

  it("installs the paper overrides and the contrast, motion and size flags", () => {
    installTheme({ highContrast: true, reducedMotion: true, textSize: "large" });
    const root = document.documentElement;
    expect(root.dataset.contrast).toBe("high");
    expect(root.dataset.motion).toBe("reduced");
    expect(root.dataset.textSize).toBe("large");
    const css = document.getElementById(PAPER_STYLE_ID)?.textContent ?? "";
    expect(css).toContain("--wg-color-text: #1B1209");
    expect(root.style.getPropertyValue("--wg-color-background")).toBe("#0F1826");
    installTheme({ highContrast: false, reducedMotion: false, textSize: "normal" });
    expect(root.dataset.contrast).toBe("normal");
    expect(document.getElementById(PAPER_STYLE_ID)?.textContent).toContain(
      "--wg-color-text: #3A2A1E",
    );
    expect(document.querySelectorAll(`#${PAPER_STYLE_ID}`)).toHaveLength(1);
  });
});

describe("contrast of every token pair", () => {
  it.each(tokenPairs(false))("normal: $id meets its threshold", (pair) => {
    const min = pair.kind === "text" ? TEXT_CONTRAST_MIN : UI_CONTRAST_MIN;
    expect(contrastRatio(pair.fg, pair.bg)).toBeGreaterThanOrEqual(min);
  });

  it.each(tokenPairs(true))("high contrast: $id reaches 7:1 for text and 3:1 for UI", (pair) => {
    const min = pair.kind === "text" ? TEXT_HIGH : UI_CONTRAST_MIN;
    expect(contrastRatio(pair.fg, pair.bg)).toBeGreaterThanOrEqual(min);
  });

  it("covers a pair for every kit colour token that the stylesheets use", () => {
    const ids = tokenPairs(false).map((pair) => pair.id);
    for (const id of [
      "text-on-night",
      "ink-on-paper",
      "accent-text-on-lamp",
      "paper-on-brick",
      "border-on-paper",
      "focus-on-night",
    ]) {
      expect(ids).toContain(id);
    }
    expect(tokenPairs(true).map((pair) => pair.id)).toEqual(ids);
  });
});

describe("fonts", () => {
  const fontsDir = join(APP_DIR, "public/fonts");
  const files = readdirSync(fontsDir, { recursive: true }).map(String);

  it("ships two woff2 files with an OFL.txt per family inside the size budgets", () => {
    const woff2 = files.filter((name) => name.endsWith(".woff2"));
    expect(woff2.sort()).toEqual([
      "nunito-sans/NunitoSans-Variable.woff2",
      "young-serif/YoungSerif-Regular.woff2",
    ]);
    let total = 0;
    for (const name of woff2) {
      const size = statSync(join(fontsDir, name)).size;
      expect(size).toBeLessThanOrEqual(120 * 1024);
      total += size;
    }
    expect(total).toBeLessThanOrEqual(300 * 1024);
    for (const family of ["young-serif", "nunito-sans"]) {
      const licence = readFileSync(join(fontsDir, family, "OFL.txt"), "utf8");
      expect(licence).toContain("SIL Open Font License, Version 1.1");
    }
  });

  it("registers a face for each bundled file and names both families", () => {
    expect(FONT_FAMILIES).toEqual(["Young Serif", "Nunito Sans"]);
    for (const face of FONT_FACES) {
      expect(statSync(join(APP_DIR, "public", face.src)).isFile()).toBe(true);
    }
    expect(FONT_FACES.find((face) => face.family === "Nunito Sans")?.weight).toBe("400 800");
    expect(FONT_FACES.find((face) => face.family === "Young Serif")?.weight).toBe(400);
  });

  it("stores both fonts as woff2 containers", () => {
    for (const name of files.filter((entry) => entry.endsWith(".woff2"))) {
      expect(readFileSync(join(fontsDir, name)).subarray(0, 4).toString("latin1")).toBe("wOF2");
    }
  });

  it("preloads both families from index.html and sets the night theme colour", () => {
    const html = readFileSync(join(APP_DIR, "index.html"), "utf8");
    expect(html).toContain("YoungSerif-Regular.woff2");
    expect(html).toContain("NunitoSans-Variable.woff2");
    expect(html).toContain('content="#1F2F45"');
  });

  it("never lets the browser fake a bold Young Serif and keeps text at 16 px or more", () => {
    expect(GAME_CSS).toMatch(/font-synthesis:\s*none/);
    expect(GAME_CSS).toMatch(/html\s*\{[^}]*font-size:\s*calc\(16px \* var\(--tlw-text-scale/);
    expect(GAME_CSS).toMatch(/body\s*\{[^}]*font-size:\s*1rem/);
    const rems = Array.from(GAME_CSS.matchAll(/font-size:\s*([\d.]+)rem/g)).map((m) =>
      Number(m[1]),
    );
    expect(Math.min(...rems)).toBeGreaterThanOrEqual(0.875);
    expect(GAME_CSS).not.toMatch(/font-size:\s*\d+px/);
  });
});
