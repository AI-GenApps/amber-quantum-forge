import { describe, expect, it } from "vitest";
import { HINT_NODE_CAP } from "../src/constants";
import { countLooks, enumerateLooks, pickHint, solveLook, UNKNOWN } from "../src/enumerate";
import { scoreLook } from "../src/score";
import { isComplete, SLOT_ORDER, SLOT_SET_IDS } from "../src/slots";
import type { Look, Piece } from "../src/types";
import { STARTER_PROOF, shape } from "./fixtures/challenges";
import { piece, STARTER_PIECES } from "./fixtures/starter-pieces";

const RIV_01 = shape("riv-01", "A", "warmth-max:2; needs-feature:shade");
const RIV_02 = shape("riv-02", "A", "max-hues:1; max-spend:330");
const RIV_06 = shape("riv-06", "A", "include-colour:sky; palette-cool; avoid-colour:navy");
const RAI_03 = shape("rai-03", "B", "needs-feature:waterproof; warmth-min:5; max-hues:1");

const COUNTS = { A: 72, B: 16, C: 144, D: 144, E: 80, F: 160, G: 160 } as const;

function threeStarCount(challenge: typeof RIV_01): { looks: number; threeStar: number } {
  let looks = 0;
  let threeStar = 0;
  for (const look of enumerateLooks(challenge.slotSet, STARTER_PIECES)) {
    looks += 1;
    if (scoreLook(challenge, STARTER_PIECES, look).stars === 3) threeStar += 1;
  }
  return { looks, threeStar };
}

describe("look counts for the starting closet", () => {
  for (const id of SLOT_SET_IDS) {
    it(`set ${id} has ${COUNTS[id]} complete looks`, () => {
      expect(countLooks(id, STARTER_PIECES)).toBe(COUNTS[id]);
      expect([...enumerateLooks(id, STARTER_PIECES)]).toHaveLength(COUNTS[id]);
    });
  }

  it("enumerates distinct complete looks in a fixed order", () => {
    const first = [...enumerateLooks("G", STARTER_PIECES)];
    const second = [...enumerateLooks("G", STARTER_PIECES)];
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(new Set(first.map((look) => JSON.stringify(look))).size).toBe(first.length);
    for (const look of first) {
      expect(isComplete("G", look)).toBe(true);
      expect(Object.keys(look)).toEqual(SLOT_ORDER.filter((slot) => slot in look));
    }
  });

  it("enumerates dress looks before top and bottom looks", () => {
    const looks = [...enumerateLooks("E", STARTER_PIECES)];
    const dressLooks = looks.filter((look) => look.dress !== undefined);
    expect(dressLooks).toHaveLength(8);
    expect(looks.slice(0, 8)).toEqual(dressLooks);
    for (const look of looks.slice(8)) {
      expect(look.dress).toBeUndefined();
      expect(look.top).toBeDefined();
      expect(look.bottom).toBeDefined();
    }
  });

  it("returns zero looks when a needed category is empty", () => {
    const noShoes = STARTER_PIECES.filter((item) => item.category !== "shoes");
    expect(countLooks("A", noShoes)).toBe(0);
    expect([...enumerateLooks("A", noShoes)]).toEqual([]);
    expect(countLooks("A", [])).toBe(0);
  });

  it("counts with arithmetic what enumeration produces for a bigger closet", () => {
    const doubled: Piece[] = [
      ...STARTER_PIECES,
      ...STARTER_PIECES.map((item) => ({ ...item, id: `${item.id}-b` })),
    ];
    expect(countLooks("G", doubled)).toBe((2 + 6 * 6) * 4 * 4 * 4 * 2 * 4);
    expect([...enumerateLooks("B", doubled)]).toHaveLength(1024);
    expect(countLooks("B", doubled)).toBe(2 * 4 * 4 * 4 * 2 * 4);
  });
});

describe("parity with the prototype (starting closet)", () => {
  it("riv-01 has 24 three-star looks of 72", () => {
    expect(threeStarCount(RIV_01)).toEqual({ looks: 72, threeStar: 24 });
  });

  it("riv-02 has 9 of 72", () => {
    expect(threeStarCount(RIV_02)).toEqual({ looks: 72, threeStar: 9 });
  });

  it("rai-03 (set B) has 4 of 16", () => {
    expect(threeStarCount(RAI_03)).toEqual({ looks: 16, threeStar: 4 });
  });

  for (const row of STARTER_PROOF) {
    it(`${row.id} matches the content-plan proof row (${row.threeStar} of ${row.looks})`, () => {
      const challenge = shape(row.id, row.set, row.codes);
      expect(threeStarCount(challenge)).toEqual({ looks: row.looks, threeStar: row.threeStar });
    });
  }
});

