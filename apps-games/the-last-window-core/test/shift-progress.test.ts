import { describe, expect, it } from "vitest";
import {
  applyShiftResult,
  defaultProfile,
  getDay,
  levelForFp,
  type Profile,
  START_COINS,
} from "../src";
import { fakeResult } from "./helpers/results";

function withDay(day: number, base: Profile = defaultProfile()): Profile {
  return { ...base, day };
}

describe("applyShiftResult coins", () => {
  it("adds payments, tips and the closing bonus to the coins", () => {
    const result = fakeResult({ payments: 30, tips: 5, stars: 3 });
    const applied = applyShiftResult(defaultProfile(), { kind: "day", day: 1 }, result);
    expect(applied.accepted).toBe(true);
    expect(applied.profile.coins).toBe(START_COINS + 30 + 5 + 20);
    expect(applied.events[0]).toEqual({ type: "coins-gained", amount: 55, source: "shift" });
  });

  it("pays closing bonuses 5, 10 and 20 for 1, 2 and 3 stars", () => {
    for (const [stars, bonus] of [
      [1, 5],
      [2, 10],
      [3, 20],
    ] as const) {
      const result = fakeResult({ payments: 0, tips: 0, stars });
      const applied = applyShiftResult(defaultProfile(), { kind: "day", day: 1 }, result);
      expect(applied.profile.coins).toBe(START_COINS + bonus);
    }
  });

  it("never lets coins go negative", () => {
    const result = { ...fakeResult(), coins: -50 };
    const applied = applyShiftResult(defaultProfile(), { kind: "day", day: 1 }, result);
    expect(applied.profile.coins).toBeGreaterThanOrEqual(START_COINS);
  });
});

describe("day progression", () => {
  it("advances only when the current day is completed", () => {
    const first = applyShiftResult(defaultProfile(), { kind: "day", day: 1 }, fakeResult());
    expect(first.advanced).toBe(true);
    expect(first.replay).toBe(false);
    expect(first.profile.day).toBe(2);
    expect(first.profile.diary).toEqual([1]);
    expect(first.profile.daysDone[1]).toMatchObject({ stars: 2, served: 5, delighted: 2 });
  });

  it("a replay pays but does not advance or duplicate the diary", () => {
    const start = withDay(5, { ...defaultProfile(), diary: [1, 2, 3, 4] });
    const replay = applyShiftResult(start, { kind: "day", day: 2 }, fakeResult({ day: 2 }));
    expect(replay.replay).toBe(true);
    expect(replay.advanced).toBe(false);
    expect(replay.profile.day).toBe(5);
    expect(replay.profile.coins).toBe(start.coins + 40 + 6 + 10);
    expect(replay.profile.diary).toEqual([1, 2, 3, 4]);
  });

  it("a replay keeps the better of the two day records", () => {
    let profile = applyShiftResult(
      defaultProfile(),
      { kind: "day", day: 1 },
      fakeResult({ stars: 3 }),
    ).profile;
    profile = applyShiftResult(profile, { kind: "day", day: 1 }, fakeResult({ stars: 1 })).profile;
    expect(profile.daysDone[1]?.stars).toBe(3);
  });

  it("refuses a day that has not been reached", () => {
    const applied = applyShiftResult(defaultProfile(), { kind: "day", day: 4 }, fakeResult());
    expect(applied.accepted).toBe(false);
    expect(applied.profile).toEqual(defaultProfile());
    expect(applied.events).toEqual([]);
  });

  it("refuses a Late Shift before the campaign is complete", () => {
    const applied = applyShiftResult(defaultProfile(), { kind: "late" }, fakeResult());
    expect(applied.accepted).toBe(false);
  });

  it("reports the unlocks of the next day", () => {
    const applied = applyShiftResult(defaultProfile(), { kind: "day", day: 1 }, fakeResult());
    const unlocks = applied.events.filter(
      (e) => e.type === "unlock" || e.type === "decor-unlocked",
    );
    expect(unlocks).toEqual([
      { type: "unlock", kind: "pastry", id: "pastry-2", day: 2 },
      { type: "unlock", kind: "book", id: "book-2", day: 2 },
      { type: "decor-unlocked", id: "decor-1", day: 2 },
    ]);
    expect(getDay(2).unlocks.pastries).toEqual(["pastry-2"]);
  });

  it("completing Day 14 completes the campaign and opens Late Shifts", () => {
    const applied = applyShiftResult(
      withDay(14),
      { kind: "day", day: 14 },
      fakeResult({ day: 14 }),
    );
    expect(applied.profile.day).toBe(15);
    expect(applied.events).toContainEqual({ type: "campaign-complete" });
    expect(applied.events.some((e) => e.type === "unlock")).toBe(false);
    expect(applied.profile.diary).toEqual([14]);
  });
});

