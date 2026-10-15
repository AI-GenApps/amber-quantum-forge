// @vitest-environment node
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { FIXED_DT } from "@city-drive/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RENDER_BUDGETS } from "../../src/render/constants";
import { frameStats } from "../../src/render/stats";
import { createGame, runFrames } from "./helpers";

type Game = Awaited<ReturnType<typeof createGame>>;
let game: Game;

beforeAll(async () => {
  game = await createGame();
});

afterAll(() => game.dispose());

const FRAME_MS = 1000 / 60;
let clockMs = 0;

describe("loop + core + NullEngine scene", () => {
  it("moves the car mesh by the simulated distance after 5 s of scripted throttle", () => {
    const { loop, session, car, input } = game;
    let now = runFrames(loop, 90, FRAME_MS, clockMs); // settle on the suspension
    const start = { ...session.state.position };
    const meshStart = car.root.position.clone();
    expect(meshStart.x).toBeCloseTo(start.x, 1);

    input.set({ throttle: 1 });
    // Odd frame length so the final alpha is neither 0 nor 1.
    now = runFrames(loop, 5 * 60, 1000 / 60, now);
    now = runFrames(loop, 1, 9, now);
    clockMs = now;

    const meshMoved = Vector3.Distance(
      new Vector3(car.root.position.x, 0, car.root.position.z),
      new Vector3(meshStart.x, 0, meshStart.z),
    );
    // The mesh shows the blend of the last two states, so compare with the same blend.
    const alpha = loop.alpha;
    const blended = session.pose(alpha).position;
    const simulated = Math.hypot(blended.x - start.x, blended.z - start.z);
    expect(simulated).toBeGreaterThan(20);
    expect(Math.abs(meshMoved - simulated)).toBeLessThan(0.1);

    // And it never lags the raw simulation by more than one step of travel.
    const raw = session.state.position;
    const rawMoved = Math.hypot(raw.x - start.x, raw.z - start.z);
    const speedMs = Math.abs(session.state.speedKmh) / 3.6;
    expect(Math.abs(meshMoved - rawMoved)).toBeLessThanOrEqual(speedMs * FIXED_DT + 0.1);
  });

  it("keeps the mesh pose equal to the interpolated physics pose, orientation included", () => {
    const { session, car } = game;
    const alpha = game.loop.alpha;
    const pose = session.pose(alpha);
    expect(car.root.position.x).toBeCloseTo(pose.position.x, 4);
    expect(car.root.position.z).toBeCloseTo(pose.position.z, 4);
    const q = car.root.rotationQuaternion;
    expect(q?.w).toBeCloseTo(pose.rotation.w, 4);
    expect(q?.y).toBeCloseTo(pose.rotation.y, 4);
  });

  it.each([
    { name: "right", steer: 1, sign: 1 },
    { name: "left", steer: -1, sign: -1 },
  ])("steering $name sends the car toward the screen's $name", ({ steer, sign }) => {
    const { loop, session, input, car } = game;
    session.respawn("manual");
    input.set({ throttle: 1 });
    clockMs = runFrames(loop, 60, FRAME_MS, clockMs);
    const before = session.state;
    // The mesh's own right-hand side (+X in Babylon's left-handed frame) before the turn starts.
    car.root.computeWorldMatrix(true);
    const right = car.root.getDirection(Vector3.Right());
    input.set({ throttle: 1, steer });
    clockMs = runFrames(loop, 45, FRAME_MS, clockMs);
    const after = session.state.position;
    const dx = after.x - before.position.x;
    const dz = after.z - before.position.z;
    // Sideways drift relative to the heading the car had when the turn began.
    const sideways = dx * right.x + dz * right.z;
    expect(sideways * sign).toBeGreaterThan(1);
    input.set({});
  });

  it("chase camera ends up behind and above the car, looking at it", () => {
    const { session, chase } = game;
    const car = session.state;
    const cam = chase.camera.position;
    const dist = Math.hypot(cam.x - car.position.x, cam.z - car.position.z);
    expect(cam.y).toBeGreaterThan(car.position.y + 2);
    expect(dist).toBeGreaterThan(3);
    expect(dist).toBeLessThan(25);
  });

  it("stays inside the render budget with the car added", () => {
    game.city.scene.render();
    const stats = frameStats(game.city.scene);
    expect(stats.drawCalls).toBeLessThanOrEqual(RENDER_BUDGETS.maxDrawCalls);
    expect(stats.triangles).toBeLessThanOrEqual(RENDER_BUDGETS.maxTriangles);
  });
});
