import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TOKENS = readFileSync(join(import.meta.dirname, "../../src/ui/tokens.css"), "utf8");

/** `--color-name: #rrggbb;` declarations in the :root block. */
function colourTokens(): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const match of TOKENS.matchAll(/--(color-[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens.set(match[1] as string, match[2] as string);
  }
  return tokens;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of `#rrggbb`. */
function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

/** WCAG contrast ratio, 1 to 21. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const AA_BODY = 4.5;
const AA_LARGE = 3;

const tokens = colourTokens();
const colour = (name: string): string => {
  const hex = tokens.get(name);
  if (!hex) throw new Error(`tokens.css has no opaque colour token --${name}`);
  return hex;
};

describe("contrast helper", () => {
  it("matches the WCAG reference values", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("tokens.css colour pairs", () => {
  it("defines the colour tokens the pairs use", () => {
    for (const name of [
      "color-bg",
      "color-surface",
      "color-surface-2",
      "color-text",
      "color-text-dim",
      "color-accent",
      "color-on-accent",
      "color-ok",
      "color-warn",
      "color-bad",
      "color-line",
    ]) {
      expect(tokens.has(name), name).toBe(true);
    }
  });

  // [foreground, background, minimum ratio, where it is used]
  const TEXT_PAIRS: readonly [string, string, number, string][] = [
    ["color-text", "color-bg", AA_BODY, "body text on the page"],
    ["color-text", "color-surface", AA_BODY, "body text on panels"],
    ["color-text", "color-surface-2", AA_BODY, "buttons and mission rows"],
    ["color-text-dim", "color-bg", AA_BODY, "secondary text on the page"],
    ["color-text-dim", "color-surface", AA_BODY, "secondary text on panels"],
    ["color-text-dim", "color-surface-2", AA_BODY, "secondary text on rows"],
    ["color-on-accent", "color-accent", AA_BODY, "primary buttons and active choices"],
    ["color-accent", "color-bg", AA_BODY, "title, objective and target coins"],
    ["color-accent", "color-surface", AA_BODY, "accent text on panels"],
    ["color-ok", "color-surface", AA_BODY, "'First clear' note and OK meter"],
    ["color-warn", "color-surface", AA_BODY, "lock notice"],
    ["color-bad", "color-surface", AA_BODY, "danger buttons"],
    ["color-bad", "color-bg", AA_BODY, "urgent timer and reset confirmation"],
    ["color-text", "color-bg", AA_LARGE, "large display type"],
  ];

  for (const [fg, bg, min, where] of TEXT_PAIRS) {
    it(`${fg} on ${bg} is at least ${min}:1 (${where})`, () => {
      expect(contrast(colour(fg), colour(bg))).toBeGreaterThanOrEqual(min);
    });
  }

  it("borders and bar tracks are at least 3:1 against the page and panels", () => {
    expect(contrast(colour("color-line"), colour("color-bg"))).toBeGreaterThanOrEqual(AA_LARGE);
    expect(contrast(colour("color-line"), colour("color-surface"))).toBeGreaterThanOrEqual(
      AA_LARGE,
    );
  });
});
