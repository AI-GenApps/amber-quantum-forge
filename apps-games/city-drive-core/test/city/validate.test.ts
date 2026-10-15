import { describe, expect, it } from "vitest";
import {
  type CityMap,
  CityMapError,
  type CityMapIssueCode,
  loadCityMap,
  parseCityMap,
  validateCityMap,
} from "../../src/index";
import { building, loadDistrict1, loadManifest, miniMap, road } from "./helpers";

const manifest = loadManifest();

function codes(map: CityMap): CityMapIssueCode[] {
  return validateCityMap(map, manifest).map((i) => i.code);
}

describe("city map validator", () => {
  it("accepts the mini map and district-1", () => {
    expect(validateCityMap(miniMap(), manifest)).toEqual([]);
    expect(validateCityMap(loadDistrict1(), manifest)).toEqual([]);
  });

  it("rejects a road edge facing a non-road tile, with the tile coordinates", () => {
    const map = miniMap({
      tiles: miniMap().tiles.map((t) => (t.x === 1 && t.y === 2 ? building(1, 2) : t)),
    });
    const issues = validateCityMap(map, manifest);
    expect(issues.map((i) => i.code)).toEqual(["socket-mismatch"]);
    expect(issues[0]).toMatchObject({ x: 1, y: 1 });
    expect(issues[0]?.message).toContain("faces building tile (1,2)");
  });

  it("rejects a road edge facing an empty (unlisted) tile", () => {
    const map = miniMap({ tiles: miniMap().tiles.filter((t) => !(t.x === 1 && t.y === 2)) });
    expect(validateCityMap(map, manifest)[0]?.message).toContain("faces empty tile (1,2)");
  });

  it("rejects a road edge that meets a closed edge of another road", () => {
    const tiles = miniMap().tiles.map((t) =>
      t.x === 1 && t.y === 2 ? road(1, 2, "road-end", 90) : t,
    );
    const issues = validateCityMap(miniMap({ tiles }), manifest);
    expect(
      issues.some((i) => i.code === "socket-mismatch" && i.message.includes("closed edge")),
    ).toBe(true);
  });

  it("rejects a road edge that leaves the map", () => {
    const tiles = miniMap().tiles.map((t) =>
      t.x === 1 && t.y === 0 ? road(1, 0, "road-end", 180) : t,
    );
    const issues = validateCityMap(miniMap({ tiles }), manifest);
    expect(issues.map((i) => i.code)).toContain("socket-outside-map");
  });

  it("rejects unknown models, and reports the tile", () => {
    const tiles = [
      ...miniMap().tiles.filter((t) => t.x !== 0 || t.y !== 0),
      building(0, 0, "bld-nope"),
    ];
    const issues = validateCityMap(miniMap({ tiles }), manifest);
    expect(issues).toEqual([expect.objectContaining({ code: "unknown-model", x: 0, y: 0 })]);
  });

  it("rejects a model of the wrong kind and a missing model", () => {
    const wrong = [
      ...miniMap().tiles.filter((t) => t.x !== 0 || t.y !== 0),
      building(0, 0, "road-straight"),
    ];
    expect(codes(miniMap({ tiles: wrong }))).toEqual(["wrong-model-kind"]);
    const bare = [
      ...miniMap().tiles.filter((t) => t.x !== 0 || t.y !== 0),
      { x: 0, y: 0, kind: "building" as const, rot: 0 as const },
    ];
    expect(codes(miniMap({ tiles: bare }))).toEqual(["missing-model"]);
  });

  it("lets park, plaza and empty tiles omit the model but not use a road model", () => {
    const base = miniMap().tiles.filter((t) => t.x !== 0 || t.y !== 0);
    const park = { x: 0, y: 0, kind: "park" as const, rot: 0 as const };
    expect(codes(miniMap({ tiles: [...base, park] }))).toEqual([]);
    expect(codes(miniMap({ tiles: [...base, { ...park, model: "road-straight" }] }))).toEqual([
      "wrong-model-kind",
    ]);
  });

  it("rejects out-of-bounds and duplicate tiles", () => {
    expect(codes(miniMap({ tiles: [...miniMap().tiles, building(5, 5)] }))).toEqual([
      "out-of-bounds",
    ]);
    expect(codes(miniMap({ tiles: [...miniMap().tiles, building(0, 0)] }))).toEqual([
      "duplicate-tile",
    ]);
  });

  it("rejects an invalid spawn", () => {
    expect(codes(miniMap({ spawn: { x: 0, y: 0, heading: 0 } }))).toEqual(["invalid-spawn"]);
    expect(codes(miniMap({ spawn: { x: 1, y: 1, heading: 45 } }))).toEqual(["invalid-spawn"]);
    expect(codes(miniMap({ spawn: { x: 1, y: 1, heading: 90 } }))).toEqual(["invalid-spawn"]);
    expect(codes(miniMap({ spawn: { x: 1, y: 0, heading: 0 } }))).toEqual(["invalid-spawn"]);
  });

  it("parseCityMap rejects malformed JSON structure with clear messages", () => {
    expect(() => parseCityMap(null)).toThrow(CityMapError);
    expect(() => parseCityMap({ ...miniMap(), schema_version: 2 })).toThrow(
      /schema_version must be 1/,
    );
    expect(() => parseCityMap({ ...miniMap(), width: 0 })).toThrow(/width must be an integer/);
    const badRot = {
      ...miniMap(),
      tiles: [{ x: 2, y: 1, kind: "building", model: "bld-commercial-a", rot: 45 }],
    };
    expect(() => parseCityMap(badRot)).toThrow(/tile \(2,1\): rot must be 0, 90, 180 or 270/);
    const badKind = { ...miniMap(), tiles: [{ x: 0, y: 0, kind: "lake", rot: 0 }] };
    expect(() => parseCityMap(badKind)).toThrow(/kind must be one of/);
  });

  it("loadCityMap throws one error that lists every problem", () => {
    const raw = {
      ...miniMap(),
      tiles: [...miniMap().tiles, building(5, 5), building(0, 0)],
      spawn: { x: 0, y: 0, heading: 0 },
    };
    try {
      loadCityMap(raw, manifest);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(CityMapError);
      const text = (error as Error).message;
      expect(text).toContain("3 problem(s)");
      expect(text).toContain("tile (5,5)");
      expect(text).toContain("tile (0,0)");
    }
  });
});
