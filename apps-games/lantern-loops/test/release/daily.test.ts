import { createMemoryAdapter } from "@web-games/kit";
import {
  archiveKeys,
  buildShareText,
  type StreakEvent,
  shiftDate,
  weekdayOf,
} from "@web-games/lantern-loops-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
  type ArchiveEntry,
  archiveList,
  clearDailyCache,
  createServices,
  type DailyResult,
  puzzleForDate,
  type Services,
} from "../../src/services";

const START = "2026-10-19";
const DAYS = 40;
/** Day indexes (0 = 2026-10-19, a Monday) on which the player opens the app but plays no daily. */
const MISSED = new Set([5, 8, 9]);
/** Day indexes on which the player spends one hint before solving. */
const HINT_DAYS = new Set([1, 11, 20]);
const MILESTONE_TOKENS: Record<number, number> = { 3: 1, 7: 2, 14: 2, 30: 4 };

interface DayLog {
  day: number;
  date: string;
  played: boolean;
  result?: DailyResult;
  tokens: number;
  streak: number;
  freezes: number;
  open: StreakEvent[];
}

let clock = new Date(2026, 9, 19, 9, 0, 0);
let services: Services;
const log: DayLog[] = [];

function setDay(day: number): string {
  const date = shiftDate(START, day);
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  clock = new Date(y, m - 1, d, 9, 0, 0);
  return date;
}

beforeAll(async () => {
  clearDailyCache();
  services = createServices({ adapter: createMemoryAdapter(), now: () => clock });
  setDay(0);
  await services.start();
  for (let day = 0; day < DAYS; day++) {
    const date = setDay(day);
    const open = day === 0 ? { events: [] } : await services.progression.refreshOnOpen();
    if (MISSED.has(day)) {
      const p = services.progression.current();
      log.push({
        day,
        date,
        played: false,
        tokens: p.tokens,
        streak: p.streak,
        freezes: p.freezes,
        open: open.events,
      });
      continue;
    }
    const hints = HINT_DAYS.has(day) ? 1 : 0;
    if (hints > 0) {
      await services.progression.spendHint();
    }
    const result = await services.progression.completeDaily({ hints, seconds: 100 + day });
    const p = services.progression.current();
    log.push({
      day,
      date,
      played: true,
      result,
      tokens: p.tokens,
      streak: p.streak,
      freezes: p.freezes,
      open: open.events,
    });
  }
}, 120000);

function at(day: number): DayLog {
  const entry = log[day];
  if (entry === undefined) throw new Error(`no log for day ${day}`);
  return entry;
}

