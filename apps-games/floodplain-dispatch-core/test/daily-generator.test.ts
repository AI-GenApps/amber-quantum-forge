import { describe, expect, it } from "vitest";
import {
  DAILY_TIERS,
  dailySeedOf,
  FALLBACK_TEMPLATES,
  generateDaily,
  hashString,
  MAX_ATTEMPTS,
  parseLayout,
  provesThreeStars,
  tierFor,
  validateDailyMap,
  weekdayOfDateKey,
} from "../src";

const MONDAY = "2026-10-19";

function keyAt(offset: number): string {
  return new Date(Date.UTC(2026, 9, 19 + offset)).toISOString().slice(0, 10);
}

function weekOf(offset: number): number {
  return weekdayOfDateKey(keyAt(offset)) ?? -1;
}

describe("date helpers", () => {
  it("numbers weekdays from Monday", () => {
    expect(weekdayOfDateKey(MONDAY)).toBe(0);
    expect(weekdayOfDateKey("2026-10-23")).toBe(4);
    expect(weekdayOfDateKey("2026-10-25")).toBe(6);
    expect(weekdayOfDateKey("2026-01-01")).toBe(3);
    expect(weekdayOfDateKey("2028-02-29")).toBe(1);
    expect(weekdayOfDateKey("garbage")).toBeNull();
    expect(weekdayOfDateKey("2026-13-01")).toBeNull();
  });

  it("agrees with the platform calendar for 400 consecutive days", () => {
    for (let i = 0; i < 400; i++) {
      const date = new Date(Date.UTC(2026, 0, 1 + i));
      const expected = (date.getUTCDay() + 6) % 7;
      expect(weekdayOfDateKey(date.toISOString().slice(0, 10))).toBe(expected);
    }
  });

  it("derives the seed the way the kit does", () => {
    expect(dailySeedOf("2026-10-23")).toBe(hashString("floodplain-dispatch|daily|2026-10-23"));
    expect(dailySeedOf("2026-10-23")).not.toBe(dailySeedOf("2026-10-24"));
  });
});

describe("tier ladder (product.md)", () => {
  const sizes: Array<[number, number, number]> = [
    [0, 8, 12],
    [1, 8, 12],
    [2, 9, 13],
    [3, 10, 14],
    [4, 10, 14],
    [5, 11, 15],
    [6, 12, 16],
  ];

  it.each(sizes)("weekday %i is %i x %i", (weekday, width, height) => {
    const tier = tierFor(weekday);
    expect([tier.width, tier.height]).toEqual([width, height]);
    expect(DAILY_TIERS[weekday]).toBe(tier);
  });

  it("adds one mechanic at a time", () => {
    const [mon, tue, wed, thu, fri, sat, sun] = DAILY_TIERS;
    const has = (tier: typeof mon, type: string): boolean =>
      tier?.events.some((e) => e.type === type) ?? false;
    expect(mon?.events).toEqual([]);
    expect(mon?.tide).toBeNull();
    expect(has(tue, "surge")).toBe(true);
    expect(tue?.pieces).not.toContain("pump");
    expect(wed?.events.find((e) => e.type === "surge")?.count).toBeGreaterThanOrEqual(2);
    expect(wed?.pieces).toContain("pump");
    expect(thu?.pieces).toContain("gate");
    expect(has(thu, "surge")).toBe(true);
    expect(fri?.pieces).toContain("reservoir");
    expect(has(fri, "drought")).toBe(true);
    expect(sat?.tide).not.toBeNull();
    expect(sun?.tide).not.toBeNull();
    for (const type of ["surge", "drought", "storm-tide"]) expect(has(sun, type)).toBe(true);
    expect(sun?.pieces).toEqual(["canal", "barrier", "pump", "gate", "reservoir"]);
  });

  it("wraps weekday numbers", () => {
    expect(tierFor(7)).toBe(DAILY_TIERS[0]);
    expect(tierFor(-1)).toBe(DAILY_TIERS[6]);
  });
});

