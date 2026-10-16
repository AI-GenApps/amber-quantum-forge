import { beforeAll, describe, expect, it } from "vitest";
import { comfortLoss, missionConstants, secondsToTicks, type TaxiMission } from "../../src/index";
import { loadMissionWorld, type MissionWorld } from "./helpers";
import { at, evaluator, feed, mission, sample } from "./scripted";

let world: MissionWorld;
let def: TaxiMission;
beforeAll(() => {
  world = loadMissionWorld();
  def = mission(world, "d1-m02") as TaxiMission;
});

const spots = () => ({
  pickup: at(world.graph, def.params.pickup),
  drop: at(world.graph, def.params.drop),
});
const FAR = { x: 0, z: 0 };

function boarded() {
  const ev = evaluator(world, def);
  const { pickup } = spots();
  ev.step(sample(pickup.x, pickup.z));
  expect(ev.objective()?.kind).toBe("dropoff");
  return ev;
}

describe("taxi comfort model", () => {
  it("costs nothing at or under the limits", () => {
    expect(comfortLoss(sample(0, 0, { longitudinalG: 0.35, lateralG: -0.4 }))).toBe(0);
  });

  it("drains with the excess over each limit", () => {
    const second = 60;
    let total = 0;
    for (let i = 0; i < second; i++) total += comfortLoss(sample(0, 0, { longitudinalG: -0.45 }));
    expect(total).toBeCloseTo(0.1 * missionConstants.COMFORT_DRAIN_PER_G_S, 5);
  });

  it("charges a fixed penalty per hit", () => {
    expect(comfortLoss(sample(0, 0, { hits: 2 }))).toBe(2 * missionConstants.COMFORT_HIT_PENALTY);
  });
});

describe("taxi evaluator", () => {
  it("does not drain comfort before the passenger is aboard", () => {
    const ev = evaluator(world, def);
    feed(ev, 120, () => sample(FAR.x, FAR.z, { lateralG: 0.9, hits: 0 }));
    expect(ev.comfort()).toBe(100);
  });

  it("drains comfort for harsh turns and braking once aboard", () => {
    const ev = boarded();
    feed(ev, 30, () => sample(FAR.x, FAR.z, { lateralG: 0.6 }));
    expect(ev.comfort() as number).toBeLessThan(100);
    const before = ev.comfort() as number;
    feed(ev, 30, () => sample(FAR.x, FAR.z, { longitudinalG: -0.8 }));
    expect(ev.comfort() as number).toBeLessThan(before);
  });

  it("fails when comfort reaches zero", () => {
    const ev = boarded();
    const step = feed(ev, 600, () => sample(FAR.x, FAR.z, { lateralG: 1 }));
    expect(step).toEqual({ status: "fail", reason: "comfort_zero" });
    expect(ev.comfort()).toBe(0);
  });

  it("four hits end the ride", () => {
    const ev = boarded();
    const hit = () => sample(FAR.x, FAR.z, { hits: 1 });
    expect(feed(ev, 3, hit).status).toBe("active");
    expect(ev.step(hit())).toEqual({ status: "fail", reason: "comfort_zero" });
  });

  it("fails on time out", () => {
    const ev = boarded();
    const rest = secondsToTicks(def.params.time_limit_s) - 1;
    expect(feed(ev, rest, () => sample(FAR.x, FAR.z)).status).toBe("active");
    expect(ev.step(sample(FAR.x, FAR.z))).toEqual({ status: "fail", reason: "time_out" });
  });

  function finish(timeLeftS: number, lateralTicks: number) {
    const ev = boarded();
    const { drop } = spots();
    const idle = secondsToTicks(def.params.time_limit_s - timeLeftS) - 2;
    for (let i = 0; i < idle; i++) {
      ev.step(sample(FAR.x, FAR.z, { lateralG: i < lateralTicks ? 0.5 : 0 }));
    }
    expect(ev.step(sample(drop.x, drop.z)).status).toBe("success");
    return ev;
  }

  it("awards stars from time and comfort together", () => {
    expect(finish(60, 0).stars()).toBe(3);
    expect(finish(30, 0).stars()).toBe(2);
    expect(finish(5, 0).stars()).toBe(1);
    expect(finish(60, 240).stars()).toBe(2);
    expect(finish(60, 480).stars()).toBe(1);
  });

  it("comfort boundary: 80 earns three stars, just under does not", () => {
    // 0.1 g over the lateral limit drains 10 per second: 120 steps cost exactly 20.
    const exact = finish(60, 120);
    expect(exact.comfort() as number).toBeCloseTo(80, 5);
    expect(exact.stars()).toBe(3);
    const worse = finish(60, 121);
    expect(worse.comfort() as number).toBeLessThan(80);
    expect(worse.stars()).toBe(2);
  });
});
