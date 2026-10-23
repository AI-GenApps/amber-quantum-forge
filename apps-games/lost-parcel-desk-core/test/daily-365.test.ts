import { describe, expect, it } from "vitest";
import {
  analyseCase,
  dailyIssues,
  generateDaily,
  MAX_DAILY_ATTEMPTS,
  PEOPLE,
  tierFor,
} from "../src";
import { dateRange, seedAndWeekday } from "./fixtures/dates";
import { solve } from "./fixtures/solve";

const DATES = dateRange(365);
const MAX_FALLBACKS = 18;

describe("365 consecutive Daily Parcel dates from 2026-01-01", () => {
  const generated = DATES.map((key) => ({ key, def: generateDaily(...seedAndWeekday(key)) }));

  it("covers 365 distinct dates ending on 2026-12-31", () => {
    expect(DATES).toHaveLength(365);
    expect(DATES[0]).toBe("2026-01-01");
    expect(DATES.at(-1)).toBe("2026-12-31");
    expect(new Set(generated.map((item) => item.def.id)).size).toBe(365);
  });

  it("validates every date with the shipped validators", () => {
    for (const { key, def } of generated) {
      expect(analyseCase(def, PEOPLE), key).toEqual([]);
      expect(dailyIssues(def), key).toEqual([]);
    }
  });

  it("follows the weekday ladder on every date", () => {
    for (const { key, def } of generated) {
      const tier = tierFor(def.weekday);
      expect(def.objects, key).toHaveLength(tier.objects);
      expect(
        def.deductions.map((item) => item.kind),
        key,
      ).toEqual([...tier.kinds]);
      expect(
        def.clues.filter((clue) => clue.flavour === true),
        key,
      ).toHaveLength(tier.flavour);
    }
  });

  it("reaches 3 stamps by the scripted solution on every date", () => {
    for (const { key, def } of generated) {
      const state = solve(def);
      expect(state.closed, key).toBe(true);
      expect(state.stamps, key).toBe(3);
      expect(state.deliveredId, key).toBe(def.ownerId);
    }
  });

  it("falls back on at most 18 dates (5 percent)", () => {
    const fallbacks = generated.filter((item) => item.def.fallback);
    expect(fallbacks.length).toBeLessThanOrEqual(MAX_FALLBACKS);
    for (const item of generated) expect(item.def.attempt).toBeLessThanOrEqual(MAX_DAILY_ATTEMPTS);
  });

  it("matches the summary committed in the task 03 evidence", () => {
    const attempts = generated.map((item) => item.def.attempt).sort((a, b) => a - b);
    const combos = new Set(
      generated.map(
        (item) =>
          `${item.def.ownerId}|${item.def.deductions.map((d) => `${d.facet}:${d.polarity}:${d.value}`).join("+")}`,
      ),
    );
    expect({
      fallbacks: generated.filter((item) => item.def.fallback).length,
      minAttempt: attempts[0],
      medianAttempt: attempts[Math.floor(attempts.length / 2)],
      maxAttempt: attempts.at(-1),
      owners: new Set(generated.map((item) => item.def.ownerId)).size,
      combinations: combos.size,
    }).toEqual({
      fallbacks: 0,
      minAttempt: 0,
      medianAttempt: 0,
      maxAttempt: 4,
      owners: 12,
      combinations: 230,
    });
  });
});
