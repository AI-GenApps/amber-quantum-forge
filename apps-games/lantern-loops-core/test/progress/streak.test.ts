import { describe, expect, it } from "vitest";
import { shiftDate } from "../../src/progress/calendar";
import {
  applyDailySolve,
  initialStreak,
  liveStreak,
  refreshOnOpen,
  type StreakState,
} from "../../src/progress/streak";

const TODAY = "2026-10-23";

function state(patch: Partial<StreakState> = {}): StreakState {
  return { ...initialStreak, ...patch };
}

function solve(s: StreakState, daysSinceLast: number | null, hints = 0) {
  return applyDailySolve(s, { today: TODAY, daysSinceLast, hints });
}

describe("applyDailySolve", () => {
  it("starts a streak on the first solve", () => {
    const r = solve(state(), null);
    expect(r.state).toMatchObject({ streak: 1, bestStreak: 1, lastDailyDate: TODAY });
    expect(r.counted).toBe(true);
    expect(r.events).toEqual([]);
  });

  it("increments on the next day", () => {
    const r = solve(state({ streak: 4, bestStreak: 4, lastDailyDate: "2026-10-22" }), 1);
    expect(r.state.streak).toBe(5);
    expect(r.state.bestStreak).toBe(5);
  });

  it("is idempotent on the same day", () => {
    const s = state({ streak: 3, bestStreak: 3, lastDailyDate: TODAY, milestonesGranted: [3] });
    const r = solve(s, 0);
    expect(r.state).toBe(s);
    expect(r.counted).toBe(false);
    expect(r.events).toEqual([]);
  });

  it("saves one missed day with a freeze and spends it", () => {
    const r = solve(
      state({ streak: 5, bestStreak: 5, freezes: 1, lastDailyDate: "2026-10-21" }),
      2,
    );
    expect(r.state).toMatchObject({ streak: 6, freezes: 0 });
    expect(r.events).toEqual([{ kind: "freeze-used" }]);
  });

  it("resets to 1 after one missed day without a freeze", () => {
    const r = solve(
      state({ streak: 5, bestStreak: 5, freezes: 0, lastDailyDate: "2026-10-21" }),
      2,
    );
    expect(r.state).toMatchObject({ streak: 1, freezes: 0, bestStreak: 5 });
    expect(r.events).toEqual([{ kind: "streak-reset", previous: 5 }]);
  });

  it("resets after two missed days even with a freeze, and keeps the freeze", () => {
    const r = solve(
      state({ streak: 9, bestStreak: 9, freezes: 1, lastDailyDate: "2026-10-20" }),
      3,
    );
    expect(r.state).toMatchObject({ streak: 1, freezes: 1 });
    expect(r.events).toEqual([{ kind: "streak-reset", previous: 9 }]);
  });

  it("changes nothing when the clock went back", () => {
    const s = state({ streak: 5, bestStreak: 5, lastDailyDate: "2026-10-25" });
    const r = solve(s, -2);
    expect(r.state).toBe(s);
    expect(r.counted).toBe(false);
    expect(r.events).toEqual([{ kind: "clock-went-back" }]);
  });
});

