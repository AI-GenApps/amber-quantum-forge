import { COLOURS } from "@web-games/lantern-loops-core";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../src/theme/contrast";
import { GLYPH_BY_COLOUR, glyphPath, LANTERN_HEX, PALETTE, UNLIT_HEX } from "../src/theme/palette";
import { gameCss } from "../src/theme/styles";
import {
  applyGameTheme,
  darkGame,
  darkTheme,
  gameTokensFor,
  HIT_PX,
  highContrastGame,
  highContrastTheme,
  themeFor,
} from "../src/theme/tokens";
import { contrastRows } from "./helpers/contrast-pairs";

describe("contrast", () => {
  it("meets 4.5:1 for text and 3:1 for graphics in both themes", () => {
    const rows = contrastRows();
    console.log(
      `\n${["theme/kind/pair".padEnd(58), "fg".padEnd(8), "bg".padEnd(8), "ratio", "min"].join(" ")}\n${rows
        .map(
          (r) =>
            `${r.name.padEnd(58)} ${r.fg.padEnd(8)} ${r.bg.padEnd(8)} ${r.ratio.toFixed(2).padStart(5)} ${r.min}`,
        )
        .join("\n")}`,
    );
    const failing = rows
      .filter((r) => r.ratio < r.min)
      .map((r) => `${r.name}: ${r.ratio.toFixed(2)}`);
    expect(failing).toEqual([]);
  });

  it("high contrast is at least as strong as the default for the main text pair", () => {
    expect(
      contrastRatio(highContrastTheme.colorText, highContrastTheme.colorBackground),
    ).toBeGreaterThanOrEqual(contrastRatio(darkTheme.colorText, darkTheme.colorBackground));
  });
});

describe("tokens and palette", () => {
  it("uses the art bible palette for the dark theme", () => {
    expect(darkTheme.colorBackground).toBe("#12132E");
    expect(darkTheme.colorSurface).toBe("#1E2050");
    expect(darkTheme.colorText).toBe("#F6EAD3");
    expect(PALETTE.teal).toBe("#0E5A5F");
    expect(PALETTE.ink).toBe("#241B2F");
    expect(LANTERN_HEX).toEqual({
      amber: "#F2A33A",
      rose: "#E9657F",
      jade: "#3FBF98",
      azure: "#4EA6EA",
      violet: "#9A7DE3",
    });
    expect(UNLIT_HEX).toBe("#6E76A6");
  });

  it("names only the bundled font families", () => {
    for (const theme of [darkTheme, highContrastTheme]) {
      expect(theme.fontDisplay).toBe('"Fraunces", serif');
      expect(theme.fontBody).toBe('"Nunito", sans-serif');
    }
  });

  it("gives every colour its own glyph", () => {
    expect(GLYPH_BY_COLOUR).toEqual({
      amber: "circle",
      rose: "diamond",
      jade: "triangle",
      azure: "square",
      violet: "star",
    });
    const paths = new Set(COLOURS.map((c) => glyphPath(GLYPH_BY_COLOUR[c], 50, 50, 12)));
    expect(paths.size).toBe(5);
  });

  it("thickens outlines and adds tile glyphs only in high contrast", () => {
    expect(darkGame.outline).toBe(0);
    expect(darkGame.glyphsOnTiles).toBe(false);
    expect(highContrastGame.outline).toBeGreaterThan(0);
    expect(highContrastGame.glyphsOnTiles).toBe(true);
    expect(gameTokensFor(true)).toBe(highContrastGame);
    expect(themeFor(false)).toBe(darkTheme);
  });

  it("applies and removes the custom properties", () => {
    const root = document.documentElement;
    const undo = applyGameTheme(true, root);
    expect(root.style.getPropertyValue("--wg-color-background")).toBe("#0A0B1F");
    expect(root.style.getPropertyValue("--ll-hit")).toBe("44px");
    expect(root.dataset.contrast).toBe("high");
    undo();
    expect(root.style.getPropertyValue("--wg-color-background")).toBe("");
    expect(root.dataset.contrast).toBeUndefined();
  });
});

describe("hit areas in the stylesheet", () => {
  it("defines --ll-hit as 44px and applies it to controls", () => {
    expect(HIT_PX).toBe(44);
    expect(gameCss).toContain("--ll-hit: 44px");
    expect(gameCss).toContain("min-height: var(--ll-hit)");
    for (const selector of [
      ".ll-puzzle-btn",
      ".ll-brush",
      ".ll-chip-btn",
      ".ll-archive-row",
      ".ll-chapter",
    ]) {
      expect(gameCss).toContain(selector);
    }
  });
});
