import { describe, expect, it } from "vitest";
import { HUE_WHEEL } from "../src/constants";
import { harmony, harmonyTotal, hueDistance } from "../src/harmony";
import { createPrng } from "../src/prng";
import type { ChromaticColour, Colour, Piece } from "../src/types";
import { makePiece, piece, STARTER_PIECES } from "./fixtures/starter-pieces";

function coloured(...colours: Colour[]): Piece[] {
  return colours.map((colour, i) => makePiece({ id: `c${i}`, colour }));
}

function schemeOf(...colours: Colour[]): { name: string | null; points: number } {
  const result = harmony(coloured(...colours));
  const part = result.parts[0];
  return { name: result.scheme, points: part?.points ?? -1 };
}

function withAnchor(...colours: ChromaticColour[]): Piece[] {
  return [...coloured(...colours), makePiece({ id: "anchor", colour: "white" })];
}

function partPoints(pieces: Piece[], id: string): number {
  return harmony(pieces).parts.find((part) => part.id === id)?.points ?? -1;
}

describe("hue distance", () => {
  it("wraps around the wheel", () => {
    expect(hueDistance("pink", "red")).toBe(1);
    expect(hueDistance("red", "pink")).toBe(1);
    expect(hueDistance("magenta", "orange")).toBe(3);
    expect(hueDistance("red", "teal")).toBe(6);
    expect(hueDistance("blue", "blue")).toBe(0);
  });

  it("never exceeds 6 and is symmetric", () => {
    for (const a of HUE_WHEEL) {
      for (const b of HUE_WHEEL) {
        expect(hueDistance(a, b)).toBeLessThanOrEqual(6);
        expect(hueDistance(a, b)).toBe(hueDistance(b, a));
      }
    }
  });
});

describe("colour scheme (max 40)", () => {
  it("H = 0 is Neutral, 34 points", () => {
    expect(schemeOf("black", "white", "tan")).toEqual({ name: "Neutral", points: 34 });
  });

  it("H = 1 is Tonal, 40 points, however many pieces share the colour", () => {
    expect(schemeOf("red", "red", "black")).toEqual({ name: "Tonal", points: 40 });
  });

  it("H = 2 by distance 0 to 6 from red", () => {
    const expected: [ChromaticColour, string, number][] = [
      ["orange", "Analogous", 40],
      ["yellow", "Analogous", 40],
      ["lime", "Awkward pair", 20],
      ["green", "Triad pair", 32],
      ["mint", "Awkward pair", 20],
      ["teal", "Complementary", 40],
    ];
    expected.forEach(([other, name, points], i) => {
      expect(hueDistance("red", other)).toBe(i + 1);
      expect(schemeOf("red", other)).toEqual({ name, points });
    });
  });

  it("H = 2 wraps around the wheel", () => {
    expect(schemeOf("pink", "red")).toEqual({ name: "Analogous", points: 40 });
    expect(schemeOf("pink", "yellow")).toEqual({ name: "Awkward pair", points: 20 });
    expect(schemeOf("pink", "lime")).toEqual({ name: "Triad pair", points: 32 });
    expect(schemeOf("magenta", "yellow")).toEqual({ name: "Triad pair", points: 32 });
    expect(schemeOf("pink", "teal")).toEqual({ name: "Awkward pair", points: 20 });
    expect(schemeOf("pink", "mint")).toEqual({ name: "Complementary", points: 40 });
  });

  it("H = 3 triadic when every pair is 4 apart", () => {
    expect(schemeOf("red", "green", "blue")).toEqual({ name: "Triadic", points: 36 });
    expect(schemeOf("orange", "mint", "violet")).toEqual({ name: "Triadic", points: 36 });
    expect(schemeOf("yellow", "teal", "magenta")).toEqual({ name: "Triadic", points: 36 });
  });

  it("H = 3 analogous trio when every pair is within 3", () => {
    expect(schemeOf("red", "orange", "yellow")).toEqual({ name: "Analogous trio", points: 36 });
    expect(schemeOf("red", "yellow", "lime")).toEqual({ name: "Analogous trio", points: 36 });
    expect(schemeOf("magenta", "pink", "red")).toEqual({ name: "Analogous trio", points: 36 });
  });

  it("H = 3 busy otherwise", () => {
    expect(schemeOf("red", "green", "teal")).toEqual({ name: "Busy", points: 16 });
    expect(schemeOf("red", "orange", "blue")).toEqual({ name: "Busy", points: 16 });
    expect(schemeOf("red", "lime", "teal")).toEqual({ name: "Busy", points: 16 });
    expect(schemeOf("red", "yellow", "mint")).toEqual({ name: "Busy", points: 16 });
  });

  it("H >= 4 is Too many colours, 4 points", () => {
    expect(schemeOf("red", "green", "blue", "pink")).toEqual({
      name: "Too many colours",
      points: 4,
    });
    expect(schemeOf("red", "orange", "yellow", "lime", "green")).toEqual({
      name: "Too many colours",
      points: 4,
    });
  });

  it("every chromatic colour is its own hue", () => {
    expect(schemeOf("red", "red")).toEqual({ name: "Tonal", points: 40 });
    expect(schemeOf("lime", "green")).toEqual({ name: "Analogous", points: 40 });
  });

  it("gives a one-line reason naming the colours", () => {
    const reasons = (colours: Colour[]) => harmony(coloured(...colours)).parts[0]?.reason;
    expect(reasons(["black"])).toBe("Neutral: no colours to clash");
    expect(reasons(["red"])).toBe("Tonal: one colour (red)");
    expect(reasons(["red", "orange"])).toBe("Analogous: red and orange are 1 step apart");
    expect(reasons(["red", "teal"])).toBe("Complementary: red and teal are 6 steps apart");
    expect(reasons(["red", "green", "blue"])).toBe("Triadic: red, green, blue");
    expect(reasons(["red", "green", "teal"])).toBe("Busy: red, green, teal do not sit together");
    expect(reasons(["red", "green", "blue", "pink"])).toBe("Too many colours: 4 in one look");
  });
});

