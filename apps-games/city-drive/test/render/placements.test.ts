// @vitest-environment node
import { buildingFitScale, parseCityManifest } from "@city-drive/core/city";
import { describe, expect, it } from "vitest";
import { CHUNK_TILES } from "../../src/render/constants";
import { loadDistrict1 } from "../../src/render/district";
import { chunkKey, planCity } from "../../src/render/placements";
import { readManifest } from "../assets/helpers";

const manifest = readManifest();
const map = loadDistrict1(manifest);
const cityManifest = parseCityManifest(manifest);

describe("planCity", () => {
  it("is deterministic and does not mutate the map", () => {
    const before = JSON.stringify(map);
    const a = planCity(map, cityManifest);
    const b = planCity(map, cityManifest);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(map)).toBe(before);
  });

  it("places one model per road and building tile and trees for parks", () => {
    const plan = planCity(map, cityManifest);
    const count = (group: string) => plan.placements.filter((p) => p.group === group).length;
    expect(count("road")).toBe(map.tiles.filter((t) => t.kind === "road").length);
    expect(count("building")).toBe(map.tiles.filter((t) => t.kind === "building").length);
    const parks = map.tiles.filter((t) => t.kind === "park").length;
    const trees = plan.placements.filter((p) => p.model.startsWith("prop-tree")).length;
    expect(trees).toBe(parks * 3);
    expect(plan.pads).toHaveLength(map.tiles.filter((t) => t.kind === "plaza").length);
  });

  it("scales buildings with the shared collider fit rule", () => {
    const plan = planCity(map, cityManifest);
    for (const p of plan.placements.filter((q) => q.group === "building")) {
      const model = cityManifest.models.find((m) => m.id === p.model);
      expect(model, p.model).toBeDefined();
      if (!model) continue;
      expect(p.scale).toBeCloseTo(map.tile_size_m * buildingFitScale(model.bbox), 9);
    }
  });

  it("assigns every placement to the 4x4 chunk of its tile", () => {
    expect(chunkKey(0, 0)).toBe("0,0");
    expect(chunkKey(CHUNK_TILES - 1, CHUNK_TILES - 1)).toBe("0,0");
    expect(chunkKey(CHUNK_TILES, 0)).toBe("1,0");
    const plan = planCity(map, cityManifest);
    const chunks = new Set(plan.placements.map((p) => p.chunk));
    expect(chunks.size).toBe(9);
  });
});
