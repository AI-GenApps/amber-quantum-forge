import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { encodePuzzle, encodeTiles } from "../../src/code";
import { hashText } from "../../src/gen/rng";
import { shiftDate, weekdayOf } from "../../src/progress/calendar";
import {
  DAILY_TIERS,
  dailyGenSeed,
  dailyId,
  dailyParams,
  dailyTier,
  GENERATOR_VERSION,
  generateDaily,
} from "../../src/progress/daily";
import { COLOURS } from "../../src/puzzle";
import { evaluate } from "../../src/rules";
import { solve } from "../../src/solver";

const START = "2026-10-23";
const DAYS = 365;
const REPORT_DIR = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".agents",
  "resources",
  "2026-10-23",
  "web-games",
  "lantern-loops",
  "03",
);

const seedFor = (dateKey: string): number => hashText(`lantern-loops|daily|${dateKey}`);

describe("daily tiers", () => {
  it("has seven weekday templates in the product table", () => {
    expect(GENERATOR_VERSION).toBe("ll-gen-1");
    expect(DAILY_TIERS.map((t) => [t.weekday, t.size])).toEqual([
      [1, 5],
      [2, 6],
      [3, 7],
      [4, 7],
      [5, 8],
      [6, 8],
      [7, 9],
    ]);
    expect(DAILY_TIERS.map((t) => t.tier)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(dailyTier(4).mechanics).toEqual({ stones: true, mirrors: true, gates: false });
    expect(dailyTier(1).mechanics).toEqual({ stones: false, mirrors: false, gates: false });
    expect(dailyTier(6).colourCount).toEqual([2, 3]);
    expect(dailyTier(7).colourCount).toEqual([3, 5]);
  });

  it("builds ids and mixes the generator version into the seed", () => {
    expect(dailyId("2026-10-23")).toBe("daily-2026-10-23");
    expect(dailyGenSeed(7)).toBe(hashText("ll-gen-1|daily|7"));
    expect(dailyGenSeed(7)).not.toBe(dailyGenSeed(8));
  });

  it("picks colours deterministically inside the tier range", () => {
    for (let seed = 0; seed < 50; seed++) {
      const sat = dailyParams(6, seed).colours ?? [];
      const sun = dailyParams(7, seed).colours ?? [];
      expect(sat.length).toBeGreaterThanOrEqual(2);
      expect(sat.length).toBeLessThanOrEqual(3);
      expect(sun.length).toBeGreaterThanOrEqual(3);
      expect(sun.length).toBeLessThanOrEqual(5);
      expect(new Set(sun).size).toBe(sun.length);
      expect(dailyParams(7, seed).colours).toEqual(sun);
      expect(dailyParams(1, seed).colours).toEqual(["amber"]);
    }
  });
});

interface Row {
  date: string;
  weekday: number;
  size: number;
  rating: number;
  ms: number;
  distinctColours: number;
  clues: Record<string, number>;
  code: string;
}

describe(`${DAYS} consecutive dailies from ${START}`, () => {
  it("are unique, solved by the stored solution, tier-shaped, reproducible and distinct", () => {
    const rows: Row[] = [];
    const codes = new Set<string>();
    let total = 0;
    const started = performance.now();
    for (let k = 0; k < DAYS; k++) {
      const date = shiftDate(START, k);
      const weekday = weekdayOf(date);
      const tier = dailyTier(weekday);
      const seed = seedFor(date);
      const t0 = performance.now();
      const made = generateDaily(seed, weekday, dailyId(date));
      const ms = performance.now() - t0;
      total += ms;
      expect(ms, `${date} generation time`).toBeLessThan(2000);

      const { puzzle, solution } = made;
      const found = solve(puzzle, { limit: 2 });
      expect(found.count, `${date} solution count`).toBe(1);
      expect(found.exhausted).toBe(false);
      expect(encodeTiles(found.solutions[0] as Uint8Array)).toBe(encodeTiles(solution));
      expect(evaluate(puzzle, solution).solved, `${date} evaluate`).toBe(true);

      expect(puzzle.id).toBe(dailyId(date));
      expect(puzzle.size).toBe(tier.size);
      const clues: Record<string, number> = { lantern: 0, mirror: 0, gate: 0, stone: 0 };
      const colours = new Set<string>();
      for (const cell of puzzle.cells) {
        if (cell.kind === "stone") clues.stone = (clues.stone ?? 0) + 1;
        if (cell.clue) clues[cell.clue.kind] = (clues[cell.clue.kind] ?? 0) + 1;
        if (cell.clue?.kind === "lantern") colours.add(cell.clue.colour);
      }
      expect(clues.lantern, `${date} lanterns`).toBeGreaterThan(0);
      expect((clues.stone ?? 0) > 0, `${date} stones`).toBe(tier.mechanics.stones);
      expect((clues.mirror ?? 0) > 0, `${date} mirrors`).toBe(tier.mechanics.mirrors);
      expect((clues.gate ?? 0) > 0, `${date} gates`).toBe(tier.mechanics.gates);
      expect(colours.size).toBeGreaterThanOrEqual(tier.colourCount[0]);
      expect(colours.size).toBeLessThanOrEqual(tier.colourCount[1]);
      for (const colour of colours) expect(COLOURS).toContain(colour);

      const code = encodePuzzle(puzzle);
      expect(
        encodePuzzle(generateDaily(seed, weekday, dailyId(date)).puzzle),
        `${date} regenerate`,
      ).toBe(code);
      codes.add(code);
      rows.push({
        date,
        weekday,
        size: puzzle.size,
        rating: made.rating,
        ms: Math.round(ms * 10) / 10,
        distinctColours: colours.size,
        clues,
        code,
      });
    }
    const slowest = rows.reduce((a, b) => (b.ms > a.ms ? b : a));
    const summary = {
      generator: GENERATOR_VERSION,
      start: START,
      days: DAYS,
      distinctCodes: codes.size,
      totalMs: Math.round(total),
      meanMs: Math.round((total / DAYS) * 10) / 10,
      slowest: { date: slowest.date, weekday: slowest.weekday, size: slowest.size, ms: slowest.ms },
      wallMs: Math.round(performance.now() - started),
    };
    console.log(`daily report: ${JSON.stringify(summary)}`);
    expect(codes.size / DAYS).toBeGreaterThanOrEqual(0.99);
    expect(performance.now() - started).toBeLessThan(120_000);

    const file = join(REPORT_DIR, "daily-report.json");
    if (process.env.LL_WRITE_REPORT === "1" || !existsSync(file)) {
      mkdirSync(REPORT_DIR, { recursive: true });
      writeFileSync(file, `${JSON.stringify({ ...summary, rows }, null, 2)}\n`);
    }
  });
});