describe("solveLook", () => {
  it("finds a three-star look when nothing is locked", () => {
    const result = solveLook(RIV_01, STARTER_PIECES, {});
    expect(result).not.toBeNull();
    expect(result).not.toBe(UNKNOWN);
    expect(scoreLook(RIV_01, STARTER_PIECES, result as Look).stars).toBe(3);
  });

  it("returns the first three-star look in enumeration order", () => {
    const first = [...enumerateLooks("A", STARTER_PIECES)].find(
      (look) => scoreLook(RIV_01, STARTER_PIECES, look).stars === 3,
    );
    expect(solveLook(RIV_01, STARTER_PIECES, {})).toEqual(first);
  });

  it("keeps every locked piece", () => {
    const locked: Look = { top: "item-riviera-1", shoes: "item-riviera-5" };
    const result = solveLook(RIV_01, STARTER_PIECES, locked) as Look;
    expect(result.top).toBe("item-riviera-1");
    expect(result.shoes).toBe("item-riviera-5");
    expect(scoreLook(RIV_01, STARTER_PIECES, result).stars).toBe(3);
  });

  it("returns the locked look itself when it is already a three-star look", () => {
    const full: Look = {
      hat: "item-riviera-7",
      accessory: "item-riviera-8",
      top: "item-riviera-1",
      bag: "item-riviera-6",
      bottom: "item-riviera-3",
      shoes: "item-riviera-5",
    };
    expect(solveLook(RIV_01, STARTER_PIECES, full)).toEqual(full);
  });

  it("returns null when the locked pieces rule out every three-star look", () => {
    const clash: Look = { top: "item-riviera-2", bottom: "item-riviera-4" };
    expect(solveLook(RIV_02, STARTER_PIECES, clash)).toBeNull();
  });

  it("returns null for locked pieces that cannot be placed", () => {
    expect(solveLook(RIV_01, STARTER_PIECES, { outer: "item-rainy-city-1" })).toBeNull();
    expect(solveLook(RIV_01, STARTER_PIECES, { top: "item-riviera-3" })).toBeNull();
    expect(solveLook(RIV_01, STARTER_PIECES, { top: "nope" })).toBeNull();
  });

  it("returns null when no three-star look exists at all", () => {
    const impossible = shape("impossible", "A", "palette-warm; palette-cool; include-colour:sky");
    expect(solveLook(impossible, STARTER_PIECES, {})).toBeNull();
  });

  it("respects the one-piece rule for locked pieces", () => {
    const rule = shape("g", "G", "needs-feature:waterproof; max-hues:2");
    const withDress = solveLook(rule, STARTER_PIECES, { dress: "item-rainy-city-7" }) as Look;
    expect(withDress.dress).toBe("item-rainy-city-7");
    expect(withDress.top).toBeUndefined();
    expect(withDress.bottom).toBeUndefined();
    const withTop = solveLook(rule, STARTER_PIECES, { top: "item-riviera-1" }) as Look;
    expect(withTop.top).toBe("item-riviera-1");
    expect(withTop.dress).toBeUndefined();
    expect(withTop.bottom).toBeDefined();
    expect(
      solveLook(rule, STARTER_PIECES, { dress: "item-rainy-city-7", top: "item-riviera-1" }),
    ).toBeNull();
  });

  it("returns UNKNOWN when the visit cap is hit and finds the look with one more visit", () => {
    const all = [...enumerateLooks("A", STARTER_PIECES)];
    const index = all.findIndex((look) => scoreLook(RIV_06, STARTER_PIECES, look).stars === 3);
    expect(index).toBe(24);
    expect(solveLook(RIV_06, STARTER_PIECES, {}, { maxVisited: 1 })).toBe(UNKNOWN);
    expect(solveLook(RIV_06, STARTER_PIECES, {}, { maxVisited: index })).toBe(UNKNOWN);
    expect(solveLook(RIV_06, STARTER_PIECES, {}, { maxVisited: index + 1 })).toEqual(all[index]);
  });

  it("returns null, not UNKNOWN, when the cap equals the number of candidates", () => {
    const clash: Look = { top: "item-riviera-2", bottom: "item-riviera-4" };
    expect(solveLook(RIV_02, STARTER_PIECES, clash, { maxVisited: 8 })).toBeNull();
    expect(solveLook(RIV_02, STARTER_PIECES, clash, { maxVisited: 7 })).toBe(UNKNOWN);
    expect(solveLook(RIV_02, STARTER_PIECES, clash, { maxVisited: 0 })).toBe(UNKNOWN);
  });

  it("defaults to the 400,000 visit cap", () => {
    expect(HINT_NODE_CAP).toBe(400000);
    expect(solveLook(RIV_01, STARTER_PIECES, {})).not.toBe(UNKNOWN);
  });

  it("is deterministic and never mutates its inputs", () => {
    const locked: Look = { top: "item-riviera-1" };
    const before = JSON.stringify([locked, STARTER_PIECES, RIV_01]);
    const a = solveLook(RIV_01, STARTER_PIECES, locked);
    const b = solveLook(RIV_01, STARTER_PIECES, locked);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify([locked, STARTER_PIECES, RIV_01])).toBe(before);
  });
});

