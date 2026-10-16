import { beforeAll, describe, expect, it } from "vitest";
import {
  BASELINE_CAR,
  type CarState,
  type CollisionImpulse,
  createPhysicsWorld,
  MissionSystem,
  missionConstants,
  quatFromForward,
} from "../../src/index";
import { CAR_FOOTPRINT, loadMissionWorld, type MissionWorld } from "./helpers";
import { at } from "./scripted";

let world: MissionWorld;
beforeAll(() => {
  world = loadMissionWorld();
});

const CAR_COLLIDER = 5;

function system(district?: string): MissionSystem {
  return new MissionSystem({
    graph: world.graph,
    laneIndex: world.laneIndex,
    missions: world.catalog,
    car: CAR_FOOTPRINT,
    carCollider: CAR_COLLIDER,
    ...(district === undefined ? {} : { district }),
  });
}

function carState(x: number, z: number, speedKmh = 0, forward = { x: 0, z: 1 }): CarState {
  const wheel = { inContact: true, rotation: 0, steering: 0, suspensionLength: 0.3, slip: 0 };
  return {
    position: { x, y: 0.5, z },
    rotation: quatFromForward(forward.x, forward.z),
    velocity: { x: (forward.x * speedKmh) / 3.6, y: 0, z: (forward.z * speedKmh) / 3.6 },
    speedKmh,
    yawRate: 0,
    longitudinalG: 0,
    lateralG: 0,
    wheelContacts: [true, true, true, true],
    wheels: [wheel, wheel, wheel, wheel],
  };
}

function marker(sys: MissionSystem, id: string) {
  const m = sys.markers().find((x) => x.missionId === id);
  if (!m) throw new Error(`no marker ${id}`);
  return m;
}

describe("MissionSystem free roam", () => {
  it("shows one marker per mission of the district on its start lane point", () => {
    const sys = system("district-1");
    expect(sys.markers().map((m) => m.missionId)).toEqual(["d1-m01", "d1-m02", "d1-m03", "d1-m04"]);
    const start = at(world.graph, { edgeId: "e:4,5:EW", s: 10 });
    expect(marker(sys, "d1-m01")).toMatchObject({ x: start.x, z: start.z, type: "delivery" });
    expect(system("district-2").markers()).toEqual([]);
  });

  it("opens the briefing only below 15 km/h inside the marker radius", () => {
    const sys = system();
    const m = marker(sys, "d1-m01");
    sys.step(carState(m.x, m.z, 30), []);
    expect(sys.run.phase).toBe("idle");
    sys.step(carState(m.x + missionConstants.START_RADIUS_M + 1, m.z, 5), []);
    expect(sys.run.phase).toBe("idle");
    sys.step(carState(m.x + 3, m.z, 14.9), []);
    expect(sys.run.phase).toBe("briefing");
    expect(sys.hud().missionId).toBe("d1-m01");
  });

  it("does not reopen after decline until the car has left the marker", () => {
    const sys = system();
    const m = marker(sys, "d1-m01");
    sys.step(carState(m.x, m.z, 0), []);
    sys.decline();
    expect(sys.run.phase).toBe("idle");
    sys.step(carState(m.x, m.z, 0), []);
    expect(sys.run.phase).toBe("idle");
    sys.step(carState(m.x + missionConstants.START_REARM_M + 1, m.z, 0), []);
    sys.step(carState(m.x, m.z, 0), []);
    expect(sys.run.phase).toBe("briefing");
  });

  it("adds each parking mission's parked cars to the physics world", async () => {
    const sys = system();
    const physics = await createPhysicsWorld();
    const handles = sys.installParkedCars(physics);
    expect(handles).toHaveLength(2);
    expect(sys.parkedCars()).toHaveLength(2);
  });
});

describe("MissionSystem active mission", () => {
  function activate(id = "d1-m01") {
    const sys = system();
    const m = marker(sys, id);
    sys.step(carState(m.x, m.z, 0), []);
    sys.accept();
    return { sys, m };
  }

  it("plans a route to the first objective and refreshes it as the car moves", () => {
    const { sys, m } = activate();
    sys.step(carState(m.x, m.z, 10), []);
    const first = sys.route;
    expect(first?.target).toEqual(sys.objective?.lane);
    expect(first?.edgeIds[0]).toBe("e:4,5:EW");
    for (let i = 0; i < 30; i++) sys.step(carState(m.x - 0.1 * i, m.z, 10), []);
    expect(sys.route?.length).toBeLessThan(first?.length ?? 0);
  });

  it("moves the route to the next objective once one is reached", () => {
    const { sys, m } = activate();
    sys.step(carState(m.x, m.z, 10), []);
    const pickup = sys.objective;
    expect(pickup?.kind).toBe("pickup");
    sys.step(carState(pickup?.x ?? 0, pickup?.z ?? 0, 10), []);
    expect(sys.objective?.kind).toBe("dropoff");
    sys.step(carState(pickup?.x ?? 0, pickup?.z ?? 0, 10), []);
    expect(sys.route?.target).toEqual(sys.objective?.lane);
  });

  it("counts player collisions as damage and ignores other bodies", () => {
    const { sys, m } = activate();
    const hit = (a: number, b: number): CollisionImpulse => ({
      tick: sys.tick,
      colliderA: a,
      colliderB: b,
      force: 1e6,
      impulse: 1e6 / 60,
    });
    sys.step(carState(m.x, m.z, 10), [hit(1, 2)]);
    expect(sys.hud().damage).toBe(0);
    sys.step(carState(m.x, m.z, 10), [hit(CAR_COLLIDER, 9)]);
    expect(sys.hud().damage).toBe(1);
  });

  it("clears the route when the mission ends and returns the result when closed", () => {
    const { sys, m } = activate();
    sys.step(carState(m.x, m.z, 10), []);
    sys.quit();
    expect(sys.run.phase).toBe("fail");
    expect(sys.route).toBeUndefined();
    expect(sys.advance()).toBeUndefined();
    expect(sys.run.phase).toBe("results");
    const result = sys.advance();
    expect(result).toMatchObject({ id: "d1-m01", success: false, failReason: "quit" });
    expect(sys.run.phase).toBe("idle");
  });

  it("freezes while paused", () => {
    const { sys, m } = activate();
    sys.step(carState(m.x, m.z, 10), []);
    sys.setPaused(true);
    for (let i = 0; i < 60; i++) sys.step(carState(m.x, m.z, 10), []);
    expect(sys.hud().elapsedS).toBeCloseTo(1 / 60, 9);
  });

  it("uses the baseline car footprint for parking", () => {
    expect(CAR_FOOTPRINT.halfLength).toBe(BASELINE_CAR.chassisHalfExtents.z);
  });
});
