import { describe, expect, it } from "vitest";
import { stepOnce } from "../src/simulate";
import type { Direction } from "../src/types";
import { cellsOf, depthAt, makeDef, placement, stateFor } from "./helpers";

const PUMP_RES = [".3 .7 .7", ".7 .7 .7"];

describe("pump", () => {
  it("moves 4 units per step into a reservoir", () => {
    const state = stateFor(
      makeDef(PUMP_RES),
      [placement("pump", 0, 0, { dir: "E" }), placement("reservoir", 1, 0)],
      [[0, 0, 6]],
    );
    stepOnce(state);
    expect(
      cellsOf(state, [
        [0, 0],
        [1, 0],
      ]),
    ).toEqual([2, 4]);
  });

  it("moves only what it holds", () => {
    const state = stateFor(
      makeDef(PUMP_RES),
      [placement("pump", 0, 0, { dir: "E" }), placement("reservoir", 1, 0)],
      [[0, 0, 2]],
    );
    stepOnce(state);
    expect(
      cellsOf(state, [
        [0, 0],
        [1, 0],
      ]),
    ).toEqual([0, 2]);
  });

  it("only moves what the target can take (partial room) and stalls when it is full", () => {
    const pieces = [placement("pump", 0, 0, { dir: "E" }), placement("reservoir", 1, 0)];
    const partial = stateFor(makeDef(PUMP_RES), pieces, [
      [0, 0, 6],
      [1, 0, 8],
    ]);
    stepOnce(partial);
    expect(
      cellsOf(partial, [
        [0, 0],
        [1, 0],
      ]),
    ).toEqual([4, 10]);
    const full = stateFor(makeDef(PUMP_RES), pieces, [
      [0, 0, 3],
      [1, 0, 10],
    ]);
    stepOnce(full);
    expect(
      cellsOf(full, [
        [0, 0],
        [1, 0],
      ]),
    ).toEqual([3, 10]);
  });

  it("lifts uphill, then normal flow takes over", () => {
    const state = stateFor(
      makeDef([".3 .7", ".0 .0"]),
      [placement("pump", 0, 0, { dir: "E" })],
      [[0, 0, 6]],
    );
    stepOnce(state);
    expect(
      cellsOf(state, [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ]),
    ).toEqual([2, 0, 2, 2]);
  });

  it("pumps a cell that sits far below its target", () => {
    const state = stateFor(
      makeDef([".0 .7 .7", ".7 .7 .7"]),
      [placement("pump", 0, 0, { dir: "E" }), placement("reservoir", 1, 0)],
      [[0, 0, 4]],
    );
    stepOnce(state);
    expect(
      cellsOf(state, [
        [0, 0],
        [1, 0],
      ]),
    ).toEqual([0, 4]);
  });

  it("does nothing when facing the board edge", () => {
    const state = stateFor(makeDef(PUMP_RES), [placement("pump", 0, 0, { dir: "W" })], [[0, 0, 3]]);
    stepOnce(state);
    expect(depthAt(state, 0, 0)).toBe(3);
  });

  it("obeys its direction", () => {
    const def = makeDef([".7 .7 .7", ".7 .3 .7", ".7 .7 .7"]);
    const arms: Array<[Direction, number, number]> = [
      ["N", 1, 0],
      ["E", 2, 1],
      ["S", 1, 2],
      ["W", 0, 1],
    ];
    for (const [dir, tx, ty] of arms) {
      const pieces = [
        placement("pump", 1, 1, { dir }),
        placement("reservoir", 1, 0),
        placement("reservoir", 2, 1),
        placement("reservoir", 1, 2),
        placement("reservoir", 0, 1),
      ];
      const state = stateFor(def, pieces, [[1, 1, 4]]);
      stepOnce(state);
      const got = [
        [1, 0],
        [2, 1],
        [1, 2],
        [0, 1],
      ].map(([x, y]) => depthAt(state, x as number, y as number));
      const want = [
        [1, 0],
        [2, 1],
        [1, 2],
        [0, 1],
      ].map(([x, y]) => (x === tx && y === ty ? 4 : 0));
      expect(got).toEqual(want);
      expect(depthAt(state, 1, 1)).toBe(0);
    }
  });

  it("runs in row-major order on live depths (chain forward)", () => {
    const def = makeDef([".3 .3 .7", ".7 .7 .7"]);
    const pieces = [
      placement("pump", 0, 0, { dir: "E" }),
      placement("pump", 1, 0, { dir: "E" }),
      placement("reservoir", 2, 0),
    ];
    const state = stateFor(def, pieces, [[0, 0, 4]]);
    stepOnce(state);
    expect(
      cellsOf(state, [
        [0, 0],
        [1, 0],
        [2, 0],
      ]),
    ).toEqual([0, 0, 4]);
  });

  it("runs in row-major order on live depths (chain backward needs two steps)", () => {
    const def = makeDef([".7 .3 .7", ".7 .7 .7"]);
    const pieces = [
      placement("reservoir", 0, 0),
      placement("pump", 1, 0, { dir: "W" }),
      placement("pump", 2, 0, { dir: "W" }),
    ];
    const state = stateFor(def, pieces, [[2, 0, 4]]);
    stepOnce(state);
    expect(
      cellsOf(state, [
        [0, 0],
        [1, 0],
        [2, 0],
      ]),
    ).toEqual([0, 4, 0]);
    stepOnce(state);
    expect(
      cellsOf(state, [
        [0, 0],
        [1, 0],
        [2, 0],
      ]),
    ).toEqual([4, 0, 0]);
  });

  it("does not pump into a closed gate", () => {
    const def = makeDef([".3 .3 .7", ".7 .7 .7"]);
    const pieces = [
      placement("pump", 0, 0, { dir: "E" }),
      placement("gate", 1, 0, { opensWeek: 1, closesWeek: 3 }),
    ];
    const state = stateFor(def, pieces, [[0, 0, 2]]);
    stepOnce(state);
    expect(
      cellsOf(state, [
        [0, 0],
        [1, 0],
      ]),
    ).toEqual([2, 0]);
  });
});
