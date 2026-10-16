import { beforeAll, describe, expect, it } from "vitest";
import { type LanePointRef, pointOnEdge, projectOnEdge, RoutePlanner } from "../../src/index";
import { loadMissionWorld, type MissionWorld } from "./helpers";

let world: MissionWorld;
let planner: RoutePlanner;
beforeAll(() => {
  world = loadMissionWorld();
  planner = new RoutePlanner(world.graph, world.laneIndex);
});

function where(ref: LanePointRef) {
  const edge = world.graph.edges.get(ref.edgeId);
  if (!edge) throw new Error(`no edge ${ref.edgeId}`);
  return pointOnEdge(edge, ref.s);
}

describe("RoutePlanner", () => {
  it("routes from the car to the target along connected lanes", () => {
    const from = where({ edgeId: "e:4,5:EW", s: 10 });
    const target = { edgeId: "e:1,6:NS", s: 10 };
    const route = planner.plan(from, target);
    expect(route).toBeDefined();
    if (!route) return;
    expect(route.edgeIds[0]).toBe("e:4,5:EW");
    expect(route.edgeIds[route.edgeIds.length - 1]).toBe("e:1,6:NS");
    for (let i = 1; i < route.edgeIds.length; i++) {
      const a = world.graph.edges.get(route.edgeIds[i - 1] as string);
      const b = world.graph.edges.get(route.edgeIds[i] as string);
      expect(a?.to).toBe(b?.from);
    }
    const first = route.points[0];
    const last = route.points[route.points.length - 1];
    expect(Math.hypot((first?.x ?? 0) - from.x, (first?.z ?? 0) - from.z)).toBeLessThan(0.1);
    const end = where(target);
    expect(Math.hypot((last?.x ?? 0) - end.x, (last?.z ?? 0) - end.z)).toBeLessThan(0.1);
  });

  it("measures the route length along its points", () => {
    const route = planner.plan(where({ edgeId: "e:4,5:EW", s: 5 }), { edgeId: "e:4,5:EW", s: 15 });
    expect(route?.edgeIds).toEqual(["e:4,5:EW"]);
    expect(route?.length).toBeCloseTo(10, 5);
  });

  it("drives on when the target is behind on the same lane, going round the block", () => {
    const route = planner.plan(where({ edgeId: "e:4,5:EW", s: 15 }), { edgeId: "e:4,5:EW", s: 5 });
    expect(route).toBeDefined();
    expect(route?.edgeIds.length ?? 0).toBeGreaterThan(3);
  });

  it("is deterministic", () => {
    const a = planner.plan(where({ edgeId: "e:3,5:EW", s: 4 }), { edgeId: "e:8,8:NS", s: 10 });
    const b = planner.plan(where({ edgeId: "e:3,5:EW", s: 4 }), { edgeId: "e:8,8:NS", s: 10 });
    expect(a).toEqual(b);
  });

  it("keeps following the previous route and advances its cursor", () => {
    const target = { edgeId: "e:1,6:NS", s: 10 };
    const first = planner.plan(where({ edgeId: "e:4,5:EW", s: 10 }), target);
    expect(first?.cursor).toBe(0);
    const ahead = where({ edgeId: "e:3,5:EW", s: 10 });
    const next = planner.plan(ahead, target, first);
    expect(next?.edgeIds).toEqual(first?.edgeIds);
    expect(next?.cursor).toBe(1);
    expect(next?.length).toBeLessThan(first?.length ?? 0);
  });

  it("replans when the car leaves the route", () => {
    const target = { edgeId: "e:1,6:NS", s: 10 };
    const first = planner.plan(where({ edgeId: "e:4,5:EW", s: 10 }), target);
    const elsewhere = where({ edgeId: "e:8,2:NS", s: 10 });
    const next = planner.plan(elsewhere, target, first);
    expect(next?.edgeIds[0]).toBe("e:8,2:NS");
    expect(next?.cursor).toBe(0);
  });

  it("replans when the target changes", () => {
    const from = where({ edgeId: "e:4,5:EW", s: 10 });
    const a = planner.plan(from, { edgeId: "e:1,6:NS", s: 10 });
    const b = planner.plan(from, { edgeId: "e:10,3:NS", s: 10 }, a);
    expect(b?.target.edgeId).toBe("e:10,3:NS");
  });

  it("projects a point onto an edge", () => {
    const edge = world.graph.edges.get("e:4,5:EW");
    if (!edge) throw new Error("edge missing");
    const hit = projectOnEdge(edge, -30, -10);
    expect(hit.s).toBeCloseTo(10, 5);
    expect(hit.distance).toBeCloseTo(3, 5);
  });

  it("throws on an unknown edge", () => {
    expect(() => planner.planEdges("e:nope", 0, { edgeId: "e:4,5:EW", s: 0 })).toThrow(
      /unknown edge/,
    );
  });
});
