import { describe, expect, it } from "vitest";
import {
  addDays,
  CASES,
  type CaseState,
  createCaseState,
  dailySeedOf,
  defaultProfile,
  FLAG_LIMIT,
  generateDaily,
  getCase,
  HISTORY_LIMIT,
  inspectObject,
  linkClue,
  type Profile,
  pinClue,
  sanitizeProfile,
  weekdayOf,
} from "../src";
import { must } from "./fixtures/helpers";
import { withCases } from "./fixtures/profiles";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function partial(caseId: string): CaseState {
  const def = getCase(caseId);
  if (def === undefined) throw new Error("no case");
  let state = createCaseState(def);
  for (const object of def.objects) state = must(inspectObject(def, state, object.id));
  const clueId = state.foundClueIds[0] ?? "";
  state = must(pinClue(state, clueId));
  state = must(linkClue(state, clueId, def.candidateIds[0] ?? "", "fits"));
  return { ...state, elapsedMs: 4200 };
}

function sanitized(data: unknown): Profile {
  const result = sanitizeProfile(data);
  if (result === null) throw new Error("rejected");
  return result;
}

describe("defaults", () => {
  it("start with 30 postage, nothing earned and the first theme", () => {
    const fresh = defaultProfile();
    expect(fresh.postage).toBe(30);
    expect(fresh.themeSelected).toBe("mustard-riso");
    expect(fresh.session).toBeNull();
    expect(fresh.daily).toEqual({ lastKey: null, streak: 0, bestStreak: 0, results: {} });
  });

  it("survive a round trip through sanitizeProfile unchanged", () => {
    expect(sanitized(clone(defaultProfile()))).toEqual(defaultProfile());
    expect(sanitized({})).toEqual(defaultProfile());
  });
});

describe("rejection", () => {
  it.each([null, undefined, 4, "profile", [], true])("rejects %j", (value) => {
    expect(sanitizeProfile(value)).toBeNull();
  });

  const wrong: Array<[string, unknown]> = [
    ["postage", "30"],
    ["postage", Number.NaN],
    ["cases", []],
    ["streakFreezes", "two"],
    ["chapterBonusClaimed", 3],
    ["daily", "never"],
    ["history", {}],
    ["flags", []],
    ["stats", 9],
    ["themeSelected", 4],
    ["session", "now"],
  ];
  it.each(wrong)("rejects a wrongly typed %s", (key, value) => {
    expect(sanitizeProfile({ ...clone(defaultProfile()), [key]: value })).toBeNull();
  });
});

describe("clamping and stripping", () => {
  it("clamps postage and freezes", () => {
    expect(sanitized({ postage: -5 }).postage).toBe(0);
    expect(sanitized({ postage: 12.9 }).postage).toBe(12);
    expect(sanitized({ streakFreezes: 9 }).streakFreezes).toBe(2);
    expect(sanitized({ streakFreezes: -1 }).streakFreezes).toBe(0);
  });

  it("clamps stamps to 3, drops empty and unknown cases and keeps sane records", () => {
    const profile = sanitized({
      cases: {
        "01": { stamps: 7, bestTimeMs: 5000.7, hintsOnBest: 9, closedCount: 0 },
        "02": { stamps: 0, bestTimeMs: null, hintsOnBest: 0, closedCount: 1 },
        "03": { stamps: "3" },
        "99": { stamps: 3 },
      },
    });
    expect(Object.keys(profile.cases)).toEqual(["01"]);
    expect(profile.cases["01"]).toEqual({
      stamps: 3,
      bestTimeMs: 5000,
      hintsOnBest: 2,
      closedCount: 1,
    });
  });

  it("drops unknown keys at every level", () => {
    const dirty = {
      ...clone(defaultProfile()),
      cheat: 1,
      cases: { "01": { stamps: 2, bestTimeMs: null, hintsOnBest: 0, closedCount: 1, extra: true } },
      daily: { lastKey: null, streak: 0, bestStreak: 0, results: {}, extra: 1 },
      stats: { ...defaultProfile().stats, extra: 1 },
    };
    const profile = sanitized(dirty);
    expect(profile).not.toHaveProperty("cheat");
    expect(profile.cases["01"]).not.toHaveProperty("extra");
    expect(profile.daily).not.toHaveProperty("extra");
    expect(profile.stats).not.toHaveProperty("extra");
  });

  it("keeps ledger, achievement and bonus keys only when they are real", () => {
    const profile = sanitized({
      cases: { "01": { stamps: 1, bestTimeMs: null, hintsOnBest: 0, closedCount: 1 } },
      ledgerSeen: { "01": true, "02": true, "99": true, "03": false },
      achievements: { "clean-sheet": true, "made-up": true },
      chapterBonusClaimed: { "1": true, "7": true },
    });
    expect(profile.ledgerSeen).toEqual({ "01": true });
    expect(profile.achievements).toEqual({ "clean-sheet": true });
    expect(profile.chapterBonusClaimed).toEqual({ "1": true });
  });

  it("limits the flags", () => {
    const flags = Object.fromEntries(Array.from({ length: 90 }, (_, i) => [`flag-${i}`, true]));
    const profile = sanitized({ flags: { ...flags, "": true, [`${"x".repeat(41)}`]: true } });
    expect(Object.keys(profile.flags)).toHaveLength(FLAG_LIMIT);
  });

  it("falls back to the default theme when the stamps have not unlocked the selection", () => {
    expect(sanitized({ themeSelected: "gold-rubber-stamp" }).themeSelected).toBe("mustard-riso");
    expect(sanitized({ themeSelected: "nonsense" }).themeSelected).toBe("mustard-riso");
    const stamps = Object.fromEntries(CASES.slice(0, 2).map((item) => [item.id, 3]));
    const earned = withCases(stamps);
    expect(sanitized({ ...earned, themeSelected: "teal-blotter" }).themeSelected).toBe(
      "teal-blotter",
    );
  });
});

