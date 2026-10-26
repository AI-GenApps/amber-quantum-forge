import { describe, expect, it } from "vitest";
import {
  applyCaseResult,
  buyFreeze,
  buyHint,
  CASES,
  type CaseResult,
  CHAPTER_BONUS,
  createCaseState,
  defaultProfile,
  FIRST_CLOSE_POSTAGE,
  FREEZE_PRICE,
  HINT_PRICE,
  PEOPLE,
  type Profile,
  STAMP_POSTAGE,
  START_POSTAGE,
  TOTAL_STAMPS,
  totalStamps,
} from "../src";
import { docTable, numbers, row } from "./fixtures/doc";
import { solve } from "./fixtures/solve";

function result(stamps: number, extra: Partial<CaseResult> = {}): CaseResult {
  return {
    stamps,
    hints: 0,
    timeMs: 60_000,
    wrongAccusations: 3 - stamps,
    cluesFound: 6,
    byElimination: false,
    ...extra,
  };
}

function withPostage(postage: number): Profile {
  return { ...defaultProfile(), postage };
}

describe("economy.md tables are the source of the numbers", () => {
  const sources = docTable("economy.md", "## Sources of postage");
  const sinks = docTable("economy.md", "## Sinks of postage");

  it("sources", () => {
    expect(numbers(row(sources, "Starting grant")[1] ?? "")).toEqual([START_POSTAGE]);
    expect(numbers(row(sources, "First close")[1] ?? "")).toEqual([FIRST_CLOSE_POSTAGE]);
    expect(numbers(row(sources, "Each stamp")[1] ?? "")[0]).toBe(STAMP_POSTAGE);
    expect(numbers(row(sources, "Chapter bonus")[1] ?? "")).toEqual([CHAPTER_BONUS]);
    expect(START_POSTAGE).toBe(30);
    expect(FIRST_CLOSE_POSTAGE).toBe(10);
    expect(STAMP_POSTAGE).toBe(5);
    expect(CHAPTER_BONUS).toBe(40);
  });

  it("sinks", () => {
    expect(numbers(row(sinks, "Hint (campaign")[1] ?? "")).toEqual([HINT_PRICE.campaign]);
    expect(numbers(row(sinks, "Hint (daily")[1] ?? "")).toEqual([HINT_PRICE.daily]);
    expect(numbers(row(sinks, "Streak freeze")[1] ?? "")).toEqual([FREEZE_PRICE]);
    expect(HINT_PRICE).toEqual({ campaign: 20, daily: 15 });
    expect(FREEZE_PRICE).toBe(30);
  });
});