describe("pickHint", () => {
  const REFERENCE: Look = {
    hat: "item-riviera-7",
    accessory: "item-riviera-8",
    top: "item-riviera-1",
    bag: "item-riviera-6",
    bottom: "item-riviera-3",
    shoes: "item-riviera-5",
  };

  it("reference look is a three-star look of riv-01", () => {
    expect(scoreLook(RIV_01, STARTER_PIECES, REFERENCE).stars).toBe(3);
  });

  it("uses the solver first and reveals the first slot in board order", () => {
    const solved = solveLook(RIV_01, STARTER_PIECES, {}) as Look;
    const hint = pickHint(RIV_01, STARTER_PIECES, {}, REFERENCE);
    expect(hint).toEqual({ slot: "hat", pieceId: solved.hat, source: "solver" });
  });

  it("skips slots the board already has right and keeps locked pieces", () => {
    const board: Look = { hat: "item-riviera-7", accessory: "item-riviera-8" };
    const hint = pickHint(RIV_01, STARTER_PIECES, board, REFERENCE);
    const solved = solveLook(RIV_01, STARTER_PIECES, board) as Look;
    expect(hint).toEqual({ slot: "top", pieceId: solved.top, source: "solver" });
  });

  it("falls back to the reference when the board makes every three-star look impossible", () => {
    const board: Look = { top: "item-riviera-2", bottom: "item-riviera-4" };
    const reference = [...enumerateLooks("A", STARTER_PIECES)].find(
      (look) => scoreLook(RIV_02, STARTER_PIECES, look).stars === 3,
    ) as Look;
    const hint = pickHint(RIV_02, STARTER_PIECES, board, reference);
    expect(hint).toEqual({ slot: "hat", pieceId: reference.hat, source: "reference" });
  });

  const RIV_06_REFERENCE = [...enumerateLooks("A", STARTER_PIECES)].find(
    (look) => scoreLook(RIV_06, STARTER_PIECES, look).stars === 3,
  ) as Look;

  it("falls back to the reference when the solver hits its cap", () => {
    const hint = pickHint(RIV_06, STARTER_PIECES, {}, RIV_06_REFERENCE, { maxVisited: 1 });
    expect(hint).toEqual({ slot: "hat", pieceId: RIV_06_REFERENCE.hat, source: "reference" });
  });

  it("reference fallback names the first slot where the board differs", () => {
    const other = piece(
      RIV_06_REFERENCE.accessory === "item-riviera-8" ? "item-rainy-city-8" : "item-riviera-8",
    );
    const board: Look = { hat: RIV_06_REFERENCE.hat as string, accessory: other.id };
    const hint = pickHint(RIV_06, STARTER_PIECES, board, RIV_06_REFERENCE, { maxVisited: 1 });
    expect(hint).toEqual({
      slot: "accessory",
      pieceId: RIV_06_REFERENCE.accessory,
      source: "reference",
    });
  });

  it("returns null when the board already matches the reference", () => {
    expect(
      pickHint(RIV_06, STARTER_PIECES, RIV_06_REFERENCE, RIV_06_REFERENCE, { maxVisited: 1 }),
    ).toBeNull();
  });

  it("returns null when the board is already a three-star look", () => {
    expect(pickHint(RIV_01, STARTER_PIECES, REFERENCE, REFERENCE)).toBeNull();
  });

  it("is deterministic and does not mutate its inputs", () => {
    const board: Look = { top: "item-riviera-1" };
    const before = JSON.stringify([board, REFERENCE]);
    const a = pickHint(RIV_01, STARTER_PIECES, board, REFERENCE);
    const b = pickHint(RIV_01, STARTER_PIECES, board, REFERENCE);
    expect(a).toEqual(b);
    expect(JSON.stringify([board, REFERENCE])).toBe(before);
  });

  it("hints the dress when the board has no top or bottom and the solution uses a dress", () => {
    const rule = shape("dress-first", "B", "needs-feature:waterproof; warmth-min:5; max-hues:1");
    const hint = pickHint(rule, STARTER_PIECES, {}, {});
    expect(hint?.source).toBe("solver");
    expect(piece(hint?.pieceId ?? "").category).toBe(hint?.slot);
  });
});
