import { describe, expect, it } from "vitest";
import { harmony } from "../src/harmony";
import { indexPieces, livePreview, requiredMet, scoreLook, starsFor } from "../src/score";
import type { ChallengeShape, Look, Piece, Rule, Stars } from "../src/types";
import { makePiece, piece, STARTER_PIECES } from "./fixtures/starter-pieces";

const SLOTS_A = ["top", "bottom", "shoes", "bag", "hat", "accessory"] as const;

function buildSet(
  formality: number[],
  era: Piece["era"][],
  warmth: number[],
): { pieces: Piece[]; look: Look } {
  const pieces = SLOTS_A.map((category, i) =>
    makePiece({
      id: `s-${category}`,
      category,
      colour: "white",
      formality: formality[i] ?? 2,
      era: era[i] ?? "70s",
      warmth: warmth[i] ?? 1,
    }),
  );
  const look: Look = {};
  for (const item of pieces) look[item.category] = item.id;
  return { pieces, look };
}

const AT_70 = buildSet(
  [1, 4, 2, 2, 2, 2],
  ["50s", "90s", "70s", "70s", "70s", "70s"],
  [0, 2, 1, 1, 1, 1],
);
const AT_69 = buildSet(
  [1, 4, 2, 2, 2, 2],
  ["now", "now", "now", "now", "now", "now"],
  [0, 3, 1, 1, 1, 1],
);

function challengeWith(c: number, met: number): ChallengeShape {
  const rules: Rule[] = [];
  for (let i = 0; i < c; i += 1) {
    rules.push({ kind: "include-piece", pieceId: i < met ? "s-top" : `missing-${i}` });
  }
  return { id: `matrix-${c}-${met}`, slotSet: "A", rules };
}

describe("fixture harmony", () => {
  it("builds exactly 70 and 69", () => {
    expect(harmony(AT_70.pieces).total).toBe(70);
    expect(harmony(AT_69.pieces).total).toBe(69);
  });
});

describe("star matrix", () => {
  const expected: Record<number, Record<number, [Stars, Stars]>> = {
    2: { 0: [0, 0], 1: [1, 1], 2: [2, 3] },
    3: { 0: [0, 0], 1: [0, 0], 2: [1, 1], 3: [2, 3] },
    4: { 0: [0, 0], 1: [0, 0], 2: [1, 1], 3: [1, 1], 4: [2, 3] },
  };

  for (const c of [2, 3, 4]) {
    for (let m = 0; m <= c; m += 1) {
      const [below, at] = expected[c]?.[m] ?? [0, 0];
      it(`C = ${c}, M = ${m}: ${below} stars at harmony 69, ${at} stars at harmony 70`, () => {
        const challenge = challengeWith(c, m);
        const low = scoreLook(challenge, AT_69.pieces, AT_69.look);
        const high = scoreLook(challenge, AT_70.pieces, AT_70.look);
        const lowMet = scoreLook(challenge, AT_69.pieces, AT_69.look);
        expect(low.metCount).toBe(m);
        expect(high.metCount).toBe(m);
        expect(lowMet.harmony.total).toBe(69);
        expect(high.harmony.total).toBe(70);
        expect(low.stars).toBe(below);
        expect(high.stars).toBe(at);
      });
    }
  }

  it("requires ceil(C / 2) rules", () => {
    expect([2, 3, 4].map(requiredMet)).toEqual([1, 2, 2]);
  });

  it("starsFor handles the same matrix directly", () => {
    expect(starsFor(3, 3, 70, true)).toBe(3);
    expect(starsFor(3, 3, 69, true)).toBe(2);
    expect(starsFor(3, 2, 100, true)).toBe(1);
    expect(starsFor(3, 1, 100, true)).toBe(0);
    expect(starsFor(3, 3, 100, false)).toBe(0);
  });
});

describe("incomplete and empty looks", () => {
  const challenge = challengeWith(2, 2);

  it("an incomplete look never earns stars, even with every rule met", () => {
    const { top, ...rest } = AT_70.look;
    expect(top).toBeDefined();
    const result = scoreLook(challenge, AT_70.pieces, rest);
    expect(result.complete).toBe(false);
    expect(result.missing).toEqual(["top"]);
    expect(result.stars).toBe(0);
  });

  it("the empty board is 0 stars, incomplete, with every slot missing", () => {
    const result = scoreLook(challenge, AT_70.pieces, {});
    expect(result.stars).toBe(0);
    expect(result.complete).toBe(false);
    expect(result.missing).toEqual(["hat", "accessory", "top", "bag", "bottom", "shoes"]);
    expect(result.harmony.total).toBe(0);
  });

  it("the empty board scores 0 stars for every slot set and rule list", () => {
    for (const slotSet of ["A", "B", "C", "D", "E", "F", "G"] as const) {
      for (const rules of [
        [],
        [{ kind: "palette-warm" }],
        [
          { kind: "max-hues", max: 3 },
          { kind: "avoid-colour", colour: "red" },
        ],
      ] as Rule[][]) {
        expect(scoreLook({ id: "x", slotSet, rules }, STARTER_PIECES, {}).stars).toBe(0);
      }
    }
  });

  it("ignores unknown ids, wrong categories and closed slots", () => {
    const messy: Look = { ...AT_70.look, top: "does-not-exist", bottom: "s-top", outer: "s-shoes" };
    const result = scoreLook(challenge, AT_70.pieces, messy);
    expect(result.complete).toBe(false);
    expect(result.missing).toEqual(["top", "bottom"]);
    expect(result.stars).toBe(0);
  });

  it("a dress together with top and bottom is not complete", () => {
    const dress = piece("item-rainy-city-7");
    const look: Look = {
      top: "item-riviera-1",
      bottom: "item-riviera-3",
      dress: dress.id,
      outer: "item-rainy-city-1",
      shoes: "item-riviera-5",
      bag: "item-riviera-6",
      hat: "item-riviera-7",
      accessory: "item-riviera-8",
    };
    const result = scoreLook({ id: "g", slotSet: "G", rules: [] }, STARTER_PIECES, look);
    expect(result.complete).toBe(false);
    expect(result.stars).toBe(0);
  });
});

