import { describe, expect, it } from "vitest";
import {
  canPlace,
  clearSlot,
  hasConflict,
  hasOnePieceRule,
  isComplete,
  missingSlots,
  normalizeLook,
  openSlots,
  place,
  SLOT_ORDER,
  SLOT_SET_IDS,
  SLOT_SETS,
} from "../src/slots";
import type { Look, Slot, SlotSetId } from "../src/types";
import { piece } from "./fixtures/starter-pieces";

const TOP = piece("item-riviera-1");
const TOP_2 = piece("item-riviera-2");
const BOTTOM = piece("item-riviera-3");
const DRESS = piece("item-rainy-city-7");
const OUTER = piece("item-rainy-city-1");
const SHOES = piece("item-riviera-5");
const BAG = piece("item-riviera-6");
const HAT = piece("item-riviera-7");
const ACCESSORY = piece("item-riviera-8");

const OPEN_IN_BOARD_ORDER: Record<SlotSetId, Slot[]> = {
  A: ["hat", "accessory", "top", "bag", "bottom", "shoes"],
  B: ["hat", "accessory", "outer", "dress", "bag", "shoes"],
  C: ["accessory", "outer", "top", "bag", "bottom", "shoes"],
  D: ["hat", "accessory", "outer", "top", "bag", "bottom", "shoes"],
  E: ["hat", "accessory", "top", "dress", "bag", "bottom", "shoes"],
  F: ["accessory", "outer", "top", "dress", "bag", "bottom", "shoes"],
  G: ["hat", "accessory", "outer", "top", "dress", "bag", "bottom", "shoes"],
};

