// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  ARROW_MIN_AHEAD_M,
  ARROW_SPACING_M,
  MAX_ARROWS,
  routeArrows,
  sampleRoute,
} from "../../src/render/missionRouteMath";

const straight = (length: number) => [
  { x: 0, z: 0 },
  { x: 0, z: length },
];

describe("sampleRoute", () => {
  it("interpolates along a polyline with the direction of the segment", () => {
    const route = [
      { x: 0, z: 0 },
      { x: 10, z: 0 },
      { x: 10, z: 10 },
    ];
    expect(sampleRoute(route, 5)).toEqual({ x: 5, z: 0, dx: 1, dz: 0 });
    expect(sampleRoute(route, 15)).toEqual({ x: 10, z: 5, dx: 0, dz: 1 });
  });

  it("clamps past the end and returns nothing for a degenerate route", () => {
    expect(sampleRoute(straight(10), 99)).toMatchObject({ x: 0, z: 10 });
    expect(sampleRoute([{ x: 0, z: 0 }], 1)).toBeUndefined();
  });
});

describe("routeArrows", () => {
  it("anchors arrows whole spacings back from the route end", () => {
    const arrows = routeArrows(straight(50));
    for (const a of arrows) expect((50 - a.z) % ARROW_SPACING_M).toBeCloseTo(0, 6);
  });

  it("keeps the same world positions when the route start moves", () => {
    const a = routeArrows(straight(50)).map((x) => x.z);
    const shifted = routeArrows([
      { x: 0, z: 1.3 },
      { x: 0, z: 50 },
    ]).map((x) => x.z);
    const common = a.filter((z) => shifted.some((o) => Math.abs(o - z) < 1e-6));
    expect(common.length).toBeGreaterThan(8);
  });

  it("leaves a gap under the car and stops before the end", () => {
    const arrows = routeArrows(straight(30));
    expect(Math.min(...arrows.map((a) => a.z))).toBeGreaterThanOrEqual(ARROW_MIN_AHEAD_M);
    expect(Math.max(...arrows.map((a) => a.z))).toBeLessThan(30);
  });

  it("is capped at MAX_ARROWS", () => {
    expect(routeArrows(straight(5000))).toHaveLength(MAX_ARROWS);
  });

  it("returns nothing for a route that is too short", () => {
    expect(routeArrows(straight(2))).toEqual([]);
    expect(routeArrows([])).toEqual([]);
  });

  it("points each arrow along its segment", () => {
    const route = [
      { x: 0, z: 0 },
      { x: 20, z: 0 },
      { x: 20, z: 20 },
    ];
    const arrows = routeArrows(route);
    expect(arrows.some((a) => a.dx === 1 && a.dz === 0)).toBe(true);
    expect(arrows.some((a) => a.dx === 0 && a.dz === 1)).toBe(true);
  });
});