describe("generateDaily", () => {
  it("returns the same map for the same seed and tier, down to the reference", () => {
    for (const tier of DAILY_TIERS) {
      const seed = dailySeedOf(keyAt(tier.weekday));
      const a = generateDaily(seed, tier);
      const b = generateDaily(seed, tier);
      expect(b.map).toEqual(a.map);
      expect(b.attempt).toBe(a.attempt);
    }
  });

  it("makes different maps for different dates", () => {
    const layouts = new Set<string>();
    for (let i = 0; i < 14; i++) {
      const puzzle = generateDaily(dailySeedOf(keyAt(i)), tierFor(weekOf(i)));
      layouts.add(puzzle.map.layout.join("/"));
    }
    expect(layouts.size).toBe(14);
  });

  it("makes different maps for the same weekday a week apart", () => {
    const a = generateDaily(dailySeedOf(keyAt(0)), tierFor(0));
    const b = generateDaily(dailySeedOf(keyAt(7)), tierFor(0));
    expect(a.map.layout).not.toEqual(b.map.layout);
  });

  it("gives every weekday tier a valid, proven map of the right size and mechanics", () => {
    for (let i = 0; i < 14; i++) {
      const tier = tierFor(weekOf(i));
      const puzzle = generateDaily(dailySeedOf(keyAt(i)), tier);
      expect(validateDailyMap(puzzle.map, tier)).toEqual([]);
      expect(provesThreeStars(puzzle.map)).toBe(true);
      const parsed = parseLayout(puzzle.map.layout);
      expect(parsed.ok && [parsed.layout.width, parsed.layout.height]).toEqual([
        tier.width,
        tier.height,
      ]);
      expect(puzzle.map.budget).toBe(puzzle.map.par + 3);
      expect(puzzle.map.reference.length).toBeGreaterThan(0);
    }
  });

  it("always has an inlet reachable by a connected reference", () => {
    for (let i = 0; i < 7; i++) {
      const puzzle = generateDaily(dailySeedOf(keyAt(i)), tierFor(weekOf(i)));
      expect(puzzle.map.reference.some((p) => p.kind === "canal")).toBe(true);
    }
  });

  it("falls back to a committed template when no attempt is allowed", () => {
    for (const tier of DAILY_TIERS) {
      const used = new Set<number | null>();
      for (let n = 0; n < 6; n++) {
        const puzzle = generateDaily(n * 7919 + tier.weekday, tier, { maxAttempts: 0 });
        expect(puzzle.fallback).not.toBeNull();
        expect(puzzle.attempt).toBe(0);
        expect(validateDailyMap(puzzle.map, tier)).toEqual([]);
        used.add(puzzle.fallback);
      }
      expect(used.size).toBe(2);
    }
  });

  it("allows at most 12 attempts", () => {
    expect(MAX_ATTEMPTS).toBe(12);
  });
});

describe("fallback templates", () => {
  it("has 14 templates, 2 per weekday tier", () => {
    expect(FALLBACK_TEMPLATES).toHaveLength(14);
    for (const tier of DAILY_TIERS) {
      expect(FALLBACK_TEMPLATES.filter((t) => t.weekday === tier.weekday)).toHaveLength(2);
    }
  });

  it("validates each template on its own", () => {
    for (const template of FALLBACK_TEMPLATES) {
      expect(validateDailyMap(template.map, tierFor(template.weekday))).toEqual([]);
      expect(provesThreeStars(template.map)).toBe(true);
    }
  });

  it("has two different maps per tier", () => {
    for (const tier of DAILY_TIERS) {
      const pair = FALLBACK_TEMPLATES.filter((t) => t.weekday === tier.weekday);
      expect(pair[0]?.map.layout).not.toEqual(pair[1]?.map.layout);
    }
  });
});

describe("validateDailyMap catches defects", () => {
  const tier = tierFor(0);
  const base = generateDaily(dailySeedOf(MONDAY), tier).map;

  it("flags a wrong budget, cost and weeks", () => {
    expect(validateDailyMap({ ...base, budget: base.par + 1 }, tier).map((i) => i.code)).toContain(
      "BUDGET_RULE",
    );
    expect(
      validateDailyMap({ ...base, par: base.par + 1, budget: base.par + 4 }, tier).map(
        (i) => i.code,
      ),
    ).toContain("REFERENCE_COST");
    expect(validateDailyMap({ ...base, weeks: 21 }, tier).map((i) => i.code)).toContain("WEEKS");
  });

  it("flags an empty reference that cannot earn the stars", () => {
    const codes = validateDailyMap({ ...base, par: 0, budget: 3, reference: [] }, tier).map(
      (i) => i.code,
    );
    expect(codes).toContain("REFERENCE_STARS");
  });

  it("flags a bad layout and a wrong tier", () => {
    expect(validateDailyMap({ ...base, layout: ["zz"] }, tier)[0]?.code).toBe("LAYOUT_PARSE");
    expect(validateDailyMap(base, tierFor(3)).map((i) => i.code)).toContain("SIZE");
  });

  it("flags events outside the season", () => {
    const events = [{ type: "surge" as const, week: 19, weeks: 5, delta: 2 }];
    const codes = validateDailyMap({ ...base, events }, tier).map((i) => i.code);
    expect(codes).toContain("EVENT_RANGE");
    expect(codes).toContain("EVENT_COUNT");
  });
});
