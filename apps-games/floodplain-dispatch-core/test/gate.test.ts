import { describe, expect, it } from "vitest";
import { stepOnce } from "../src/simulate";
import { cellsOf, depthAt, makeDef, placement, stateFor } from "./helpers";

const DEF = makeDef([".5 .5 .0", ".7 .7 .7"], { weeks: 6 });

function gateAfterStepAtWeek(week: number, opensWeek?: number, closesWeek?: number): number {
  const extra: { opensWeek?: number; closesWeek?: number } = {};
  if (opensWeek !== undefined) extra.opensWeek = opensWeek;
  if (closesWeek !== undefined) extra.closesWeek = closesWeek;
  const state = stateFor(DEF, [placement("gate", 1, 0, extra)], [[0, 0, 4]]);
  state.step = week * 4;
  stepOnce(state);
  return depthAt(state, 1, 0);
}

describe("sluice gate", () => {
  it("is open for the whole season by default", () => {
    for (const week of [0, 1, 5]) expect(gateAfterStepAtWeek(week)).toBe(2);
  });

  it("opens at opensWeek (inclusive) and closes at closesWeek (exclusive)", () => {
    const seen = [0, 1, 2, 3, 4].map((week) => gateAfterStepAtWeek(week, 1, 3));
    expect(seen).toEqual([0, 2, 2, 0, 0]);
  });

  it("also switches on the first step of the boundary week, not the last step before it", () => {
    const state = stateFor(
      DEF,
      [placement("gate", 1, 0, { opensWeek: 1, closesWeek: 3 })],
      [[0, 0, 4]],
    );
    state.step = 3;
    stepOnce(state);
    expect(depthAt(state, 1, 0)).toBe(0);
    const next = stateFor(
      DEF,
      [placement("gate", 1, 0, { opensWeek: 1, closesWeek: 3 })],
      [[0, 0, 4]],
    );
    next.step = 4;
    stepOnce(next);
    expect(depthAt(next, 1, 0)).toBe(2);
  });

  it("a closed gate is a wall that keeps its own water in, an open one drains", () => {
    const pieces = [placement("gate", 1, 0, { opensWeek: 1, closesWeek: 3 })];
    const closed = stateFor(DEF, pieces, [[1, 0, 4]]);
    stepOnce(closed);
    expect(
      cellsOf(closed, [
        [1, 0],
        [2, 0],
      ]),
    ).toEqual([4, 0]);
    const open = stateFor(DEF, pieces, [[1, 0, 4]]);
    open.step = 4;
    stepOnce(open);
    expect(
      cellsOf(open, [
        [1, 0],
        [2, 0],
      ]),
    ).toEqual([1, 2]);
  });

  it("an open gate between canals carries up to 4 per step", () => {
    const def = makeDef([".5 .5 .5", ".7 .7 .7"]);
    const pieces = [placement("canal", 0, 0), placement("gate", 1, 0), placement("canal", 2, 0)];
    const state = stateFor(def, pieces, [[1, 0, 12]]);
    stepOnce(state);
    expect(
      cellsOf(state, [
        [0, 0],
        [1, 0],
        [2, 0],
        [1, 1],
      ]),
    ).toEqual([4, 2, 4, 2]);
  });
});
