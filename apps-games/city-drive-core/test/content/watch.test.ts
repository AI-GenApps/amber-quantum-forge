import { buildRoadGraph, type CarState, quatFromForward } from "../../src/index";
import { describe, expect, it } from "vitest";
import { junctionBoxes, TrafficWatch } from "../support/traffic-watch";
import { loadDistrict1 } from "../city/helpers";

const map = loadDistrict1();
const boxes = junctionBoxes(map, buildRoadGraph(map));

function carAt(x: number, z: number, forward = { x: 1, z: 0 }): CarState {
  return { position: { x, y: 1, z }, rotation: quatFromForward(forward.x, forward.z) } as CarState;
}

function straight(from: number, to: number, z = 0) {
  return Array.from({ length: Math.abs(to - from) + 1 }, (_, i) => ({ x: from + i, z }));
}

describe("junctionBoxes", () => {
  it("finds the ten T and cross tiles of district-1", () => {
    expect(boxes).toHaveLength(10);
    for (const b of boxes) {
      expect(b.maxX - b.minX).toBe(20);
      expect(b.maxZ - b.minZ).toBe(20);
    }
  });
});

describe("TrafficWatch", () => {
  const open = new TrafficWatch([]);

  it("lets the car go on an empty road", () => {
    expect(open.limit(carAt(0, 0), straight(0, 60), [])).toBe(Number.POSITIVE_INFINITY);
  });

  it("slows behind a slower car in its lane and ignores one behind it", () => {
    const ahead = open.limit(carAt(0, 0), straight(0, 60), [{ x: 14, z: 0.3, speed: 4 }]);
    expect(ahead).toBeCloseTo(4 + Math.sqrt(2 * 2.5 * 4.8), 5);
    expect(open.limit(carAt(0, 0), straight(0, 60), [{ x: 8, z: 0, speed: 4 }])).toBe(2);
    expect(open.limit(carAt(0, 0), straight(0, 60), [{ x: -10, z: 0, speed: 4 }])).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it("stops short of an occupied junction but not an empty one", () => {
    const watch = new TrafficWatch([{ minX: 30, maxX: 50, minZ: -10, maxZ: 10 }]);
    const route = straight(0, 90);
    expect(watch.limit(carAt(0, 0), route, [])).toBe(Number.POSITIVE_INFINITY);
    const busy = watch.limit(carAt(0, 0), route, [{ x: 40, z: 6, speed: 0 }]);
    expect(busy).toBeLessThan(Number.POSITIVE_INFINITY);
    expect(busy).toBeGreaterThan(0);
    const closeUp = watch.limit(carAt(27, 0), route.slice(27), [{ x: 40, z: 6, speed: 0 }]);
    expect(closeUp).toBe(0);
  });

  it("ignores a car waiting outside the junction and one already inside the car's way", () => {
    const watch = new TrafficWatch([{ minX: 30, maxX: 50, minZ: -10, maxZ: 10 }]);
    expect(watch.limit(carAt(0, 0), straight(0, 90), [{ x: 40, z: 25, speed: 0 }])).toBe(
      Number.POSITIVE_INFINITY,
    );
    expect(watch.limit(carAt(40, 0), straight(40, 90), [{ x: 45, z: 6, speed: 3 }])).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});
