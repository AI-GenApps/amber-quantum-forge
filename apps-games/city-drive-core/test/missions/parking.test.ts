import { beforeAll, describe, expect, it } from "vitest";
import {
  bayGeometry,
  missionConstants,
  type ParkingMission,
  secondsToTicks,
} from "../../src/index";
import { loadMissionWorld, type MissionWorld } from "./helpers";
import { evaluator, feed, mission, sample } from "./scripted";

let world: MissionWorld;
let def: ParkingMission;
beforeAll(() => {
  world = loadMissionWorld();
  def = mission(world, "d1-m04") as ParkingMission;
});

const geo = () => bayGeometry(world.graph, def.params.bay);

function parked(
  over: { yawDeg?: number; speed?: number; du?: number; dv?: number; hits?: number } = {},
) {
  const g = geo();
  const yaw = ((over.yawDeg ?? 0) * Math.PI) / 180;
  const du = over.du ?? 0;
  const dv = over.dv ?? 0;
  return sample(
    g.centre.x + g.axis.x * du + g.right.x * dv,
    g.centre.z + g.axis.z * du + g.right.z * dv,
    {
      speedKmh: over.speed ?? 0,
      hits: over.hits ?? 0,
      forward: {
        x: g.axis.x * Math.cos(yaw) + g.right.x * Math.sin(yaw),
        z: g.axis.z * Math.cos(yaw) + g.right.z * Math.sin(yaw),
      },
    },
  );
}

const HOLD = missionConstants.PARK_HOLD_TICKS;

describe("parking evaluator", () => {
  it("succeeds after holding still, aligned and inside for 60 steps", () => {
    const ev = evaluator(world, def);
    expect(feed(ev, HOLD - 1, () => parked()).status).toBe("active");
    expect(ev.step(parked())).toEqual({ status: "success" });
  });

  it("restarts the hold when a condition breaks", () => {
    const ev = evaluator(world, def);
    feed(ev, HOLD - 1, () => parked());
    expect(ev.step(parked({ speed: 3 })).status).toBe("active");
    expect(feed(ev, HOLD - 1, () => parked()).status).toBe("active");
    expect(ev.step(parked()).status).toBe("success");
  });

  it("needs speed under 1 km/h", () => {
    expect(feed(evaluator(world, def), 200, () => parked({ speed: 1.01 })).status).toBe("active");
    expect(feed(evaluator(world, def), HOLD, () => parked({ speed: 0.99 })).status).toBe("success");
    expect(feed(evaluator(world, def), HOLD, () => parked({ speed: -0.99 })).status).toBe(
      "success",
    );
  });

  it("accepts 14 degrees and rejects 16 degrees of misalignment", () => {
    expect(feed(evaluator(world, def), HOLD, () => parked({ yawDeg: 14 })).status).toBe("success");
    expect(feed(evaluator(world, def), 200, () => parked({ yawDeg: 16 })).status).toBe("active");
  });

  it("accepts a car facing either way along the bay", () => {
    expect(feed(evaluator(world, def), HOLD, () => parked({ yawDeg: 180 })).status).toBe("success");
    expect(feed(evaluator(world, def), 200, () => parked({ yawDeg: 90 })).status).toBe("active");
  });

  it("needs the whole car inside the bay", () => {
    expect(feed(evaluator(world, def), 200, () => parked({ du: 2 })).status).toBe("active");
    expect(feed(evaluator(world, def), 200, () => parked({ dv: 1.2 })).status).toBe("active");
    expect(feed(evaluator(world, def), HOLD, () => parked({ du: 0.5, dv: 0.3 })).status).toBe(
      "success",
    );
  });

  it("counts touches and fails when they pass the limit", () => {
    const ev = evaluator(world, def);
    expect(ev.step(parked({ speed: 10, hits: 1 })).status).toBe("active");
    expect(ev.step(parked({ speed: 10, hits: 1 })).status).toBe("active");
    expect(ev.step(parked({ speed: 10, hits: 1 }))).toEqual({
      status: "fail",
      reason: "damage_limit",
    });
  });

  function finishAt(seconds: number, touches: number) {
    const ev = evaluator(world, def);
    const total = secondsToTicks(seconds);
    for (let i = 0; i < total - HOLD; i++) {
      ev.step(parked({ speed: 10, hits: i < touches ? 1 : 0 }));
    }
    const out = feed(ev, HOLD, () => parked());
    expect(out.status).toBe("success");
    return ev;
  }

  it("star boundaries on time and touches", () => {
    expect(finishAt(28, 0).stars()).toBe(3);
    expect(finishAt(28 + 1 / 60, 0).stars()).toBe(2);
    expect(finishAt(28, 1).stars()).toBe(2);
    expect(finishAt(40, 1).stars()).toBe(2);
    expect(finishAt(40 + 1 / 60, 1).stars()).toBe(1);
    expect(finishAt(28, 2).stars()).toBe(1);
  });

  it("fails on time out", () => {
    const ev = evaluator(world, def);
    const limit = secondsToTicks(def.params.time_limit_s);
    expect(feed(ev, limit, () => parked({ speed: 20 })).status).toBe("active");
    expect(ev.step(parked({ speed: 20 }))).toEqual({ status: "fail", reason: "time_out" });
  });

  it("flanks the bay with two parked cars clear of the lane", () => {
    const g = geo();
    expect(g.parkedCars).toHaveLength(2);
    for (const car of g.parkedCars) {
      const lateral =
        (car.center.x - g.centre.x) * g.right.x + (car.center.z - g.centre.z) * g.right.z;
      expect(Math.abs(lateral)).toBeLessThan(1e-9);
    }
  });
});
