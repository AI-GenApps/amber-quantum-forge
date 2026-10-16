import { beforeAll, describe, expect, it } from "vitest";
import { type DeliveryMission, MissionRun, secondsToTicks } from "../../src/index";
import { CAR_FOOTPRINT, loadMissionWorld, type MissionWorld } from "./helpers";
import { at, mission, sample } from "./scripted";

let world: MissionWorld;
let def: DeliveryMission;
beforeAll(() => {
  world = loadMissionWorld();
  def = mission(world, "d1-m01") as DeliveryMission;
});

const run = () => new MissionRun({ graph: world.graph, car: CAR_FOOTPRINT });

function complete(r: MissionRun): void {
  const pickup = at(world.graph, def.params.pickup);
  const drop = at(world.graph, def.params.drops[0] as DeliveryMission["params"]["drops"][0]);
  r.step(sample(pickup.x, pickup.z));
  r.step(sample(drop.x, drop.z));
}

describe("mission state machine", () => {
  it("walks idle, briefing, active, success, results, idle", () => {
    const r = run();
    expect(r.phase).toBe("idle");
    r.open(def);
    expect(r.phase).toBe("briefing");
    expect(r.mission?.id).toBe("d1-m01");
    r.start();
    expect(r.phase).toBe("active");
    complete(r);
    expect(r.phase).toBe("success");
    expect(r.result?.success).toBe(true);
    r.showResults();
    expect(r.phase).toBe("results");
    const result = r.close();
    expect(r.phase).toBe("idle");
    expect(result.id).toBe("d1-m01");
    expect(r.mission).toBeUndefined();
    expect(r.result).toBeUndefined();
  });

  it("builds the result with stars, time, damage and coins", () => {
    const r = run();
    r.open(def);
    r.start();
    complete(r);
    expect(r.result).toEqual({
      id: "d1-m01",
      success: true,
      stars: 3,
      time: 2 / 60,
      damage: 0,
      comfort: null,
      coins: def.reward_coins["3"],
    });
  });

  it("goes briefing back to idle on cancel", () => {
    const r = run();
    r.open(def);
    r.cancel();
    expect(r.phase).toBe("idle");
  });

  it("fails with the quit reason when the player quits", () => {
    const r = run();
    r.open(def);
    r.start();
    r.step(sample(0, 0));
    r.quit();
    expect(r.phase).toBe("fail");
    expect(r.result).toMatchObject({ success: false, stars: 0, coins: 0, failReason: "quit" });
    expect(r.result?.time).toBeCloseTo(1 / 60, 9);
  });

  it("fails on time out and on the damage limit", () => {
    const a = run();
    a.open(def);
    a.start();
    for (let i = 0; i <= secondsToTicks(def.params.time_limit_s); i++) a.step(sample(0, 0));
    expect(a.result?.failReason).toBe("time_out");
    const b = run();
    b.open(def);
    b.start();
    for (let i = 0; i < def.params.max_damage + 1; i++) b.step(sample(0, 0, { hits: 1 }));
    expect(b.result).toMatchObject({ success: false, failReason: "damage_limit", damage: 4 });
  });

  it("freezes the mission clock while paused", () => {
    const r = run();
    r.open(def);
    r.start();
    r.step(sample(0, 0));
    r.setPaused(true);
    for (let i = 0; i < 100; i++) r.step(sample(0, 0, { hits: 1 }));
    expect(r.hud().elapsedS).toBeCloseTo(1 / 60, 9);
    expect(r.hud().damage).toBe(0);
    expect(r.hud().paused).toBe(true);
    r.setPaused(false);
    r.step(sample(0, 0));
    expect(r.hud().elapsedS).toBeCloseTo(2 / 60, 9);
  });

  it("ignores steps when no mission is active", () => {
    const r = run();
    r.step(sample(0, 0));
    r.open(def);
    r.step(sample(0, 0));
    expect(r.hud().elapsedS).toBe(0);
  });

  it("refuses transitions that do not exist", () => {
    const r = run();
    expect(() => r.start()).toThrow(/cannot start a mission while the phase is "idle"/);
    expect(() => r.quit()).toThrow(/cannot quit/);
    expect(() => r.cancel()).toThrow(/cannot cancel/);
    expect(() => r.showResults()).toThrow(/cannot show results/);
    expect(() => r.close()).toThrow(/cannot close/);
    r.open(def);
    expect(() => r.open(def)).toThrow(/cannot open a briefing/);
    r.start();
    expect(() => r.cancel()).toThrow(/cannot cancel/);
    complete(r);
    expect(() => r.quit()).toThrow(/cannot quit/);
    expect(() => r.close()).toThrow(/cannot close/);
  });

  it("hud shows the objective only while active", () => {
    const r = run();
    r.open(def);
    expect(r.hud().objective).toBeUndefined();
    expect(r.hud().title).toBe(def.title);
    r.start();
    expect(r.hud().objective?.kind).toBe("pickup");
    expect(r.hud().progress).toEqual({ done: 0, total: 2 });
    complete(r);
    expect(r.hud().objective).toBeUndefined();
  });

  it("can run a second mission after the first is closed", () => {
    const r = run();
    r.open(def);
    r.start();
    complete(r);
    r.showResults();
    r.close();
    r.open(def);
    r.start();
    expect(r.hud().elapsedS).toBe(0);
  });
});
