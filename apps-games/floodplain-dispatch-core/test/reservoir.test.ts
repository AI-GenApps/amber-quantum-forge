import { describe, expect, it } from "vitest";
import { stepOnce } from "../src/simulate";
import type { Placement } from "../src/types";
import { depthAt, makeDef, placement, stateFor } from "./helpers";

const ROW = [".3 .7 .0", ".7 .7 .7"];
const RES = placement("reservoir", 1, 0);

function run(layout: string[], pieces: Placement[], depths: Array<[number, number, number]>) {
  const state = stateFor(makeDef(layout), pieces, depths);
  stepOnce(state);
  return (x: number, y: number) => depthAt(state, x, y);
}

describe("reservoir", () => {
  it("fills through a canal neighbour", () => {
    const at = run(ROW, [placement("canal", 0, 0), RES], [[0, 0, 6]]);
    expect([at(0, 0), at(1, 0)]).toEqual([5, 1]);
  });

  it("never exchanges with a bare land neighbour (walled)", () => {
    const at = run(ROW, [RES], [[0, 0, 5]]);
    expect([at(0, 0), at(1, 0)]).toEqual([5, 0]);
    const full = run(ROW, [RES], [[1, 0, 10]]);
    expect([full(1, 0), full(2, 0)]).toEqual([10, 0]);
  });

  it("holds at most 10 units (inflow clipped to the room left)", () => {
    const at = run(
      [".7 .4 .0", ".7 .7 .7"],
      [placement("canal", 0, 0), RES],
      [
        [0, 0, 9],
        [1, 0, 9],
      ],
    );
    expect([at(0, 0), at(1, 0), at(0, 1)]).toEqual([6, 10, 2]);
  });

  it("drains into a canal neighbour at the canal cap", () => {
    const at = run(ROW, [placement("canal", 0, 0), RES], [[1, 0, 8]]);
    expect([at(0, 0), at(1, 0)]).toEqual([4, 4]);
  });

  it("exchanges through an open gate but not a closed one", () => {
    const open = run(ROW, [placement("gate", 0, 0), RES], [[1, 0, 8]]);
    expect([open(0, 0), open(1, 0)]).toEqual([4, 4]);
    const closed = run(
      ROW,
      [placement("gate", 0, 0, { opensWeek: 1, closesWeek: 3 }), RES],
      [[1, 0, 8]],
    );
    expect([closed(0, 0), closed(1, 0)]).toEqual([0, 8]);
  });

  it("ignores sea and other reservoirs", () => {
    const sea = run([".3 .7 S0", ".7 .7 .7"], [RES], [[1, 0, 8]]);
    expect([sea(1, 0), sea(2, 0)]).toEqual([8, 0]);
    const twin = run(
      [".7 .7", ".7 .7"],
      [placement("reservoir", 0, 0), placement("reservoir", 1, 0)],
      [[0, 0, 10]],
    );
    expect([twin(0, 0), twin(1, 0)]).toEqual([10, 0]);
  });

  it("drains into a pump that does not face it, but not one that does", () => {
    const away = run(ROW, [placement("pump", 0, 0, { dir: "S" }), RES], [[1, 0, 8]]);
    expect([away(0, 0), away(1, 0)]).toEqual([2, 6]);
    const facing = run(ROW, [placement("pump", 0, 0, { dir: "E" }), RES], [[1, 0, 8]]);
    expect([facing(0, 0), facing(1, 0)]).toEqual([0, 8]);
  });

  it("has a crest of height - 3, which sets the exact fill threshold", () => {
    const below = run(ROW, [placement("canal", 0, 0), RES], [[0, 0, 4]]);
    expect([below(0, 0), below(1, 0)]).toEqual([4, 0]);
    const at = run(ROW, [placement("canal", 0, 0), RES], [[0, 0, 5]]);
    expect([at(0, 0), at(1, 0)]).toEqual([4, 1]);
  });
});