describe("neutral anchor (max 10)", () => {
  it("is 10 with a neutral piece and 0 without", () => {
    expect(partPoints(coloured("red", "black"), "anchor")).toBe(10);
    for (const neutral of ["black", "white", "cream", "grey", "navy", "tan"] as const) {
      expect(partPoints(coloured("red", neutral), "anchor")).toBe(10);
    }
    expect(partPoints(coloured("red", "blue"), "anchor")).toBe(0);
    expect(partPoints(coloured("pink"), "anchor")).toBe(0);
  });
});

describe("dress code, era and season spreads", () => {
  const spreadPieces = (key: "formality" | "warmth" | "era", values: number[]): Piece[] =>
    values.map((value, i) => {
      if (key === "era")
        return makePiece({
          id: `s${i}`,
          era: (["50s", "70s", "90s", "now"] as const)[value] ?? "now",
        });
      return makePiece({ id: `s${i}`, [key]: value });
    });

  it("formality spread 0 to 4 gives 20, 20, 14, 6, 0", () => {
    const results = [
      [3, 3],
      [3, 4],
      [2, 4],
      [1, 4],
      [1, 5],
    ].map((values) => partPoints(spreadPieces("formality", values), "dressCode"));
    expect(results).toEqual([20, 20, 14, 6, 0]);
  });

  it("era spread 0 to 3 gives 15, 15, 10, 4", () => {
    const results = [
      [2, 2],
      [2, 3],
      [1, 3],
      [0, 3],
    ].map((values) => partPoints(spreadPieces("era", values), "era"));
    expect(results).toEqual([15, 15, 10, 4]);
  });

  it("era spread uses the order 50s, 70s, 90s, now", () => {
    expect(
      partPoints([makePiece({ id: "a", era: "50s" }), makePiece({ id: "b", era: "70s" })], "era"),
    ).toBe(15);
    expect(
      partPoints([makePiece({ id: "a", era: "50s" }), makePiece({ id: "b", era: "90s" })], "era"),
    ).toBe(10);
    expect(
      partPoints([makePiece({ id: "a", era: "70s" }), makePiece({ id: "b", era: "now" })], "era"),
    ).toBe(10);
  });

  it("warmth spread 0 to 3 gives 15, 15, 10, 4", () => {
    const results = [
      [2, 2],
      [2, 3],
      [1, 3],
      [0, 3],
    ].map((values) => partPoints(spreadPieces("warmth", values), "season"));
    expect(results).toEqual([15, 15, 10, 4]);
  });

  it("a single piece has spread 0", () => {
    const one = [makePiece({ id: "a", colour: "red" })];
    expect(partPoints(one, "dressCode")).toBe(20);
    expect(partPoints(one, "era")).toBe(15);
    expect(partPoints(one, "season")).toBe(15);
  });
});