describe("rule results", () => {
  const challenge: ChallengeShape = {
    id: "riv-07-like",
    slotSet: "A",
    rules: [
      { kind: "include-piece", pieceId: "item-riviera-4" },
      { kind: "warmth-max", value: 1 },
      { kind: "max-spend", amount: 330 },
    ],
  };
  const look: Look = {
    top: "item-riviera-2",
    bottom: "item-riviera-4",
    shoes: "item-riviera-5",
    bag: "item-riviera-6",
    hat: "item-riviera-7",
    accessory: "item-riviera-8",
  };

  it("returns one result per rule with code, chip, detail and met", () => {
    const result = scoreLook(challenge, STARTER_PIECES, look);
    expect(result.rules.map((rule) => [rule.code, rule.met])).toEqual([
      ["include-piece:item-riviera-4", true],
      ["warmth-max:1", true],
      ["max-spend:330", true],
    ]);
    expect(result.rules.map((rule) => rule.chip)).toEqual([
      "Wear the Orange Wrap Skirt",
      "Total warmth at most 1",
      "Spend at most $330",
    ]);
    expect(result.rules.map((rule) => rule.detail)).toEqual([
      "Wearing the Orange Wrap Skirt",
      "Total warmth is 0, the limit is 1",
      "Spend is $324, the limit is $330",
    ]);
    expect(result.metCount).toBe(3);
    expect(result.complete).toBe(true);
    expect(result.harmony.total).toBe(83);
    expect(result.stars).toBe(3);
  });

  it("names a required piece that is not on the board", () => {
    const swapped: Look = { ...look, bottom: "item-riviera-3" };
    const result = scoreLook(challenge, STARTER_PIECES, swapped);
    expect(result.rules[0]?.met).toBe(false);
    expect(result.rules[0]?.detail).toBe("Missing: the Orange Wrap Skirt");
    expect(result.rules[2]?.detail).toBe("Spend is $336, the limit is $330");
    expect(result.metCount).toBe(1);
    expect(result.stars).toBe(0);
  });

  it("accepts a lookup map as well as an array", () => {
    const fromArray = scoreLook(challenge, STARTER_PIECES, look);
    const fromMap = scoreLook(challenge, indexPieces(STARTER_PIECES), look);
    expect(JSON.stringify(fromMap)).toBe(JSON.stringify(fromArray));
  });
});

describe("livePreview", () => {
  const challenge: ChallengeShape = {
    id: "preview",
    slotSet: "A",
    rules: [{ kind: "palette-warm" }, { kind: "warmth-max", value: 2 }],
  };

  it("returns rule results and harmony for a partial look without stars", () => {
    const preview = livePreview(challenge, STARTER_PIECES, {
      top: "item-riviera-2",
      shoes: "item-riviera-5",
    });
    expect(preview.complete).toBe(false);
    expect(preview.missing).toEqual(["hat", "accessory", "bag", "bottom"]);
    expect(preview.rules.map((rule) => rule.met)).toEqual([false, true]);
    expect(preview.rules[0]?.detail).toBe("Not warm: sky");
    expect(preview.metCount).toBe(1);
    expect(preview.harmony.total).toBe(
      harmony([piece("item-riviera-2"), piece("item-riviera-5")]).total,
    );
    expect("stars" in preview).toBe(false);
  });

  it("works on an empty board", () => {
    const preview = livePreview(challenge, STARTER_PIECES, {});
    expect(preview.harmony.total).toBe(0);
    expect(preview.complete).toBe(false);
    expect(preview.rules).toHaveLength(2);
  });

  it("does not mutate its inputs", () => {
    const look: Look = { top: "item-riviera-2" };
    const before = JSON.stringify([challenge, look, STARTER_PIECES]);
    livePreview(challenge, STARTER_PIECES, look);
    scoreLook(challenge, STARTER_PIECES, look);
    expect(JSON.stringify([challenge, look, STARTER_PIECES])).toBe(before);
  });
});
