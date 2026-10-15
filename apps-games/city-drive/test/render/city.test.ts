// @vitest-environment node

import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { describe, expect, it } from "vitest";
import { applyViewDistance } from "../../src/render/city";
import { frameStats } from "../../src/render/stats";
import { buildDistrict1 } from "./helpers";

describe("district-1 renderer", () => {
  it("builds under NullEngine and renders", async () => {
    const { city, engine } = await buildDistrict1();
    const camera = new UniversalCamera("cam", new Vector3(0, 6, 120), city.scene);
    camera.setTarget(new Vector3(0, 0, 0));
    applyViewDistance(camera);
    city.scene.activeCamera = camera;
    city.scene.render();
    const stats = frameStats(city.scene);
    console.log(
      JSON.stringify(stats),
      city.chunks.map((c) => `${c.key}:${c.hosts.length}+${c.merged ? 1 : 0}`).join(" "),
    );
    expect(stats.activeMeshes).toBeGreaterThan(0);
    city.dispose();
    engine.dispose();
  });

  it("keeps every pack colormap alive after the asset cache is freed", async () => {
    const { city, engine } = await buildDistrict1();
    const packs = city.scene.materials.filter((m) => m.name.startsWith("pack:"));
    expect(packs.length).toBeGreaterThan(0);
    for (const material of packs) {
      const texture = (material as StandardMaterial).diffuseTexture;
      expect(texture?.isReady(), `${material.name} texture ready`).toBe(true);
    }
    city.dispose();
    engine.dispose();
  });
});
