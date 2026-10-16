import { describe, expect, it } from "vitest";
import {
  districtInfo,
  isDistrictUnlocked,
  parseProgression,
  type Progression,
  unlockedDistricts,
} from "../../src/index";
import { allMissions, content } from "./support";

const progression = (): Progression => content().progression;

/**
 * Play every district in order, earning `starsPerMission` on each mission of every district that
 * is open at the moment the player reaches it. Returns the districts that never opened.
 */
function playThrough(starsPerMission: number): { total: number; locked: string[] } {
  const p = progression();
  let total = 0;
  const locked: string[] = [];
  for (const d of content().districts) {
    if (!isDistrictUnlocked(p, total, d.info.id)) {
      locked.push(d.info.id);
      continue;
    }
    total += starsPerMission * d.missions.length;
  }
  return { total, locked };
}

describe("progression.json", () => {
  it("opens district 2 at 10 stars and district 3 at 24", () => {
    const p = progression();
    expect(districtInfo(p, "district-1").unlock_stars).toBe(0);
    expect(districtInfo(p, "district-2").unlock_stars).toBe(10);
    expect(districtInfo(p, "district-3").unlock_stars).toBe(24);
  });

  it("has one entry per shipped district, in order, with the placeholder names", () => {
    expect(progression().districts.map((d) => d.id)).toEqual(content().districts.map((d) => d.info.id));
    expect(progression().districts.map((d) => d.name)).toEqual(["Old Town", "Harbor", "Downtown"]);
  });

  it("carries the difficulty weights from the task and they sum to one", () => {
    const { weights } = progression().difficulty;
    expect(weights).toEqual({ route_ratio: 0.4, intersections: 0.25, traffic: 0.2, parking: 0.15 });
    expect(Object.values(weights).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(progression().difficulty.max_intersections).toBe(12);
    expect(progression().difficulty.max_traffic_agents).toBe(16);
    expect(progression().difficulty.parking_margin_tight_m).toBe(0.2);
    expect(progression().difficulty.parking_margin_loose_m).toBe(1.5);
  });
});

describe("district unlocks", () => {
  it("unlocks by total stars", () => {
    const p = progression();
    expect(unlockedDistricts(p, 0)).toEqual(["district-1"]);
    expect(unlockedDistricts(p, 9)).toEqual(["district-1"]);
    expect(unlockedDistricts(p, 10)).toEqual(["district-1", "district-2"]);
    expect(unlockedDistricts(p, 23)).toEqual(["district-1", "district-2"]);
    expect(unlockedDistricts(p, 24)).toEqual(["district-1", "district-2", "district-3"]);
    expect(isDistrictUnlocked(p, 9, "district-2")).toBe(false);
    expect(isDistrictUnlocked(p, 10, "district-2")).toBe(true);
  });

  it("throws on an unknown district", () => {
    expect(() => districtInfo(progression(), "district-9")).toThrow(/unknown district/);
  });

  it("is reachable with a 2-star average: every district opens", () => {
    const { total, locked } = playThrough(2);
    expect(locked).toEqual([]);
    expect(total).toBe(2 * allMissions().length);
  });

  it("opens district 2 from district 1 alone with 2 stars a mission, and district 3 from districts 1 and 2", () => {
    const d1 = content().districts[0]?.missions.length ?? 0;
    const d2 = content().districts[1]?.missions.length ?? 0;
    expect(2 * d1).toBeGreaterThanOrEqual(districtInfo(progression(), "district-2").unlock_stars);
    expect(2 * (d1 + d2)).toBeGreaterThanOrEqual(districtInfo(progression(), "district-3").unlock_stars);
  });

  it("is within reach of the maximum: 3 stars a mission opens everything with room to spare", () => {
    const max = 3 * allMissions().length;
    expect(max).toBe(72);
    expect(districtInfo(progression(), "district-3").unlock_stars).toBeLessThan(max / 2);
  });

  it("cannot be skipped: 1-star play does not open district 3 from district 1 alone", () => {
    const d1 = content().districts[0]?.missions.length ?? 0;
    expect(d1).toBeLessThan(districtInfo(progression(), "district-3").unlock_stars);
  });
});

describe("parseProgression", () => {
  const good = () => JSON.parse(JSON.stringify(progression())) as Record<string, unknown>;

  it("accepts the shipped file", () => {
    expect(() => parseProgression(good())).not.toThrow();
  });

  it("rejects a wrong schema version, a locked first district and decreasing thresholds", () => {
    expect(() => parseProgression({ ...good(), schema_version: 9 })).toThrow(/schema_version/);
    const locked = good();
    (locked.districts as { unlock_stars: number }[])[0]!.unlock_stars = 5;
    expect(() => parseProgression(locked)).toThrow(/open from the start/);
    const backwards = good();
    (backwards.districts as { unlock_stars: number }[])[2]!.unlock_stars = 3;
    expect(() => parseProgression(backwards)).toThrow(/must not decrease/);
  });

  it("rejects missing fields and non-objects with every problem listed", () => {
    expect(() => parseProgression(null)).toThrow(/JSON object/);
    expect(() => parseProgression({ schema_version: 1 })).toThrow(/problem\(s\)/);
  });
});
