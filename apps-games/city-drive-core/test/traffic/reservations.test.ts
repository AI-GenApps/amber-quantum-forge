import { beforeAll, describe, expect, it } from "vitest";
import {
  arbitrate,
  buildIntersectionPlan,
  buildRoadGraph,
  type IntersectionPlan,
  RANK_WEIGHT_S,
  ReservationTable,
  Rng,
  turnRank,
} from "../../src/index";
import { loadDistrict1 } from "../city/helpers";

let plan: IntersectionPlan;
let graphEdges: Map<string, { kind: "straight" | "left" | "right" | "uturn" }>;

beforeAll(() => {
  const graph = buildRoadGraph(loadDistrict1());
  plan = buildIntersectionPlan(graph);
  graphEdges = graph.edges;
});

const tee = (pass: string) => `e:3,1:${pass}`;
const cross = (pass: string) => `e:5,5:${pass}`;

describe("intersection plan", () => {
  it("marks only tiles with three or more sides as intersections", () => {
    expect(plan.tileOf.has("e:2,1:WE")).toBe(false);
    expect(plan.tileOf.has("e:1,1:NE")).toBe(false);
    expect(plan.tileOf.has("e:3,0:SS")).toBe(false);
    expect(plan.tileOf.get(tee("WE"))).toBe("3,1");
    const crossEdges = [...plan.tileOf.entries()].filter(([, tile]) => tile === "5,5");
    expect(crossEdges).toHaveLength(12);
  });

  it("is symmetric and irreflexive", () => {
    for (const [id, set] of plan.conflicts) {
      expect(set.has(id)).toBe(false);
      for (const other of set) expect(plan.conflicts.get(other)?.has(id)).toBe(true);
    }
  });

  it("lets opposite straights and diverging turns share a tile", () => {
    expect(plan.conflicts.get(tee("WE"))?.has(tee("EW"))).toBe(false);
    expect(plan.conflicts.get(tee("WE"))?.has(tee("WN"))).toBe(false);
    expect(plan.conflicts.get(tee("EW"))?.has(tee("EN"))).toBe(false);
  });

  it("flags merges and crossings", () => {
    expect(plan.conflicts.get(tee("WN"))?.has(tee("EN"))).toBe(true);
    expect(plan.conflicts.get(tee("WN"))?.has(tee("EW"))).toBe(true);
    expect(plan.conflicts.get(tee("NE"))?.has(tee("WE"))).toBe(true);
    expect(plan.conflicts.get(tee("NW"))?.has(tee("EW"))).toBe(true);
  });

  it("makes the cross conflict across directions but not along them", () => {
    expect(plan.conflicts.get(cross("WE"))?.has(cross("EW"))).toBe(false);
    expect(plan.conflicts.get(cross("WE"))?.has(cross("NS"))).toBe(true);
    expect(plan.conflicts.get(cross("WE"))?.has(cross("SN"))).toBe(true);
    expect(plan.conflicts.get(cross("WE"))?.has(cross("SE"))).toBe(true);
  });

  it("ranks right turns over straights over left turns", () => {
    expect(graphEdges.get(tee("EN"))?.kind).toBe("right");
    expect(graphEdges.get(tee("WN"))?.kind).toBe("left");
    expect(turnRank("right")).toBeLessThan(turnRank("straight"));
    expect(turnRank("straight")).toBeLessThan(turnRank("left"));
    expect(turnRank("left")).toBeLessThan(turnRank("uturn"));
  });
});

describe("ReservationTable", () => {
  it("never grants two conflicting edges at once", () => {
    const table = new ReservationTable(plan);
    expect(table.reserve(1, tee("WN"))).toBe(true);
    expect(table.canReserve(2, tee("EN"))).toBe(false);
    expect(table.reserve(2, tee("EN"))).toBe(false);
    expect(table.holds(2, tee("EN"))).toBe(false);
  });

  it("lets non-conflicting turns through together", () => {
    const table = new ReservationTable(plan);
    expect(table.reserve(1, tee("WE"))).toBe(true);
    expect(table.reserve(2, tee("EW"))).toBe(true);
    expect(table.reserve(3, tee("WN"))).toBe(false);
  });

  it("lets a platoon share one edge", () => {
    const table = new ReservationTable(plan);
    expect(table.reserve(1, tee("WE"))).toBe(true);
    expect(table.reserve(2, tee("WE"))).toBe(true);
    expect(table.holders(tee("WE"))).toEqual([1, 2]);
    table.release(1, tee("WE"));
    expect(table.canReserve(3, tee("NE"))).toBe(false);
    table.release(2, tee("WE"));
    expect(table.canReserve(3, tee("NE"))).toBe(true);
  });

  it("treats edges outside intersections as always free", () => {
    const table = new ReservationTable(plan);
    expect(table.reserve(1, "e:2,1:WE")).toBe(true);
    expect(table.size).toBe(0);
  });

  it("frees everything an agent held", () => {
    const table = new ReservationTable(plan);
    table.reserve(1, tee("WN"));
    table.reserve(1, cross("WE"));
    table.releaseAll(1);
    expect(table.size).toBe(0);
    expect(table.canReserve(2, tee("EN"))).toBe(true);
  });
});

