// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildRoadGraph,
  LaneIndex,
  laneRespawn,
  quatFromForward,
  quatFromYaw,
  rotateVec,
  tileCenter,
} from "../../src/index";
import { loadDistrict1 } from "./helpers";

const map = loadDistrict1();
const graph = buildRoadGraph(map);
const index = new LaneIndex(graph);

describe("quatFromForward", () => {
  it("turns local +Z onto the requested direction", () => {
    for (const [dx, dz] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
      [0.6, 0.8],
      [-0.6, -0.8],
    ] as const) {
      const f = rotateVec(quatFromForward(dx, dz), { x: 0, y: 0, z: 1 });
      expect(f.x).toBeCloseTo(dx, 9);
      expect(f.z).toBeCloseTo(dz, 9);
      expect(f.y).toBeCloseTo(0, 9);
    }
  });

  it("agrees with quatFromYaw", () => {
    const a = quatFromForward(Math.sin(0.7), Math.cos(0.7));
    const b = quatFromYaw(0.7);
    expect(a.y).toBeCloseTo(b.y, 9);
    expect(a.w).toBeCloseTo(b.w, 9);
  });
});

describe("laneRespawn", () => {
  it("snaps to the eastbound lane and faces east", () => {
    const c = tileCenter(map, 3, 5);
    const r = laneRespawn(graph, index, { x: c.x + 3, z: c.z + 6 }, 1.2);
    expect(r?.edgeId).toBe("e:3,5:WE");
    expect(r?.position.z).toBeCloseTo(c.z + graph.laneOffset, 9);
    expect(r?.position.y).toBe(1.2);
    const f = rotateVec(r?.rotation ?? { x: 0, y: 0, z: 0, w: 1 }, { x: 0, y: 0, z: 1 });
    expect(f.x).toBeCloseTo(1, 6);
    expect(f.z).toBeCloseTo(0, 6);
  });

  it("is deterministic for the same query", () => {
    const q = { x: 12.3, z: -40.1 };
    expect(laneRespawn(graph, index, q)).toEqual(laneRespawn(graph, index, q));
  });
});
