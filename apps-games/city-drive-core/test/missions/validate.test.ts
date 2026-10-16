import { describe, expect, it } from "vitest";
import {
  buildRoadGraph,
  type CityMap,
  LaneIndex,
  loadMissionCatalog,
  MissionError,
  parseMission,
  validateMission,
} from "../../src/index";
import { building, miniMap, road } from "../city/helpers";
import { cloneMission, loadMissionWorld, readMissionFiles } from "./helpers";

function codes(raw: unknown, world = loadMissionWorld()): string[] {
  return validateMission(parseMission(raw), world).map((i) => i.code);
}

function setStar(raw: Record<string, unknown>, tier: string, key: string, value: number): void {
  const tiers = raw.stars as Record<string, Record<string, number>>;
  const entry = tiers[tier];
  if (!entry) throw new Error(`no star tier ${tier}`);
  entry[key] = value;
}

function file(id: string): Record<string, unknown> {
  const found = readMissionFiles().find((f) => (f.raw as { id: string }).id === id);
  return cloneMission(found?.raw);
}

describe("validateMission", () => {
  it("accepts the four sample missions", () => {
    for (const { raw } of readMissionFiles()) expect(codes(raw)).toEqual([]);
  });

  it("flags an unknown edge", () => {
    const raw = file("d1-m01");
    (raw.params as { pickup: { edgeId: string } }).pickup.edgeId = "e:99,99:NS";
    expect(codes(raw)).toContain("unknown-edge");
  });

  it("flags a distance beyond the edge", () => {
    const raw = file("d1-m01");
    (raw.start as { lane_point: { s: number } }).lane_point.s = 500;
    expect(codes(raw)).toContain("bad-distance");
  });

  it("flags star thresholds that are not monotonic", () => {
    const raw = file("d1-m01");
    setStar(raw, "2", "min_time_left_s", 70);
    expect(codes(raw)).toContain("stars-not-monotonic");
    const trial = file("d1-m03");
    setStar(trial, "3", "max_time_s", 75);
    expect(codes(trial)).toContain("stars-not-monotonic");
  });

  it("flags each monotonic field of each type", () => {
    const taxi = file("d1-m02");
    setStar(taxi, "3", "min_comfort", 10);
    expect(codes(taxi)).toContain("stars-not-monotonic");
    const park = file("d1-m04");
    setStar(park, "3", "max_touches", 5);
    expect(codes(park)).toContain("stars-not-monotonic");
    const dmg = file("d1-m01");
    setStar(dmg, "3", "max_damage", 9);
    expect(codes(dmg)).toContain("stars-not-monotonic");
  });

  it("flags rewards that shrink with more stars", () => {
    const raw = file("d1-m01");
    (raw.reward_coins as Record<string, number>)["3"] = 10;
    expect(codes(raw)).toContain("rewards-not-monotonic");
  });

  it("flags a star time that does not fit in the time limit", () => {
    const raw = file("d1-m01");
    setStar(raw, "3", "min_time_left_s", 150);
    expect(codes(raw)).toContain("stars-out-of-range");
  });

  it("flags ids that do not follow d{n}-m{nn} or the district", () => {
    const raw = file("d1-m01");
    raw.id = "mission-1";
    expect(codes(raw)).toContain("bad-id");
    raw.id = "d2-m01";
    expect(codes(raw)).toContain("bad-id");
  });

  it("flags a bay on a junction or a corner", () => {
    const raw = file("d1-m04");
    (raw.params as { bay: { lane_point: { edgeId: string; s: number } } }).bay.lane_point = {
      edgeId: "e:10,5:NS",
      s: 10,
    };
    expect(codes(raw)).toContain("bay-geometry");
  });

  it("flags a bay whose parked cars would reach past the straight road", () => {
    const raw = file("d1-m04");
    (raw.params as { bay: { flank_gap_m: number } }).bay.flank_gap_m = 40;
    expect(codes(raw)).toContain("bay-geometry");
  });

  it("flags a bay too far from the lane for the road width", () => {
    const raw = file("d1-m04");
    (raw.params as { bay: { lateral_offset_m: number } }).bay.lateral_offset_m = 9;
    expect(codes(raw)).toContain("bay-geometry");
  });

  it("flags an objective that cannot be reached by road", () => {
    const tiles = [
      road(1, 0, "road-end", 0),
      road(1, 1, "road-straight"),
      road(1, 2, "road-end", 180),
      road(3, 0, "road-end", 0),
      road(3, 1, "road-straight"),
      road(3, 2, "road-end", 180),
      building(0, 0),
      building(2, 0),
      building(4, 0),
    ];
    const map: CityMap = miniMap({ width: 5, tiles, id: "split" });
    const graph = buildRoadGraph(map);
    const world = { graph, laneIndex: new LaneIndex(graph), catalog: [] };
    const raw = file("d1-m01");
    const edgeA = graph.edgeList.find((e) => e.tileX === 1 && e.tileY === 1);
    const edgeB = graph.edgeList.find((e) => e.tileX === 3 && e.tileY === 1);
    if (!edgeA || !edgeB) throw new Error("test map has no straight edges");
    raw.id = "d1-m01";
    (raw.start as { lane_point: unknown }).lane_point = { edgeId: edgeA.id, s: 5 };
    const params = raw.params as { pickup: unknown; drops: unknown[] };
    params.pickup = { edgeId: edgeB.id, s: 5 };
    params.drops = [{ edgeId: edgeB.id, s: 10 }];
    expect(codes(raw, world)).toContain("unreachable");
  });

  it("reports an invalid mission with the id and every issue", () => {
    const raw = file("d1-m01");
    raw.id = "oops";
    (raw.reward_coins as Record<string, number>)["3"] = 1;
    const world = loadMissionWorld();
    try {
      loadMissionCatalog([raw], world);
      throw new Error("expected a MissionError");
    } catch (error) {
      expect(error).toBeInstanceOf(MissionError);
      expect((error as MissionError).message).toContain('mission "oops"');
      expect((error as MissionError).issues.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("rejects duplicate ids in a catalog", () => {
    const world = loadMissionWorld();
    const a = file("d1-m01");
    expect(() => loadMissionCatalog([a, cloneMission(a)], world)).toThrow(/used twice/);
  });
});
