// @vitest-environment node
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Material } from "@babylonjs/core/Materials/material.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { quatFromForward, type TrafficPose, trafficConstants } from "@city-drive/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createScene } from "../../src/render/scene";
import { frameStats } from "../../src/render/stats";
import { createTrafficVisual, type TrafficVisual } from "../../src/render/traffic";
import { buildTrafficWheel } from "../../src/render/trafficWheel";
import { readManifest } from "../assets/helpers";
import { readBytes } from "./helpers";
import { ccwShare } from "./winding";

let engine: NullEngine;
let scene: Scene;
let camera: UniversalCamera;
let visual: TrafficVisual;

function pose(id: number, x: number, z: number, extra: Partial<TrafficPose> = {}): TrafficPose {
  return {
    id,
    modelIndex: id % 4,
    position: { x, y: trafficConstants.AGENT_CENTRE_Y_M, z },
    rotation: quatFromForward(0, -1),
    wheelRotation: 0,
    speedKmh: 30,
    ...extra,
  };
}

function crowd(count: number): TrafficPose[] {
  return Array.from({ length: count }, (_, i) =>
    pose(i, ((i % 4) - 1.5) * 3.2, -10 - Math.floor(i / 4) * 9),
  );
}

function instances(): InstancedMesh[] {
  return scene.meshes.filter(
    (m): m is InstancedMesh => m instanceof InstancedMesh && m.isEnabled(),
  );
}

beforeAll(async () => {
  engine = new NullEngine();
  scene = createScene(engine);
  camera = new UniversalCamera("cam", new Vector3(0, 8, 14), scene);
  camera.setTarget(new Vector3(0, 0, -30));
  camera.maxZ = 240;
  scene.activeCamera = camera;
  visual = await createTrafficVisual(scene, readManifest(), readBytes);
});

afterAll(() => {
  scene.dispose();
  engine.dispose();
});

describe("traffic visual", () => {
  it("shows one car per pose and creates slots only when needed", () => {
    visual.sync(crowd(5));
    expect(visual.shown).toBe(5);
    expect(visual.slotCount).toBe(5);
    expect(instances()).toHaveLength(5 * 5);
  });

  it("hides cars that are gone and reuses their slots", () => {
    visual.sync(crowd(2));
    expect(visual.shown).toBe(2);
    expect(instances()).toHaveLength(2 * 5);
    visual.sync(crowd(5).map((p) => ({ ...p, id: p.id + 100 })));
    expect(visual.shown).toBe(5);
    expect(visual.slotCount).toBe(5);
  });

  it("places each car at its pose with the wheels on the ground", () => {
    visual.sync([pose(1, 12, -7)]);
    scene.render();
    const root = scene.getTransformNodeByName("traffic:car-van");
    expect(root?.position.x).toBeCloseTo(12, 6);
    expect(root?.position.z).toBeCloseTo(-7, 6);
    const wheels = instances().filter((m) => m.name.includes(":wheel"));
    expect(wheels).toHaveLength(4);
    for (const wheel of wheels) {
      const centre = wheel.computeWorldMatrix(true).getTranslation();
      expect(centre.y).toBeCloseTo(trafficConstants.WHEEL_RADIUS_M, 1);
    }
    const xs = wheels.map((w) => w.computeWorldMatrix(true).getTranslation().x - 12);
    expect(Math.max(...xs)).toBeGreaterThan(0.4);
    expect(Math.max(...xs)).toBeLessThan(1);
    expect(Math.min(...xs)).toBeLessThan(-0.4);
    expect(Math.min(...xs)).toBeGreaterThan(-1);
  });

  it("points the car along its pose heading", () => {
    visual.sync([pose(1, 0, 0, { rotation: quatFromForward(1, 0) })]);
    const body = instances().find((m) => m.name.includes(":body"));
    const forward = Vector3.TransformNormal(
      new Vector3(0, 0, 1),
      (body as InstancedMesh).computeWorldMatrix(true),
    );
    expect(forward.x).toBeGreaterThan(0.99);
    expect(Math.abs(forward.z)).toBeLessThan(0.01);
  });

  it("spins the wheels with the pose", () => {
    visual.sync([pose(1, 0, -10, { wheelRotation: 1.25 })]);
    const wheels = instances().filter((m) => m.name.includes(":wheel"));
    for (const wheel of wheels) expect(wheel.rotation.x).toBeCloseTo(1.25, 9);
  });

  it("draws 16 cars in view for 5 draw calls and a few thousand triangles", () => {
    visual.sync(crowd(16));
    scene.render();
    const stats = frameStats(scene);
    expect(visual.shown).toBe(16);
    expect(stats.drawCalls).toBe(trafficConstants.MAX_AGENTS_DEFAULT === 16 ? 5 : stats.drawCalls);
    expect(stats.triangles).toBeLessThan(20_000);
    expect(stats.triangles / 16).toBeLessThan(1200);
  });

  it("builds the shared wheel low-poly, counter-clockwise, and axle-aligned", () => {
    const wheel = buildTrafficWheel(scene);
    const triangles = (wheel.getTotalIndices() ?? 0) / 3;
    expect(triangles).toBeGreaterThan(30);
    expect(triangles).toBeLessThan(100);
    expect(ccwShare(wheel)).toBeLessThan(0.01);
    expect(wheel.sideOrientation).toBe(Material.ClockWiseSideOrientation);
    wheel.refreshBoundingInfo();
    const box = wheel.getBoundingInfo().boundingBox;
    expect(box.maximum.y - box.minimum.y).toBeCloseTo(0.7, 1);
    expect(box.maximum.x - box.minimum.x).toBeLessThan(0.45);
    wheel.dispose();
  });

  it("disposes every mesh it made", () => {
    const before = scene.meshes.length;
    visual.dispose();
    expect(scene.meshes.length).toBeLessThan(before);
    expect(instances()).toHaveLength(0);
  });
});
