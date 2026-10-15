import { describe, expect, it } from "vitest";
import {
  type CarInput,
  trafficConstants as k,
  type LaneEdge,
  quatFromForward,
  type TrafficAgent,
} from "../../src/index";
import { type CarRig, createCarRig } from "./rig";

const FULL: CarInput = { throttle: 1, steer: 0, handbrake: false };
const COAST: CarInput = { throttle: 0, steer: 0, handbrake: false };

/** Park the car 24 m ahead of `agent` on its lane, facing it, and let it settle. */
function faceAgentHeadOn(rig: CarRig, agent: TrafficAgent): void {
  const x = agent.x + agent.headX * 24;
  const z = agent.z + agent.headZ * 24;
  rig.car.respawn({
    position: { x, y: 1.1, z },
    rotation: quatFromForward(-agent.headX, -agent.headZ),
  });
}

async function setup(): Promise<{ rig: CarRig; agent: TrafficAgent }> {
  const rig = await createCarRig({ maxAgents: 1 });
  rig.car.respawn({ position: { x: -110, y: 1.1, z: 110 } });
  for (let i = 0; i < 5; i++) rig.physics.step();
  const agent = rig.traffic.list[0] as TrafficAgent;
  expect(agent, "an agent spawned").toBeDefined();
  return { rig, agent };
}

function straightAhead(agent: TrafficAgent, metres: number): boolean {
  const edge = agent.path[0] as LaneEdge;
  return edge.kind === "straight" && edge.length - agent.s > metres;
}

describe("player hits an agent", () => {
  it("reports a contact event, stops the agent for 3 s, then lets it resume", async () => {
    const { rig, agent } = await setup();
    for (let i = 0; i < 600 && !straightAhead(agent, 12); i++) rig.physics.step();
    faceAgentHeadOn(rig, agent);
    rig.car.applyInput(FULL);
    const events = [];
    let hitTick = -1;
    for (let i = 0; i < 60 * 8 && events.length === 0; i++) {
      rig.physics.step();
      events.push(...rig.traffic.processCollisions(rig.physics.drainCollisionImpulses()));
      hitTick = i;
    }
    expect(events, "a collision event within 8 s").toHaveLength(1);
    expect(events[0]?.agentId).toBe(agent.id);
    expect(events[0]?.force).toBeGreaterThan(0);
    expect(rig.traffic.stats.collisions).toBe(1);
    expect(hitTick).toBeGreaterThan(30);

    expect(agent.stunTicks).toBe(k.STUN_TICKS);
    const frozenAt = { x: agent.x, z: agent.z };
    rig.car.applyInput(COAST);
    for (let i = 0; i < k.STUN_TICKS - 2; i++) {
      rig.physics.step();
      rig.traffic.processCollisions(rig.physics.drainCollisionImpulses());
      expect(agent.speed).toBe(0);
      expect(agent.blocker).toBe("stun");
    }
    expect(agent.x).toBe(frozenAt.x);
    expect(agent.z).toBe(frozenAt.z);
    expect(rig.traffic.drainCollisions()).toHaveLength(1);

    rig.car.respawn({ position: { x: -110, y: 1.1, z: 110 } });
    const before = agent.travelled;
    for (let i = 0; i < 60 * 6; i++) {
      rig.physics.step();
      rig.traffic.processCollisions(rig.physics.drainCollisionImpulses());
    }
    expect(agent.stunTicks).toBe(0);
    expect(agent.travelled - before).toBeGreaterThan(10);
  });

  it("ignores contacts between an agent and anything but the player", async () => {
    const { rig, agent } = await setup();
    const none = rig.traffic.processCollisions([
      {
        tick: 1,
        colliderA: agent.body.colliderHandle,
        colliderB: 99_999,
        force: 5e5,
        impulse: 8e3,
      },
    ]);
    expect(none).toEqual([]);
    expect(agent.stunTicks).toBe(0);
  });

  it("brakes for the player in its lane before touching it", async () => {
    const { rig, agent } = await setup();
    for (let i = 0; i < 600 && !straightAhead(agent, 12); i++) rig.physics.step();
    faceAgentHeadOn(rig, agent);
    rig.car.applyInput(COAST);
    let minGap = Number.POSITIVE_INFINITY;
    for (let i = 0; i < 60 * 6; i++) {
      rig.physics.step();
      rig.traffic.processCollisions(rig.physics.drainCollisionImpulses());
      const car = rig.car.state().position;
      minGap = Math.min(minGap, Math.hypot(agent.x - car.x, agent.z - car.z) - 4.2);
    }
    expect(rig.traffic.stats.collisions).toBe(0);
    expect(minGap).toBeGreaterThan(0.5);
    expect(agent.speed).toBeLessThan(0.1);
    expect(agent.blocker).toBe("player");
  });
});
