// @vitest-environment node
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Scene } from "@babylonjs/core/scene.js";
import { BASELINE_CAR } from "@city-drive/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { CarPose } from "../../src/game/interpolate";
import { type CarVisual, createCarVisual } from "../../src/render/carVisual";
import { readManifest } from "../assets/helpers";
import { readBytes } from "./helpers";

let engine: NullEngine;
let scene: Scene;
let visual: CarVisual;

const SETTLED = 0.268;

function pose(
  overrides: Partial<CarPose> = {},
  wheelOverrides: Partial<CarPose["wheels"][number]> = {},
): CarPose {
  return {
    position: { x: 10, y: 0.867, z: -4 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    speedKmh: 0,
    wheels: BASELINE_CAR.wheels.map(() => ({
      steering: 0,
      rotation: 0,
      suspensionLength: SETTLED,
      ...wheelOverrides,
    })),
    ...overrides,
  };
}

function worldOf(node: {
  computeWorldMatrix(force: boolean): { getTranslation(): Vector3 };
}): Vector3 {
  return node.computeWorldMatrix(true).getTranslation().clone();
}

beforeAll(async () => {
  engine = new NullEngine();
  scene = new Scene(engine);
  visual = await createCarVisual(scene, readManifest(), readBytes, BASELINE_CAR);
});

afterAll(() => {
  scene.dispose();
  engine.dispose();
});

describe("car visual", () => {
  it("is a body, four wheels and a shadow under one root", () => {
    expect(visual.wheels).toHaveLength(4);
    expect(visual.body.parent?.parent).toBe(visual.root);
    expect(visual.scale).toBeGreaterThan(0.5);
    expect(visual.scale).toBeLessThan(2);
  });

  it("follows the physics pose", () => {
    visual.sync(pose());
    expect(visual.root.position.x).toBeCloseTo(10, 6);
    expect(visual.root.position.z).toBeCloseTo(-4, 6);
  });

  it("sits with its wheels on the ground at the settled ride height", () => {
    visual.sync(pose());
    for (const wheel of visual.wheels) {
      const centre = worldOf(wheel);
      expect(centre.y).toBeCloseTo(BASELINE_CAR.wheelRadius, 1);
    }
    const bodyBottom = worldOf(visual.body).y;
    expect(Math.abs(bodyBottom)).toBeLessThan(0.1);
  });

  it("puts the front wheels ahead (+Z) and the right-hand wheels on +X", () => {
    visual.sync(pose());
    const [fr, fl, rr, rl] = visual.wheels.map(worldOf) as [Vector3, Vector3, Vector3, Vector3];
    expect(fr.z).toBeGreaterThan(rr.z);
    expect(fl.z).toBeGreaterThan(rl.z);
    expect(fr.x).toBeGreaterThan(fl.x);
    expect(rr.x).toBeGreaterThan(rl.x);
  });

  it("compresses a wheel upward when its suspension shortens", () => {
    visual.sync(pose());
    const rest = worldOf(visual.wheels[0] as never).y;
    visual.sync(pose({}, { suspensionLength: 0.1 }));
    const compressed = worldOf(visual.wheels[0] as never).y;
    expect(compressed).toBeGreaterThan(rest + 0.1);
  });

  it("applies the reported steering angle to the wheel meshes", () => {
    const steering = BASELINE_CAR.wheels.map((w) => (w.steered ? 0.4 : 0));
    visual.sync(
      pose({
        wheels: steering.map((angle) => ({
          steering: angle,
          rotation: 0,
          suspensionLength: SETTLED,
        })),
      }),
    );
    steering.forEach((angle, i) => {
      expect(visual.wheels[i]?.rotation.y).toBeCloseTo(angle, 9);
    });
    expect(steering.filter((a) => a !== 0)).toHaveLength(2);
  });

  it("spins the wheels so the top moves forward when the car rolls forward", () => {
    const wheel = visual.wheels[0];
    if (!wheel) throw new Error("no wheel");
    const top = new Vector3(0, 0.3, 0);
    visual.sync(pose({}, { rotation: 1 }));
    const a = Vector3.TransformCoordinates(top, wheel.computeWorldMatrix(true));
    visual.sync(pose({}, { rotation: 1.1 }));
    const b = Vector3.TransformCoordinates(top, wheel.computeWorldMatrix(true));
    expect(b.z - a.z).toBeGreaterThan(0.01);
  });

  it("lays the blob shadow flat under the car, turned to its heading", () => {
    const yaw = Math.PI / 2; // facing +X
    visual.sync(pose({ rotation: { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) } }));
    expect(visual.shadow.position.x).toBeCloseTo(10, 6);
    expect(visual.shadow.position.z).toBeCloseTo(-4, 6);
    expect(visual.shadow.position.y).toBeLessThan(0.1);
    expect(visual.shadow.rotation.y).toBeCloseTo(yaw, 6);
    expect(visual.shadow.material?.alpha).toBeLessThan(1);
  });

  it("adds at most 6 draw calls (body, 4 wheels, shadow)", () => {
    const meshes = [visual.body, ...visual.wheels, visual.shadow];
    const calls = meshes.reduce((n, m) => n + (m.subMeshes?.length ?? 0), 0);
    expect(calls).toBeLessThanOrEqual(6);
  });
});
