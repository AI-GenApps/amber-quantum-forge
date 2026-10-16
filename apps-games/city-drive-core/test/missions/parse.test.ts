import { describe, expect, it } from "vitest";
import { MissionError, parseMission } from "../../src/index";
import { cloneMission, readMissionFiles } from "./helpers";

function issuesOf(raw: unknown): string {
  try {
    parseMission(raw);
  } catch (error) {
    if (error instanceof MissionError) return error.message;
    throw error;
  }
  return "";
}

describe("parseMission", () => {
  for (const { file, raw } of readMissionFiles()) {
    it(`parses ${file}`, () => {
      expect(parseMission(raw).id).toBe((raw as { id: string }).id);
    });
  }

  it("rejects things that are not objects", () => {
    expect(issuesOf(null)).toContain("JSON object");
    expect(issuesOf([])).toContain("JSON object");
  });

  it("rejects an unknown type", () => {
    const raw = cloneMission(readMissionFiles()[0]?.raw);
    raw.type = "race";
    expect(issuesOf(raw)).toContain("type must be one of");
  });

  it("rejects the wrong schema version", () => {
    const raw = cloneMission(readMissionFiles()[0]?.raw);
    raw.schema_version = 2;
    expect(issuesOf(raw)).toContain("schema_version must be 1");
  });

  it("lists every problem, not just the first", () => {
    const raw = cloneMission(readMissionFiles()[0]?.raw);
    delete raw.title;
    delete raw.brief;
    (raw.params as Record<string, unknown>).drops = [];
    const message = issuesOf(raw);
    expect(message).toContain("title must be");
    expect(message).toContain("brief must be");
    expect(message).toContain("drops must be an array of 1..3");
  });

  it("rejects a malformed lane point", () => {
    const raw = cloneMission(readMissionFiles()[0]?.raw);
    (raw.start as Record<string, unknown>).lane_point = { edgeId: 7 };
    expect(issuesOf(raw)).toContain("start.lane_point");
  });

  it("rejects missing star tiers and negative rewards", () => {
    const raw = cloneMission(readMissionFiles()[0]?.raw);
    delete (raw.stars as Record<string, unknown>)["2"];
    (raw.reward_coins as Record<string, unknown>)["1"] = -5;
    const message = issuesOf(raw);
    expect(message).toContain("stars.2");
    expect(message).toContain("reward_coins.1");
  });

  it("rejects more than three drops", () => {
    const raw = cloneMission(readMissionFiles()[0]?.raw);
    const p = raw.params as { drops: unknown[] };
    p.drops = [p.drops[0], p.drops[0], p.drops[0], p.drops[0]];
    expect(issuesOf(raw)).toContain("1..3");
  });

  const metrics = {
    traffic_seed: 1,
    traffic_agents: 8,
    autopilot_stars: 2,
    autopilot_time_s: 31.5,
    autopilot_damage: 0,
    route_length_m: 210,
    intersections: 3,
    ticks: 2000,
  };

  it("keeps the optional difficulty and validation block the tool writes", () => {
    const raw = cloneMission(readMissionFiles()[0]?.raw);
    raw.difficulty = 0.31;
    raw.validation = metrics;
    const mission = parseMission(raw);
    expect(mission.difficulty).toBe(0.31);
    expect(mission.validation).toEqual(metrics);
  });

  it("leaves them off when the file has none", () => {
    const mission = parseMission(cloneMission(readMissionFiles()[0]?.raw));
    expect(mission.difficulty).toBeUndefined();
    expect(mission.validation).toBeUndefined();
  });

  it("rejects a malformed validation block and a negative difficulty", () => {
    const raw = cloneMission(readMissionFiles()[0]?.raw);
    raw.validation = { ...metrics, autopilot_stars: 5, ticks: "many" };
    const message = issuesOf(raw);
    expect(message).toContain("autopilot_stars must be 0, 1, 2 or 3");
    expect(message).toContain("ticks");
    raw.validation = metrics;
    raw.difficulty = -1;
    expect(issuesOf(raw)).toContain("difficulty");
  });
});
