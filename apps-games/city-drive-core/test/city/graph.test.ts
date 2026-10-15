import { describe, expect, it } from "vitest";
import {
  buildRoadGraph,
  CORNER_POINTS,
  findDeadEnds,
  findRoute,
  isStronglyConnected,
  tileCenter,
  UTURN_POINTS,
} from "../../src/index";
import { DISTRICT_1_ROAD_ENDS, loadDistrict1, miniMap } from "./helpers";

const map = loadDistrict1();
const graph = buildRoadGraph(map);

describe("road graph", () => {
  it("is strongly connected for district-1", () => {
    expect(graph.nodeList.length).toBeGreaterThan(0);
    expect(isStronglyConnected(graph)).toBe(true);
  });

  it("has no dead-end lanes; the only road-ends are the recorded ones and they U-turn", () => {
    expect(findDeadEnds(graph)).toEqual([]);
    const uturns = graph.edgeList.filter((e) => e.kind === "uturn");
    expect(uturns.map((e) => ({ x: e.tileX, y: e.tileY })).sort((a, b) => a.y - b.y)).toEqual(
      DISTRICT_1_ROAD_ENDS,
    );
    const ends = map.tiles.filter((t) => t.model === "road-end").map((t) => ({ x: t.x, y: t.y }));
    expect(ends.sort((a, b) => a.y - b.y)).toEqual(DISTRICT_1_ROAD_ENDS);
  });

  it("has at least 2 crossroads, 2 T-junctions, 4 corners and a loop", () => {
    const count = (model: string) => map.tiles.filter((t) => t.model === model).length;
    expect(count("road-crossroads")).toBeGreaterThanOrEqual(2);
    expect(count("road-t")).toBeGreaterThanOrEqual(2);
    expect(count("road-corner")).toBeGreaterThanOrEqual(4);
    const loop = findRoute(graph, "c:1,1>E", "c:1,1>E");
    expect(loop?.edgeIds).toEqual([]);
    const around = findRoute(graph, "c:1,1>E", "c:1,2>S");
    expect(around).toBeDefined();
    const back = findRoute(graph, "c:1,2>S", "c:1,1>E");
    expect(back).toBeDefined();
  });

  it("makes left, straight and right turn edges at every intersection", () => {
    const crossroads = graph.edgeList.filter((e) => e.tileX === 5 && e.tileY === 5);
    expect(crossroads).toHaveLength(12);
    const turnsFromWest = crossroads
      .filter((e) => e.inDir === "W")
      .map((e) => e.kind)
      .sort();
    expect(turnsFromWest).toEqual(["left", "right", "straight"]);
    const tee = graph.edgeList.filter((e) => e.tileX === 5 && e.tileY === 1);
    expect(tee).toHaveLength(6);
  });

  it("samples corners to 8 points and keeps right-hand traffic", () => {
    expect(graph.edges.get("e:1,1:SE")?.kind).toBe("right");
    expect(graph.edges.get("e:1,1:ES")?.kind).toBe("left");
    expect(graph.edges.get("e:1,1:SE")?.points).toHaveLength(CORNER_POINTS);
    expect(graph.edges.get("e:1,1:ES")?.points).toHaveLength(CORNER_POINTS);
    expect(CORNER_POINTS).toBe(8);
    const centre = tileCenter(map, 5, 3);
    const southbound = graph.edges.get("e:5,3:NS");
    const northbound = graph.edges.get("e:5,3:SN");
    expect(southbound?.points[0]?.x).toBeCloseTo(centre.x - graph.laneOffset, 9);
    expect(northbound?.points[0]?.x).toBeCloseTo(centre.x + graph.laneOffset, 9);
    const eastbound = graph.edges.get("e:6,5:WE");
    const westbound = graph.edges.get("e:6,5:EW");
    const c65 = tileCenter(map, 6, 5);
    expect(eastbound?.points[0]?.z).toBeCloseTo(c65.z + graph.laneOffset, 9);
    expect(westbound?.points[0]?.z).toBeCloseTo(c65.z - graph.laneOffset, 9);
    const uturn = graph.edges.get("e:3,0:SS");
    expect(uturn?.points).toHaveLength(UTURN_POINTS + 2);
  });

  it("keeps every lane polyline inside its road tile", () => {
    const half = map.tile_size_m / 2 + 1e-6;
    for (const edge of graph.edgeList) {
      const c = tileCenter(map, edge.tileX, edge.tileY);
      for (const p of edge.points) {
        expect(Math.abs(p.x - c.x)).toBeLessThanOrEqual(half);
        expect(Math.abs(p.z - c.z)).toBeLessThanOrEqual(half);
      }
    }
  });

  it("joins edges end to end: each edge ends exactly where the next starts", () => {
    for (const edge of graph.edgeList) {
      const to = graph.nodes.get(edge.to);
      const from = graph.nodes.get(edge.from);
      const last = edge.points[edge.points.length - 1];
      expect(last).toEqual({ x: to?.x, z: to?.z });
      expect(edge.points[0]).toEqual({ x: from?.x, z: from?.z });
      expect(edge.length).toBeGreaterThan(0);
      expect(edge.cum[edge.cum.length - 1]).toBe(edge.length);
    }
  });

  it("produces identical node and edge ids on every build", () => {
    const again = buildRoadGraph(loadDistrict1());
    expect(again.nodeList.map((n) => n.id)).toEqual(graph.nodeList.map((n) => n.id));
    expect(again.edgeList.map((e) => e.id)).toEqual(graph.edgeList.map((e) => e.id));
    expect(JSON.stringify(again.edgeList)).toBe(JSON.stringify(graph.edgeList));
    expect(graph.edges.has("e:5,5:WE")).toBe(true);
    expect(graph.nodes.has("c:5,5>E")).toBe(true);
  });

  it("builds a small graph for the mini map", () => {
    const mini = buildRoadGraph(miniMap());
    expect(isStronglyConnected(mini)).toBe(true);
    expect(mini.edgeList.map((e) => e.id).sort()).toEqual(
      ["e:1,0:SS", "e:1,1:NS", "e:1,1:SN", "e:1,2:NN"].sort(),
    );
  });
});

