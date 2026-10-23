import { describe, expect, it } from "vitest";
import { evaluate } from "../src/evaluate";
import type { SeasonResult } from "../src/types";
import { makeDef } from "./helpers";

const DEF = makeDef([".1 .1", ".1 .1"], { par: 10, budget: 13 });

function fake(houses: Array<[number, number]>, fields: number[]): SeasonResult {
  return {
    width: 2,
    height: 2,
    weeks: 0,
    weekFrames: [],
    metrics: {
      houses: houses.map(([suppliedSteps, floodedSteps], i) => ({
        index: i,
        x: 0,
        y: 0,
        suppliedSteps,
        floodedSteps,
      })),
      fields: fields.map((wetSteps, i) => ({ index: i, x: 0, y: 0, wetSteps })),
    },
  };
}

const spendOf = (n: number) =>
  Array.from({ length: n }, (_, x) => ({ x, y: 0, kind: "canal" as const }));

describe("stars", () => {
  const rows: Array<[boolean, boolean, boolean, boolean, 0 | 1 | 2 | 3]> = [
    [true, true, false, false, 3],
    [true, true, false, true, 2],
    [true, true, true, false, 1],
    [true, true, true, true, 1],
    [true, false, false, false, 0],
    [true, false, false, true, 0],
    [true, false, true, false, 0],
    [true, false, true, true, 0],
    [false, true, false, false, 0],
    [false, true, false, true, 0],
    [false, true, true, false, 0],
    [false, true, true, true, 0],
    [false, false, false, false, 0],
    [false, false, false, true, 0],
    [false, false, true, false, 0],
    [false, false, true, true, 0],
  ];

  for (const [allSupplied, allIrrigated, flooded, overPar, stars] of rows) {
    const label = `supplied=${allSupplied} irrigated=${allIrrigated} flooded=${flooded} overPar=${overPar}`;
    it(`${label} gives ${stars} stars`, () => {
      const houses: Array<[number, number]> = [
        [6, flooded ? 1 : 0],
        [allSupplied ? 6 : 5, 0],
      ];
      const result = fake(houses, [allIrrigated ? 6 : 5]);
      const evaluation = evaluate(DEF, result, spendOf(overPar ? 11 : 10));
      expect(evaluation.stars).toBe(stars);
      expect(evaluation.cleared).toBe(stars >= 1);
    });
  }

  it("spend equal to par keeps star 3, one over loses it", () => {
    const result = fake([[6, 0]], [6]);
    expect(evaluate(DEF, result, spendOf(10)).starThrift).toBe(true);
    expect(evaluate(DEF, result, spendOf(11)).starThrift).toBe(false);
  });

  it("a flooded house is any single flooded step", () => {
    expect(evaluate(DEF, fake([[6, 1]], [6]), []).housesFlooded).toBe(1);
    expect(evaluate(DEF, fake([[6, 0]], [6]), []).housesFlooded).toBe(0);
  });
});

describe("partial progress and score", () => {
  it("counts supplied, irrigated and flooded with totals", () => {
    const result = fake(
      [
        [6, 0],
        [5, 0],
        [24, 2],
      ],
      [6, 7, 0, 5],
    );
    const e = evaluate(DEF, result, spendOf(4));
    expect([e.housesTotal, e.housesSupplied, e.housesFlooded]).toEqual([3, 2, 1]);
    expect([e.fieldsTotal, e.fieldsIrrigated]).toEqual([4, 2]);
    expect([e.spend, e.par, e.budgetLeft]).toEqual([4, 10, 9]);
  });

  it("scores 200 + 100 per house + 50 per field - 150 per flooded + 20 per unspent point", () => {
    const perfect = evaluate(
      DEF,
      fake(
        [
          [6, 0],
          [6, 0],
        ],
        [6],
      ),
      spendOf(10),
    );
    expect(perfect.score).toBe(200 + 200 + 50 + 60);
    const partial = evaluate(
      DEF,
      fake(
        [
          [6, 1],
          [6, 0],
          [2, 0],
        ],
        [6],
      ),
      spendOf(8),
    );
    expect(partial.stars).toBe(0);
    expect(partial.score).toBe(200 + 50 - 150 + 100);
  });

  it("never drops below 0 and ignores overspend in the unspent term", () => {
    const awful = evaluate(
      DEF,
      fake(
        [
          [0, 3],
          [0, 3],
          [0, 3],
        ],
        [],
      ),
      spendOf(13),
    );
    expect(awful.score).toBe(0);
    const over = evaluate(DEF, fake([[6, 0]], [6]), spendOf(14));
    expect(over.budgetLeft).toBe(-1);
    expect(over.score).toBe(200 + 100 + 50);
  });

  it("an empty placement list spends nothing", () => {
    const e = evaluate(DEF, fake([[0, 0]], [0]), []);
    expect([e.spend, e.stars, e.cleared, e.score]).toEqual([0, 0, false, 260]);
  });
});