describe("milestones", () => {
  const cases: Array<[number, number]> = [
    [3, 1],
    [7, 2],
    [14, 2],
    [30, 4],
    [60, 5],
    [100, 8],
  ];

  it.each(cases)("pays %s days once: +%s tokens", (days, tokens) => {
    const before = state({ streak: days - 1, bestStreak: days - 1, lastDailyDate: "2026-10-22" });
    const r = solve(before, 1);
    expect(r.events).toEqual([{ kind: "milestone", days, tokens }]);
    expect(r.state.milestonesGranted).toContain(days);
    const again = applyDailySolve(r.state, { today: TODAY, daysSinceLast: 0, hints: 0 });
    expect(again.events).toEqual([]);
  });

  it("does not pay a milestone twice in one run", () => {
    const s = state({
      streak: 2,
      bestStreak: 2,
      lastDailyDate: "2026-10-22",
      milestonesGranted: [3],
    });
    expect(solve(s, 1).events).toEqual([]);
  });

  it("pays again after a reset run", () => {
    let s = state({ streak: 2, bestStreak: 2, lastDailyDate: "2026-10-01" });
    s = applyDailySolve(s, { today: "2026-10-02", daysSinceLast: 1, hints: 0 }).state;
    expect(s.milestonesGranted).toEqual([3]);
    const broken = applyDailySolve(s, { today: "2026-10-10", daysSinceLast: 8, hints: 0 });
    expect(broken.state).toMatchObject({ streak: 1, milestonesGranted: [], bestStreak: 3 });
    let run = broken.state;
    for (const day of ["2026-10-11", "2026-10-12"]) {
      const r = applyDailySolve(run, { today: day, daysSinceLast: 1, hints: 0 });
      run = r.state;
      if (day === "2026-10-12")
        expect(r.events).toEqual([{ kind: "milestone", days: 3, tokens: 1 }]);
    }
  });

  it("walks 100 consecutive days and pays every milestone once", () => {
    let s = initialStreak;
    let last: string | null = null;
    const paid: number[] = [];
    for (let k = 0; k < 100; k++) {
      const day = shiftDate("2026-01-01", k);
      const gap = last === null ? null : 1;
      const r = applyDailySolve(s, { today: day, daysSinceLast: gap, hints: 0 });
      for (const e of r.events) if (e.kind === "milestone") paid.push(e.days);
      s = r.state;
      last = day;
    }
    expect(paid).toEqual([3, 7, 14, 30, 60, 100]);
    expect(s.streak).toBe(100);
  });
});

describe("refreshOnOpen", () => {
  it("refills on the first open of a new ISO week, never above 1", () => {
    const empty = state({ freezes: 0, freezeWeek: "2026-W42" });
    const r = refreshOnOpen(empty, { today: "2026-10-19" });
    expect(r.state).toMatchObject({ freezes: 1, freezeWeek: "2026-W43" });
    expect(r.events).toEqual([{ kind: "freeze-refilled" }]);
    const full = refreshOnOpen(state({ freezes: 1, freezeWeek: "2026-W42" }), {
      today: "2026-10-19",
    });
    expect(full.state.freezes).toBe(1);
    expect(full.events).toEqual([]);
  });

  it("does not refill twice in the same week", () => {
    const spent = state({ freezes: 0, freezeWeek: "2026-W43" });
    const r = refreshOnOpen(spent, { today: "2026-10-25" });
    expect(r.state).toBe(spent);
    expect(r.events).toEqual([]);
  });

  it("starts a new install with one freeze and records the week", () => {
    const r = refreshOnOpen(initialStreak, { today: TODAY });
    expect(r.state).toMatchObject({ freezes: 1, freezeWeek: "2026-W43" });
    expect(r.events).toEqual([]);
  });

  it("ignores a clock that went back to an earlier week", () => {
    const s = state({ freezes: 0, freezeWeek: "2026-W43" });
    const r = refreshOnOpen(s, { today: "2026-10-10" });
    expect(r.state).toBe(s);
    expect(r.events).toEqual([{ kind: "clock-went-back" }]);
  });

  it("treats 2026-12-28 to 2027-01-03 as one week", () => {
    let s = state({ freezes: 0, freezeWeek: "2026-W52" });
    s = refreshOnOpen(s, { today: "2026-12-28" }).state;
    expect(s.freezes).toBe(1);
    s = { ...s, freezes: 0 };
    for (const day of ["2026-12-31", "2027-01-01", "2027-01-03"]) {
      expect(refreshOnOpen(s, { today: day }).state.freezes).toBe(0);
    }
    expect(refreshOnOpen(s, { today: "2027-01-04" }).state.freezes).toBe(1);
  });
});

describe("liveStreak", () => {
  it("shows the streak while it can still be saved", () => {
    const s = state({ streak: 6, freezes: 0 });
    expect(liveStreak(s, null)).toBe(6);
    expect(liveStreak(s, 0)).toBe(6);
    expect(liveStreak(s, 1)).toBe(6);
    expect(liveStreak(s, 2)).toBe(0);
    expect(liveStreak({ ...s, freezes: 1 }, 2)).toBe(6);
    expect(liveStreak({ ...s, freezes: 1 }, 3)).toBe(0);
  });
});
