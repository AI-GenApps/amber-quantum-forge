import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { THEMES } from "@web-games/floodplain-dispatch-core";
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
import { landColor, MAP_THEMES, mapThemeFor, themePairs, waterColor } from "../src/theme/mapThemes";
import {
  applyGameTheme,
  chromePairs,
  FONT_BODY,
  FONT_DISPLAY,
  gameTokens,
  HIT_MIN_PX,
  PALETTE,
  PALETTE_VARS,
  paperTokens,
} from "../src/theme/tokens";

const APP_DIR = join(import.meta.dirname, "..");

describe("contrast maths", () => {
  it("matches the measured values in the art bible", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio(PALETTE.ink, PALETTE.paper)).toBeCloseTo(12.5, 1);
    expect(contrastRatio(PALETTE.paper, PALETTE.night)).toBeCloseTo(13.75, 1);
    expect(contrastRatio(PALETTE.paper, PALETTE.waterDeep)).toBeCloseTo(5.77, 1);
    expect(contrastRatio(PALETTE.paper, PALETTE.meadowDeep)).toBeCloseTo(5.09, 1);
    expect(contrastRatio(PALETTE.paper, PALETTE.clay)).toBeCloseTo(5.12, 1);
    expect(contrastRatio(PALETTE.paper, PALETTE.ochreDeep)).toBeCloseTo(5.6, 1);
    expect(contrastRatio(PALETTE.ink, PALETTE.meadow)).toBeCloseTo(5.32, 1);
    expect(contrastRatio(PALETTE.ink, PALETTE.ochre)).toBeCloseTo(5.35, 1);
  });

  it("parses, mixes and rejects colours", () => {
    expect(parseHex("#1f2b22")).toEqual([31, 43, 34]);
    expect(() => parseHex("red")).toThrow();
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("design tokens", () => {
  it("holds the 14 art-bible palette tokens", () => {
    expect(Object.keys(PALETTE)).toHaveLength(14);
    expect(PALETTE).toMatchObject({
      ink: "#1f2b22",
      paper: "#f4ecd8",
      paper2: "#e8dcc0",
      night: "#18231d",
      meadow: "#8aa468",
      meadowDeep: "#4f6b3c",
      ochre: "#c8923a",
      ochreDeep: "#7d5516",
      clay: "#a7432c",
      water: "#3b8dc4",
      waterDeep: "#1f5f8f",
      waterLight: "#a5d3ee",
      rock: "#7d776b",
      sea: "#2a6c9c",
    });
  });

  it("overrides every kit theme token with a game value and bundled font stacks", () => {
    const tokens = gameTokens();
    for (const name of Object.keys(TOKEN_VARS)) expect(tokens).toHaveProperty(name);
    expect(tokens.fontBody).toBe(FONT_BODY);
    expect(tokens.fontDisplay).toBe(FONT_DISPLAY);
    expect(FONT_BODY).toBe('"Atkinson Hyperlegible", sans-serif');
    expect(FONT_DISPLAY).toBe('"Bricolage Grotesque", sans-serif');
  });

  it("applies the palette variables and the hit-area token to the root", () => {
    const root = document.createElement("div");
    const remove = applyGameTheme({}, root);
    expect(root.style.getPropertyValue("--wg-hit-min")).toBe(`${HIT_MIN_PX}px`);
    expect(HIT_MIN_PX).toBe(44);
    expect(root.style.getPropertyValue(PALETTE_VARS.ink)).toBe(PALETTE.ink);
    expect(root.style.getPropertyValue("--wg-color-background")).toBe(PALETTE.night);
    remove();
    expect(root.style.getPropertyValue("--wg-hit-min")).toBe("");
  });

  it("installs the paper surface overrides and the contrast and motion flags", () => {
    installTheme({ themeId: "night-lantern", highContrast: true, reducedMotion: true });
    expect(document.documentElement.dataset.contrast).toBe("high");
    expect(document.documentElement.dataset.motion).toBe("reduced");
    const css = document.getElementById(PAPER_STYLE_ID)?.textContent ?? "";
    expect(css).toContain("--wg-color-text: #1f2b22");
    expect(document.documentElement.style.getPropertyValue("--wg-color-background")).toBe(
      "#0f1a22",
    );
    installTheme({ themeId: "gouache-meadow", highContrast: false, reducedMotion: false });
    expect(document.documentElement.dataset.contrast).toBe("normal");
  });
});

describe("contrast of every token pair", () => {
  it.each(chromePairs())("chrome pair $id meets its threshold", (pair) => {
    const min = pair.kind === "text" ? TEXT_CONTRAST_MIN : UI_CONTRAST_MIN;
    expect(contrastRatio(pair.fg, pair.bg)).toBeGreaterThanOrEqual(min);
  });

  it("covers the high-contrast chrome too", () => {
    const high = gameTokens({ highContrast: true });
    expect(contrastRatio(high.colorBorder as string, PALETTE.night)).toBeGreaterThanOrEqual(3);
    const paperHigh = paperTokens(true);
    expect(contrastRatio(paperHigh.colorTextMuted as string, PALETTE.paper)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(contrastRatio(paperHigh.colorBorder as string, PALETTE.paper)).toBeGreaterThanOrEqual(3);
  });

  it("has all seven map themes keyed by the core theme ids", () => {
    expect(MAP_THEMES.map((theme) => theme.id)).toEqual(THEMES.map((theme) => theme.id));
    expect(MAP_THEMES).toHaveLength(7);
    expect(mapThemeFor("nope").id).toBe("gouache-meadow");
  });

  for (const theme of MAP_THEMES) {
    it.each(themePairs(theme))(`${theme.id}: $id meets its threshold`, (pair) => {
      const min = pair.kind === "text" ? TEXT_CONTRAST_MIN : UI_CONTRAST_MIN;
      expect(contrastRatio(pair.fg, pair.bg)).toBeGreaterThanOrEqual(min);
    });

    it(`${theme.id}: terrain gets lighter with height and the ramp keeps the shore readable`, () => {
      for (let height = 0; height <= 7; height++) {
        expect(contrastRatio(theme.shore, landColor(theme, height))).toBeGreaterThanOrEqual(3);
      }
      expect(relativeLuminance(landColor(theme, 7))).toBeGreaterThan(
        relativeLuminance(landColor(theme, 0)),
      );
      expect(waterColor(theme, 1)).toBe(theme.waterShallow);
      expect(waterColor(theme, 3)).toBe(theme.waterMid);
      expect(waterColor(theme, 6)).toBe(theme.waterDeep);
    });
  }
});

describe("bundled fonts", () => {
  const fontsDir = join(APP_DIR, "public/fonts");
  const files = readdirSync(fontsDir, { recursive: true }).map(String);

  it("ships woff2 files with an OFL.txt per family inside the size budgets", () => {
    const woff2 = files.filter((name) => name.endsWith(".woff2"));
    expect(woff2).toHaveLength(3);
    let total = 0;
    for (const name of woff2) {
      const size = statSync(join(fontsDir, name)).size;
      expect(size).toBeLessThanOrEqual(120 * 1024);
      total += size;
    }
    expect(total).toBeLessThanOrEqual(300 * 1024);
    for (const family of ["bricolage-grotesque", "atkinson-hyperlegible"]) {
      const licence = readFileSync(join(fontsDir, family, "OFL.txt"), "utf8");
      expect(licence).toContain("SIL OPEN FONT LICENSE Version 1.1");
    }
  });

  it("registers a face for each bundled file and names both families", () => {
    expect(FONT_FAMILIES).toEqual(["Bricolage Grotesque", "Atkinson Hyperlegible"]);
    for (const face of FONT_FACES) {
      expect(statSync(join(APP_DIR, "public", face.src)).isFile()).toBe(true);
    }
    expect(FONT_FACES.filter((face) => face.family === "Atkinson Hyperlegible")).toHaveLength(2);
  });

  it("stores the display font as a woff2 container", () => {
    const header = readFileSync(
      join(fontsDir, "bricolage-grotesque/BricolageGrotesque-Variable.woff2"),
    );
    expect(header.subarray(0, 4).toString("latin1")).toBe("wOF2");
  });

  it("preloads both families from index.html", () => {
    const html = readFileSync(join(APP_DIR, "index.html"), "utf8");
    expect(html).toContain("AtkinsonHyperlegible-Regular.woff2");
    expect(html).toContain("BricolageGrotesque-Variable.woff2");
    expect(html).toContain('content="#18231d"');
  });
});
