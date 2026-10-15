// @vitest-environment node
import { BASELINE_CAR, FIXED_DT, rotateVec, tileCenter, uprightness } from "@city-drive/core";
import { afterEach, describe, expect, it } from "vitest";
import type { GameSession } from "../../src/game/session";
import { createSession, ScriptedInput } from "./helpers";

let active: GameSession | undefined;

async function make(): Promise<{ session: GameSession; input: ScriptedInput }> {
  const input = new ScriptedInput();
  const session = await createSession(input);
  active = session;
  return { session, input };
}

function run(session: GameSession, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / FIXED_DT); i++) session.step();
}

/** Tip the car onto its side/roof by respawning it with a rolled pose, through the core API. */
function flip(session: GameSession, rollRadians: number): void {
  const p = session.state.position;
  const half = rollRadians / 2;
  session.car.respawn({
    position: { x: p.x, y: 1.5, z: p.z },
    rotation: { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) },
  });
}

afterEach(() => {
  active?.dispose();
  active = undefined;
});

describe("GameSession respawn", () => {
  it("drives forward from the spawn point on throttle", async () => {
    const { session, input } = await make();
    run(session, 1);
    const start = { ...session.state.position };
    input.set({ throttle: 1 });
    run(session, 3);
    expect(session.state.speedKmh).toBeGreaterThan(20);
    const moved = Math.hypot(
      session.state.position.x - start.x,
      session.state.position.z - start.z,
    );
    expect(moved).toBeGreaterThan(10);
    expect(session.respawns).toHaveLength(0);
  });

  it("auto-respawns a car that stays upside down for 2 s, upright on a lane", async () => {
    const { session } = await make();
    run(session, 1);
    flip(session, Math.PI);
    run(session, 1.5);
    expect(session.respawns).toHaveLength(0);
    run(session, 1);
    expect(session.respawns).toHaveLength(1);
    expect(session.respawns[0]?.cause).toBe("flipped");
    expect(uprightness(session.state.rotation)).toBeGreaterThan(0.99);
    expect(session.state.speedKmh).toBeCloseTo(0, 0);
  });

  it("does not respawn a car that rights itself within 2 s", async () => {
    const { session } = await make();
    run(session, 1);
    flip(session, (80 * Math.PI) / 180);
    run(session, 1);
    session.car.respawn({
      position: { x: session.state.position.x, y: 1.2, z: session.state.position.z },
    });
    run(session, 3);
    expect(session.respawns).toHaveLength(0);
  });

  it("auto-respawns a car stuck against a wall on full throttle after 4 s", async () => {
    const { session, input } = await make();
    // Drive into the boundary wall: spawn heading is along a road that reaches the map edge.
    input.set({ throttle: 1 });
    for (let i = 0; i < 60 * 40 && session.respawns.length === 0; i++) session.step();
    expect(session.respawns.length).toBeGreaterThan(0);
    expect(session.respawns[0]?.cause).toBe("stuck");
  });

  it("respawns to the nearest lane point facing the lane direction", async () => {
    const { session } = await make();
    run(session, 1);
    const tile = tileCenter(session.map, 3, 5);
    session.car.respawn({ position: { x: tile.x + 4, y: 1.2, z: tile.z + 7 } });
    session.step();
    session.respawn("manual");
    const s = session.state;
    // Lane of tile (3,5) heading east sits laneOffset south of the tile centre.
    expect(s.position.z).toBeCloseTo(tile.z + session.map.tile_size_m * 0.15, 3);
    const forward = rotateVec(s.rotation, { x: 0, y: 0, z: 1 });
    expect(forward.x).toBeCloseTo(1, 3);
    expect(forward.z).toBeCloseTo(0, 3);
    expect(s.position.y).toBeCloseTo(1.1, 2);
  });

  it("manual reset (R) respawns once, mid-drive, without waiting", async () => {
    const { session, input } = await make();
    input.set({ throttle: 1 });
    run(session, 2);
    input.pressReset();
    session.step();
    expect(session.respawns).toHaveLength(1);
    expect(session.respawns[0]?.cause).toBe("manual");
    expect(session.state.speedKmh).toBeCloseTo(0, 0);
    run(session, 0.5);
    expect(session.respawns).toHaveLength(1);
  });

  it("does not interpolate across a respawn", async () => {
    const { session } = await make();
    run(session, 2);
    session.respawn("manual");
    const a = session.pose(0).position;
    const b = session.pose(1).position;
    expect(a).toEqual(b);
  });

  it("uses the baseline spec", async () => {
    const { session } = await make();
    expect(session.car.spec).toBe(BASELINE_CAR);
  });
});