describe("trimming", () => {
  it("keeps the last 50 history entries", () => {
    const history = Array.from({ length: 80 }, (_, index) => ({
      kind: "campaign",
      id: CASES[index % 12]?.id,
      stamps: 1 + (index % 3),
      hints: 0,
    }));
    const profile = sanitized({ history });
    expect(profile.history).toHaveLength(HISTORY_LIMIT);
    expect(profile.history[0]).toEqual(history[30]);
    expect(profile.history.at(-1)).toEqual(history[79]);
  });

  it("drops history entries that are not real results", () => {
    const profile = sanitized({
      history: [
        { kind: "campaign", id: "99", stamps: 1, hints: 0 },
        { kind: "daily", id: "not-a-date", stamps: 1, hints: 0 },
        { kind: "daily", id: "2026-02-03", stamps: 2, hints: 1 },
        "text",
      ],
    });
    expect(profile.history).toEqual([{ kind: "daily", id: "2026-02-03", stamps: 2, hints: 1 }]);
  });

  it("keeps the latest 60 daily results and repairs the streaks", () => {
    const results = Object.fromEntries(
      Array.from({ length: 70 }, (_, i) => [addDays("2026-01-01", i), { stamps: 2 }]),
    );
    const profile = sanitized({
      daily: { lastKey: "2026-03-11", streak: 5, bestStreak: 1, results },
    });
    expect(Object.keys(profile.daily.results)).toHaveLength(60);
    expect(profile.daily.results["2026-01-01"]).toBeUndefined();
    expect(profile.daily.results["2026-03-11"]).toEqual({ stamps: 2 });
    expect(profile.daily.bestStreak).toBe(5);
  });

  it("rejects a daily with a bad date key", () => {
    expect(
      sanitizeProfile({ daily: { lastKey: "yesterday", streak: 1, bestStreak: 1, results: {} } }),
    ).toBeNull();
  });
});

describe("the saved session", () => {
  const unlocked = withCases({ "01": 2 });

  it("is kept when it matches the case", () => {
    const state = partial("01");
    const profile = sanitized({
      ...clone(defaultProfile()),
      session: { kind: "campaign", id: "01", state },
    });
    expect(profile.session).toEqual({ kind: "campaign", id: "01", state });
  });

  it("is kept for a daily on its date and equals what the generator makes", () => {
    const key = "2026-06-15";
    const def = generateDaily(dailySeedOf(key), weekdayOf(key));
    const state = createCaseState(def);
    const profile = sanitized({ session: { kind: "daily", id: key, state } });
    expect(profile.session?.state.caseId).toBe(def.id);
  });

  const stale: Array<[string, (state: CaseState) => unknown]> = [
    ["another case id", (state) => ({ ...state, caseId: "02" })],
    ["an unknown clue", (state) => ({ ...state, foundClueIds: ["01-zz"] })],
    ["a clue on an unopened object", (state) => ({ ...state, seenObjectIds: [] })],
    ["a pin that was never found", (state) => ({ ...state, pinnedClueIds: ["01-c9"] })],
    [
      "a link to a stranger",
      (state) => ({
        ...state,
        links: [{ clueId: state.pinnedClueIds[0], personId: "p09", kind: "fits" }],
      }),
    ],
    [
      "a link kind that does not exist",
      (state) => ({
        ...state,
        links: [{ clueId: state.pinnedClueIds[0], personId: state.candidateIds[0], kind: "maybe" }],
      }),
    ],
    ["changed candidates", (state) => ({ ...state, candidateIds: ["p01", "p02", "p03"] })],
    ["a closed case", (state) => ({ ...state, closed: true })],
    ["a negative clock", (state) => ({ ...state, elapsedMs: -1 })],
    ["too many hints", (state) => ({ ...state, hintsUsed: 3 })],
    ["wrong accusations without returns", (state) => ({ ...state, wrongAccusations: 1 })],
    ["a string for a state", () => "state"],
  ];
  it.each(stale)("is discarded with %s, and the rest of the profile survives", (_label, mutate) => {
    const state = partial("01");
    const data = {
      ...clone(unlocked),
      session: { kind: "campaign", id: "01", state: mutate(state) },
    };
    const profile = sanitized(data);
    expect(profile.session).toBeNull();
    expect(profile.cases["01"]?.stamps).toBe(2);
  });

  it("is discarded for a locked case, an unknown case, a bad kind and a bad date", () => {
    const state = partial("01");
    const locked = sanitized({
      session: { kind: "campaign", id: "05", state: { ...state, caseId: "05" } },
    });
    expect(locked.session).toBeNull();
    for (const session of [
      { kind: "campaign", id: "77", state },
      { kind: "weekly", id: "01", state },
      { kind: "daily", id: "2026-13-40", state },
      { kind: "daily", id: "2026-06-15", state },
      null,
    ]) {
      expect(sanitized({ session }).session).toBeNull();
    }
  });
});