describe("40-day daily simulation (fake clock, real services)", () => {
  it("covers 40 consecutive dates starting on a Monday", () => {
    expect(log).toHaveLength(DAYS);
    expect(weekdayOf(at(0).date)).toBe(1);
    expect(at(39).date).toBe("2026-11-27");
  });

  it("pays 2 tokens for a hint-free daily and 1 with a hint (checkpoints)", () => {
    expect([0, 1, 2, 3, 4].map((d) => at(d).tokens)).toEqual([5, 5, 8, 10, 12]);
    expect(at(0).result).toMatchObject({ tokensGranted: 2, streak: 1, firstSolve: true });
    expect(at(1).result).toMatchObject({ tokensGranted: 1, balance: 5 });
    expect(at(2).result).toMatchObject({ tokensGranted: 3, streak: 3 });
  });

  it("matches an independent token model with the cap of 20", () => {
    let tokens = 3;
    let streak = 0;
    let lastPlayed = -99;
    let paid: number[] = [];
    for (const entry of log) {
      if (HINT_DAYS.has(entry.day)) tokens -= 1;
      if (entry.played) {
        const gap = entry.day - lastPlayed;
        const saved = gap === 2 && entry.day === 6;
        if (gap === 1 || saved) streak += 1;
        else {
          streak = 1;
          paid = [];
        }
        lastPlayed = entry.day;
        let reward = HINT_DAYS.has(entry.day) ? 1 : 2;
        const milestone = MILESTONE_TOKENS[streak];
        if (milestone !== undefined && !paid.includes(streak)) {
          reward += milestone;
          paid.push(streak);
        }
        tokens = Math.min(20, tokens + reward);
        expect(entry.streak, `streak on ${entry.date}`).toBe(streak);
      }
      expect(entry.tokens, `tokens on ${entry.date}`).toBe(tokens);
    }
    expect(services.progression.current().tokens).toBe(tokens);
    expect(Math.max(...log.map((e) => e.tokens))).toBe(20);
  });

  it("uses the weekly freeze for a single missed day, then refills it next week", () => {
    expect(at(5).played).toBe(false);
    expect(at(6).result?.events).toEqual([{ kind: "freeze-used" }]);
    expect(at(6).result?.streak).toBe(6);
    expect([at(5).freezes, at(6).freezes]).toEqual([1, 0]);
    expect(at(7).open).toEqual([{ kind: "freeze-refilled" }]);
    expect(at(7).freezes).toBe(1);
    const refills = log.filter((e) => e.open.some((ev) => ev.kind === "freeze-refilled"));
    expect(refills.map((e) => e.date)).toEqual(["2026-10-26"]);
  });

  it("resets the streak after two missed days, with no freeze left to spend", () => {
    expect([at(8).played, at(9).played]).toEqual([false, false]);
    expect(at(10).result?.events).toEqual([{ kind: "streak-reset", previous: 7 }]);
    expect(at(10).result?.streak).toBe(1);
    expect(services.progression.current().bestStreak).toBe(30);
  });

  it("raises every milestone 3, 7, 14 and 30 once per run", () => {
    const milestones = log.flatMap((e) =>
      (e.result?.events ?? [])
        .filter((ev) => ev.kind === "milestone")
        .map((ev) => [e.date, ev.kind === "milestone" ? [ev.days, ev.tokens] : []]),
    );
    expect(milestones).toEqual([
      ["2026-10-21", [3, 1]],
      ["2026-10-26", [7, 2]],
      ["2026-10-31", [3, 1]],
      ["2026-11-04", [7, 2]],
      ["2026-11-11", [14, 2]],
      ["2026-11-27", [30, 4]],
    ]);
  });

  it("ends with a 30 day streak, the freeze in the jar and the profile saved", () => {
    const p = services.progression.current();
    expect(p).toMatchObject({ streak: 30, lastDailyDate: "2026-11-27", freezes: 1 });
    expect(p.freezeWeek).toBe("2026-W48");
    expect(Object.keys(p.dailiesSolved)).toHaveLength(37);
    expect(p.milestonesGranted).toEqual([3, 7, 14, 30]);
  });

  it("builds the share text for the last daily with and without the path", () => {
    const daily = puzzleForDate("2026-11-27");
    const hidden = buildShareText({
      dateKey: daily.dateKey,
      stars: 3,
      seconds: 139,
      puzzle: daily.puzzle,
      tiles: daily.solution,
    });
    const lines = hidden.split("\n");
    expect(lines.slice(0, 2)).toEqual(["Lantern Loops Daily 2026-11-27", "3 stars  2:19"]);
    expect(lines).toHaveLength(2 + daily.puzzle.size);
    expect(lines.slice(2).every((row) => [...row].length === daily.puzzle.size)).toBe(true);
    expect(hidden).toContain("🏮");
    const shown = buildShareText({
      dateKey: daily.dateKey,
      stars: 1,
      seconds: 61,
      puzzle: daily.puzzle,
      tiles: daily.solution,
      hidePath: false,
    });
    expect(shown.split("\n").slice(0, 2)).toEqual([
      "Lantern Loops Daily 2026-11-27",
      "1 star  1:01",
    ]);
    expect(shown).not.toContain("🏮");
    expect(shown).toMatch(/[🟧🟥🟩🟦🟪]/u);
  });
});

describe("archive after the simulation", () => {
  const today = "2026-11-27";

  it("lists the 30 previous dates, all played except the one missed date inside the window", () => {
    const keys = archiveKeys(today);
    expect([keys[0], keys[29]]).toEqual(["2026-11-26", "2026-10-28"]);
    const list = archiveList(today, services.progression.current());
    expect(list).toHaveLength(30);
    const open = list.filter((e: ArchiveEntry) => e.status === "to-play");
    expect(open.map((e) => e.dateKey)).toEqual(["2026-10-28"]);
  });

  it("refuses a date outside the window", async () => {
    await expect(
      services.progression.completeArchive("2026-10-27", { hints: 0, seconds: 50 }),
    ).rejects.toThrow(RangeError);
  });

  it("pays +1 once for a hint-free archive solve and leaves the streak alone", async () => {
    for (let k = 0; k < 3; k++) await services.progression.spendHint();
    expect(services.progression.current().tokens).toBe(17);
    const first = await services.progression.completeArchive("2026-10-28", {
      hints: 0,
      seconds: 70,
    });
    expect(first).toMatchObject({
      kind: "archive",
      firstSolve: true,
      tokensGranted: 1,
      balance: 18,
      streak: 30,
      streakCounted: false,
    });
    const replay = await services.progression.completeArchive("2026-10-28", {
      hints: 0,
      seconds: 60,
    });
    expect(replay).toMatchObject({ firstSolve: false, tokensGranted: 0, balance: 18 });
    const p = services.progression.current();
    expect(p).toMatchObject({ streak: 30, tokens: 18, archiveRewarded: ["2026-10-28"] });
    expect(p.dailiesSolved["2026-10-28"]).toEqual({ stars: 3, seconds: 60 });
  });

  it("gives no token for an archive solve that used a hint", async () => {
    const other = createServices({ adapter: createMemoryAdapter(), now: () => clock });
    await other.start();
    const result = await other.progression.completeArchive("2026-11-20", {
      hints: 1,
      seconds: 90,
    });
    expect(result).toMatchObject({ stars: 2, tokensGranted: 0, balance: 3 });
  });
});
