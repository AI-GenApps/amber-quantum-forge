import { describe, expect, it } from "vitest";
import {
  trafficConstants as k,
  type LaneEdge,
  LaneIndex,
  pointOnEdge,
  type TrafficAgent,
} from "../../src/index";
import { obbOverlap } from "./obb";
import { createRig, parkedPlayer, runTicks } from "./rig";

const dist = (a: { x: number; z: number }, b: { x: number; z: number }) =>
  Math.hypot(a.x - b.x, a.z - b.z);

describe("TrafficManager spawning", () => {
  it("fills to 16 agents on the first step by default", async () => {
    const rig = await createRig();
    runTicks(rig, 1);
    expect(rig.traffic.list).toHaveLength(16);
    expect(rig.traffic.stats.spawned).toBe(16);
  });

  it("honours a per-district agent cap", async () => {
    const rig = await createRig({ maxAgents: 5 });
    runTicks(rig, 600);
    expect(rig.traffic.list.length).toBeLessThanOrEqual(5);
    expect(rig.traffic.list.length).toBeGreaterThan(0);
  });

  it("spawns 60 to 150 m from the player and outside the view cone", async () => {
    const rig = await createRig({ player: parkedPlayer(90, 90, { x: 0, z: -1 }) });
    const seen = new Set<number>();
    for (let i = 0; i < 60 * 180; i++) {
      runTicks(rig, 1);
      for (const a of rig.traffic.list) {
        if (seen.has(a.id)) continue;
        seen.add(a.id);
        const d = dist(a, rig.player);
        expect(d, `agent ${a.id} distance`).toBeGreaterThanOrEqual(k.SPAWN_MIN_M - 0.5);
        expect(d, `agent ${a.id} distance`).toBeLessThanOrEqual(k.SPAWN_MAX_M + 0.5);
        const facing =
          ((a.x - rig.player.x) * rig.player.forwardX +
            (a.z - rig.player.z) * rig.player.forwardZ) /
          d;
        expect(facing, `agent ${a.id} in view`).toBeLessThan(k.VIEW_HALF_COS + 0.01);
      }
    }
    expect(seen.size).toBeGreaterThan(16);
  });

  it("gives every agent a 30 to 45 km/h cruise speed and never exceeds it", async () => {
    const rig = await createRig();
    let top = 0;
    for (let i = 0; i < 60 * 60; i++) {
      runTicks(rig, 1);
      for (const a of rig.traffic.list) {
        expect(a.cruise * 3.6).toBeGreaterThanOrEqual(30 - 1e-9);
        expect(a.cruise * 3.6).toBeLessThanOrEqual(45 + 1e-9);
        expect(a.speed).toBeLessThanOrEqual(a.cruise + 1e-6);
        top = Math.max(top, a.speed * 3.6);
      }
    }
    expect(top).toBeGreaterThan(30);
  });

  it("despawns agents the player has left far behind and refills near the player", async () => {
    const rig = await createRig();
    runTicks(rig, 5);
    rig.player.x = 5000;
    rig.player.z = 5000;
    runTicks(rig, 5);
    expect(rig.traffic.list).toHaveLength(0);
    expect(rig.traffic.stats.despawned).toBeGreaterThanOrEqual(16);
    rig.player.x = 0;
    rig.player.z = 0;
    runTicks(rig, 60 * 30);
    expect(rig.traffic.list.length).toBeGreaterThan(10);
  });
});

