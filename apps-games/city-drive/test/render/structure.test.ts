// @vitest-environment node

import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Scene } from "@babylonjs/core/scene.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyViewDistance } from "../../src/render/city";
import { CAMERA_MAX_Z, THIN_INSTANCE_MIN } from "../../src/render/constants";
import { frameStats } from "../../src/render/stats";
import { readManifest } from "../assets/helpers";
import { buildDistrict1 } from "./helpers";

type Built = Awaited<ReturnType<typeof buildDistrict1>>;
let built: Built;

beforeAll(async () => {
  built = await buildDistrict1();
});
afterAll(() => {
  built.city.dispose();
  built.engine.dispose();
});

describe("district-1 scene structure", () => {
  it("uses one hemispheric and one directional light, linear fog, no shadows or HDR", () => {
    const { scene } = built.city;
    expect(scene.lights).toHaveLength(2);
    expect(scene.lights.filter((l) => l instanceof HemisphericLight)).toHaveLength(1);
    expect(scene.lights.filter((l) => l instanceof DirectionalLight)).toHaveLength(1);
    expect(scene.lights.every((l) => l.getShadowGenerators() === null)).toBe(true);
    expect(scene.fogMode).toBe(Scene.FOGMODE_LINEAR);
    expect(scene.fogEnd).toBeLessThanOrEqual(CAMERA_MAX_Z);
    expect(scene.environmentTexture).toBeNull();
    expect(scene.skipPointerMovePicking).toBe(true);
  });

  it("freezes every static mesh and every material", () => {
    const { scene, statics } = built.city;
    expect(statics.length).toBeGreaterThan(0);
    for (const mesh of statics) {
      expect(mesh.isWorldMatrixFrozen, mesh.name).toBe(true);
      expect(mesh.alwaysSelectAsActiveMesh, mesh.name).toBe(false);
      expect(mesh.isPickable, mesh.name).toBe(false);
    }
    expect(scene.materials.length).toBeGreaterThan(0);
    for (const material of scene.materials) {
      if ("subMaterials" in material) continue;
      expect(material.isFrozen, material.name).toBe(true);
    }
  });

  it("keeps only the city meshes in the scene (no leftover loader or template meshes)", () => {
    const { scene, statics } = built.city;
    expect(scene.meshes.length).toBe(statics.length);
    expect(scene.textures.length).toBeLessThanOrEqual(4);
  });

  it("carries every placement exactly once, as instances or as merged geometry", () => {
    const { chunks, plan } = built.city;
    const manifest = readManifest();
    const perKey = new Map<string, number>();
    for (const p of plan.placements) {
      const key = `${p.chunk}|${p.model}`;
      perKey.set(key, (perKey.get(key) ?? 0) + 1);
    }
    const isThin = (p: { chunk: string; model: string }) =>
      (perKey.get(`${p.chunk}|${p.model}`) ?? 0) >= THIN_INSTANCE_MIN;
    for (const chunk of chunks) {
      const mine = plan.placements.filter((p) => p.chunk === chunk.key);
      const thin = mine.filter(isThin);
      const rest = mine.filter((p) => !isThin(p));
      const hostInstances = chunk.hosts
        .filter((h) => h.name.endsWith(":0"))
        .reduce((sum, h) => sum + h.thinInstanceCount, 0);
      expect(hostInstances, `chunk ${chunk.key} instances`).toBe(thin.length);
      const expectedTriangles = rest.reduce(
        (sum, p) => sum + (manifest.models.find((m) => m.id === p.model)?.triangles ?? 0),
        0,
      );
      expect(chunk.merged === undefined, `chunk ${chunk.key} merged`).toBe(rest.length === 0);
      expect((chunk.merged?.getTotalIndices() ?? 0) / 3, `chunk ${chunk.key} merged tris`).toBe(
        expectedTriangles,
      );
    }
    expect(chunks.some((c) => c.hosts.length > 0)).toBe(true);
    expect(chunks.some((c) => c.merged !== undefined)).toBe(true);
  });

  it("gives thin-instance hosts bounding boxes that cover their instances", () => {
    const { chunks } = built.city;
    for (const chunk of chunks) {
      for (const host of chunk.hosts) {
        const box = host.getBoundingInfo().boundingBox;
        const buffer = host.thinInstanceGetWorldMatrices();
        expect(buffer.length).toBe(host.thinInstanceCount);
        for (const matrix of buffer) {
          const p = matrix.getTranslation();
          expect(p.x).toBeGreaterThanOrEqual(box.minimumWorld.x - 1e-3);
          expect(p.x).toBeLessThanOrEqual(box.maximumWorld.x + 1e-3);
          expect(p.z).toBeGreaterThanOrEqual(box.minimumWorld.z - 1e-3);
          expect(p.z).toBeLessThanOrEqual(box.maximumWorld.z + 1e-3);
        }
      }
    }
  });

  it("frustum-culls chunks that are behind the camera", () => {
    const { scene } = built.city;
    const camera = new UniversalCamera("cull-cam", new Vector3(0, 6, 150), scene);
    applyViewDistance(camera);
    scene.activeCamera = camera;
    camera.setTarget(new Vector3(0, 6, 400));
    scene.render();
    const away = frameStats(scene);
    camera.setTarget(new Vector3(0, 1, 0));
    scene.render();
    const toward = frameStats(scene);
    expect(away.triangles).toBeLessThan(toward.triangles);
    expect(away.activeMeshes).toBeLessThan(toward.activeMeshes);
    scene.activeCamera = null;
    camera.dispose();
  });
});
