// @vitest-environment node
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { StaticBox } from "@city-drive/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CarPose } from "../../src/game/interpolate";
import { CHASE, chaseDistance, chaseFov, chaseHeight } from "../../src/render/cameraMath";
import { ChaseCamera } from "../../src/render/chaseCamera";
import { createScene } from "../../src/render/scene";

let engine: NullEngine;
let scene: Scene;

beforeEach(() => {
  engine = new NullEngine();
  scene = createScene(engine);
});

afterEach(() => {
  scene.dispose();
  engine.dispose();
});

/** Car at (x, z) facing +Z unless `yaw` says otherwise. */
function carAt(x: number, z: number, speedKmh = 0, yaw = 0): CarPose {
  return {
    position: { x, y: 0.9, z },
    rotation: { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) },
    speedKmh,
    wheels: [],
  };
}

const wall = (x: number, z: number, hx = 20, hz = 1): StaticBox => ({
  kind: "building",
  center: { x, y: 8, z },
  half: { x: hx, y: 8, z: hz },
});

function settle(cam: ChaseCamera, pose: CarPose, seconds = 3): void {
  for (let i = 0; i < seconds * 60; i++) cam.update(1 / 60, pose);
}

describe("ChaseCamera", () => {
  it("places itself behind and above the car on the first frame", () => {
    const cam = new ChaseCamera(scene, []);
    cam.update(1 / 60, carAt(0, 0));
    expect(cam.camera.position.z).toBeCloseTo(-CHASE.distance, 3);
    expect(cam.camera.position.y).toBeCloseTo(0.9 + CHASE.height, 3);
    expect(cam.camera.fov).toBeCloseTo(CHASE.fovBase, 6);
  });

  it("looks ahead of the car, not at its own feet", () => {
    const cam = new ChaseCamera(scene, []);
    cam.update(1 / 60, carAt(0, 0));
    cam.camera.getViewMatrix(true);
    const forward = cam.camera.getDirection(Vector3.Forward(scene.useRightHandedSystem));
    expect(forward.z).toBeGreaterThan(0.5);
    expect(forward.y).toBeLessThan(0);
  });

  it("widens the lens and pulls back at speed", () => {
    const cam = new ChaseCamera(scene, []);
    const fast = carAt(0, 0, 110);
    cam.update(1 / 60, fast);
    settle(cam, fast, 5);
    expect(cam.camera.fov).toBeCloseTo(chaseFov(110), 3);
    expect(cam.camera.position.z).toBeCloseTo(-chaseDistance(110), 2);
    expect(cam.camera.position.y).toBeCloseTo(0.9 + chaseHeight(110), 2);
  });

  it("swings round behind the car after it turns, without snapping", () => {
    const cam = new ChaseCamera(scene, []);
    cam.update(1 / 60, carAt(0, 0));
    const turned = carAt(0, 0, 0, Math.PI / 2); // now facing +X
    cam.update(1 / 60, turned);
    // One frame after a 90 degree turn the camera has barely moved.
    expect(cam.camera.position.x).toBeGreaterThan(-3);
    settle(cam, turned, 4);
    expect(cam.camera.position.x).toBeCloseTo(-CHASE.distance, 1);
    expect(Math.abs(cam.camera.position.z)).toBeLessThan(0.5);
  });

  it("moves in small steps while the car drives at constant speed (no jitter)", () => {
    const cam = new ChaseCamera(scene, []);
    const speedMs = 15;
    let z = 0;
    const deltas: number[] = [];
    let last = Number.NaN;
    for (let i = 0; i < 240; i++) {
      z += speedMs / 60;
      cam.update(1 / 60, carAt(0, z, speedMs * 3.6));
      if (i > 120) deltas.push(cam.camera.position.z - last);
      last = cam.camera.position.z;
    }
    const mean = deltas.slice(1).reduce((a, b) => a + b, 0) / (deltas.length - 1);
    for (const d of deltas.slice(1)) expect(Math.abs(d - mean)).toBeLessThan(0.02);
  });

  it("pulls in when a building stands between the car and the camera", () => {
    const cam = new ChaseCamera(scene, [wall(0, -6)]); // 6 m behind the car
    const pose = carAt(0, 0);
    cam.update(1 / 60, pose);
    const d = Vector3.Distance(cam.camera.position, new Vector3(0, 0.9 + CHASE.lookHeight, 0));
    expect(d).toBeLessThan(chaseDistance(0));
    expect(cam.camera.position.z).toBeGreaterThan(-5.5); // in front of the wall's near face
  });

  it("is not pulled in by a building beside or behind the camera", () => {
    const cam = new ChaseCamera(scene, [wall(30, -6, 2, 2), wall(0, -40)]);
    cam.update(1 / 60, carAt(0, 0));
    expect(cam.camera.position.z).toBeCloseTo(-CHASE.distance, 3);
  });

  it("returns to the full distance once the building is gone", () => {
    const boxes = [wall(0, -6)];
    const cam = new ChaseCamera(scene, boxes);
    settle(cam, carAt(0, 0), 1);
    expect(cam.camera.position.z).toBeGreaterThan(-6);
    boxes.length = 0;
    settle(cam, carAt(0, 0), 3);
    expect(cam.camera.position.z).toBeCloseTo(-CHASE.distance, 2);
  });

  it("snap() puts the camera at the ideal spot on the next update", () => {
    const cam = new ChaseCamera(scene, []);
    cam.update(1 / 60, carAt(0, 0));
    cam.snap();
    cam.update(1 / 60, carAt(100, 100));
    expect(cam.camera.position.x).toBeCloseTo(100, 3);
    expect(cam.camera.position.z).toBeCloseTo(100 - CHASE.distance, 3);
  });

  it("drives the camera with no user inputs attached", () => {
    const cam = new ChaseCamera(scene, []);
    expect(cam.camera.inputs.attached).toEqual({});
  });
});
