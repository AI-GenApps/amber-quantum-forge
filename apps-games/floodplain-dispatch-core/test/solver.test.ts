import { describe, expect, it } from "vitest";
import {
  checkPlacement,
  DEFAULT_MAX_SIMS,
  evaluate,
  getMap,
  MAPS,
  type Placement,
  REGIONS,
  runSeason,
  solveMap,
  totalCost,
} from "../src";

function legal(mapId: string, placements: readonly Placement[]): boolean {
  const map = getMap(mapId);
  const placed: Placement[] = [];
  for (const piece of placements) {
    if (checkPlacement(map, placed, piece) !== null) return false;
    placed.push(piece);
  }
  return true;
}

describe("solveMap on the campaign", () => {
  const results = new Map<string, ReturnType<typeof solveMap>>();
  for (const map of MAPS) results.set(map.id, solveMap(map, { maxSims: DEFAULT_MAX_SIMS }));

  it("never exceeds the simulation cap", () => {
    expect(DEFAULT_MAX_SIMS).toBe(20000);
    for (const solution of results.values()) {
      if (solution) expect(solution.sims).toBeLessThanOrEqual(DEFAULT_MAX_SIMS);
    }
  });

  it("returns only legal placements that really earn at least two stars within budget", () => {
    for (const [id, solution] of results) {
      if (!solution) continue;
      const map = getMap(id);
      expect(legal(id, solution.placements)).toBe(true);
      expect(solution.cost).toBe(totalCost(solution.placements));
      expect(solution.cost).toBeLessThanOrEqual(map.budget);
      const evaluation = evaluate(map, runSeason(map, solution.placements), solution.placements);
      expect(evaluation.stars).toBeGreaterThanOrEqual(2);
    }
  });

  it.each(["valley", "delta"] as const)("solves at least 8 of the 10 %s maps", (regionId) => {
    const region = REGIONS.find((entry) => entry.id === regionId);
    const solved = (region?.mapIds ?? []).filter((id) => results.get(id) !== null);
    expect(solved.length).toBeGreaterThanOrEqual(8);
  });

  it("solves the first five valley maps, which need only canals and a barrier", () => {
    for (const id of ["v01", "v02", "v03", "v04", "v05"]) expect(results.get(id)).not.toBeNull();
  });

  it("solves at least 30 of the 40 maps and reports the rest as null", () => {
    const solved = [...results.values()].filter((entry) => entry !== null).length;
    expect(solved).toBeGreaterThanOrEqual(30);
    for (const solution of results.values())
      expect(solution === null || solution.placements.length > 0).toBe(true);
  });

  it("is deterministic for a given seed", () => {
    const first = solveMap(getMap("v04"), { seed: 7 });
    const second = solveMap(getMap("v04"), { seed: 7 });
    expect(second).toEqual(first);
  });
});

describe("solveMap bounds", () => {
  it("gives up with null when the budget is too small", () => {
    expect(solveMap(getMap("v04"), { maxCost: 2 })).toBeNull();
  });

  it("stops at a tiny simulation cap", () => {
    const solution = solveMap(getMap("v02"), { maxSims: 5 });
    if (solution) expect(solution.sims).toBeLessThanOrEqual(5);
  });

  it("accepts a given starting layout and returns it pruned", () => {
    const map = getMap("v01");
    const solution = solveMap(map, { starts: [map.reference], maxSims: 300 });
    expect(solution).not.toBeNull();
    expect(solution?.cost).toBeLessThanOrEqual(map.par);
  });
});
