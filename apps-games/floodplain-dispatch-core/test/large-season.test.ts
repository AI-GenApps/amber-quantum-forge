import { describe, expect, it } from "vitest";
import { hashSeason, runSeason } from "../src/simulate";
import { randomScenario } from "./helpers";

describe("largest legal season (12 x 16, 30 weeks)", () => {
  const { def, placements } = randomScenario(424242, {
    width: 12,
    height: 16,
    weeks: 30,
    attempts: 80,
  });
  const result = runSeason(def, placements, { keepSteps: true });

  it("produces 30 week frames and 120 step frames within 0 to 99", () => {
    expect(result.weekFrames).toHaveLength(30);
    expect(result.stepFrames).toHaveLength(120);
    for (const frame of [...result.weekFrames, ...(result.stepFrames ?? [])]) {
      expect(frame).toHaveLength(12 * 16);
      expect(Math.max(...frame)).toBeLessThanOrEqual(99);
    }
    expect(result.weekFrames.some((f) => f.some((d) => d > 0))).toBe(true);
  });

  it("week frames are the last step of each week", () => {
    result.weekFrames.forEach((frame, week) => {
      expect(Array.from(frame)).toEqual(Array.from(result.stepFrames?.[week * 4 + 3] ?? []));
    });
  });

  it("has a stable result hash", () => {
    expect(hashSeason(result)).toBe(4043004376);
    expect(hashSeason(runSeason(def, placements))).toBe(hashSeason(result));
  });
});
