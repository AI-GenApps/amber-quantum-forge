import { describe, expect, it } from "vitest";
import { evaluate } from "../src/evaluate";
import { recordMetrics, type SimState } from "../src/simulate";
import type { MapDef, Placement } from "../src/types";
import { makeDef, placement, resultOf, stateFor } from "./helpers";

const HOUSE = [".3 .3 .3", ".3 H3 .3", ".3 .3 .3"];
const FIELD = [".3 .3 .3", ".3 F3 .3", ".3 .3 .3"];

function record(state: SimState, times: number): void {
  for (let i = 0; i < times; i++) recordMetrics(state);
}

function supplied(def: MapDef, pieces: Placement[], depth: number, steps: number): number {
  const state = stateFor(def, pieces, [[1, 0, depth]]);
  record(state, steps);
  return evaluate(def, resultOf(state), pieces).housesSupplied;
}

describe("house supply", () => {
  const def = makeDef(HOUSE);
  const canal = [placement("canal", 1, 0)];

  it("needs 6 supplied steps: 5 is not enough, 6 is", () => {
    expect(supplied(def, canal, 2, 5)).toBe(0);
    expect(supplied(def, canal, 2, 6)).toBe(1);
  });

  it("needs an adjacent canal-type cell at depth 2 or more", () => {
    expect(supplied(def, canal, 1, 9)).toBe(0);
    expect(supplied(def, canal, 3, 6)).toBe(1);
  });

  it("does not count bare land, diagonals, barriers or pumps", () => {
    expect(supplied(def, [], 9, 9)).toBe(0);
    expect(supplied(def, [placement("barrier", 1, 0)], 9, 9)).toBe(0);
    expect(supplied(def, [placement("pump", 1, 0, { dir: "N" })], 9, 9)).toBe(0);
    const state = stateFor(def, [placement("canal", 0, 0)], [[0, 0, 9]]);
    record(state, 9);
    expect(evaluate(def, resultOf(state), []).housesSupplied).toBe(0);
  });

  it("counts reservoirs, inlets, sea and open gates but not closed gates", () => {
    expect(supplied(def, [placement("reservoir", 1, 0)], 2, 6)).toBe(1);
    expect(supplied(def, [placement("gate", 1, 0)], 2, 6)).toBe(1);
    const closed = stateFor(def, [placement("gate", 1, 0)], [[1, 0, 2]]);
    closed.closed[1] = 1;
    record(closed, 9);
    expect(evaluate(def, resultOf(closed), []).housesSupplied).toBe(0);
    for (const token of ["I3", "S3"]) {
      const withToken = makeDef([`.3 ${token} .3`, ".3 H3 .3", ".3 .3 .3"]);
      const state = stateFor(withToken, [], [[1, 0, 2]]);
      record(state, 6);
      expect(evaluate(withToken, resultOf(state), []).housesSupplied).toBe(1);
    }
  });

  it("adds up steps across different supplying neighbours", () => {
    const pieces = [placement("canal", 1, 0), placement("canal", 0, 1)];
    const state = stateFor(def, pieces, [[1, 0, 2]]);
    record(state, 3);
    state.depths[1] = 0;
    state.depths[3] = 2;
    record(state, 3);
    expect(evaluate(def, resultOf(state), pieces).housesSupplied).toBe(1);
  });
});

describe("house flooding", () => {
  const def = makeDef(HOUSE);

  it("is one step at depth 2, not at depth 1", () => {
    const shallow = stateFor(def, [], [[1, 1, 1]]);
    record(shallow, 9);
    expect(evaluate(def, resultOf(shallow), []).housesFlooded).toBe(0);
    const deep = stateFor(def, [], [[1, 1, 2]]);
    record(deep, 1);
    const result = resultOf(deep);
    expect(result.metrics.houses[0]?.floodedSteps).toBe(1);
    expect(evaluate(def, result, []).housesFlooded).toBe(1);
  });
});

describe("field irrigation", () => {
  const def = makeDef(FIELD);
  const wet = (depth: number, steps: number) => {
    const state = stateFor(def, [], [[1, 1, depth]]);
    record(state, steps);
    return resultOf(state).metrics.fields[0]?.wetSteps;
  };

  it("counts steps with depth 1 to 4 only", () => {
    expect(wet(0, 3)).toBe(0);
    expect(wet(1, 3)).toBe(3);
    expect(wet(4, 3)).toBe(3);
    expect(wet(5, 3)).toBe(0);
  });

  it("needs 6 wet steps: 5 is not enough, 6 is", () => {
    const check = (steps: number) => {
      const state = stateFor(def, [], [[1, 1, 2]]);
      record(state, steps);
      return evaluate(def, resultOf(state), []).fieldsIrrigated;
    };
    expect(check(5)).toBe(0);
    expect(check(6)).toBe(1);
  });
});
