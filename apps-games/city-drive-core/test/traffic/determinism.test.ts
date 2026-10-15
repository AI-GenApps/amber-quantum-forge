import { describe, expect, it } from "vitest";
import { type CarInput, hashNumbers, type TrafficAgent } from "../../src/index";
import { createCarRig } from "./rig";

const SECONDS = 90;

/** A fixed player script: drive off, weave, brake, repeat. */
function scriptedInput(tick: number): CarInput {
  const phase = Math.floor(tick / 120) % 4;
  return {
    throttle: phase === 3 ? -0.5 : 0.8,
    steer: phase === 1 ? 0.4 : phase === 2 ? -0.3 : 0,
    handbrake: false,
  };
}

function trafficHash(agents: readonly TrafficAgent[]): string {
  return hashNumbers(
    agents.flatMap((a) => [a.id, a.x, a.z, a.speed, a.s, a.headX, a.headZ, a.stunTicks]),
  );
}

async function replay(seed: number): Promise<string[]> {
  const rig = await createCarRig({ seed });
  const hashes: string[] = [];
  for (let tick = 0; tick < SECONDS * 60; tick++) {
    rig.car.applyInput(scriptedInput(tick));
    rig.physics.step();
    rig.traffic.processCollisions(rig.physics.drainCollisionImpulses());
    if (tick % 60 === 59) hashes.push(`${rig.car.hash()}:${trafficHash(rig.traffic.list)}`);
  }
  rig.physics.dispose();
  return hashes;
}

describe("traffic determinism", () => {
  it("the same seed and the same player inputs give identical traffic and car every second", async () => {
    const a = await replay(7);
    const b = await replay(7);
    expect(a).toHaveLength(SECONDS);
    expect(b).toEqual(a);
    expect(new Set(a.map((h) => h.split(":")[1])).size).toBeGreaterThan(SECONDS - 5);
  }, 60_000);

  it("a different seed gives different traffic", async () => {
    const a = await replay(7);
    const c = await replay(8);
    const trafficOnly = (hs: string[]) => hs.map((h) => h.split(":")[1]);
    expect(trafficOnly(c)).not.toEqual(trafficOnly(a));
  }, 60_000);
});