describe("arbitrate", () => {
  const req = (
    agentId: number,
    edgeId: string,
    kind: "right" | "straight" | "left",
    waited = 0,
  ) => ({
    agentId,
    edgeId,
    rank: turnRank(kind),
    waited,
  });

  it("gives a right turn priority over a left turn", () => {
    const table = new ReservationTable(plan);
    const granted = arbitrate(table, [req(1, tee("WN"), "left"), req(2, tee("EN"), "right")]);
    expect([...granted]).toEqual([2]);
    expect(table.holds(1, tee("WN"))).toBe(false);
  });

  it("gives a straight priority over a left turn", () => {
    const table = new ReservationTable(plan);
    const granted = arbitrate(table, [req(1, tee("NE"), "left"), req(2, tee("WE"), "straight")]);
    expect([...granted]).toEqual([2]);
  });

  it("breaks ties by agent id so the order is stable", () => {
    const table = new ReservationTable(plan);
    const granted = arbitrate(table, [req(9, tee("EN"), "right"), req(4, tee("WN"), "right")]);
    expect([...granted]).toEqual([4]);
  });

  it("lets a long wait overcome rank", () => {
    const table = new ReservationTable(plan);
    const waited = RANK_WEIGHT_S * 2 + 1;
    const granted = arbitrate(table, [
      req(1, tee("NE"), "left", waited),
      req(2, tee("WE"), "straight", 0),
    ]);
    expect([...granted]).toEqual([1]);
  });

  it("does not let a lower request jump a waiting conflicting one", () => {
    const table = new ReservationTable(plan);
    table.reserve(1, tee("EW"));
    const granted = arbitrate(table, [
      req(2, tee("WN"), "left", 12),
      req(3, tee("EN"), "right", 0),
    ]);
    expect(granted.size).toBe(0);
    expect(table.holds(3, tee("EN"))).toBe(false);
  });

  it("grants the waiter once the holder leaves", () => {
    const table = new ReservationTable(plan);
    table.reserve(1, tee("EW"));
    const wait = [req(2, tee("WN"), "left", 5)];
    expect(arbitrate(table, wait).size).toBe(0);
    table.release(1, tee("EW"));
    expect([...arbitrate(table, wait)]).toEqual([2]);
  });

  it("is deadlock free: random arrivals on the cross are all served within a bound", () => {
    const table = new ReservationTable(plan);
    const edges = [...plan.tileOf.entries()].filter(([, t]) => t === "5,5").map(([id]) => id);
    const rng = new Rng(2024);
    interface Car {
      id: number;
      edge: string;
      arrived: number;
      holdUntil: number;
      granted: boolean;
    }
    const waiting: Car[] = [];
    const inside: Car[] = [];
    let nextId = 0;
    let served = 0;
    let worstWait = 0;
    for (let tick = 0; tick < 60 * 600; tick++) {
      if (tick % 100 === 0) {
        waiting.push({
          id: nextId++,
          edge: rng.pick(edges),
          arrived: tick,
          holdUntil: 0,
          granted: false,
        });
      }
      for (const car of [...inside]) {
        if (tick >= car.holdUntil) {
          table.release(car.id, car.edge);
          inside.splice(inside.indexOf(car), 1);
        }
      }
      const requests = waiting.map((c) => ({
        agentId: c.id,
        edgeId: c.edge,
        rank: turnRank(graphEdges.get(c.edge)?.kind ?? "straight"),
        waited: (tick - c.arrived) / 60,
      }));
      const granted = arbitrate(table, requests);
      for (const car of [...waiting]) {
        if (!granted.has(car.id)) continue;
        waiting.splice(waiting.indexOf(car), 1);
        car.holdUntil = tick + 90 + rng.int(60);
        inside.push(car);
        served++;
        worstWait = Math.max(worstWait, (tick - car.arrived) / 60);
        for (const other of inside) {
          if (other !== car) expect(table.conflicts(other.edge, car.edge)).toBe(false);
        }
      }
    }
    expect(served).toBeGreaterThan(150);
    expect(worstWait).toBeLessThan(40);
    expect(waiting.every((c) => 60 * 600 - c.arrived < 60 * 40)).toBe(true);
  });
});
