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
});
