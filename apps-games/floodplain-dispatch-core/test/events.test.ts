import { describe, expect, it } from "vitest";
import { baseTide, inletRate, tideLevel } from "../src/events";
import { makeDef } from "./helpers";

const LAYOUT = [".1 .1", ".1 .1"];

describe("inletRate", () => {
  it("returns the base outside every event", () => {
    const def = makeDef(LAYOUT, { inlets: [2, 3] });
    expect(inletRate(def, 0, 0)).toBe(2);
    expect(inletRate(def, 1, 7)).toBe(3);
    expect(inletRate(def, 5, 0)).toBe(0);
  });

  it("adds surges, subtracts droughts and treats the end week as exclusive", () => {
    const def = makeDef(LAYOUT, {
      inlets: [2, 3],
      events: [
        { type: "surge", week: 2, weeks: 3, delta: 2 },
        { type: "surge", week: 3, weeks: 1, delta: 1 },
        { type: "drought", week: 3, weeks: 2, delta: 1 },
      ],
    });
    const rates = Array.from({ length: 7 }, (_, w) => inletRate(def, 0, w));
    expect(rates).toEqual([2, 2, 4, 4, 3, 2, 2]);
    expect(inletRate(def, 1, 3)).toBe(5);
  });

  it("floors at 0", () => {
    const def = makeDef(LAYOUT, {
      inlets: [2],
      events: [
        { type: "drought", week: 1, weeks: 2, delta: 5 },
        { type: "surge", week: 2, weeks: 1, delta: 2 },
      ],
    });
    expect([0, 1, 2, 3].map((w) => inletRate(def, 0, w))).toEqual([2, 0, 0, 2]);
  });

  it("ignores storm tides", () => {
    const def = makeDef(LAYOUT, {
      inlets: [2],
      events: [{ type: "storm-tide", week: 0, weeks: 5, delta: 3 }],
    });
    expect(inletRate(def, 0, 2)).toBe(2);
  });
});

describe("tideLevel", () => {
  const levels = (period: number, amp: number) => {
    const def = makeDef(LAYOUT, { tide: { period, amp } });
    return Array.from({ length: period }, (_, w) => tideLevel(def, w));
  };

  it("matches the hand-computed table for periods 6, 8, 10", () => {
    expect(levels(6, 1)).toEqual([0, 0, 0, 1, 0, 0]);
    expect(levels(6, 2)).toEqual([0, 0, 1, 2, 1, 0]);
    expect(levels(6, 3)).toEqual([0, 1, 2, 3, 2, 1]);
    expect(levels(8, 1)).toEqual([0, 0, 0, 0, 1, 0, 0, 0]);
    expect(levels(8, 2)).toEqual([0, 0, 1, 1, 2, 1, 1, 0]);
    expect(levels(8, 3)).toEqual([0, 0, 1, 2, 3, 2, 1, 0]);
    expect(levels(10, 1)).toEqual([0, 0, 0, 0, 0, 1, 0, 0, 0, 0]);
    expect(levels(10, 2)).toEqual([0, 0, 0, 1, 1, 2, 1, 1, 0, 0]);
    expect(levels(10, 3)).toEqual([0, 0, 1, 1, 2, 3, 2, 1, 1, 0]);
  });

  it("repeats every period", () => {
    const def = makeDef(LAYOUT, { tide: { period: 8, amp: 3 } });
    expect([8, 12, 16, 20, 24].map((w) => tideLevel(def, w))).toEqual([0, 3, 0, 3, 0]);
  });

  it("is always 0 without a tide, even with a storm tide", () => {
    const def = makeDef(LAYOUT, { events: [{ type: "storm-tide", week: 0, weeks: 9, delta: 2 }] });
    expect(tideLevel(def, 3)).toBe(0);
    expect(baseTide(def, 3)).toBe(0);
  });

  it("adds the storm-tide delta and overlaps stack", () => {
    const def = makeDef(LAYOUT, {
      tide: { period: 6, amp: 3 },
      events: [
        { type: "storm-tide", week: 2, weeks: 2, delta: 2 },
        { type: "storm-tide", week: 3, weeks: 2, delta: 1 },
      ],
    });
    expect(Array.from({ length: 6 }, (_, w) => tideLevel(def, w))).toEqual([0, 1, 4, 6, 3, 1]);
  });
});
