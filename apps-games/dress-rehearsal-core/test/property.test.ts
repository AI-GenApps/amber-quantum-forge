import { describe, expect, it } from "vitest";
import { THREE_STAR_HARMONY } from "../src/constants";
import { harmony } from "../src/harmony";
import { lookPieces, quickStars, sanitizeLook, scoreLook } from "../src/score";
import { makeScenarios } from "./fixtures/scenarios";
import { STARTER_PIECES } from "./fixtures/starter-pieces";

describe("scoring properties over 200 generated scenarios", () => {
  const scenarios = makeScenarios(20261023, 200);

  it("generates 200 scenarios with 2 to 4 rules each", () => {
    expect(scenarios).toHaveLength(200);
    for (const { challenge } of scenarios) {
      expect(challenge.rules.length).toBeGreaterThanOrEqual(2);
      expect(challenge.rules.length).toBeLessThanOrEqual(4);
    }
  });

  it("never throws, is repeatable and does not mutate inputs", () => {
    for (const { challenge, look } of scenarios) {
      const before = JSON.stringify([challenge, look, STARTER_PIECES]);
      const first = scoreLook(challenge, STARTER_PIECES, look);
      const second = scoreLook(challenge, STARTER_PIECES, look);
      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
      expect(JSON.stringify([challenge, look, STARTER_PIECES])).toBe(before);
    }
  });

  it("keeps harmony within 0 to 100 and equal to the sum of its parts", () => {
    for (const { challenge, look } of scenarios) {
      const { harmony: result } = scoreLook(challenge, STARTER_PIECES, look);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(result.total).toBe(result.parts.reduce((sum, part) => sum + part.points, 0));
      for (const part of result.parts) {
        expect(part.points).toBeGreaterThanOrEqual(0);
        expect(part.points).toBeLessThanOrEqual(part.max);
      }
    }
  });

  it("keeps stars consistent with completeness, rules and harmony", () => {
    let withStars = 0;
    for (const { challenge, look } of scenarios) {
      const result = scoreLook(challenge, STARTER_PIECES, look);
      const clean = sanitizeLook(challenge.slotSet, STARTER_PIECES, look);
      const pieces = lookPieces(clean, STARTER_PIECES);
      expect(result.metCount).toBe(result.rules.filter((rule) => rule.met).length);
      expect(result.rules).toHaveLength(challenge.rules.length);
      expect(harmony(pieces).total).toBe(result.harmony.total);
      if (result.stars > 0) {
        withStars += 1;
        expect(result.complete).toBe(true);
        expect(result.missing).toEqual([]);
      }
      if (result.stars === 3) {
        expect(result.metCount).toBe(challenge.rules.length);
        expect(result.harmony.total).toBeGreaterThanOrEqual(THREE_STAR_HARMONY);
      }
      if (result.complete) expect(quickStars(challenge.rules, pieces)).toBe(result.stars);
      else expect(result.stars).toBe(0);
    }
    expect(withStars).toBeGreaterThan(0);
  });

  it("covers every star count and both complete and incomplete looks", () => {
    const stars = new Set<number>();
    const completeness = new Set<boolean>();
    for (const { challenge, look } of makeScenarios(7, 2000)) {
      const result = scoreLook(challenge, STARTER_PIECES, look);
      stars.add(result.stars);
      completeness.add(result.complete);
    }
    expect([...stars].sort()).toEqual([0, 1, 2, 3]);
    expect([...completeness].sort()).toEqual([false, true]);
  });
});
