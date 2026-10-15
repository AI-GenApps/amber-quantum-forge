import { describe, expect, it } from "vitest";
import {
  buildRoadGraph,
  LaneIndex,
  nearestLanePoint,
  pointOnEdge,
  tileCenter,
} from "../../src/index";
import { loadDistrict1 } from "./helpers";

const map = loadDistrict1();
const graph = buildRoadGraph(map);
const index = new LaneIndex(graph);

function bruteForce(p: { x: number; z: number }): number {
  let best = Number.POSITIVE_INFINITY;
  for (const edge of graph.edgeList) {
    for (let i = 1; i < edge.points.length; i++) {
      const a = edge.points[i - 1] as { x: number; z: number };
      const b = edge.points[i] as { x: number; z: number };
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len2 = dx * dx + dz * dz;
      const t = Math.min(Math.max(((p.x - a.x) * dx + (p.z - a.z) * dz) / len2, 0), 1);
      best = Math.min(best, Math.hypot(p.x - (a.x + dx * t), p.z - (a.z + dz * t)));
    }
  }
  return best;
}

describe("nearestLanePoint", () => {
  it("snaps to the eastbound lane of a straight tile with the right s", () => {
    const c = tileCenter(map, 3, 5);
    const hit = nearestLanePoint(index, { x: c.x + 5, z: c.z + graph.laneOffset - 0.1 });
    expect(hit?.edgeId).toBe("e:3,5:WE");
    expect(hit?.s).toBeCloseTo(15, 9);
    expect(hit?.x).toBeCloseTo(c.x + 5, 9);
    expect(hit?.z).toBeCloseTo(c.z + graph.laneOffset, 9);
    expect(hit?.distance).toBeCloseTo(0.1, 9);
  });

  it("picks the westbound lane when the query is on the north side", () => {
    const c = tileCenter(map, 3, 5);
    const hit = nearestLanePoint(index, { x: c.x - 4, z: c.z - graph.laneOffset + 0.5 });
    expect(hit?.edgeId).toBe("e:3,5:EW");
    expect(hit?.s).toBeCloseTo(14, 9);
  });

  it("projects onto the start of an edge when the query is behind it", () => {
    const c = tileCenter(map, 3, 5);
    const hit = nearestLanePoint(index, { x: c.x + 10.5, z: c.z + graph.laneOffset });
    expect(hit?.distance).toBeLessThan(0.5 + 1e-9);
  });

  it("finds the nearest lane from far outside the map, and respects maxDistance", () => {
    const far = { x: 500, z: 500 };
    const hit = nearestLanePoint(index, far);
    expect(hit).toBeDefined();
    expect(hit?.distance).toBeCloseTo(bruteForce(far), 6);
    expect(nearestLanePoint(index, far, 50)).toBeUndefined();
    expect(nearestLanePoint(index, tileCenter(map, 3, 5), 50)).toBeDefined();
  });

  it("agrees with a brute-force scan on 300 pseudo-random points", () => {
    let seed = 12345;
    const rand = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 300; i++) {
      const p = { x: (rand() - 0.5) * 300, z: (rand() - 0.5) * 300 };
      expect(nearestLanePoint(index, p)?.distance).toBeCloseTo(bruteForce(p), 6);
    }
  });

  it("returns undefined for an empty graph", () => {
    const empty = new LaneIndex({ ...graph, edgeList: [] });
    expect(empty.nearest({ x: 0, z: 0 })).toBeUndefined();
  });

  it("pointOnEdge round-trips the s value that nearestLanePoint returns", () => {
    const hit = nearestLanePoint(index, { x: -3, z: 7 });
    const edge = graph.edges.get(hit?.edgeId ?? "");
    expect(edge).toBeDefined();
    if (!edge || !hit) return;
    const p = pointOnEdge(edge, hit.s);
    expect(p.x).toBeCloseTo(hit.x, 9);
    expect(p.z).toBeCloseTo(hit.z, 9);
    expect(Math.hypot(p.dirX, p.dirZ)).toBeCloseTo(1, 9);
    expect(pointOnEdge(edge, -5)).toMatchObject(pointOnEdge(edge, 0));
    expect(pointOnEdge(edge, 1e9).x).toBeCloseTo(edge.points[edge.points.length - 1]?.x ?? NaN, 9);
  });
});