describe("TrafficManager motion", () => {
  it("keeps the kinematic body on the agent and on its lane", async () => {
    const rig = await createRig({ walls: true });
    const lanes = new LaneIndex(rig.graph);
    let checked = 0;
    for (let i = 0; i < 60 * 60; i++) {
      runTicks(rig, 1);
      for (const a of rig.traffic.list) {
        const p = a.body.position();
        expect(Math.hypot(p.x - a.x, p.z - a.z)).toBeLessThan(1e-4);
        expect(p.y).toBeCloseTo(k.AGENT_CENTRE_Y_M, 6);
        expect(lanes.nearest({ x: p.x, z: p.z })?.distance ?? 99).toBeLessThan(0.5);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(16 * 60 * 50);
  });

  it("only picks turns the graph allows and always has a plan", async () => {
    const rig = await createRig();
    for (let i = 0; i < 60 * 60; i++) {
      runTicks(rig, 1);
      for (const a of rig.traffic.list) {
        expect(a.path.length).toBeGreaterThanOrEqual(k.PLAN_EDGES - 1);
        for (let j = 1; j < a.path.length; j++) {
          expect((a.path[j - 1] as LaneEdge).to).toBe((a.path[j] as LaneEdge).from);
        }
      }
    }
  });

  it("never reserves conflicting turns for two agents", async () => {
    const rig = await createRig();
    for (let i = 0; i < 60 * 180; i++) {
      runTicks(rig, 1);
      const inside = rig.traffic.list.filter((a) =>
        rig.traffic.table.isIntersectionEdge((a.path[0] as LaneEdge).id),
      );
      for (const a of inside)
        expect(rig.traffic.table.holds(a.id, (a.path[0] as LaneEdge).id)).toBe(true);
      for (let p = 0; p < inside.length; p++) {
        for (let q = p + 1; q < inside.length; q++) {
          const a = inside[p] as TrafficAgent;
          const b = inside[q] as TrafficAgent;
          expect(
            rig.traffic.table.conflicts((a.path[0] as LaneEdge).id, (b.path[0] as LaneEdge).id),
          ).toBe(false);
        }
      }
    }
    expect(rig.traffic.stats.forcedStops).toBe(0);
  });

  it("interpolates poses between the last two steps", async () => {
    const rig = await createRig();
    runTicks(rig, 120);
    const a = rig.traffic.list[0] as TrafficAgent;
    const at0 = rig.traffic.poses(0).find((p) => p.id === a.id);
    const at1 = rig.traffic.poses(1).find((p) => p.id === a.id);
    const half = rig.traffic.poses(0.5).find((p) => p.id === a.id);
    expect(at1?.position.x).toBeCloseTo(a.x, 9);
    expect(at0?.position.x).toBeCloseTo(a.prev.x, 9);
    expect(half?.position.x).toBeCloseTo((a.prev.x + a.x) / 2, 9);
    expect(half?.wheelRotation).toBeGreaterThanOrEqual(a.prev.spin);
  });
});

describe("TrafficManager and the player", () => {
  it("brakes for a car parked in the lane and never touches it", async () => {
    const rig = await createRig({ maxAgents: 16 });
    const edge = rig.graph.edges.get("e:1,3:NS") as LaneEdge;
    const spot = pointOnEdge(edge, 10);
    Object.assign(rig.player, { x: spot.x, z: spot.z, forwardX: spot.dirX, forwardZ: spot.dirZ });
    let sawPlayerBlock = false;
    let minGap = Number.POSITIVE_INFINITY;
    const box = (x: number, z: number, hx: number, hz: number, hl: number) => ({
      x,
      z,
      hx,
      hz,
      halfLength: hl,
      halfWidth: 0.85,
    });
    for (let i = 0; i < 60 * 240; i++) {
      runTicks(rig, 1);
      for (const a of rig.traffic.list) {
        if (a.blocker === "player") sawPlayerBlock = true;
        const d = dist(a, rig.player);
        if (d < 12 && a.blocker === "player") minGap = Math.min(minGap, d - 4.2);
        expect(
          obbOverlap(
            box(a.x, a.z, a.headX, a.headZ, 2.1),
            box(rig.player.x, rig.player.z, spot.dirX, spot.dirZ, 2.1),
          ),
          `agent ${a.id} hit the parked player at tick ${i}`,
        ).toBe(false);
      }
    }
    expect(sawPlayerBlock).toBe(true);
    expect(minGap).toBeGreaterThan(0.5);
  });

  it("resumes once the player drives away", async () => {
    const rig = await createRig({ maxAgents: 16 });
    const edge = rig.graph.edges.get("e:1,3:NS") as LaneEdge;
    const spot = pointOnEdge(edge, 10);
    Object.assign(rig.player, { x: spot.x, z: spot.z, forwardX: spot.dirX, forwardZ: spot.dirZ });
    let blocked: TrafficAgent | undefined;
    for (let i = 0; i < 60 * 240 && !blocked; i++) {
      runTicks(rig, 1);
      blocked = rig.traffic.list.find((a) => a.blocker === "player" && a.speed < 0.05);
    }
    expect(blocked, "an agent queued behind the parked player").toBeDefined();
    const id = (blocked as TrafficAgent).id;
    const off = { x: 0, z: -100 };
    Object.assign(rig.player, off);
    runTicks(rig, 60 * 8);
    const after = rig.traffic.list.find((a) => a.id === id);
    if (after) expect(after.travelled).toBeGreaterThan(0);
    expect(rig.traffic.list.every((a) => a.blocker !== "player")).toBe(true);
  });
});
