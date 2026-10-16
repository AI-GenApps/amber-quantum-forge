import { beforeAll, describe, expect, it } from "vitest";
import { type DeliveryMission, secondsToTicks } from "../../src/index";
import { loadMissionWorld, type MissionWorld } from "./helpers";
import { at, evaluator, feed, mission, sample } from "./scripted";

let world: MissionWorld;
let def: DeliveryMission;
beforeAll(() => {
  world = loadMissionWorld();
  def = mission(world, "d1-m01") as DeliveryMission;
});

function spots() {
  const pickup = at(world.graph, def.params.pickup);
  const drop = at(world.graph, def.params.drops[0] as DeliveryMission["params"]["drops"][0]);
  return { pickup, drop };
}

/** Run to the pickup on tick 1, idle, then reach the drop with `leftS` seconds remaining. */
function finishWithTimeLeft(leftS: number, hitsOnRoute = 0) {
  const ev = evaluator(world, def);
  const { pickup, drop } = spots();
  expect(ev.step(sample(pickup.x, pickup.z)).status).toBe("active");
  expect(ev.objective()?.kind).toBe("dropoff");
  const ticks = secondsToTicks(def.params.time_limit_s - leftS);
  const idle = ticks - 2;
  for (let i = 0; i < idle; i++)
    ev.step(sample(pickup.x + 50, pickup.z, { hits: i === 0 ? hitsOnRoute : 0 }));
  const done = ev.step(sample(drop.x, drop.z));
  expect(done.status).toBe("success");
  return ev;
}

describe("delivery evaluator", () => {
  it("starts at the pickup and tracks progress", () => {
    const ev = evaluator(world, def);
    expect(ev.objective()?.kind).toBe("pickup");
    expect(ev.progress()).toEqual({ done: 0, total: 2 });
    const { pickup } = spots();
    ev.step(sample(pickup.x, pickup.z));
    expect(ev.progress()).toEqual({ done: 1, total: 2 });
  });

  it("does not drop before the pickup", () => {
    const ev = evaluator(world, def);
    const { drop } = spots();
    expect(ev.step(sample(drop.x, drop.z)).status).toBe("active");
    expect(ev.objective()?.kind).toBe("pickup");
  });

  it("succeeds with three stars at exactly 60 s left and no damage", () => {
    const ev = finishWithTimeLeft(60);
    expect(ev.stars()).toBe(3);
  });

  it("drops to two stars one step short of the 3-star time", () => {
    const ev = finishWithTimeLeft(60 - 1 / 60);
    expect(ev.stars()).toBe(2);
  });

  it("keeps three stars with one damage and loses one with two", () => {
    expect(finishWithTimeLeft(70, 1).stars()).toBe(3);
    expect(finishWithTimeLeft(70, 2).stars()).toBe(2);
  });

  it("gives one star for a slow, scraped delivery", () => {
    expect(finishWithTimeLeft(5, 3).stars()).toBe(1);
  });

  it("two-star boundary is 40 s left", () => {
    expect(finishWithTimeLeft(40).stars()).toBe(2);
    expect(finishWithTimeLeft(40 - 1 / 60).stars()).toBe(1);
  });

  it("fails when damage goes above the limit", () => {
    const ev = evaluator(world, def);
    const { pickup } = spots();
    ev.step(sample(pickup.x, pickup.z));
    const far = sample(pickup.x + 50, pickup.z, { hits: 1 });
    expect(ev.step(far).status).toBe("active");
    expect(ev.step(far).status).toBe("active");
    expect(ev.damage()).toBe(2);
    expect(ev.step(far)).toEqual({ status: "active" });
    expect(ev.step(far)).toEqual({ status: "fail", reason: "damage_limit" });
  });

  it("fails on time out only after the last allowed step", () => {
    const ev = evaluator(world, def);
    const limit = secondsToTicks(def.params.time_limit_s);
    const away = () => sample(0, 0);
    expect(feed(ev, limit, away).status).toBe("active");
    expect(ev.step(away())).toEqual({ status: "fail", reason: "time_out" });
  });

  it("reaching the drop on the very last step still succeeds", () => {
    const ev = evaluator(world, def);
    const { pickup, drop } = spots();
    ev.step(sample(pickup.x, pickup.z));
    const limit = secondsToTicks(def.params.time_limit_s);
    feed(ev, limit - 2, () => sample(0, 0));
    expect(ev.step(sample(drop.x, drop.z)).status).toBe("success");
    expect(ev.stars()).toBe(1);
  });

  it("chains up to three drops in order", () => {
    const raw = JSON.parse(JSON.stringify(def)) as DeliveryMission;
    raw.params.drops = [
      def.params.drops[0],
      def.params.pickup,
      def.params.drops[0],
    ] as DeliveryMission["params"]["drops"];
    const ev = evaluator(world, raw);
    const p = at(world.graph, raw.params.pickup);
    const d = at(world.graph, raw.params.drops[0] as DeliveryMission["params"]["drops"][0]);
    ev.step(sample(p.x, p.z));
    expect(ev.progress().total).toBe(4);
    ev.step(sample(d.x, d.z));
    expect(ev.progress().done).toBe(2);
    expect(ev.step(sample(p.x, p.z)).status).toBe("active");
    expect(ev.step(sample(d.x, d.z)).status).toBe("success");
  });
});
