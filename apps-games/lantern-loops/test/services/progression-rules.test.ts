import { CAMPAIGN } from "@web-games/lantern-loops-core";
import { describe, expect, it } from "vitest";
import { defaults, type Profile } from "../../src/save/profile";
import {
  completeArchive,
  completeDaily,
  completePuzzle,
  refreshOnOpen,
  spendHint,
} from "../../src/services/progression-rules";

const TODAY = "2026-10-23";

function profile(patch: Partial<Profile> = {}): Profile {
  return { ...defaults(), ...patch };
}

function starsOf(count: number, from = 0, value = 3): Record<string, number> {
  const out: Record<string, number> = {};
  for (const record of CAMPAIGN.slice(from, from + count)) out[record.id] = value;
  return out;
}

describe("completePuzzle", () => {
  it("awards stars by hints and records time and play time", () => {
    const a = completePuzzle(profile(), "harbor-01", { hints: 0, seconds: 100 });
    expect(a.result).toMatchObject({
      stars: 3,
      previousStars: 0,
      newBestTime: true,
      tokensGranted: 0,
    });
    expect(a.profile.stars["harbor-01"]).toBe(3);
    expect(a.profile.bestTimes["harbor-01"]).toBe(100);
    expect(a.profile.playSeconds).toBe(100);
    expect(completePuzzle(profile(), "harbor-02", { hints: 1, seconds: 5 }).result.stars).toBe(2);
    expect(completePuzzle(profile(), "harbor-03", { hints: 5, seconds: 5 }).result.stars).toBe(1);
  });

  it("never lowers stars and keeps the faster time", () => {
    const first = completePuzzle(profile(), "harbor-01", { hints: 0, seconds: 60 }).profile;
    const worse = completePuzzle(first, "harbor-01", { hints: 4, seconds: 90 });
    expect(worse.result).toMatchObject({ stars: 3, previousStars: 3, newBestTime: false });
    expect(worse.profile.stars["harbor-01"]).toBe(3);
    expect(worse.profile.bestTimes["harbor-01"]).toBe(60);
    expect(worse.profile.playSeconds).toBe(150);
    const faster = completePuzzle(worse.profile, "harbor-01", { hints: 0, seconds: 40 });
    expect(faster.profile.bestTimes["harbor-01"]).toBe(40);
  });

  it("reports a chapter unlock when the total crosses 45", () => {
    const base = profile({ stars: starsOf(14) });
    const step = completePuzzle(base, "harbor-15", { hints: 0, seconds: 10 });
    expect(step.result.chaptersUnlocked).toEqual(["garden"]);
    expect(
      completePuzzle(step.profile, "harbor-16", { hints: 0, seconds: 10 }).result.chaptersUnlocked,
    ).toEqual([]);
    const lower = completePuzzle(profile({ stars: starsOf(14, 0, 2) }), "harbor-15", {
      hints: 0,
      seconds: 10,
    });
    expect(lower.result.chaptersUnlocked).toEqual([]);
  });

  it("pays +5 once when a chapter is cleared", () => {
    const base = profile({ stars: starsOf(29, 0, 1), tokens: 3 });
    const done = completePuzzle(base, "harbor-30", { hints: 2, seconds: 10 });
    expect(done.result.chaptersCleared).toEqual(["harbor"]);
    expect(done.result).toMatchObject({ tokensGranted: 5, balance: 8, tokensCapped: false });
    expect(done.profile.chaptersCleared).toEqual(["harbor"]);
    const replay = completePuzzle(done.profile, "harbor-30", { hints: 0, seconds: 5 });
    expect(replay.result.chaptersCleared).toEqual([]);
    expect(replay.result.tokensGranted).toBe(0);
  });

  it("caps the chapter reward at 20 tokens", () => {
    const base = profile({ stars: starsOf(29, 0, 1), tokens: 18 });
    const done = completePuzzle(base, "harbor-30", { hints: 0, seconds: 10 });
    expect(done.result).toMatchObject({ tokensGranted: 2, tokensCapped: true, balance: 20 });
  });

  it("rejects unknown ids", () => {
    expect(() => completePuzzle(profile(), "nope-01", { hints: 0, seconds: 5 })).toThrow(
      RangeError,
    );
    expect(() => completePuzzle(profile(), "daily-2026-10-23", { hints: 0, seconds: 5 })).toThrow(
      RangeError,
    );
  });
});

