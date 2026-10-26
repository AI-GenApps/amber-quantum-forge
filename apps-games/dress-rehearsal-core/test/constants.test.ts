import { describe, expect, it } from "vitest";
import {
  ALL_COLOURS,
  CATEGORIES,
  COOL_COLOURS,
  DRESS_CODE_POINTS,
  ERA_ORDER,
  ERA_POINTS,
  FEATURES,
  FORMALITY_MAX,
  FORMALITY_MIN,
  HARMONY_PART_NAMES,
  HARMONY_WEIGHTS,
  HINT_NODE_CAP,
  HUE_WHEEL,
  NEUTRAL_COLOURS,
  RULE_FAMILY,
  RULE_KINDS,
  SCHEME_POINTS,
  SEASON_POINTS,
  THREE_STAR_HARMONY,
  WARM_COLOURS,
  WARMTH_MAX,
  WARMTH_MIN,
} from "../src/constants";

describe("pinned constants (docs and code must not drift)", () => {
  it("pins the 12-step hue wheel order", () => {
    expect(HUE_WHEEL).toEqual([
      "red",
      "orange",
      "yellow",
      "lime",
      "green",
      "mint",
      "teal",
      "sky",
      "blue",
      "violet",
      "magenta",
      "pink",
    ]);
  });

  it("pins neutrals, warm and cool sets", () => {
    expect(NEUTRAL_COLOURS).toEqual(["black", "white", "cream", "grey", "navy", "tan"]);
    expect([...WARM_COLOURS].sort()).toEqual(["orange", "pink", "red", "yellow"]);
    expect([...COOL_COLOURS].sort()).toEqual(["blue", "mint", "sky", "teal", "violet"]);
    expect(ALL_COLOURS).toHaveLength(18);
    expect(new Set(ALL_COLOURS).size).toBe(18);
  });

  it("keeps lime, green and magenta neither warm nor cool", () => {
    for (const colour of ["lime", "green", "magenta"] as const) {
      expect(WARM_COLOURS).not.toContain(colour);
      expect(COOL_COLOURS).not.toContain(colour);
    }
  });

  it("pins eras, features and categories", () => {
    expect(ERA_ORDER).toEqual(["50s", "70s", "90s", "now"]);
    expect(FEATURES).toEqual(["waterproof", "shade", "sparkle", "sturdy"]);
    expect(CATEGORIES).toEqual([
      "top",
      "bottom",
      "dress",
      "outer",
      "shoes",
      "bag",
      "hat",
      "accessory",
    ]);
  });

  it("pins tag ranges", () => {
    expect([FORMALITY_MIN, FORMALITY_MAX]).toEqual([1, 5]);
    expect([WARMTH_MIN, WARMTH_MAX]).toEqual([0, 3]);
  });

  it("pins the harmony weights (40, 10, 20, 15, 15) and names", () => {
    expect(HARMONY_WEIGHTS).toEqual({ scheme: 40, anchor: 10, dressCode: 20, era: 15, season: 15 });
    expect(Object.values(HARMONY_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
    expect(HARMONY_PART_NAMES).toEqual({
      scheme: "Colour scheme",
      anchor: "Neutral anchor",
      dressCode: "Dress code",
      era: "Era match",
      season: "Season sense",
    });
  });

  it("pins scheme and spread point tables", () => {
    expect(SCHEME_POINTS).toEqual({
      Neutral: 34,
      Tonal: 40,
      Analogous: 40,
      Complementary: 40,
      "Triad pair": 32,
      "Awkward pair": 20,
      Triadic: 36,
      "Analogous trio": 36,
      Busy: 16,
      "Too many colours": 4,
    });
    expect(DRESS_CODE_POINTS).toEqual([20, 20, 14, 6, 0]);
    expect(ERA_POINTS).toEqual([15, 15, 10, 4]);
    expect(SEASON_POINTS).toEqual([15, 15, 10, 4]);
  });

  it("pins the three-star bar and the hint node cap", () => {
    expect(THREE_STAR_HARMONY).toBe(70);
    expect(HINT_NODE_CAP).toBe(400000);
  });

  it("lists exactly the 16 rule kinds, each in one of 7 families", () => {
    expect(RULE_KINDS).toHaveLength(16);
    expect(new Set(RULE_KINDS).size).toBe(16);
    expect(new Set(Object.values(RULE_FAMILY))).toEqual(
      new Set(["palette", "era", "formality", "weather", "feature", "budget", "piece"]),
    );
    for (const kind of RULE_KINDS) expect(RULE_FAMILY[kind]).toBeDefined();
  });
});
