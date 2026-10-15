// @vitest-environment node
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js";
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
});
