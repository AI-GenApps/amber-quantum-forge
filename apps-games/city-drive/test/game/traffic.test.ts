// @vitest-environment node
import { FIXED_DT, quatFromForward } from "@city-drive/core";
import { parseCityManifest } from "@city-drive/core/city";
import { afterEach, describe, expect, it } from "vitest";
import { GameSession } from "../../src/game/session";
import { loadDistrict1 } from "../../src/render/district";
import { readManifest } from "../assets/helpers";
import { ScriptedInput } from "./helpers";

let active: GameSession | undefined;

async function make(traffic?: { seed: number; maxAgents?: number }) {
  const input = new ScriptedInput();
  const manifest = readManifest();
  const session = await GameSession.create(
    loadDistrict1(manifest),
    parseCityManifest(manifest),
    input,
    undefined,
    traffic ? { traffic } : {},
  );
  active = session;
  return { session, input };
}

const run = (session: GameSession, seconds: number) => {
  for (let i = 0; i < Math.round(seconds / FIXED_DT); i++) session.step();
};

afterEach(() => {
  active?.dispose();
  active = undefined;
});

describe("GameSession traffic", () => {
  it("has no traffic unless asked for", async () => {
    const { session } = await make();
    run(session, 1);
    expect(session.traffic).toBeUndefined();
    expect(session.trafficPoses(0.5)).toEqual([]);
  });

  it("runs 16 agents around the parked player and exposes their poses", async () => {
    const { session } = await make({ seed: 3 });
    run(session, 30);
    expect(session.traffic?.list).toHaveLength(16);
    const poses = session.trafficPoses(0.5);
    expect(poses).toHaveLength(16);
    expect(poses.every((p) => p.speedKmh >= 0 && p.speedKmh <= 46)).toBe(true);
    expect(session.trafficHits).toEqual([]);
  });

  it("drains the physics collision queue every step", async () => {
    const { session } = await make({ seed: 3 });
    run(session, 2);
    expect(session.physics.drainCollisionImpulses()).toEqual([]);
  });

  it("records a hit when the player drives into an agent, and the agent stops 3 s", async () => {
    const { session, input } = await make({ seed: 3, maxAgents: 1 });
    run(session, 1);
    const agent = session.traffic?.list[0];
    expect(agent).toBeDefined();
    if (!agent) return;
    for (
      let i = 0;
      i < 600 && !(agent.path[0]?.kind === "straight" && agent.path[0].length - agent.s > 12);
      i++
    ) {
      session.step();
    }
    session.car.respawn({
      position: { x: agent.x + agent.headX * 24, y: 1.1, z: agent.z + agent.headZ * 24 },
      rotation: quatFromForward(-agent.headX, -agent.headZ),
    });
    input.set({ throttle: 1 });
    for (let i = 0; i < 60 * 8 && session.trafficHits.length === 0; i++) session.step();
    input.set({});
    expect(session.trafficHits).toHaveLength(1);
    expect(session.trafficHits[0]?.agentId).toBe(agent.id);
    expect(agent.stunTicks).toBeGreaterThan(0);
  });

  it("repeats the same traffic for the same seed and inputs", async () => {
    const hashes: string[] = [];
    for (let k = 0; k < 2; k++) {
      const { session, input } = await make({ seed: 11 });
      input.set({ throttle: 0.6, steer: 0.15 });
      run(session, 40);
      hashes.push(
        `${session.car.hash()}|${session.traffic?.list.map((a) => `${a.id}:${a.x.toFixed(3)}:${a.z.toFixed(3)}`).join(",")}`,
      );
      session.dispose();
      active = undefined;
    }
    expect(hashes[1]).toBe(hashes[0]);
  });
});
