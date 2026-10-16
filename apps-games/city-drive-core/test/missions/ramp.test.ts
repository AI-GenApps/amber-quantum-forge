import { describe, expect, it } from "vitest";
import { checkRamp, countInversions, type MissionDef } from "../../src/index";
import { loadMissionWorld } from "./helpers";

function mission(id: string, type: MissionDef["type"], difficulty: number | undefined): MissionDef {
  const { catalog } = loadMissionWorld();
  const base = catalog.find((m) => m.type === type) as MissionDef;
  const { difficulty: _drop, ...rest } = base;
  return (difficulty === undefined ? { ...rest, id } : { ...rest, id, difficulty }) as MissionDef;
}

const TYPES: MissionDef["type"][] = ["delivery", "taxi", "time_trial", "parking"];

function district(id: string, values: number[]) {
  const n = id.replace("district-", "");
  return {
    id,
    missions: values.map((v, i) =>
      mission(`d${n}-m0${i + 1}`, TYPES[i % 4] as MissionDef["type"], v),
    ),
  };
}

describe("countInversions", () => {
  it("counts every drop between neighbours", () => {
    expect(countInversions([])).toBe(0);
    expect(countInversions([1, 2, 2, 3])).toBe(0);
    expect(countInversions([1, 3, 2, 4])).toBe(1);
    expect(countInversions([3, 2, 1])).toBe(2);
  });
});

describe("checkRamp", () => {
  const up = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

  it("passes a clean ramp", () => {
    expect(checkRamp([district("district-1", up)], 1, 2)).toEqual([]);
  });

  it("allows one inversion and rejects two", () => {
    const one = [0.1, 0.2, 0.4, 0.3, 0.5, 0.6, 0.7, 0.8];
    const two = [0.1, 0.4, 0.3, 0.5, 0.45, 0.6, 0.7, 0.8];
    expect(checkRamp([district("district-1", one)], 1, 2)).toEqual([]);
    const issues = checkRamp([district("district-1", two)], 1, 2);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/drops 2 times/);
  });

  it("needs each district to start easier than the previous one ended", () => {
    const next = [0.8, 0.82, 0.84, 0.86, 0.88, 0.9, 0.92, 0.94];
    const issues = checkRamp([district("district-1", up), district("district-2", next)], 1, 2);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.district).toBe("district-2");
    expect(issues[0]?.message).toMatch(/not easier/);
    const fine = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65];
    expect(checkRamp([district("district-1", up), district("district-2", fine)], 1, 2)).toEqual([]);
  });

  it("asks for the right number of missions of each type", () => {
    const issues = checkRamp([district("district-1", up.slice(0, 5))], 1, 2);
    expect(issues.some((i) => /expected 2/.test(i.message))).toBe(true);
  });

  it("asks for a difficulty on every mission", () => {
    const d = district("district-1", up);
    d.missions[3] = mission("d1-m04", "parking", undefined);
    expect(checkRamp([d], 1, 2)[0]?.message).toMatch(/no difficulty/);
  });
});
