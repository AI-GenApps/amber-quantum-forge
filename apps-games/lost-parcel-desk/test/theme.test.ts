import { TOKEN_VARS } from "@web-games/kit";
import { THEMES } from "@web-games/lost-parcel-desk-core";
import { describe, expect, it } from "vitest";
import { FONT_FACES, FONT_FAMILIES } from "../src/fonts";
import {
  contrastRatio,
  parseHex,
  relativeLuminance,
  TEXT_CONTRAST_MIN,
  UI_CONTRAST_MIN,
} from "../src/theme/contrast";
import {
  DESK_THEMES,
  deskPalette,
  deskTokens,
  PAPER_PAIRS,
  themePairs,
} from "../src/theme/deskThemes";
import { installTheme } from "../src/theme/install";
import {
  DERIVED,
  FONT_BODY,
  FONT_DISPLAY,
  HIT_MIN_PX,
  HOTSPOT_PX,
  PALETTE,
  PALETTE_VARS,
} from "../src/theme/tokens";

describe("contrast maths", () => {
  it("matches the measured values in the art bible", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio(PALETTE.ink, PALETTE.cream)).toBeCloseTo(13.06, 1);
    expect(contrastRatio(PALETTE.ink, PALETTE.cream2)).toBeCloseTo(10.94, 1);
    expect(contrastRatio(PALETTE.cream, PALETTE.night)).toBeCloseTo(14.49, 1);
    expect(contrastRatio(PALETTE.cream, PALETTE.tealDeep)).toBeCloseTo(6.58, 1);
    expect(contrastRatio(PALETTE.cream, PALETTE.brick)).toBeCloseTo(5.33, 1);
    expect(contrastRatio(PALETTE.cream, PALETTE.brickDeep)).toBeCloseTo(8.09, 1);
    expect(contrastRatio(PALETTE.cream, PALETTE.mustardDeep)).toBeCloseTo(5.73, 1);
    expect(contrastRatio(PALETTE.ink, PALETTE.mustard)).toBeCloseTo(6.86, 1);
    expect(contrastRatio(PALETTE.ink, PALETTE.tealLight)).toBeCloseTo(9.02, 1);
    expect(contrastRatio(PALETTE.ink, PALETTE.mustardLight)).toBeCloseTo(10.44, 1);
    expect(contrastRatio(PALETTE.mustard, PALETTE.night)).toBeCloseTo(7.61, 1);
    expect(contrastRatio(PALETTE.tealLight, PALETTE.night)).toBeCloseTo(10.02, 1);
    expect(contrastRatio(PALETTE.mustardLight, PALETTE.night)).toBeCloseTo(11.59, 1);
    expect(contrastRatio(PALETTE.line, PALETTE.cream)).toBeCloseTo(3.49, 1);
  });

  it("documents why teal never carries text", () => {
    expect(contrastRatio(PALETTE.teal, PALETTE.cream)).toBeLessThan(TEXT_CONTRAST_MIN);
    expect(contrastRatio(PALETTE.ink, PALETTE.teal)).toBeLessThan(TEXT_CONTRAST_MIN);
    expect(contrastRatio(PALETTE.cream, PALETTE.teal)).toBeGreaterThanOrEqual(UI_CONTRAST_MIN);
  });

  it("parses and rejects colours", () => {
    expect(parseHex("#1c2330")).toEqual([28, 35, 48]);
    expect(() => parseHex("red")).toThrow();
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("design tokens", () => {
  it("holds the 13 art-bible palette tokens with their hex values", () => {
    expect(Object.keys(PALETTE)).toHaveLength(13);
    expect(PALETTE).toMatchObject({
      ink: "#1c2330",
      night: "#141a22",
      cream: "#f3e9d2",
      cream2: "#e4d6b4",
      mustard: "#d9a21b",
      mustardDeep: "#7a5200",
      mustardLight: "#f0cf7a",
      teal: "#1f7a7a",
      tealDeep: "#135a5c",
      tealLight: "#8fd0c8",
      brick: "#a8382a",
      brickDeep: "#7d2519",
      line: "#8a7a52",
    });
    expect(Object.keys(PALETTE_VARS).sort()).toEqual(Object.keys(PALETTE).sort());
  });

  it("uses the bundled font stacks and the hit constants", () => {
    expect(FONT_BODY).toBe('"IBM Plex Sans", system-ui, sans-serif');
    expect(FONT_DISPLAY).toBe('"Courier Prime", "Courier New", monospace');
    expect(FONT_FAMILIES).toEqual(["Courier Prime", "IBM Plex Sans"]);
    expect(HIT_MIN_PX).toBe(44);
    expect(HOTSPOT_PX).toBe(48);
    expect(FONT_FACES.map((face) => face.family)).toEqual([
      "Courier Prime",
      "Courier Prime",
      "IBM Plex Sans",
    ]);
  });

  it("has a desk palette for every core theme id", () => {
    expect(Object.keys(DESK_THEMES).sort()).toEqual(THEMES.map((theme) => theme.id).sort());
    expect(THEMES.map((theme) => theme.id)).toEqual([
      "mustard-riso",
      "teal-blotter",
      "brick-ledger",
      "midnight-sorting-room",
      "gold-rubber-stamp",
    ]);
    expect(deskPalette("nope").id).toBe("mustard-riso");
  });

  it("matches the core's ink for each theme (cream on dark desks, ink on light ones)", () => {
    for (const theme of THEMES) {
      const palette = deskPalette(theme.id);
      expect(palette.dark, theme.id).toBe(theme.ink === "cream");
      expect(palette.text, theme.id).toBe(theme.ink === "cream" ? PALETTE.cream : PALETTE.ink);
    }
  });

  it("overrides every kit theme token with a game value in every desk theme", () => {
    for (const theme of THEMES) {
      const tokens = deskTokens(theme.id);
      for (const name of Object.keys(TOKEN_VARS))
        expect(tokens, `${theme.id} ${name}`).toHaveProperty(name);
      expect(tokens.fontBody).toBe(FONT_BODY);
      expect(tokens.fontDisplay).toBe(FONT_DISPLAY);
    }
  });
});

describe("contrast of every token pair in all 5 desk themes", () => {
  for (const theme of THEMES) {
    it(`${theme.name}: text pairs reach 4.5 and UI pairs reach 3`, () => {
      const pairs = themePairs(theme.id);
      expect(pairs).toHaveLength(21);
      const failures = pairs
        .map((pair) => ({ ...pair, ratio: contrastRatio(pair.fg, pair.bg) }))
        .filter((pair) => pair.ratio < (pair.kind === "text" ? TEXT_CONTRAST_MIN : UI_CONTRAST_MIN))
        .map((pair) => `${pair.id} ${pair.fg} on ${pair.bg} = ${pair.ratio.toFixed(2)}`);
      expect(failures).toEqual([]);
    });

    it(`${theme.name}: high contrast keeps the same guarantees with stronger borders`, () => {
      const tokens = deskTokens(theme.id, true);
      expect(tokens.colorTextMuted).toBe(tokens.colorText);
      expect(tokens.colorBorder).toBe(tokens.colorText);
      const palette = deskPalette(theme.id);
      expect(
        contrastRatio(tokens.colorBorder as string, palette.background),
      ).toBeGreaterThanOrEqual(7);
    });
  }

  it("paper surfaces keep ink text readable in every theme", () => {
    expect(PAPER_PAIRS).toHaveLength(19);
    const failures = PAPER_PAIRS.map((pair) => ({
      ...pair,
      ratio: contrastRatio(pair.fg, pair.bg),
    }))
      .filter((pair) => pair.ratio < (pair.kind === "text" ? TEXT_CONTRAST_MIN : UI_CONTRAST_MIN))
      .map((pair) => `${pair.id} = ${pair.ratio.toFixed(2)}`);
    expect(failures).toEqual([]);
  });

  it("teal is never the foreground of a text pair", () => {
    const all = [...PAPER_PAIRS, ...THEMES.flatMap((theme) => themePairs(theme.id))];
    const teals = [PALETTE.teal];
    expect(all.filter((pair) => pair.kind === "text" && teals.includes(pair.fg))).toEqual([]);
    expect(DERIVED.mutedOnLight).not.toBe(PALETTE.teal);
  });
});

describe("installing a theme", () => {
  function fakeRoot() {
    const props = new Map<string, string>();
    return {
      props,
      root: {
        style: {
          setProperty: (name: string, value: string) => void props.set(name, value),
          removeProperty: (name: string) => void props.delete(name),
        } as unknown as CSSStyleDeclaration,
        dataset: {} as DOMStringMap,
      },
    };
  }

  it("sets kit tokens, palette, desk and hit custom properties and the flags, and undoes them", () => {
    const { props, root } = fakeRoot();
    const off = installTheme(
      { themeId: "midnight-sorting-room", highContrast: true, reducedMotion: true },
      root,
    );
    expect(props.get(TOKEN_VARS.colorBackground)).toBe(PALETTE.night);
    expect(props.get(TOKEN_VARS.fontDisplay)).toBe(FONT_DISPLAY);
    expect(props.get("--lp-ink")).toBe(PALETTE.ink);
    expect(props.get("--lp-blotter-edge")).toBe(PALETTE.mustard);
    expect(props.get("--wg-hit-min")).toBe("44px");
    expect(root.dataset).toMatchObject({
      contrast: "high",
      motion: "reduced",
      desk: "midnight-sorting-room",
      tone: "dark",
    });
    off();
    expect(props.size).toBe(0);
  });

  it("reverts to the default desk for an unknown id", () => {
    const { root } = fakeRoot();
    installTheme({ themeId: "unknown", highContrast: false, reducedMotion: false }, root);
    expect(root.dataset).toMatchObject({
      desk: "mustard-riso",
      contrast: "normal",
      motion: "full",
      tone: "light",
    });
  });
});