describe("slot order and sets", () => {
  it("pins the board order", () => {
    expect(SLOT_ORDER).toEqual([
      "hat",
      "accessory",
      "outer",
      "top",
      "dress",
      "bag",
      "bottom",
      "shoes",
    ]);
  });

  it("lists seven sets A to G with 6, 6, 6, 7, 7, 7, 8 open slots", () => {
    expect(SLOT_SET_IDS).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
    expect(SLOT_SET_IDS.map((id) => SLOT_SETS[id].length)).toEqual([6, 6, 6, 7, 7, 7, 8]);
  });

  it("matches content-plan.md slot by slot", () => {
    expect(SLOT_SETS.A).toEqual(["top", "bottom", "shoes", "bag", "hat", "accessory"]);
    expect(SLOT_SETS.B).toEqual(["dress", "outer", "shoes", "bag", "hat", "accessory"]);
    expect(SLOT_SETS.C).toEqual(["top", "bottom", "outer", "shoes", "bag", "accessory"]);
    expect(SLOT_SETS.D).toEqual(["top", "bottom", "outer", "shoes", "bag", "hat", "accessory"]);
    expect(SLOT_SETS.E).toEqual(["top", "bottom", "dress", "shoes", "bag", "hat", "accessory"]);
    expect(SLOT_SETS.F).toEqual(["top", "bottom", "dress", "outer", "shoes", "bag", "accessory"]);
    expect(SLOT_SETS.G).toEqual([
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

  for (const id of SLOT_SET_IDS) {
    it(`openSlots(${id}) returns the open slots in board order`, () => {
      expect(openSlots(id)).toEqual(OPEN_IN_BOARD_ORDER[id]);
    });
  }

  it("applies the one-piece rule only where dress, top and bottom are all open", () => {
    expect(SLOT_SET_IDS.filter(hasOnePieceRule)).toEqual(["E", "F", "G"]);
  });
});

describe("canPlace", () => {
  it("accepts a piece in its own open slot", () => {
    expect(canPlace("A", TOP)).toEqual({ ok: true });
    expect(canPlace("A", TOP, "top")).toEqual({ ok: true });
  });

  it("rejects the wrong category with a typed reason", () => {
    expect(canPlace("A", TOP, "bottom")).toEqual({ ok: false, reason: "WRONG_CATEGORY" });
  });

  it("rejects a closed slot with a typed reason", () => {
    expect(canPlace("A", DRESS)).toEqual({ ok: false, reason: "SLOT_CLOSED" });
    expect(canPlace("A", OUTER)).toEqual({ ok: false, reason: "SLOT_CLOSED" });
    expect(canPlace("B", TOP)).toEqual({ ok: false, reason: "SLOT_CLOSED" });
    expect(canPlace("C", HAT)).toEqual({ ok: false, reason: "SLOT_CLOSED" });
  });

  it("checks the category before the closed slot", () => {
    expect(canPlace("A", DRESS, "top")).toEqual({ ok: false, reason: "WRONG_CATEGORY" });
  });
});

describe("place", () => {
  it("adds a piece and returns a new look without mutating the old one", () => {
    const before: Look = { top: TOP.id };
    const result = place("A", before, SHOES);
    expect(result).toEqual({ ok: true, look: { top: TOP.id, shoes: SHOES.id }, displaced: [] });
    expect(before).toEqual({ top: TOP.id });
  });

  it("keeps look keys in board order", () => {
    const first = place("A", { shoes: SHOES.id }, TOP);
    if (!first.ok) throw new Error("expected ok");
    expect(Object.keys(first.look)).toEqual(["top", "shoes"]);
  });

  it("swaps within a slot and reports the old piece as displaced", () => {
    const result = place("A", { top: TOP.id }, TOP_2);
    expect(result).toEqual({ ok: true, look: { top: TOP_2.id }, displaced: [TOP.id] });
  });

  it("placing the same piece again displaces nothing", () => {
    expect(place("A", { top: TOP.id }, TOP)).toEqual({
      ok: true,
      look: { top: TOP.id },
      displaced: [],
    });
  });

  it("a dress clears top and bottom (one-piece rule)", () => {
    const result = place("G", { top: TOP.id, bottom: BOTTOM.id, shoes: SHOES.id }, DRESS);
    expect(result).toEqual({
      ok: true,
      look: { dress: DRESS.id, shoes: SHOES.id },
      displaced: [TOP.id, BOTTOM.id],
    });
  });

  it("a dress clears only the one of top and bottom that is present", () => {
    const result = place("E", { bottom: BOTTOM.id }, DRESS);
    expect(result).toEqual({ ok: true, look: { dress: DRESS.id }, displaced: [BOTTOM.id] });
  });

  it("a top clears the dress (one-piece rule, other direction)", () => {
    const result = place("G", { dress: DRESS.id, hat: HAT.id }, TOP);
    expect(result).toEqual({
      ok: true,
      look: { hat: HAT.id, top: TOP.id },
      displaced: [DRESS.id],
    });
  });

  it("a bottom clears the dress too", () => {
    const result = place("F", { dress: DRESS.id }, BOTTOM);
    expect(result).toEqual({ ok: true, look: { bottom: BOTTOM.id }, displaced: [DRESS.id] });
  });

  it("a top keeps the bottom and does not touch the dress when none is placed", () => {
    const result = place("F", { bottom: BOTTOM.id }, TOP);
    expect(result).toEqual({ ok: true, look: { top: TOP.id, bottom: BOTTOM.id }, displaced: [] });
  });

  it("does not apply the one-piece rule to a dress-only set", () => {
    expect(place("B", { outer: OUTER.id }, DRESS)).toEqual({
      ok: true,
      look: { outer: OUTER.id, dress: DRESS.id },
      displaced: [],
    });
  });

  it("reports failures instead of throwing", () => {
    expect(place("A", {}, DRESS)).toEqual({ ok: false, reason: "SLOT_CLOSED" });
    expect(place("A", {}, TOP, "bottom")).toEqual({ ok: false, reason: "WRONG_CATEGORY" });
  });
});

describe("clearSlot and normalizeLook", () => {
  it("removes a slot without mutating", () => {
    const before: Look = { top: TOP.id, shoes: SHOES.id };
    expect(clearSlot(before, "top")).toEqual({ shoes: SHOES.id });
    expect(before).toEqual({ top: TOP.id, shoes: SHOES.id });
    expect(clearSlot(before, "hat")).toEqual(before);
  });

  it("orders keys by the board order", () => {
    expect(Object.keys(normalizeLook({ shoes: "s", hat: "h", top: "t" }))).toEqual([
      "hat",
      "top",
      "shoes",
    ]);
  });
});

const FULL: Record<string, string> = {
  hat: HAT.id,
  accessory: ACCESSORY.id,
  outer: OUTER.id,
  top: TOP.id,
  dress: DRESS.id,
  bag: BAG.id,
  bottom: BOTTOM.id,
  shoes: SHOES.id,
};

function lookFor(slots: readonly Slot[]): Look {
  const look: Look = {};
  for (const slot of slots) look[slot] = FULL[slot] as string;
  return look;
}

describe("completeness", () => {
  it("is complete when every open slot is filled, for every set (top and bottom base)", () => {
    for (const id of SLOT_SET_IDS) {
      const slots = SLOT_SETS[id].filter(
        (slot) => slot !== "dress" || !SLOT_SETS[id].includes("top"),
      );
      const look = lookFor(slots);
      expect(missingSlots(id, look)).toEqual([]);
      expect(isComplete(id, look)).toBe(true);
    }
  });

  it("counts a dress as the whole base in sets E, F and G", () => {
    for (const id of ["E", "F", "G"] as const) {
      const slots = SLOT_SETS[id].filter((slot) => slot !== "top" && slot !== "bottom");
      expect(isComplete(id, lookFor(slots))).toBe(true);
    }
  });

  it("requires the dress in the dress-only set B", () => {
    const withoutDress = lookFor(["outer", "shoes", "bag", "hat", "accessory"]);
    expect(missingSlots("B", withoutDress)).toEqual(["dress"]);
    expect(isComplete("B", withoutDress)).toBe(false);
    expect(isComplete("B", lookFor(["dress", "outer", "shoes", "bag", "hat", "accessory"]))).toBe(
      true,
    );
  });

  it("requires both top and bottom in sets without a dress slot", () => {
    const base = lookFor(["outer", "shoes", "bag", "hat", "accessory"]);
    expect(missingSlots("D", base)).toEqual(["top", "bottom"]);
    expect(missingSlots("D", { ...base, top: TOP.id })).toEqual(["bottom"]);
    expect(missingSlots("D", { ...base, bottom: BOTTOM.id })).toEqual(["top"]);
  });

  it("reports an empty dress-capable base as top and bottom, and a half base as the other half", () => {
    const rest = lookFor(["outer", "shoes", "bag", "hat", "accessory"]);
    expect(missingSlots("G", rest)).toEqual(["top", "bottom"]);
    expect(missingSlots("G", { ...rest, top: TOP.id })).toEqual(["bottom"]);
    expect(missingSlots("G", { ...rest, bottom: BOTTOM.id })).toEqual(["top"]);
    expect(isComplete("G", { ...rest, top: TOP.id })).toBe(false);
  });

  it("lists missing slots in board order", () => {
    expect(missingSlots("G", {})).toEqual([
      "hat",
      "accessory",
      "outer",
      "top",
      "bag",
      "bottom",
      "shoes",
    ]);
    expect(missingSlots("A", {})).toEqual(["hat", "accessory", "top", "bag", "bottom", "shoes"]);
    expect(missingSlots("B", {})).toEqual(["hat", "accessory", "outer", "dress", "bag", "shoes"]);
  });

  it("ignores pieces in closed slots", () => {
    const look = { ...lookFor(SLOT_SETS.A), outer: OUTER.id };
    expect(missingSlots("A", look)).toEqual([]);
  });

  it("treats a dress together with top or bottom as a conflict, not a complete look", () => {
    const look = { ...lookFor(SLOT_SETS.G), dress: DRESS.id };
    expect(hasConflict("G", look)).toBe(true);
    expect(missingSlots("G", look)).toEqual([]);
    expect(isComplete("G", look)).toBe(false);
    expect(hasConflict("B", lookFor(SLOT_SETS.B))).toBe(false);
  });

  it("an empty board is never complete", () => {
    for (const id of SLOT_SET_IDS) expect(isComplete(id, {})).toBe(false);
  });
});