describe("applyCaseResult", () => {
  it("pays 10 plus 5 per stamp on the first close and nothing for a repeat", () => {
    const first = applyCaseResult(defaultProfile(), "01", result(3));
    expect(first.profile.postage).toBe(30 + 25);
    expect(first.events).toContainEqual({
      type: "postage-gained",
      amount: 10,
      reason: "first-close",
    });
    expect(first.events).toContainEqual({ type: "postage-gained", amount: 15, reason: "stamp" });
    expect(first.events).toContainEqual({ type: "ledger-unlocked", caseId: "01" });
    const again = applyCaseResult(first.profile, "01", result(3));
    expect(again.profile.postage).toBe(first.profile.postage);
    expect(again.events).toEqual([]);
  });

  it("pays the table for 1, 2 and 3 stamps", () => {
    for (const [stamps, paid] of [
      [1, 15],
      [2, 20],
      [3, 25],
    ] as const) {
      expect(applyCaseResult(defaultProfile(), "02", result(stamps)).profile.postage).toBe(
        30 + paid,
      );
    }
  });

  it("pays only the difference when a case is upgraded", () => {
    const one = applyCaseResult(defaultProfile(), "01", result(1));
    const two = applyCaseResult(one.profile, "01", result(2));
    expect(two.profile.postage - one.profile.postage).toBe(5);
    const three = applyCaseResult(two.profile, "01", result(3));
    expect(three.profile.postage - two.profile.postage).toBe(5);
    expect(three.events).toContainEqual({
      type: "stamp-gained",
      caseId: "01",
      stamps: 3,
      previous: 2,
    });
    const lower = applyCaseResult(three.profile, "01", result(1));
    expect(lower.profile.postage).toBe(three.profile.postage);
    expect(lower.profile.cases["01"]?.stamps).toBe(3);
  });

  it("pays the difference from 1 to 3 stamps in one go", () => {
    const one = applyCaseResult(defaultProfile(), "03", result(1));
    const three = applyCaseResult(one.profile, "03", result(3));
    expect(three.profile.postage - one.profile.postage).toBe(10);
  });

  it("pays the chapter bonus once, in the update that closes the fourth case", () => {
    let profile = defaultProfile();
    for (const id of ["01", "02", "03"]) {
      const applied = applyCaseResult(profile, id, result(1));
      expect(applied.events.some((event) => event.type === "chapter-bonus")).toBe(false);
      profile = applied.profile;
    }
    const last = applyCaseResult(profile, "04", result(1));
    expect(last.events).toContainEqual({ type: "chapter-bonus", chapter: 1, amount: 40 });
    expect(last.profile.postage).toBe(profile.postage + 15 + 40);
    expect(last.profile.chapterBonusClaimed).toEqual({ "1": true });
    const replay = applyCaseResult(last.profile, "04", result(3));
    expect(replay.events.some((event) => event.type === "chapter-bonus")).toBe(false);
    expect(replay.profile.postage).toBe(last.profile.postage + 10);
  });

  it("raises records only and counts closes", () => {
    const first = applyCaseResult(defaultProfile(), "01", result(2, { hints: 1, timeMs: 90_000 }));
    expect(first.profile.cases["01"]).toEqual({
      stamps: 2,
      bestTimeMs: 90_000,
      hintsOnBest: 1,
      closedCount: 1,
    });
    const slower = applyCaseResult(first.profile, "01", result(1, { hints: 0, timeMs: 120_000 }));
    expect(slower.profile.cases["01"]).toEqual({
      stamps: 2,
      bestTimeMs: 90_000,
      hintsOnBest: 1,
      closedCount: 2,
    });
    const better = applyCaseResult(slower.profile, "01", result(3, { hints: 0, timeMs: 30_000 }));
    expect(better.profile.cases["01"]).toEqual({
      stamps: 3,
      bestTimeMs: 30_000,
      hintsOnBest: 0,
      closedCount: 3,
    });
    const sameStampsFewerHints = applyCaseResult(first.profile, "01", result(2, { hints: 0 }));
    expect(sameStampsFewerHints.profile.cases["01"]?.hintsOnBest).toBe(0);
  });

  it("ignores unknown cases and results without a stamp", () => {
    const start = defaultProfile();
    expect(applyCaseResult(start, "99", result(3)).profile).toBe(start);
    expect(applyCaseResult(start, "01", result(0)).profile).toBe(start);
  });

  it("never lets total stamps pass 36", () => {
    let profile = defaultProfile();
    for (let round = 0; round < 3; round++) {
      for (const item of CASES) profile = applyCaseResult(profile, item.id, result(3)).profile;
    }
    expect(totalStamps(profile)).toBe(36);
    expect(TOTAL_STAMPS).toBe(36);
  });

  it("reports unlock events as they happen", () => {
    const one = applyCaseResult(defaultProfile(), "01", result(3));
    expect(one.events.some((event) => event.type === "theme-unlocked")).toBe(false);
    const two = applyCaseResult(one.profile, "02", result(3));
    expect(two.events).toContainEqual({ type: "theme-unlocked", themeId: "teal-blotter" });
    const three = applyCaseResult(two.profile, "03", result(1));
    expect(three.events.some((event) => event.type === "chapter-unlocked")).toBe(false);
    const four = applyCaseResult(three.profile, "04", result(1));
    expect(four.events).toContainEqual({ type: "chapter-unlocked", chapter: 2 });
  });
});

