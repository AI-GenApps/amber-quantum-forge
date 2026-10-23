import { describe, expect, it } from "vitest";
import { stepOnce } from "../src/simulate";
import { cellsOf, depthAt, makeDef, placement, stateFor, stepN, total } from "./helpers";

const TWO = [".3 .3", ".7 .7"];
const CORNERS = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
] as const;

function runTwo(depth: number, canals = false): number[] {
  const state = stateFor(
    makeDef(TWO),
    canals ? [placement("canal", 0, 0), placement("canal", 1, 0)] : [],
    [[0, 0, depth]],
  );
  stepOnce(state);
  return cellsOf(state, CORNERS);
}

describe("flow downhill", () => {
  it("never moves water across a surface difference of 1", () => {
    expect(runTwo(1)).toEqual([1, 0, 0, 0]);
  });

  it("moves 1 unit across a difference of 2 and equalises", () => {
    const state = stateFor(makeDef(TWO), [], [[0, 0, 2]]);
    stepOnce(state);
    expect(cellsOf(state, CORNERS)).toEqual([1, 1, 0, 0]);
    stepOnce(state);
    expect(cellsOf(state, CORNERS)).toEqual([1, 1, 0, 0]);
  });

  it("moves floor(diff / 2) up to the cap", () => {
    expect(runTwo(3)).toEqual([2, 1, 0, 0]);
    expect(runTwo(4)).toEqual([2, 2, 0, 0]);
    expect(runTwo(5)).toEqual([3, 2, 0, 0]);
  });

  it("caps land and other edges at 2 per step", () => {
    expect(runTwo(20)).toEqual([16, 2, 2, 0]);
  });

  it("caps canal-to-canal edges at 4 per step but canal-to-land at 2", () => {
    expect(runTwo(20, true)).toEqual([14, 4, 2, 0]);
  });

  it("does not let water travel two cells in one step (snapshot flow)", () => {
    const def = makeDef([".6 .4 .2 .0", ".7 .7 .7 .7"]);
    const state = stateFor(def, [], [[0, 0, 2]]);
    stepOnce(state);
    expect(
      cellsOf(state, [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ]),
    ).toEqual([0, 2, 0, 0]);
  });
});

describe("outflow limited by source depth and ordered by surface", () => {
  const PLAIN = [".7 .7 .7", ".7 .7 .7", ".7 .7 .7"];
  const ARMS = [
    [1, 0],
    [2, 1],
    [1, 2],
    [0, 1],
  ] as const;

  it("a cell with 1 unit gives it to the first neighbour in N, E, S, W order", () => {
    const def = makeDef([".7 .0 .7", ".0 .7 .0", ".7 .0 .7"]);
    const state = stateFor(def, [], [[1, 1, 1]]);
    stepOnce(state);
    expect(cellsOf(state, ARMS)).toEqual([1, 0, 0, 0]);
    expect(depthAt(state, 1, 1)).toBe(0);
  });

  it("equal surfaces fill N then E and stop when the source is empty", () => {
    const def = makeDef([".7 .0 .7", ".0 .7 .0", ".7 .0 .7"]);
    const state = stateFor(def, [], [[1, 1, 3]]);
    stepOnce(state);
    expect(cellsOf(state, ARMS)).toEqual([2, 1, 0, 0]);
  });

  it("lower neighbours are served first, ties broken N, E, S, W", () => {
    const def = makeDef([".7 .2 .7", ".1 .7 .0", ".7 .1 .7"]);
    const state = stateFor(def, [], [[1, 1, 5]]);
    stepOnce(state);
    expect(cellsOf(state, ARMS)).toEqual([0, 2, 2, 1]);
    expect(total(state)).toBe(5);
  });

  it("a cell only 1 above all neighbours keeps its water", () => {
    const state = stateFor(makeDef(PLAIN), [], [[1, 1, 1]]);
    stepOnce(state);
    expect(depthAt(state, 1, 1)).toBe(1);
  });
});

describe("barriers", () => {
  const def = makeDef([".3 .3 .3", ".7 .7 .7"]);
  const barrier = [placement("barrier", 1, 0)];

  it("holds water until the surface is 2 above the crest, exactly", () => {
    const four = stateFor(def, barrier, [[0, 0, 4]]);
    stepOnce(four);
    expect(
      cellsOf(four, [
        [1, 0],
        [0, 0],
      ]),
    ).toEqual([0, 4]);
    const five = stateFor(def, barrier, [[0, 0, 5]]);
    stepOnce(five);
    expect(
      cellsOf(five, [
        [1, 0],
        [0, 0],
      ]),
    ).toEqual([1, 4]);
  });

  it("the same water flows freely without the barrier", () => {
    const state = stateFor(def, [], [[0, 0, 4]]);
    stepOnce(state);
    expect(depthAt(state, 1, 0)).toBe(2);
  });
});

describe("mirror symmetry (no order bias)", () => {
  const sym = [
    ".4 .3 .2 .1 .2 .3 .4",
    ".4 .3 .2 .1 .2 .3 .4",
    ".4 .3 .2 .1 .2 .3 .4",
    ".4 .3 .2 .1 .2 .3 .4",
    ".4 .3 .2 .1 .2 .3 .4",
    ".4 .3 .2 .1 .2 .3 .4",
    ".4 .3 .2 .1 .2 .3 .4",
  ];

  it("left-right mirrored boards give left-right mirrored depths at every step", () => {
    const state = stateFor(makeDef(sym), [], [[3, 3, 60]]);
    for (let step = 0; step < 4; step++) {
      stepOnce(state);
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 3; x++) {
          expect(depthAt(state, x, y)).toBe(depthAt(state, 6 - x, y));
        }
      }
    }
    expect(total(state)).toBe(60);
  });

  it("the same holds for a mirrored canal network", () => {
    const canals = [
      placement("canal", 2, 3),
      placement("canal", 4, 3),
      placement("canal", 2, 2),
      placement("canal", 4, 2),
    ];
    const state = stateFor(makeDef(sym), canals, [[3, 3, 60]]);
    stepN(state, 3);
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 3; x++) expect(depthAt(state, x, y)).toBe(depthAt(state, 6 - x, y));
    }
  });
});
