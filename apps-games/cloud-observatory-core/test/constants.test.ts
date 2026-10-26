import { describe, expect, it } from "vitest";
import { RULES } from "../src/constants";

describe("RULES", () => {
  it("matches economy.md literally", () => {
    expect(RULES.STARTING_STARLIGHT).toBe(10);
    expect(RULES.ATLAS_BONUS).toBe(0.05);
    expect(RULES.ACHIEVEMENT_BONUS).toBe(0.01);
    expect(RULES.OFFLINE_CAP_SECONDS).toBe(28800);
    expect(RULES.OFFLINE_EFFICIENCY_BASE).toBe(0.5);
    expect(RULES.ECLIPSE_DIVISOR).toBe(1e9);
    expect(RULES.ECLIPSE_MIN_SHARDS).toBe(5);
    expect([...RULES.UPGRADE_THRESHOLDS]).toEqual([10, 25, 50]);
    expect([...RULES.UPGRADE_COST_FACTORS]).toEqual([10, 100, 1000]);
    expect([...RULES.UPGRADE_MULTIPLIERS]).toEqual([2, 2, 3]);
    expect(RULES.STAR_MIN_SPACING).toBe(140);
    expect(RULES.MAP_WIDTH).toBe(1000);
    expect(RULES.MAP_HEIGHT).toBe(1400);
    expect(RULES.MAP_MARGIN).toBe(100);
    expect(RULES.MAX_VALUE).toBe(1e300);
  });

  it("has exactly the documented keys", () => {
    expect(Object.keys(RULES).sort()).toEqual(
      [
        "ACHIEVEMENT_BONUS",
        "ATLAS_BONUS",
        "ECLIPSE_DIVISOR",
        "ECLIPSE_MIN_SHARDS",
        "MAP_HEIGHT",
        "MAP_MARGIN",
        "MAP_WIDTH",
        "MAX_VALUE",
        "OFFLINE_CAP_SECONDS",
        "OFFLINE_EFFICIENCY_BASE",
        "STARTING_STARLIGHT",
        "STAR_MIN_SPACING",
        "UPGRADE_COST_FACTORS",
        "UPGRADE_MULTIPLIERS",
        "UPGRADE_THRESHOLDS",
      ].sort(),
    );
  });
});
