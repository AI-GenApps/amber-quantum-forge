// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildColliders, raycastBoxes, type StaticBox } from "../../src/index";
import { loadDistrict1, loadManifest } from "./helpers";

const box = (x: number, z: number): StaticBox => ({
  kind: "building",
  center: { x, y: 5, z },
  half: { x: 2, y: 5, z: 2 },
});

describe("raycastBoxes", () => {
  it("hits the near face of a box on the ray", () => {
    const hit = raycastBoxes([box(10, 0)], { x: 0, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }, 50);
    expect(hit?.distance).toBeCloseTo(8, 9);
  });

  it("returns the nearest of several boxes regardless of order", () => {
    const boxes = [box(30, 0), box(10, 0)];
    const hit = raycastBoxes(boxes, { x: 0, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }, 100);
    expect(hit?.box.center.x).toBe(10);
  });

  it("misses when the box is beyond maxDistance, beside the ray, or behind it", () => {
    const origin = { x: 0, y: 1, z: 0 };
    const east = { x: 1, y: 0, z: 0 };
    expect(raycastBoxes([box(10, 0)], origin, east, 7)).toBeUndefined();
    expect(raycastBoxes([box(10, 6)], origin, east, 50)).toBeUndefined();
    expect(raycastBoxes([box(-10, 0)], origin, east, 50)).toBeUndefined();
  });

  it("handles rays parallel to a slab, inside and outside it", () => {
    const north = { x: 0, y: 0, z: 1 };
    expect(raycastBoxes([box(0, 10)], { x: 1, y: 1, z: 0 }, north, 50)?.distance).toBeCloseTo(8, 9);
    expect(raycastBoxes([box(0, 10)], { x: 3, y: 1, z: 0 }, north, 50)).toBeUndefined();
  });

  it("sees district-1 buildings and boundary walls", () => {
    const plan = buildColliders(loadDistrict1(), loadManifest());
    const hit = raycastBoxes(plan.boxes, { x: 0, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }, 1000);
    expect(hit).toBeDefined();
    expect(hit?.distance).toBeGreaterThan(0);
  });
});
