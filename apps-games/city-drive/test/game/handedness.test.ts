// @vitest-environment node
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { tileCenter } from "@city-drive/core/city";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { CarPose } from "../../src/game/interpolate";
import { ChaseCamera } from "../../src/render/chaseCamera";
import { createScene } from "../../src/render/scene";
import { snapshotCamera, toScreen } from "../render/projection";
import { createGame, runFrames } from "./helpers";

type Game = Awaited<ReturnType<typeof createGame>>;
let game: Game;
let clockMs = 0;
const FRAME_MS = 1000 / 60;

beforeAll(async () => {
  game = await createGame();
});

afterAll(() => game.dispose());

const facingZ: CarPose = {
  position: { x: 0, y: 0.9, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  speedKmh: 0,
  wheels: [],
};

/** The car's right in the right-handed frame: forward x up. */
const rightOf = (forward: Vector3): Vector3 => Vector3.Cross(forward, Vector3.Up());

describe("screen handedness (task 08a)", () => {
  it("test 2: a point on the car's simulation-right projects to the right half of the screen", () => {
    const chase = new ChaseCamera(game.city.scene, []);
    chase.update(1 / 60, facingZ);
    const forward = new Vector3(0, 0, 1);
    const right = rightOf(forward);
    expect(right.x).toBe(-1);
    const ahead = new Vector3(0, 0.9, 0).addInPlace(forward.scale(10));
    const onRight = toScreen(chase.camera, ahead.add(right.scale(3)));
    const onLeft = toScreen(chase.camera, ahead.subtract(right.scale(3)));
    expect(onRight.ahead && onLeft.ahead).toBe(true);
    expect(onRight.x).toBeGreaterThan(0.1);
    expect(onLeft.x).toBeLessThan(-0.1);
    expect(toScreen(chase.camera, ahead).x).toBeCloseTo(0, 1);
  });

  it("test 2: the point the chase camera looks at lands in the middle of the screen", () => {
    const chase = new ChaseCamera(game.city.scene, []);
    chase.update(1 / 60, facingZ);
    const target = toScreen(chase.camera, new Vector3(0, 0.9 + 1.2, 6));
    expect(target.ahead).toBe(true);
    expect(Math.abs(target.x)).toBeLessThan(0.01);
    expect(Math.abs(target.y)).toBeLessThan(0.01);
  });

  it("seen from above with north (-Z) up, east (+X) is on the right, as on the map", () => {
    const top = new FreeCamera("top", new Vector3(0, 80, 20), createScene(game.engine));
    top.setTarget(new Vector3(0, 0, 0));
    const east = toScreen(top, new Vector3(10, 0, 0));
    const north = toScreen(top, new Vector3(0, 0, -10));
    const south = toScreen(top, new Vector3(0, 0, 10));
    expect(east.x).toBeGreaterThan(0);
    expect(north.y).toBeGreaterThan(south.y);
    top.getScene().dispose();
  });

  it("the spawn car in its right-hand lane shows the road centre on the screen's left", () => {
    const { session, loop, input, chase, city } = game;
    input.set({});
    session.respawn("manual");
    clockMs = runFrames(loop, 90, FRAME_MS, clockMs);
    const spawn = session.map.spawn;
    const centre = tileCenter(session.map, spawn.x, spawn.y);
    const car = session.state.position;
    const camera = snapshotCamera(chase.camera);
    const lane = camera.project(new Vector3(car.x, 0, car.z));
    const middle = camera.project(new Vector3(centre.x, 0, centre.z));
    expect(city.scene.useRightHandedSystem).toBe(true);
    expect(lane.ahead && middle.ahead).toBe(true);
    expect(middle.x).toBeLessThan(lane.x);
  });

  it.each([
    { name: "right", steer: 1, sign: 1 },
    { name: "left", steer: -1, sign: -1 },
  ])("test 3: steering $name yaws the car and its screen heading toward its $name", ({
    steer,
    sign,
  }) => {
    const { session, loop, input, car, chase } = game;
    session.respawn("manual");
    input.set({ throttle: 1 });
    clockMs = runFrames(loop, 60, FRAME_MS, clockMs);
    car.root.computeWorldMatrix(true);
    const origin = car.root.position.clone();
    const forward0 = car.root.getDirection(new Vector3(0, 0, 1));
    const camera0 = snapshotCamera(chase.camera);

    input.set({ throttle: 1, steer });
    clockMs = runFrames(loop, 45, FRAME_MS, clockMs);
    car.root.computeWorldMatrix(true);
    const forward1 = car.root.getDirection(new Vector3(0, 0, 1));

    // Right-handed Y-up: a turn to the right is a clockwise (negative) yaw seen from above.
    const yaw = Vector3.Cross(forward0, forward1).y;
    expect(yaw * sign).toBeLessThan(-0.1);
    expect(Vector3.Dot(forward1, rightOf(forward0)) * sign).toBeGreaterThan(0.1);

    const before = camera0.project(origin.add(forward0.scale(10)));
    const after = camera0.project(origin.add(forward1.scale(10)));
    expect(before.ahead && after.ahead).toBe(true);
    expect((after.x - before.x) * sign).toBeGreaterThan(0.05);

    // The steered front wheels turn the same way. The axle is the wheel axis that wheel spin leaves
    // alone: it swings toward the car's forward direction when the wheel points to the car's right.
    const wheel = car.wheels.find((w) => w.name.includes("front"));
    expect(wheel).toBeDefined();
    wheel?.computeWorldMatrix(true);
    const axle = wheel?.getDirection(new Vector3(1, 0, 0)) ?? Vector3.Zero();
    expect(Vector3.Dot(axle, forward1) * sign).toBeGreaterThan(0.02);
    input.set({});
  });
});
