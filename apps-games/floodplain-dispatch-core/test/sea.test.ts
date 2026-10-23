import { describe, expect, it } from "vitest";
import { createSimState, runSeason, stepOnce } from "../src/simulate";
import { cellsOf, depthAt, makeDef, stateFor, stepN, total } from "./helpers";

describe("sea", () => {
  it("is a pure drain without a tide: excess is discarded", () => {
    const state = stateFor(makeDef([".7 S0", ".7 .7"]), [], [[1, 0, 9]]);
    stepOnce(state);
    expect(
      cellsOf(state, [
        [1, 0],
        [0, 0],
        [1, 1],
      ]),
    ).toEqual([0, 1, 1]);
  });

  it("drains water arriving from a canal", () => {
    const state = stateFor(makeDef([".7 .5 S0", ".7 .7 .7"]), [], [[1, 0, 4]]);
    stepOnce(state);
    expect(depthAt(state, 2, 0)).toBe(0);
    expect(total(state)).toBeLessThan(4);
  });

  it("starts at the week 0 tide level and is reset to the tide level every step", () => {
    const def = makeDef([".0 S0", ".7 .7"], {
      tide: { period: 6, amp: 2 },
      events: [{ type: "storm-tide", week: 0, weeks: 1, delta: 2 }],
      weeks: 3,
    });
    const state = createSimState(def, []);
    expect(depthAt(state, 1, 0)).toBe(2);
    stepOnce(state);
    expect(
      cellsOf(state, [
        [0, 0],
        [1, 0],
      ]),
    ).toEqual([1, 2]);
    stepN(state, 4);
    expect(depthAt(state, 1, 0)).toBe(0);
  });

  it("follows the tide table week by week in a full season", () => {
    const def = makeDef([".0 S0", ".7 .7"], { tide: { period: 6, amp: 3 }, weeks: 6 });
    const result = runSeason(def, []);
    expect(result.weekFrames.map((frame) => frame[1])).toEqual([0, 1, 2, 3, 2, 1]);
  });
});

describe("inlets", () => {
  it("adds the rate to the inlet cell each step, in row-major inlet order", () => {
    const def = makeDef([".7 I0 .7", ".7 .7 I0"], { inlets: [1, 3] });
    const state = createSimState(def, []);
    stepOnce(state);
    expect(
      cellsOf(state, [
        [1, 0],
        [2, 1],
      ]),
    ).toEqual([1, 3]);
  });

  it("follows surges and droughts, flooring at 0", () => {
    const rows = ["I7 .7", ".7 .7"];
    const surged = createSimState(
      makeDef(rows, { inlets: [2], events: [{ type: "surge", week: 0, weeks: 1, delta: 1 }] }),
      [],
    );
    stepOnce(surged);
    expect(total(surged)).toBe(3);
    const dry = createSimState(
      makeDef(rows, { inlets: [2], events: [{ type: "drought", week: 0, weeks: 1, delta: 5 }] }),
      [],
    );
    stepOnce(dry);
    expect(total(dry)).toBe(0);
  });

  it("has a known inflow and no drain when walled in", () => {
    const state = createSimState(makeDef(["I4 .7", ".7 .7"], { inlets: [2] }), []);
    stepN(state, 3);
    expect(
      cellsOf(state, [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ]),
    ).toEqual([4, 1, 1, 0]);
    expect(total(state)).toBe(6);
  });

  it("has a known inflow matched by a drain into the sea", () => {
    const state = createSimState(makeDef(["I4 S0", ".7 .7"], { inlets: [2] }), []);
    for (let i = 0; i < 5; i++) {
      stepOnce(state);
      expect(total(state)).toBe(0);
    }
  });

  it("caps a cell at 99 and discards the excess", () => {
    const state = createSimState(makeDef(["I7 .7", ".7 .7"], { inlets: [4] }), []);
    state.depths[0] = 98;
    stepOnce(state);
    expect(Math.max(...state.depths)).toBeLessThanOrEqual(99);
    expect(depthAt(state, 0, 0)).toBeLessThanOrEqual(99);
  });
});
