// @vitest-environment node
import { FIXED_DT, quatFromForward } from "@city-drive/core";
import { parseCityManifest } from "@city-drive/core/city";
import { afterEach, describe, expect, it } from "vitest";
import { Autopilot } from "../../../city-drive-core/test/support/autopilot";
import { DISTRICT_1_MISSIONS } from "../../src/game/missions";
import { GameSession } from "../../src/game/session";
import { loadDistrict1 } from "../../src/render/district";
import { readManifest } from "../assets/helpers";
import { ScriptedInput } from "./helpers";

let active: GameSession | undefined;

async function make(withTraffic = false) {
  const input = new ScriptedInput();
  const manifest = readManifest();
  const session = await GameSession.create(
    loadDistrict1(manifest),
    parseCityManifest(manifest),
    input,
    undefined,
    {
      missions: DISTRICT_1_MISSIONS,
      ...(withTraffic ? { traffic: { seed: 3, maxAgents: 6 } } : {}),
    },
  );
  active = session;
  return { session, input };
}

const run = (session: GameSession, ticks: number) => {
  for (let i = 0; i < ticks; i++) session.step();
};

/** Put the car on a mission's start marker, at rest, facing along the lane. */
function parkOnMarker(session: GameSession, id: string) {
  const sys = session.missions;
  const marker = sys?.markers().find((m) => m.missionId === id);
  if (!marker) throw new Error(`no marker ${id}`);
  session.car.respawn({
    position: { x: marker.x, y: 1.1, z: marker.z },
    rotation: quatFromForward(-1, 0),
  });
  return marker;
}

afterEach(() => {
  active?.dispose();
  active = undefined;
});

describe("session missions", () => {
  it("has no missions unless asked", async () => {
    const manifest = readManifest();
    const session = await GameSession.create(
      loadDistrict1(manifest),
      parseCityManifest(manifest),
      new ScriptedInput(),
    );
    active = session;
    expect(session.missions).toBeUndefined();
    expect(session.parkedPoses()).toEqual([]);
  });

  it("loads the eight district-1 missions and their markers", async () => {
    const { session } = await make();
    expect(session.missions?.markers().map((m) => m.missionId)).toEqual(
      Array.from({ length: 8 }, (_, i) => `d1-m0${i + 1}`),
    );
    expect(session.missions?.run.phase).toBe("idle");
  });

  it("offers the parked cars to the renderer with negative ids", async () => {
    const { session } = await make();
    const poses = session.parkedPoses();
    expect(poses.map((p) => p.id)).toEqual([-1, -2, -3, -4]);
    expect(session.parkedPoses()).toBe(poses);
  });

  it("opens the briefing when the slow car sits on a marker", async () => {
    const { session } = await make();
    parkOnMarker(session, "d1-m01");
    run(session, 60);
    expect(session.missions?.run.phase).toBe("briefing");
    expect(session.missions?.hud().missionId).toBe("d1-m01");
  });

  it("does not open the briefing for a fast pass through the marker", async () => {
    const { session, input } = await make();
    const marker = session.missions?.markers().find((m) => m.missionId === "d1-m01");
    if (!marker) throw new Error("marker missing");
    session.car.respawn({
      position: { x: marker.x + 60, y: 1.1, z: marker.z },
      rotation: quatFromForward(-1, 0),
    });
    input.set({ throttle: 1 });
    for (let i = 0; i < 60 * 8 && session.missions?.run.phase === "idle"; i++) {
      session.step();
      if (session.state.speedKmh > 40) input.set({ throttle: 0.2 });
    }
    expect(session.missions?.run.phase).toBe("idle");
  });

  it("runs a mission to its end and logs the result when it is closed", async () => {
    const { session } = await make();
    parkOnMarker(session, "d1-m01");
    run(session, 60);
    session.missions?.accept();
    run(session, 120);
    expect(session.missions?.hud().elapsedS).toBeCloseTo(2, 1);
    session.missions?.quit();
    expect(session.advanceMission()).toBeUndefined();
    const result = session.advanceMission();
    expect(result).toMatchObject({ id: "d1-m01", success: false, failReason: "quit" });
    expect(session.missionResults).toEqual([result]);
    expect(session.missions?.run.phase).toBe("idle");
  });

  it("stops the mission clock and the whole simulation while paused", async () => {
    const { session } = await make();
    parkOnMarker(session, "d1-m01");
    run(session, 60);
    session.missions?.accept();
    run(session, 30);
    const before = session.missions?.hud().elapsedS ?? 0;
    const tick = session.physics.tick;
    session.setPaused(true);
    run(session, 300);
    expect(session.paused).toBe(true);
    expect(session.missions?.hud().elapsedS).toBe(before);
    expect(session.physics.tick).toBe(tick);
    session.setPaused(false);
    run(session, 30);
    expect(session.missions?.hud().elapsedS).toBeCloseTo(before + 30 * FIXED_DT, 6);
  });

  it("keeps the traffic running during a mission", async () => {
    const { session } = await make(true);
    parkOnMarker(session, "d1-m01");
    run(session, 60);
    session.missions?.accept();
    const spawnedBefore = session.traffic?.stats.spawned ?? 0;
    const before = JSON.stringify(session.trafficPoses(1));
    run(session, 600);
    expect(session.missions?.run.phase).toBe("active");
    expect(session.traffic?.stats.spawned).toBeGreaterThanOrEqual(spawnedBefore);
    expect(session.trafficPoses(1).length).toBeGreaterThan(0);
    expect(JSON.stringify(session.trafficPoses(1))).not.toBe(before);
  });

  it("counts a crash into a building as mission damage", async () => {
    const { session, input } = await make();
    const marker = parkOnMarker(session, "d1-m01");
    expect(marker.x).toBeGreaterThan(-100);
    run(session, 60);
    session.missions?.accept();
    input.set({ throttle: 1 });
    for (let i = 0; i < 60 * 30 && (session.missions?.hud().damage ?? 0) === 0; i++) {
      session.step();
    }
    expect(session.missions?.hud().damage).toBeGreaterThanOrEqual(1);
  });

  it("starts the route at the car and ends at the objective's lane point", async () => {
    const { session } = await make();
    parkOnMarker(session, "d1-m01");
    run(session, 60);
    session.missions?.accept();
    run(session, 20);
    const route = session.missions?.route;
    const objective = session.missions?.objective;
    expect(route).toBeDefined();
    expect(objective).toBeDefined();
    if (!route || !objective) return;
    const last = route.points[route.points.length - 1];
    expect(Math.hypot((last?.x ?? 0) - objective.x, (last?.z ?? 0) - objective.z)).toBeLessThan(
      0.2,
    );
  });

  it("a scripted driver completes a delivery through the session", async () => {
    const { session, input } = await make();
    parkOnMarker(session, "d1-m01");
    run(session, 60);
    session.missions?.accept();
    const pilot = new Autopilot();
    for (let i = 0; i < 60 * 100 && session.missions?.run.phase === "active"; i++) {
      const drive = pilot.drive(session.state, session.missions.route, session.missions.objective);
      input.set({ throttle: drive.throttle, steer: drive.steer, handbrake: drive.handbrake });
      session.step();
    }
    expect(session.missions?.run.phase).toBe("success");
    session.advanceMission();
    const result = session.advanceMission();
    expect(result?.success).toBe(true);
    expect(result?.stars).toBeGreaterThanOrEqual(1);
    expect(session.missionResults).toHaveLength(1);
  });
});
