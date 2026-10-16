import { beforeAll, describe, expect, it } from "vitest";
import { secondsToTicks, type TrialMission } from "../../src/index";
import { loadMissionWorld, type MissionWorld } from "./helpers";
import { at, evaluator, feed, mission, sample } from "./scripted";

let world: MissionWorld;
let def: TrialMission;
beforeAll(() => {
  world = loadMissionWorld();
  def = mission(world, "d1-m03") as TrialMission;
});

const cp = (i: number) =>
  at(
    world.graph,
    (def.params.checkpoints[i] as TrialMission["params"]["checkpoints"][0]).lane_point,
  );
const far = () => sample(0, 100);

/** Visit every checkpoint so that the last one is reached after exactly `seconds`. */
function runTrial(seconds: number) {
  const ev = evaluator(world, def);
  const total = secondsToTicks(seconds);
  const n = def.params.checkpoints.length;
  for (let i = 0; i < n - 1; i++) {
    ev.step(sample(cp(i).x, cp(i).z));
  }
  const last = cp(n - 1);
  const idle = total - n;
  feed(ev, idle, far);
  const outcome = ev.step(sample(last.x, last.z));
  return { ev, outcome };
}

describe("time trial evaluator", () => {
  it("lists checkpoints in order and marks the last as the finish", () => {
    const ev = evaluator(world, def);
    expect(ev.objective()?.kind).toBe("checkpoint");
    expect(ev.progress()).toEqual({ done: 0, total: def.params.checkpoints.length });
  });

  it("ignores a later checkpoint reached out of order", () => {
    const ev = evaluator(world, def);
    expect(ev.step(sample(cp(2).x, cp(2).z)).status).toBe("active");
    expect(ev.progress().done).toBe(0);
  });

  it("finishes with the exact time and counts checkpoints", () => {
    const { ev, outcome } = runTrial(40);
    expect(outcome.status).toBe("success");
    expect(ev.elapsedS()).toBeCloseTo(40, 6);
    expect(ev.progress().done).toBe(def.params.checkpoints.length);
  });

  it("star boundaries: 40 s and 60 s inclusive", () => {
    expect(runTrial(40).ev.stars()).toBe(3);
    expect(runTrial(40 + 1 / 60).ev.stars()).toBe(2);
    expect(runTrial(60).ev.stars()).toBe(2);
    expect(runTrial(60 + 1 / 60).ev.stars()).toBe(1);
    expect(runTrial(def.params.time_limit_s).ev.stars()).toBe(1);
  });

  it("fails on time out", () => {
    const ev = evaluator(world, def);
    const limit = secondsToTicks(def.params.time_limit_s);
    expect(feed(ev, limit, far).status).toBe("active");
    expect(ev.step(far())).toEqual({ status: "fail", reason: "time_out" });
  });

  it("reports no comfort", () => {
    expect(evaluator(world, def).comfort()).toBeNull();
  });
});
