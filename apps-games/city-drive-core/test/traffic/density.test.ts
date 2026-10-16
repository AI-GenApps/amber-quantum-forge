import { describe, expect, it } from "vitest";
import { createRig, runTicks } from "./rig";

describe("TrafficManager.setMaxAgents", () => {
  it("drains surplus agents one per tick down to the new cap, then holds it", async () => {
    const rig = await createRig({ maxAgents: 16 });
    runTicks(rig, 5);
    expect(rig.traffic.list).toHaveLength(16);
    rig.traffic.setMaxAgents(6);
    runTicks(rig, 1);
    expect(rig.traffic.list).toHaveLength(15);
    runTicks(rig, 30);
    expect(rig.traffic.list).toHaveLength(6);
    runTicks(rig, 600);
    expect(rig.traffic.list.length).toBeLessThanOrEqual(6);
    expect(rig.traffic.list.length).toBeGreaterThan(0);
  });

  it("refills one car per interval after the cap is raised again", async () => {
    const rig = await createRig({ maxAgents: 4 });
    runTicks(rig, 5);
    expect(rig.traffic.list).toHaveLength(4);
    rig.traffic.setMaxAgents(10);
    runTicks(rig, 60 * 60);
    expect(rig.traffic.list.length).toBeGreaterThan(4);
    expect(rig.traffic.list.length).toBeLessThanOrEqual(10);
  });

  it("is deterministic: the same cap changes at the same ticks give the same cars", async () => {
    const run = async () => {
      const rig = await createRig({ maxAgents: 12 });
      runTicks(rig, 120);
      rig.traffic.setMaxAgents(5);
      runTicks(rig, 240);
      return rig.traffic.list.map((a) => [a.id, Math.round(a.x * 1000), Math.round(a.z * 1000)]);
    };
    expect(await run()).toEqual(await run());
  });

  it("rejects a cap that is not a non-negative integer", async () => {
    const rig = await createRig();
    expect(() => rig.traffic.setMaxAgents(-1)).toThrow(/maxAgents/);
    expect(() => rig.traffic.setMaxAgents(2.5)).toThrow(/maxAgents/);
  });
});