describe("completeDaily", () => {
  it("pays 2 tokens for a no-hint first solve and starts the streak", () => {
    const step = completeDaily(profile(), TODAY, { hints: 0, seconds: 120 });
    expect(step.result).toMatchObject({
      kind: "daily",
      firstSolve: true,
      stars: 3,
      tokensGranted: 2,
      balance: 5,
      streak: 1,
      streakCounted: true,
    });
    expect(step.profile).toMatchObject({ streak: 1, bestStreak: 1, lastDailyDate: TODAY });
    expect(step.profile.dailiesSolved[TODAY]).toEqual({ stars: 3, seconds: 120 });
  });

  it("pays 1 token when a hint was used", () => {
    expect(completeDaily(profile(), TODAY, { hints: 1, seconds: 50 }).result).toMatchObject({
      tokensGranted: 1,
      stars: 2,
    });
  });

  it("is idempotent: a second solve pays nothing and keeps the streak", () => {
    const first = completeDaily(profile(), TODAY, { hints: 1, seconds: 100 }).profile;
    const again = completeDaily(first, TODAY, { hints: 0, seconds: 70 });
    expect(again.result).toMatchObject({
      firstSolve: false,
      tokensGranted: 0,
      streakCounted: false,
      stars: 3,
      previousStars: 2,
    });
    expect(again.profile.tokens).toBe(first.tokens);
    expect(again.profile.streak).toBe(1);
    expect(again.profile.dailiesSolved[TODAY]).toEqual({ stars: 3, seconds: 70 });
  });

  it("continues on the next day and pays the 3-day milestone with the daily", () => {
    const base = profile({ streak: 2, bestStreak: 2, lastDailyDate: "2026-10-22", tokens: 4 });
    const step = completeDaily(base, TODAY, { hints: 0, seconds: 30 });
    expect(step.result.streak).toBe(3);
    expect(step.result.events).toEqual([{ kind: "milestone", days: 3, tokens: 1 }]);
    expect(step.result.tokensGranted).toBe(3);
    expect(step.profile.tokens).toBe(7);
    expect(step.profile.milestonesGranted).toEqual([3]);
  });

  it("spends the freeze on exactly one missed day", () => {
    const base = profile({ streak: 4, bestStreak: 4, lastDailyDate: "2026-10-21", freezes: 1 });
    const step = completeDaily(base, TODAY, { hints: 0, seconds: 30 });
    expect(step.result.events).toEqual([{ kind: "freeze-used" }]);
    expect(step.profile).toMatchObject({ streak: 5, freezes: 0 });
  });

  it("resets after two missed days", () => {
    const base = profile({ streak: 4, bestStreak: 4, lastDailyDate: "2026-10-20", freezes: 1 });
    const step = completeDaily(base, TODAY, { hints: 0, seconds: 30 });
    expect(step.result.events).toEqual([{ kind: "streak-reset", previous: 4 }]);
    expect(step.profile).toMatchObject({ streak: 1, freezes: 1, bestStreak: 4 });
  });

  it("changes no streak when the clock went back but still records the solve once", () => {
    const base = profile({ streak: 4, bestStreak: 4, lastDailyDate: "2026-10-25" });
    const step = completeDaily(base, TODAY, { hints: 0, seconds: 30 });
    expect(step.result.events).toEqual([{ kind: "clock-went-back" }]);
    expect(step.profile).toMatchObject({ streak: 4, lastDailyDate: "2026-10-25" });
  });

  it("flags the cap when the jar is nearly full", () => {
    const step = completeDaily(profile({ tokens: 19 }), TODAY, { hints: 0, seconds: 30 });
    expect(step.result).toMatchObject({ tokensGranted: 1, tokensCapped: true, balance: 20 });
  });
});

