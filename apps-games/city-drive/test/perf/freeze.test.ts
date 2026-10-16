// @vitest-environment node
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { BASELINE_CAR } from "@city-drive/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auditFreeze } from "../../src/perf/freezeAudit";
import { createCarVisual } from "../../src/render/carVisual";
import { applyViewDistance } from "../../src/render/city";
import { freezeMaterials } from "../../src/render/freeze";
import { createMissionVisual } from "../../src/render/missionVisual";
import { createTrafficVisual } from "../../src/render/traffic";
import { readManifest } from "../assets/helpers";
import { buildDistrict, readBytes } from "../render/helpers";

const DISTRICTS = ["district-1", "district-2", "district-3"];

for (const id of DISTRICTS) {
  describe(`${id} freeze audit`, () => {
    let built: Awaited<ReturnType<typeof buildDistrict>>;

    beforeAll(async () => {
      built = await buildDistrict(id);
      const camera = new UniversalCamera("freeze-cam", new Vector3(0, 8, 0), built.city.scene);
      applyViewDistance(camera);
      built.city.scene.activeCamera = camera;
    });
    afterAll(() => {
      built.city.dispose();
      built.engine.dispose();
    });

    it("freezes every static mesh and every material of the bare city", () => {
      const audit = auditFreeze(built.city.scene, built.city.statics);
      expect(audit.looseStatics).toEqual([]);
      expect(audit.looseMaterials).toEqual([]);
      expect(audit.dynamicMeshes).toBe(0);
      expect(built.city.statics.length).toBeGreaterThan(2);
    });

    it("with the car, traffic and mission visuals added, only instanced traffic stays unfrozen", async () => {
      const { scene } = built.city;
      await createCarVisual(scene, readManifest(), readBytes, BASELINE_CAR);
      await createTrafficVisual(scene, readManifest(), readBytes);
      createMissionVisual(scene);
      freezeMaterials(scene);
      const audit = auditFreeze(scene, built.city.statics);
      expect(audit.looseStatics).toEqual([]);
      expect(audit.looseMaterials).toEqual([]);
      expect(audit.dynamicMeshes).toBeGreaterThan(0);
      expect(audit.keptUnfrozen.length).toBeGreaterThan(0);
      expect(audit.keptUnfrozen.every((name) => name.startsWith("pack:"))).toBe(true);
    });

    it("never freezes the active mesh list (traffic moves), and still culls far chunks", () => {
      const { scene } = built.city;
      scene.render();
      expect(auditFreeze(scene, built.city.statics).activeMeshesFrozen).toBe(false);
      const all = scene.meshes.length;
      expect(scene.getActiveMeshes().length).toBeLessThan(all);
    });

    it("keeps the sky as the clear colour, so autoClear must stay on", () => {
      const { scene } = built.city;
      expect(scene.autoClear).toBe(true);
      expect(scene.autoClearDepthAndStencil).toBe(true);
      expect(scene.meshes.some((m) => /sky/i.test(m.name))).toBe(false);
      expect(scene.clearColor.r).toBeCloseTo(scene.fogColor.r);
      expect(scene.clearColor.g).toBeCloseTo(scene.fogColor.g);
      expect(scene.clearColor.b).toBeCloseTo(scene.fogColor.b);
    });
  });
}
