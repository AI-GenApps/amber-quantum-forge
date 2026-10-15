// @vitest-environment node
import { Material } from "@babylonjs/core/Materials/material.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { BASELINE_CAR } from "@city-drive/core";
import { parseCityManifest, tileCenter } from "@city-drive/core/city";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { CarPose } from "../../src/game/interpolate";
import { type CarVisual, createCarVisual } from "../../src/render/carVisual";
import { placementMatrix } from "../../src/render/chunkBuilder";
import { loadDistrict1 } from "../../src/render/district";
import { planCity } from "../../src/render/placements";
import { createScene } from "../../src/render/scene";
import { readManifest } from "../assets/helpers";
import { buildDistrict1, readBytes } from "./helpers";
import { ccwShare } from "./winding";

type District = Awaited<ReturnType<typeof buildDistrict1>>;
let district: District;
let visual: CarVisual;

beforeAll(async () => {
  district = await buildDistrict1();
  visual = await createCarVisual(district.city.scene, readManifest(), readBytes, BASELINE_CAR);
});

afterAll(() => {
  district.city.dispose();
  district.engine.dispose();
});

const IDENTITY_POSE: CarPose = {
  position: { x: 0, y: 0.867, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  speedKmh: 0,
  wheels: BASELINE_CAR.wheels.map(() => ({ steering: 0, rotation: 0, suspensionLength: 0.268 })),
};

describe("right-handed scene (task 08a)", () => {
  it("every scene is right-handed, from the city to the test scene factory", () => {
    expect(district.city.scene.useRightHandedSystem).toBe(true);
    const scene = createScene(district.engine);
    expect(scene.useRightHandedSystem).toBe(true);
    scene.dispose();
  });

  it("test 1: a mesh placed at simulation (x, y, z) has world position (x, y, z)", async () => {
    const scene = createScene(district.engine);
    const car = await createCarVisual(scene, readManifest(), readBytes, BASELINE_CAR);
    car.sync({ ...IDENTITY_POSE, position: { x: 13.5, y: 0.9, z: -42.25 } });
    const world = car.root.computeWorldMatrix(true).getTranslation();
    expect(world.x).toBeCloseTo(13.5, 5);
    expect(world.y).toBeCloseTo(0.9, 5);
    expect(world.z).toBeCloseTo(-42.25, 5);
    scene.dispose();
  });

  it("test 1: planned placements keep their simulation x and z, with east on +X and south on +Z", () => {
    const manifest = readManifest();
    const map = loadDistrict1(manifest);
    const plan = planCity(map, parseCityManifest(manifest));
    for (const p of plan.placements) {
      const t = placementMatrix(p).getTranslation();
      expect(t.x).toBeCloseTo(p.x, 3);
      expect(t.y).toBe(0);
      expect(t.z).toBeCloseTo(p.z, 3);
    }
    const west = tileCenter(map, 0, 0);
    const east = tileCenter(map, map.width - 1, 0);
    const south = tileCenter(map, 0, map.height - 1);
    expect(east.x).toBeGreaterThan(west.x);
    expect(south.z).toBeGreaterThan(west.z);
  });

  it("puts the car's front and left where the simulation has them (+Z and +X)", () => {
    visual.sync(IDENTITY_POSE);
    const root = visual.root.computeWorldMatrix(true).getTranslation();
    for (const wheel of visual.wheels) {
      const at = wheel.computeWorldMatrix(true).getTranslation().subtract(root);
      expect(wheel.name.includes("front"), wheel.name).toBe(at.z > 0);
      expect(wheel.name.includes("left"), wheel.name).toBe(at.x > 0);
    }
    const forward = visual.root.getDirection(new Vector3(0, 0, 1));
    const left = Vector3.Cross(Vector3.Up(), forward);
    expect(left.x).toBeCloseTo(1, 6);
  });

  it("winds glTF meshes counter-clockwise with the loader's side orientation", () => {
    const gltfMeshes = [
      ...district.city.statics.filter(
        (m) => m.name.startsWith("host:") || m.name.startsWith("merged:"),
      ),
      visual.body,
      ...visual.wheels,
    ];
    expect(gltfMeshes.length).toBeGreaterThan(10);
    for (const mesh of gltfMeshes) {
      expect(ccwShare(mesh), mesh.name).toBeGreaterThan(0.99);
      expect(mesh.sideOrientation, mesh.name).toBe(Material.CounterClockWiseSideOrientation);
    }
  });

  it("winds builder meshes (ground, plaza pads) clockwise, with the right-handed default", () => {
    const builders = district.city.statics.filter(
      (m) => m.name === "ground" || m.name.startsWith("pads:"),
    );
    expect(builders.length).toBeGreaterThan(1);
    for (const mesh of builders) {
      expect(ccwShare(mesh), mesh.name).toBeLessThan(0.01);
      expect(mesh.sideOrientation, mesh.name).toBe(Material.ClockWiseSideOrientation);
    }
  });
});