describe("harmony totals", () => {
  const riv = (n: number) => piece(`item-riviera-${n}`);
  const rai = (n: number) => piece(`item-rainy-city-${n}`);

  it("returns the five named parts with maximums 40, 10, 20, 15, 15", () => {
    const result = harmony(withAnchor("red"));
    expect(result.parts.map((part) => [part.id, part.name, part.max])).toEqual([
      ["scheme", "Colour scheme", 40],
      ["anchor", "Neutral anchor", 10],
      ["dressCode", "Dress code", 20],
      ["era", "Era match", 15],
      ["season", "Season sense", 15],
    ]);
    for (const part of result.parts) expect(part.reason.length).toBeGreaterThan(0);
    expect(result.total).toBe(result.parts.reduce((sum, part) => sum + part.points, 0));
  });

  it("hand-computed look 1: neutrals, spread 2, era spread 3, warmth spread 1 = 77", () => {
    const result = harmony([riv(1), riv(3), riv(5), riv(6), riv(7), riv(8)]);
    expect(result.scheme).toBe("Neutral");
    expect(result.parts.map((part) => part.points)).toEqual([34, 10, 14, 4, 15]);
    expect(result.total).toBe(77);
  });

  it("hand-computed look 2: yellow and mint 3 apart = 64", () => {
    const result = harmony([rai(7), rai(1), rai(5), rai(6), riv(7), rai(8)]);
    expect(result.scheme).toBe("Awkward pair");
    expect(result.parts.map((part) => part.points)).toEqual([20, 10, 20, 4, 10]);
    expect(result.total).toBe(64);
  });

  it("hand-computed look 3: sky and orange complementary = 83", () => {
    const result = harmony([riv(2), riv(4), riv(5), riv(6), riv(7), riv(8)]);
    expect(result.scheme).toBe("Complementary");
    expect(result.parts.map((part) => part.points)).toEqual([40, 10, 14, 4, 15]);
    expect(result.total).toBe(83);
  });

  it("is invariant under piece order", () => {
    const base = [riv(2), riv(4), riv(5), riv(6), riv(7), riv(8), rai(1), rai(7)];
    const expected = JSON.stringify(harmony(base));
    for (let seed = 1; seed <= 25; seed += 1) {
      expect(JSON.stringify(harmony(createPrng(seed).shuffle(base)))).toBe(expected);
    }
  });

  it("does not mutate its input", () => {
    const pieces = [riv(2), riv(4)];
    const copy = JSON.stringify(pieces);
    harmony(pieces);
    expect(JSON.stringify(pieces)).toBe(copy);
  });

  it("an empty board scores 0 with no scheme", () => {
    const result = harmony([]);
    expect(result.total).toBe(0);
    expect(result.scheme).toBeNull();
    expect(result.parts).toHaveLength(5);
    expect(harmonyTotal([])).toBe(0);
  });

  it("harmonyTotal agrees with harmony().total on random subsets", () => {
    const prng = createPrng(77);
    for (let i = 0; i < 300; i += 1) {
      const size = 1 + prng.int(8);
      const subset = prng.shuffle(STARTER_PIECES).slice(0, size);
      expect(harmonyTotal(subset)).toBe(harmony(subset).total);
    }
  });

  it("stays between 0 and 100", () => {
    const prng = createPrng(5);
    for (let i = 0; i < 300; i += 1) {
      const subset = prng.shuffle(STARTER_PIECES).slice(0, 1 + prng.int(10));
      const total = harmony(subset).total;
      expect(total).toBeGreaterThanOrEqual(0);
      expect(total).toBeLessThanOrEqual(100);
    }
  });
});
