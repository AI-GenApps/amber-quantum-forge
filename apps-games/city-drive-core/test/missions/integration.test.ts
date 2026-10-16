import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bayGeometry, type MissionDef, toBayFrame } from "../../src/index";
import { Autopilot } from "../support/autopilot";
import { createMissionRig, driveMission, type MissionRig, stepRig } from "../support/harness";
import { loadMissionWorld, type MissionWorld } from "./helpers";

const REPORT_PATH = join(
  import.meta.dirname,
  "../../../../.agents/resources/2026-10-15/city-drive-qa/10/autopilot-report.json",
);
const report: Record<string, unknown>[] = [];

let world: MissionWorld;
beforeAll(() => {
  world = loadMissionWorld();
});

afterAll(() => {
  if (process.env.MISSION_REPORT !== "1") return;
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  const rows = [...report].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  writeFileSync(
    REPORT_PATH,
    `${JSON.stringify({ autopilot: "test/support/autopilot.ts, defaults", missions: rows }, null, 2)}\n`,
  );
});

function def(id: string): MissionDef {
  const found = world.catalog.find((m) => m.id === id);
  if (!found) throw new Error(`mission ${id} missing`);
  return found;
}

async function rigFor(id: string): Promise<{ rig: MissionRig; mission: MissionDef }> {
  const mission = def(id);
  return { rig: await createMissionRig({ missions: world.catalog, at: mission }), mission };
}

function openAndAccept(rig: MissionRig): void {
  for (let i = 0; i < 45 && rig.system.run.phase === "idle"; i++) stepRig(rig);
  expect(rig.system.run.phase).toBe("briefing");
  rig.system.accept();
}

describe("autopilot completes each sample mission in the real sim", () => {
  const cases: [string, string][] = [
    ["d1-m01", "delivery"],
    ["d1-m02", "taxi"],
    ["d1-m03", "time_trial"],
    ["d1-m04", "parking"],
  ];
  for (const [id, type] of cases) {
    it(`${id} (${type}) earns at least one star`, async () => {
      const { rig, mission } = await rigFor(id);
      const { result } = driveMission(rig, mission);
      report.push({ ...result, type, ticks: rig.ticks, carHash: rig.car.hash() });
      expect(result.id).toBe(id);
      expect(result.success).toBe(true);
      expect(result.stars).toBeGreaterThanOrEqual(1);
      expect(result.coins).toBe(mission.reward_coins[String(result.stars) as "1" | "2" | "3"]);
      expect(result.damage).toBe(0);
    });

    it(`${id} (${type}) is deterministic`, async () => {
      const runOnce = async () => {
        const { rig, mission } = await rigFor(id);
        const out = driveMission(rig, mission);
        return { out, hash: rig.car.hash() };
      };
      const a = await runOnce();
      const b = await runOnce();
      expect(b.out).toEqual(a.out);
      expect(b.hash).toBe(a.hash);
    });
  }

  it("taxi comfort stays high for the gentle autopilot", async () => {
    const { rig, mission } = await rigFor("d1-m02");
    const { result } = driveMission(rig, mission);
    expect(result.comfort).toBeGreaterThan(80);
  });

  it("a slower driver earns fewer stars on the delivery", async () => {
    const fast = driveMission(...(await rigFor("d1-m01").then((r) => [r.rig, r.mission] as const)));
    const slow = driveMission(
      ...(await rigFor("d1-m01").then((r) => [r.rig, r.mission] as const)),
      { cruiseKmh: 12 },
    );
    expect(slow.result.success).toBe(true);
    expect(slow.result.stars).toBeLessThan(fast.result.stars);
    expect(slow.result.time).toBeGreaterThan(fast.result.time);
  });

  it("the parking autopilot ends inside the bay, aligned and still", async () => {
    const { rig, mission } = await rigFor("d1-m04");
    if (mission.type !== "parking") throw new Error("not a parking mission");
    driveMission(rig, mission);
    const geo = bayGeometry(rig.graph, mission.params.bay);
    const s = rig.car.state();
    const frame = toBayFrame(geo, s.position.x, s.position.z);
    expect(Math.abs(frame.u)).toBeLessThan(0.7);
    expect(Math.abs(frame.v)).toBeLessThan(0.45);
    expect(Math.abs(s.speedKmh)).toBeLessThan(1);
  });
});

describe("failure and damage in the real sim", () => {
  it("an idle car runs out of time", async () => {
    const { rig } = await rigFor("d1-m03");
    openAndAccept(rig);
    for (let i = 0; i < 60 * 101 && rig.system.run.phase === "active"; i++) stepRig(rig);
    expect(rig.system.run.phase).toBe("fail");
    expect(rig.system.run.result?.failReason).toBe("time_out");
  });

  it("driving into a building counts as damage and can end a delivery", async () => {
    const { rig } = await rigFor("d1-m01");
    openAndAccept(rig);
    // Straight west from the marker: the T-junction has no west road, so a building stops the car.
    for (let i = 0; i < 60 * 40 && rig.system.run.phase === "active"; i++) {
      stepRig(rig, { throttle: 1, steer: 0, handbrake: false });
    }
    expect(rig.system.hud().damage).toBeGreaterThanOrEqual(1);
  });

  it("scraping the parked cars counts as touches", async () => {
    const { rig, mission } = await rigFor("d1-m04");
    if (mission.type !== "parking") throw new Error("not a parking mission");
    openAndAccept(rig);
    const geo = bayGeometry(rig.graph, mission.params.bay);
    const pilot = new Autopilot();
    for (let i = 0; i < 60 * 30 && rig.system.run.phase === "active"; i++) {
      const state = rig.car.state();
      const frame = toBayFrame(geo, state.position.x, state.position.z);
      if (frame.u > -12) {
        stepRig(rig, { throttle: 0.4, steer: 1, handbrake: false });
      } else {
        stepRig(rig, pilot.drive(state, rig.system.route, rig.system.objective, geo, 3));
      }
    }
    expect(rig.system.hud().damage).toBeGreaterThanOrEqual(1);
  });
});