describe("A* routing", () => {
  const arc = (radius: number) => 14 * radius * Math.sin(Math.PI / 28);

  it("returns the hand-checked shortest route along the y=5 avenue", () => {
    const route = findRoute(graph, "c:2,5>E", "c:10,5>N");
    const straight = ["3", "4", "5", "6", "7", "8", "9"].map((x) => `e:${x},5:WE`);
    expect(route?.edgeIds).toEqual([...straight, "e:10,5:WN"]);
    const radius = map.tile_size_m / 2 + graph.laneOffset;
    expect(route?.length).toBeCloseTo(7 * 20 + arc(radius), 6);
    expect(route?.nodeIds[0]).toBe("c:2,5>E");
    expect(route?.nodeIds[route.nodeIds.length - 1]).toBe("c:10,5>N");
  });

  it("matches a brute-force Dijkstra for sampled pairs", () => {
    const ids = graph.nodeList.map((n) => n.id);
    for (let i = 0; i < ids.length; i += 17) {
      for (let j = 3; j < ids.length; j += 29) {
        const from = ids[i] as string;
        const to = ids[j] as string;
        expect(findRoute(graph, from, to)?.length).toBeCloseTo(dijkstra(from, to), 6);
      }
    }
  });

  it("returns an empty route to the same node and throws on unknown ids", () => {
    expect(findRoute(graph, "c:2,5>E", "c:2,5>E")).toEqual({
      nodeIds: ["c:2,5>E"],
      edgeIds: [],
      length: 0,
    });
    expect(() => findRoute(graph, "nope", "c:2,5>E")).toThrow(/unknown start node "nope"/);
    expect(() => findRoute(graph, "c:2,5>E", "nope")).toThrow(/unknown goal node "nope"/);
  });
});

function dijkstra(from: string, to: string): number {
  const dist = new Map<string, number>([[from, 0]]);
  const open = new Set<string>([from]);
  while (open.size > 0) {
    let current = "";
    let best = Number.POSITIVE_INFINITY;
    for (const id of open) {
      const d = dist.get(id) ?? Number.POSITIVE_INFINITY;
      if (d < best) {
        best = d;
        current = id;
      }
    }
    open.delete(current);
    if (current === to) return best;
    for (const edgeId of graph.nodes.get(current)?.outEdges ?? []) {
      const edge = graph.edges.get(edgeId);
      if (!edge) continue;
      const next = best + edge.length;
      if (next < (dist.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        dist.set(edge.to, next);
        open.add(edge.to);
      }
    }
  }
  return Number.POSITIVE_INFINITY;
}
