// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader.js";
import { Scene } from "@babylonjs/core/scene.js";
import "@babylonjs/loaders/glTF/index.js";
import { describe, expect, it } from "vitest";
import { ASSET_KINDS, type AssetKind } from "../../src/assets/manifest";
import { assetsDir, readManifest } from "./helpers";

const manifest = readManifest();

function firstOfKind(kind: AssetKind) {
  const model = manifest.models.find((entry) => entry.kind === kind);
  if (!model) throw new Error(`no ${kind} in manifest`);
  return model;
}

describe("GLB parsing under NullEngine", () => {
  for (const kind of ASSET_KINDS) {
    it(`loads one ${kind} model and matches the manifest triangle count`, async () => {
      const model = firstOfKind(kind);
      const engine = new NullEngine();
      const scene = new Scene(engine);
      const bytes = readFileSync(join(assetsDir, model.file));
      const container = await LoadAssetContainerAsync(new Uint8Array(bytes), scene, {
        pluginExtension: ".glb",
      });
      const meshes = container.meshes.filter((mesh) => mesh.getTotalVertices() > 0);
      expect(meshes.length, model.id).toBeGreaterThan(0);
      const triangles = meshes.reduce((sum, mesh) => sum + mesh.getTotalIndices() / 3, 0);
      // Babylon instances shared meshes per node, so the loaded count equals the manifest count.
      expect(triangles, model.id).toBe(model.triangles);
      container.dispose();
      scene.dispose();
      engine.dispose();
    });
  }

  it("loads every shipped model without error", async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    for (const model of manifest.models) {
      const bytes = readFileSync(join(assetsDir, model.file));
      const container = await LoadAssetContainerAsync(new Uint8Array(bytes), scene, {
        pluginExtension: ".glb",
      });
      expect(container.meshes.length, model.id).toBeGreaterThan(0);
      container.dispose();
    }
    scene.dispose();
    engine.dispose();
  });
});
