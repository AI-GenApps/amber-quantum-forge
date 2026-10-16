// @vitest-environment node

import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { describe, expect, it } from "vitest";
import { THIN_INSTANCE_MIN } from "../../src/render/constants";
import { buildDistrict } from "./helpers";

/** Translation (x, z) of every instance in the matrix buffer the GPU will actually read. */
function drawnPositions(host: Mesh): string[] {
  const world3 = host.geometry?.getVertexBuffer("world3");
  const data = world3?.getFloatData(host.thinInstanceCount) ?? [];
  const out: string[] = [];
  for (let i = 0; i < host.thinInstanceCount; i++) {
    out.push(`${(data[i * 4] as number).toFixed(3)},${(data[i * 4 + 2] as number).toFixed(3)}`);
  }
  return out;
}

// Regression (owner playtest, 2026-10-16): chunk hosts were clones sharing one geometry, and Babylon
// keeps thin-instance buffers on the geometry, so every host drew the last host's matrices and most
// straight roads vanished. Each host must draw its own placements.
describe.each(["district-1", "district-2", "district-3"])("%s thin-instance hosts", (id) => {
  it("each host owns its geometry and draws exactly its own placements", async () => {
    const { city, engine } = await buildDistrict(id);
    const hosts = city.statics.filter((m) => m.thinInstanceCount > 0);
    expect(hosts.length).toBeGreaterThan(1);
    expect(new Set(hosts.map((h) => h.geometry)).size).toBe(hosts.length);
    expect(new Set(hosts.map((h) => h.geometry?.getVertexBuffer("world0"))).size).toBe(
      hosts.length,
    );

    const perGroup = new Map<string, number>();
    for (const p of city.plan.placements) {
      const key = `${p.chunk}|${p.model}`;
      perGroup.set(key, (perGroup.get(key) ?? 0) + 1);
    }
    const expected = city.plan.placements
      .filter((p) => (perGroup.get(`${p.chunk}|${p.model}`) ?? 0) >= THIN_INSTANCE_MIN)
      .map((p) => `${p.model}@${p.x.toFixed(3)},${p.z.toFixed(3)}`)
      .sort();
    const drawn = hosts
      .filter((h) => h.name.startsWith("host:"))
      .flatMap((h) => {
        const model = h.name.split(":")[2];
        return drawnPositions(h).map((xz) => `${model}@${xz}`);
      })
      .sort();
    expect(drawn).toEqual(expected);

    const roads = city.plan.placements.filter((p) => p.group === "road").length;
    const roadsDrawn =
      drawn.filter((d) => d.startsWith("road-")).length +
      city.plan.placements.filter(
        (p) =>
          p.group === "road" && (perGroup.get(`${p.chunk}|${p.model}`) ?? 0) < THIN_INSTANCE_MIN,
      ).length;
    expect(roadsDrawn).toBe(roads);
    city.dispose();
    engine.dispose();
  });
});