describe("a perfect campaign", () => {
  it("replayed in order pays exactly 450 postage including the grant", () => {
    let profile = defaultProfile();
    for (const item of CASES) profile = applyCaseResult(profile, item.id, result(3)).profile;
    expect(profile.postage).toBe(450);
  });

  it("pays 450 when every case is solved through the real reducers", () => {
    let profile = defaultProfile();
    for (const item of CASES) {
      const state = solve(item);
      expect(state.stamps).toBe(3);
      const applied = applyCaseResult(profile, item.id, {
        stamps: state.stamps ?? 0,
        hints: state.hintsUsed,
        timeMs: state.elapsedMs,
        wrongAccusations: state.wrongAccusations,
        cluesFound: state.foundClueIds.length,
        byElimination: state.byElimination,
      });
      profile = applied.profile;
    }
    expect(profile.postage).toBe(450);
  });

  it("pays the same total whatever the order of stamp upgrades", () => {
    let profile = defaultProfile();
    for (const item of CASES) profile = applyCaseResult(profile, item.id, result(1)).profile;
    for (const item of CASES) profile = applyCaseResult(profile, item.id, result(2)).profile;
    for (const item of CASES) profile = applyCaseResult(profile, item.id, result(3)).profile;
    expect(profile.postage).toBe(450);
  });
});

describe("buying hints", () => {
  const def =
    CASES[0] ??
    (() => {
      throw new Error("no cases");
    })();

  it("charges once and returns the hinted state", () => {
    const state = createCaseState(def);
    const bought = buyHint(withPostage(30), def, state, "campaign");
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    expect(bought.profile.postage).toBe(10);
    expect(bought.profile.stats.hintsUsed).toBe(1);
    expect(bought.state.hintsUsed).toBe(1);
    expect(bought.events).toEqual([{ type: "postage-spent", amount: 20, reason: "hint" }]);
  });

  it("charges 15 on a daily", () => {
    const bought = buyHint(withPostage(15), def, createCaseState(def), "daily");
    expect(bought.ok && bought.profile.postage).toBe(0);
  });

  it("rejects without charging when postage is short", () => {
    const profile = withPostage(19);
    const bought = buyHint(profile, def, createCaseState(def), "campaign");
    expect(bought).toEqual({ ok: false, reason: "INSUFFICIENT_POSTAGE" });
    expect(profile.postage).toBe(19);
  });

  it("rejects at the per-case limit and when the case is closed", () => {
    let profile = withPostage(500);
    let state = createCaseState(def);
    for (let hint = 0; hint < 2; hint++) {
      const bought = buyHint(profile, def, state, "campaign");
      if (!bought.ok) throw new Error(bought.reason);
      profile = bought.profile;
      state = bought.state;
    }
    expect(profile.postage).toBe(460);
    const third = buyHint(profile, def, state, "campaign");
    expect(third.ok).toBe(false);
    expect(profile.postage).toBe(460);
    const closed = buyHint(profile, def, solve(def), "campaign");
    expect(closed).toEqual({ ok: false, reason: "CASE_CLOSED" });
  });

  it("rejects with nothing to hint, without charge", () => {
    const state = solve(def);
    const open = { ...state, closed: false, stamps: null, deliveredId: null, returnedIds: [] };
    const bought = buyHint(withPostage(100), def, open, "campaign", PEOPLE);
    expect(bought).toEqual({ ok: false, reason: "NOTHING_TO_HINT" });
  });
});

describe("buying streak freezes", () => {
  it("sells up to 2 at 30 each", () => {
    const first = buyFreeze(withPostage(100));
    if (!first.ok) throw new Error(first.reason);
    expect(first.profile.postage).toBe(70);
    expect(first.profile.streakFreezes).toBe(1);
    const second = buyFreeze(first.profile);
    if (!second.ok) throw new Error(second.reason);
    expect(second.profile.streakFreezes).toBe(2);
    expect(buyFreeze(second.profile)).toEqual({ ok: false, reason: "FREEZES_FULL" });
  });

  it("rejects when postage is short", () => {
    expect(buyFreeze(withPostage(29))).toEqual({ ok: false, reason: "INSUFFICIENT_POSTAGE" });
  });
});
