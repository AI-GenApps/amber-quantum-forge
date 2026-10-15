import { beforeAll, describe, expect, it } from "vitest";
import {
  buildRoadGraph,
  findLeader,
  type LaneEdge,
  type Obstacle,
  pointOnEdge,
  type RoadGraph,
} from "../../src/index";
import { loadDistrict1 } from "../city/helpers";

let graph: RoadGraph;
let path: LaneEdge[];
let first: LaneEdge;

function follow(start: LaneEdge, count: number): LaneEdge[] {
  const out = [start];
  while (out.length < count) {
    const last = out[out.length - 1] as LaneEdge;
    const next = graph.nodes.get(last.to)?.outEdges[0];
    out.push(graph.edges.get(next as string) as LaneEdge);
  }
  return out;
}

beforeAll(() => {
  graph = buildRoadGraph(loadDistrict1());
  first = graph.edges.get("e:6,1:WE") as LaneEdge;
  path = follow(first, 4);
});

/** An obstacle `ahead` metres along edge 0 from distance s0, `side` metres to the left of the lane. */
function obstacle(ahead: number, side = 0, extra: Partial<Obstacle> = {}): Obstacle {
  const p = pointOnEdge(first, 5 + ahead);
  return {
    id: 1,
    x: p.x + -p.dirZ * side,
    z: p.z + p.dirX * side,
    vx: 0,
    vz: 0,
    halfLength: 2.1,
    reach: 2,
    ...extra,
  };
}

const find = (obstacles: Obstacle[], range = 25) => findLeader(path, 5, 2.1, range, obstacles, 0);

describe("findLeader", () => {
  it("finds a car ahead in the lane and reports the bumper gap", () => {
    const hit = find([obstacle(10)]);
    expect(hit?.id).toBe(1);
    expect(hit?.gap).toBeCloseTo(10 - 4.2, 5);
  });

  it("ignores a car behind", () => {
    expect(find([obstacle(-8)])).toBeUndefined();
  });

  it("ignores a car in the oncoming lane", () => {
    expect(find([obstacle(10, 6)])).toBeUndefined();
    expect(find([obstacle(10, -6)])).toBeUndefined();
  });

  it("ignores a car beyond the look-ahead range", () => {
    expect(find([obstacle(14)], 5)).toBeUndefined();
    expect(find([obstacle(14)], 25)).toBeDefined();
  });

  it("sees a car on the next tile across the border", () => {
    const next = path[1] as LaneEdge;
    const p = pointOnEdge(next, 3);
    const hit = find([{ ...obstacle(0), x: p.x, z: p.z }]);
    expect(hit).toBeDefined();
    expect(hit?.gap).toBeCloseTo(first.length - 5 + 3 - 4.2, 3);
  });

  it("prefers the nearest of several", () => {
    const hit = find([obstacle(20, 0, { id: 2 }), obstacle(9, 0, { id: 3 })]);
    expect(hit?.id).toBe(3);
  });

  it("never returns the asking agent itself", () => {
    expect(findLeader(path, 5, 2.1, 25, [obstacle(10, 0, { id: 0 })], 0)).toBeUndefined();
  });

  it("reports the leader speed along our direction", () => {
    const along = pointOnEdge(first, 5);
    const moving = find([obstacle(12, 0, { vx: along.dirX * 5, vz: along.dirZ * 5 })]);
    expect(moving?.speed).toBeCloseTo(5, 5);
    const oncoming = find([obstacle(12, 0, { vx: -along.dirX * 4, vz: -along.dirZ * 4 })]);
    expect(oncoming?.speed).toBeCloseTo(-4, 5);
    const crossing = find([obstacle(12, 0, { vx: -along.dirZ * 6, vz: along.dirX * 6 })]);
    expect(crossing?.speed).toBeCloseTo(0, 5);
  });

  it("uses each obstacle's own reach", () => {
    expect(find([obstacle(10, 2.2, { reach: 2 })])).toBeUndefined();
    expect(find([obstacle(10, 2.2, { reach: 2.4 })])).toBeDefined();
  });

  it("reports a negative gap for an overlapping car", () => {
    const hit = find([obstacle(3)]);
    expect(hit?.gap).toBeCloseTo(3 - 4.2, 5);
  });
});
