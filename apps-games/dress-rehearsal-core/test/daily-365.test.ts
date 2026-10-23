import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  type Category,
  checkRule,
  closetFor,
  createPrng,
  DAILY_BRIEF_MAX,
  type DailyChallenge,
  generateDaily,
  hashString,
  MAX_THREE_STAR_SHARE,
  poolsOf,
  quickStars,
  randomLook,
  scoreLook,
  validateChallenge,
  weekdayOfKey,
} from "../src/index";

const START = "2026-01-01";
const DAYS = 365;
const LEVELS = [1, 2, 3, 4, 5] as const;
const MAX_FALLBACKS = 18;
const CLOSET_SIZES = [16, 24, 32, 40, 48];

interface Year {
  readonly level: number;
  readonly results: readonly DailyChallenge[];
}

const years = new Map<number, Year>();

function yearFor(level: number): Year {
  const cached = years.get(level);
  if (cached !== undefined) return cached;
  const closet = closetFor(level);
  const results: DailyChallenge[] = [];
  for (let day = 0; day < DAYS; day += 1) {
    const dateKey = addDaysToKey(START, day);
    results.push(
      generateDaily(
        {
          seed: hashString(`dress-rehearsal|daily|${dateKey}`),
          weekday: weekdayOfKey(dateKey),
          closet,
          dateKey,
        },
        { strict: true },
      ),
    );
  }
  const year = { level, results };
  years.set(level, year);
  return year;
}

describe.each(LEVELS)("365 daily dates at closet level %i", (level) => {
  const closet = closetFor(level);

  it("uses the expected closet size", () => {
    expect(closet.length).toBe(CLOSET_SIZES[level - 1]);
  });

  it("generates 365 consecutive dates, each with a unique id", () => {
    const { results } = yearFor(level);
    expect(results).toHaveLength(DAYS);
    expect(new Set(results.map((out) => out.id)).size).toBe(DAYS);
    expect(results[0]?.id).toBe("daily-2026-01-01");
    expect(results[DAYS - 1]?.id).toBe("daily-2026-12-31");
  });

  it("stores a reference look that scores three stars under scoreLook", () => {
    for (const out of yearFor(level).results) {
      const result = scoreLook(out, closet, out.reference);
      expect(result.stars, out.id).toBe(3);
      expect(result.complete, out.id).toBe(true);
    }
  });

  it("uses at most 18 fallbacks (5 percent)", () => {
    const fallbacks = yearFor(level).results.filter((out) => out.source === "fallback");
    expect(fallbacks.length).toBeLessThanOrEqual(MAX_FALLBACKS);
  });

  it("passes the structural checks of validateChallenge every day", () => {
    for (const out of yearFor(level).results) {
      const issues = validateChallenge(out, closet, { briefMax: DAILY_BRIEF_MAX });
      expect(issues, out.id).toEqual([]);
    }
  });

  it("keeps every brief within 120 characters", () => {
    for (const out of yearFor(level).results) {
      expect(out.brief.length, out.id).toBeLessThanOrEqual(DAILY_BRIEF_MAX);
    }
  });

  it("passes the non-triviality sample: generated challenges are not trivially easy", () => {
    const pools = poolsOf(closet);
    for (const out of yearFor(level).results) {
      if (out.source !== "generated") continue;
      expect(out.sampledShare, out.id).toBeLessThanOrEqual(MAX_THREE_STAR_SHARE);
      const rnd = createPrng(hashString(`check|${out.id}`));
      const sample = Array.from({ length: 400 }, () => randomLook(out.slotSet, pools, rnd));
      const looks = sample.filter((pieces) => pieces !== null);
      expect(looks.length, out.id).toBe(400);
      const threeStar = looks.filter((pieces) => quickStars(out.rules, pieces) === 3).length;
      expect(threeStar / looks.length, out.id).toBeLessThanOrEqual(0.2);
      for (const rule of out.rules) {
        const failing = looks.filter((pieces) => !checkRule(rule, pieces)).length;
        expect(failing / looks.length, `${out.id} ${rule.kind}`).toBeGreaterThanOrEqual(0.1);
      }
    }
  });

  it("an empty board never scores", () => {
    for (const out of yearFor(level).results) {
      expect(scoreLook(out, closet, {}).stars, out.id).toBe(0);
    }
  });
});

describe("365-date summary", () => {
  it("fallback counts per closet level stay within the cap and shrink with a bigger closet", () => {
    const counts = LEVELS.map(
      (level) => yearFor(level).results.filter((out) => out.source === "fallback").length,
    );
    for (const count of counts) expect(count).toBeLessThanOrEqual(MAX_FALLBACKS);
    expect(counts[0]).toBeGreaterThanOrEqual(counts[4] ?? 0);
  });

  it("different closet levels draw from only the pieces they own", () => {
    const categories = new Set<Category>();
    for (const out of yearFor(1).results) {
      for (const slot of Object.keys(out.reference) as Category[]) categories.add(slot);
    }
    expect(categories.size).toBe(8);
  });
});