describe("completeArchive", () => {
  it("pays 1 token once for a no-hint solve and never touches the streak", () => {
    const base = profile({ streak: 6, bestStreak: 6, lastDailyDate: TODAY, tokens: 4 });
    const step = completeArchive(base, TODAY, "2026-10-20", { hints: 0, seconds: 99 });
    expect(step.result).toMatchObject({
      kind: "archive",
      tokensGranted: 1,
      balance: 5,
      firstSolve: true,
      streakCounted: false,
    });
    expect(step.profile).toMatchObject({ streak: 6, lastDailyDate: TODAY, tokens: 5 });
    expect(step.profile.archiveRewarded).toEqual(["2026-10-20"]);
    const replay = completeArchive(step.profile, TODAY, "2026-10-20", { hints: 0, seconds: 50 });
    expect(replay.result).toMatchObject({ tokensGranted: 0, firstSolve: false });
    expect(replay.profile.tokens).toBe(5);
    expect(replay.profile.dailiesSolved["2026-10-20"]?.seconds).toBe(50);
  });

  it("pays nothing when a hint was used, and not later either", () => {
    const first = completeArchive(profile(), TODAY, "2026-10-21", { hints: 1, seconds: 99 });
    expect(first.result.tokensGranted).toBe(0);
    expect(first.profile.archiveRewarded).toEqual([]);
    const later = completeArchive(first.profile, TODAY, "2026-10-21", { hints: 0, seconds: 60 });
    expect(later.result.tokensGranted).toBe(0);
  });

  it("only accepts the 30 previous dates", () => {
    expect(() => completeArchive(profile(), TODAY, TODAY, { hints: 0, seconds: 5 })).toThrow(
      RangeError,
    );
    expect(() => completeArchive(profile(), TODAY, "2026-09-22", { hints: 0, seconds: 5 })).toThrow(
      RangeError,
    );
    expect(() => completeArchive(profile(), TODAY, "2026-10-24", { hints: 0, seconds: 5 })).toThrow(
      RangeError,
    );
    expect(
      completeArchive(profile(), TODAY, "2026-09-23", { hints: 0, seconds: 5 }).result
        .tokensGranted,
    ).toBe(1);
  });

  it("prunes old reward markers", () => {
    const base = profile({ archiveRewarded: ["2026-01-01", "2026-10-01"] });
    const step = completeArchive(base, TODAY, "2026-10-22", { hints: 0, seconds: 5 });
    expect(step.profile.archiveRewarded).toEqual(["2026-10-01", "2026-10-22"]);
  });
});

describe("spendHint", () => {
  it("spends one token and counts the hint", () => {
    const step = spendHint(profile({ tokens: 2 }));
    expect(step.result).toEqual({ ok: true, balance: 1 });
    expect(step.profile).toMatchObject({ tokens: 1, hintsUsed: 1 });
  });

  it("is refused at zero without changing anything", () => {
    const base = profile({ tokens: 0 });
    const step = spendHint(base);
    expect(step.result).toEqual({ ok: false, balance: 0 });
    expect(step.profile).toBe(base);
  });
});

describe("refreshOnOpen", () => {
  it("refills the freeze once per ISO week", () => {
    const base = profile({ freezes: 0, freezeWeek: "2026-W42" });
    const first = refreshOnOpen(base, TODAY);
    expect(first.profile).toMatchObject({ freezes: 1, freezeWeek: "2026-W43" });
    expect(first.result.events).toEqual([{ kind: "freeze-refilled" }]);
    const used = { ...first.profile, freezes: 0 };
    expect(refreshOnOpen(used, "2026-10-25").profile.freezes).toBe(0);
    expect(refreshOnOpen(used, "2026-10-26").profile.freezes).toBe(1);
  });

  it("starts a new install with 1 freeze and no event", () => {
    const step = refreshOnOpen(profile(), TODAY);
    expect(step.profile.freezes).toBe(1);
    expect(step.result.events).toEqual([]);
  });
});