describe("friendship, visits and scenes", () => {
  it("counts a visit for every served regular and none for one who left", () => {
    const result = fakeResult({
      fp: [[1, 2]],
      seen: [
        [1, "delighted"],
        [2, "disappointed"],
        [3, "left"],
      ],
    });
    const { profile } = applyShiftResult(defaultProfile(), { kind: "day", day: 1 }, result);
    expect(profile.regulars[1]?.visits).toBe(1);
    expect(profile.regulars[2]?.visits).toBe(1);
    expect(profile.regulars[3]?.visits).toBe(0);
    expect(profile.regulars[1]?.fp).toBe(2);
  });

  it("caps friendship points at 8 and reports each new level", () => {
    const start = defaultProfile();
    const result = fakeResult({ fp: [[1, 3]], seen: [[1, "delighted"]] });
    const first = applyShiftResult(start, { kind: "day", day: 1 }, result);
    expect(first.events).toContainEqual({ type: "friendship-level", regularId: 1, level: 2 });
    let profile = first.profile;
    for (let i = 0; i < 5; i++) {
      profile = applyShiftResult(withDay(9, profile), { kind: "day", day: 9 }, result).profile;
    }
    expect(profile.regulars[1]?.fp).toBe(8);
    expect(levelForFp(8)).toBe(5);
  });

  it("queues scene 1 when level and visit are reached and reports it once", () => {
    const result = fakeResult({ fp: [[1, 2]], seen: [[1, "delighted"]] });
    const first = applyShiftResult(defaultProfile(), { kind: "day", day: 1 }, result);
    expect(first.queue).toEqual([{ regularId: 1, index: 1 }]);
    expect(first.profile.pendingEvening).toEqual(["scene-1-1"]);
    expect(first.events).toContainEqual({
      type: "scene-eligible",
      regularId: 1,
      index: 1,
      sceneId: "scene-1-1",
    });
    const again = applyShiftResult(
      first.profile,
      { kind: "day", day: 1 },
      fakeResult({ seen: [], fp: [] }),
    );
    expect(again.events.some((e) => e.type === "scene-eligible")).toBe(false);
    expect(again.profile.pendingEvening).toEqual(["scene-1-1"]);
  });

  it("does not offer scene 2 before the second visit even at high friendship", () => {
    const result = fakeResult({ fp: [[1, 8]], seen: [[1, "delighted"]] });
    const applied = applyShiftResult(defaultProfile(), { kind: "day", day: 1 }, result);
    expect(applied.queue).toEqual([{ regularId: 1, index: 1 }]);
  });
});

describe("evening queue cap", () => {
  function allEight(): Profile {
    const profile = defaultProfile();
    for (let id = 1; id <= 8; id++) {
      profile.regulars[id] = { fp: 2, visits: 0, scenesDone: 0, choices: {}, ending: null };
    }
    return profile;
  }
  const everyone = fakeResult({
    seen: [1, 2, 3, 4, 5, 6, 7, 8].map((id) => [id, "satisfied"] as [number, "satisfied"]),
  });

  it("plays at most 4 scenes in an evening and carries the rest", () => {
    const applied = applyShiftResult(withDay(9, allEight()), { kind: "day", day: 9 }, everyone);
    expect(applied.queue.map((ref) => ref.regularId)).toEqual([1, 2, 3, 4]);
    expect(applied.remainder.map((ref) => ref.regularId)).toEqual([5, 6, 7, 8]);
    expect(applied.profile.pendingEvening).toEqual([
      "scene-1-1",
      "scene-2-1",
      "scene-3-1",
      "scene-4-1",
    ]);
  });

  it("allows 8 scenes on Day 14", () => {
    const applied = applyShiftResult(withDay(14, allEight()), { kind: "day", day: 14 }, everyone);
    expect(applied.queue).toHaveLength(8);
    expect(applied.remainder).toHaveLength(0);
  });

  it("carries unseen scenes first into the next evening", () => {
    const first = applyShiftResult(withDay(9, allEight()), { kind: "day", day: 9 }, everyone);
    const next = applyShiftResult(
      withDay(9, first.profile),
      { kind: "day", day: 9 },
      fakeResult({ seen: [] }),
    );
    expect(next.queue.map((ref) => ref.regularId)).toEqual([1, 2, 3, 4]);
    expect(next.remainder.map((ref) => ref.regularId)).toEqual([5, 6, 7, 8]);
  });

  it("a Late Shift evening is capped at 4", () => {
    const applied = applyShiftResult(withDay(15, allEight()), { kind: "late" }, everyone);
    expect(applied.queue).toHaveLength(4);
  });
});

describe("stats", () => {
  it("accumulates served, delighted, mistakes and items", () => {
    const result = fakeResult({
      counts: { delighted: 3, satisfied: 2, disappointed: 1, left: 1 },
      mistakes: 4,
    });
    const applied = applyShiftResult(defaultProfile(), { kind: "day", day: 1 }, result, {
      itemsMade: 9,
    });
    expect(applied.profile.stats).toMatchObject({
      served: 6,
      delighted: 3,
      mistakes: 4,
      itemsMade: 9,
      scenesRead: 0,
    });
  });
});
