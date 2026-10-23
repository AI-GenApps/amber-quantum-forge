import { describe, expect, it } from "vitest";
import { evaluate } from "../src/evaluate";
import { runSeason } from "../src/simulate";
import { frameAt, makeDef, placement } from "./helpers";

const DEF = makeDef(
  [
    ".7 .7 I5 .7 .7",
    ".7 .7 .4 H7 .7",
    ".7 H7 .3 .7 .7",
    ".7 .7 .2 F7 .7",
    ".7 .7 .1 .7 .7",
    ".7 .7 S0 .7 .7",
  ],
  { inlets: [1], houseKinds: ["cottage", "cottage"], weeks: 2, par: 4, budget: 7 },
);
const PLACEMENTS = [
  placement("canal", 2, 1),
  placement("canal", 2, 2),
  placement("canal", 2, 3),
  placement("canal", 2, 4),
];

function frame(channel: number[]): number[] {
  const out = new Array<number>(30).fill(0);
  channel.forEach((depth, y) => {
    out[y * 5 + 2] = depth;
  });
  return out;
}

const STEPS = [
  [0, 1, 0, 0, 0],
  [0, 1, 1, 0, 0],
  [0, 2, 0, 1, 0],
  [0, 2, 1, 1, 0],
  [0, 2, 2, 1, 0],
  [0, 3, 1, 2, 0],
  [1, 2, 2, 1, 1],
  [1, 3, 1, 2, 1],
];

describe("hand-built 5 x 6 golden season (inlet 1, canal chain, sea drain)", () => {
  const result = runSeason(DEF, PLACEMENTS, { keepSteps: true });

  it("has every step frame as computed by hand", () => {
    expect(result.stepFrames).toHaveLength(8);
    STEPS.forEach((channel, i) => {
      expect(Array.from(result.stepFrames?.[i] ?? [])).toEqual(frame(channel));
    });
  });

  it("has the week frames at steps 4 and 8", () => {
    expect(result.weekFrames.map((f) => Array.from(f))).toEqual([
      frame([0, 2, 1, 1, 0]),
      frame([1, 3, 1, 2, 1]),
    ]);
    expect(frameAt(result.weekFrames[1] ?? new Uint8Array(), 5, 2, 5)).toBe(0);
  });

  it("has the metrics computed by hand", () => {
    expect(result.metrics.houses).toEqual([
      { index: 8, x: 3, y: 1, floodedSteps: 0, suppliedSteps: 6 },
      { index: 11, x: 1, y: 2, floodedSteps: 0, suppliedSteps: 2 },
    ]);
    expect(result.metrics.fields).toEqual([{ index: 18, x: 3, y: 3, wetSteps: 0 }]);
  });

  it("evaluates to 1 house supplied, nothing irrigated and no stars", () => {
    const e = evaluate(DEF, result, PLACEMENTS);
    expect([e.housesSupplied, e.fieldsIrrigated, e.housesFlooded, e.spend]).toEqual([1, 0, 0, 4]);
    expect([e.stars, e.score]).toEqual([0, 100 + 60]);
  });

  it("without keepSteps carries no step frames", () => {
    expect(runSeason(DEF, PLACEMENTS).stepFrames).toBeUndefined();
  });
});
