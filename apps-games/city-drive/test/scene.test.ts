// @vitest-environment node
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { describe, expect, it } from "vitest";
import { createEmptyScene } from "../src/scene";

describe("empty scene", () => {
  it("builds headlessly with NullEngine and contains ground + box", () => {
    const engine = new NullEngine();
    const scene = createEmptyScene(engine);
    expect(scene.meshes.map((mesh) => mesh.name).sort()).toEqual(["box", "ground"]);
    expect(scene.lights).toHaveLength(1);
    expect(scene.activeCamera).not.toBeNull();
    scene.dispose();
    engine.dispose();
  });
});
