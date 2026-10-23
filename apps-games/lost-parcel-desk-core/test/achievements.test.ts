import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  CASES,
  closeCampaignCase,
  defaultProfile,
  evaluateAchievements,
  getCase,
  grantAchievements,
  type Profile,
} from "../src";
import { docTable } from "./fixtures/doc";
import { withCases, withTotal } from "./fixtures/profiles";
import { solve } from "./fixtures/solve";

function caseOf(id: string) {
  const found = getCase(id);
  if (found === undefined) throw new Error(`no case ${id}`);
  return found;
}

describe("achievement list", () => {
  it("has the 12 ids of content-plan.md and pays nothing", () => {
    const rows = docTable("content-plan.md", "## Achievements (12, no postage reward)");
    expect(ACHIEVEMENTS.map((item) => item.id)).toEqual(rows.map((row) => row[0]));
    const start = defaultProfile();
    expect(grantAchievements(start, ["clean-sheet"]).postage).toBe(start.postage);
  });
});

describe("profile-only achievements", () => {
  it("first-delivery needs case 01 closed", () => {
    expect(evaluateAchievements(withCases({ "02": 3 }))).not.toContain("first-delivery");
    expect(evaluateAchievements(withCases({ "01": 1 }))).toContain("first-delivery");
  });

  it.each([
    ["chapter-1", ["01", "02", "03", "04"]],
    ["chapter-2", ["05", "06", "07", "08"]],
    ["chapter-3", ["09", "10", "11", "12"]],
  ])("%s needs all four cases", (id, ids) => {
    const all = Object.fromEntries(ids.map((caseId) => [caseId, 1]));
    expect(evaluateAchievements(withCases(all))).toContain(id);
    const [, ...rest] = ids;
    const three = Object.fromEntries(rest.map((caseId) => [caseId, 3]));
    expect(evaluateAchievements(withCases(three))).not.toContain(id);
  });

  it("stamp-collector fires at 12 stamps and not at 11", () => {
    expect(evaluateAchievements(withTotal(11))).not.toContain("stamp-collector");
    expect(evaluateAchievements(withTotal(12))).toContain("stamp-collector");
  });

  it("postmasters-pride fires at 36 stamps and not at 35", () => {
    expect(evaluateAchievements(withTotal(35))).not.toContain("postmasters-pride");
    expect(evaluateAchievements(withTotal(36))).toContain("postmasters-pride");
  });

  it.each([
    ["daily-habit", 3],
    ["week-at-the-desk", 7],
  ])("%s fires at a streak of %i and not one below", (id, days) => {
    const at = (bestStreak: number): Profile => ({
      ...defaultProfile(),
      daily: { lastKey: null, streak: 0, bestStreak, results: {} },
    });
    expect(evaluateAchievements(at(days - 1))).not.toContain(id);
    expect(evaluateAchievements(at(days))).toContain(id);
  });

  it("does not return what is already earned", () => {
    const earned = grantAchievements(withTotal(12), ["stamp-collector"]);
    expect(evaluateAchievements(earned)).not.toContain("stamp-collector");
  });
});

describe("achievements that read the finished case", () => {
  const def = caseOf("03");

  it("clean-sheet needs 3 stamps; unaided also needs no hint", () => {
    const profile = defaultProfile();
    const perfect = solve(def);
    expect(evaluateAchievements(profile, { def, state: perfect })).toEqual(
      expect.arrayContaining(["clean-sheet", "unaided"]),
    );
    const hinted = solve(def, { hints: 1 });
    const ids = evaluateAchievements(profile, { def, state: hinted });
    expect(ids).toContain("clean-sheet");
    expect(ids).not.toContain("unaided");
    const slipped = solve(def, { wrong: 1 });
    expect(slipped.stamps).toBe(2);
    const slippedIds = evaluateAchievements(profile, { def, state: slipped });
    expect(slippedIds).not.toContain("clean-sheet");
    expect(slippedIds).not.toContain("unaided");
  });

  it("neither fires without a finished case", () => {
    const ids = evaluateAchievements(defaultProfile(), { def });
    expect(ids).toEqual([]);
  });

  it("sharp-eyes needs every clue found", () => {
    const perfect = solve(def);
    expect(perfect.foundClueIds).toHaveLength(def.clues.length);
    expect(evaluateAchievements(defaultProfile(), { def, state: perfect })).toContain("sharp-eyes");
    const missing = { ...perfect, foundClueIds: perfect.foundClueIds.slice(1) };
    expect(evaluateAchievements(defaultProfile(), { def, state: missing })).not.toContain(
      "sharp-eyes",
    );
  });

  it("second-look needs a raised best on a replay", () => {
    const two = solve(def, { wrong: 1 });
    const three = solve(def);
    const ctx = { def, kind: "campaign" as const };
    expect(
      evaluateAchievements(defaultProfile(), { ...ctx, state: three, previousStamps: 2 }),
    ).toContain("second-look");
    expect(
      evaluateAchievements(defaultProfile(), { ...ctx, state: three, previousStamps: 3 }),
    ).not.toContain("second-look");
    expect(
      evaluateAchievements(defaultProfile(), { ...ctx, state: two, previousStamps: 3 }),
    ).not.toContain("second-look");
    expect(
      evaluateAchievements(defaultProfile(), { ...ctx, state: three, previousStamps: 0 }),
    ).not.toContain("second-look");
  });
});

describe("closeCampaignCase", () => {
  it("awards achievements on the real close and clears the session", () => {
    const def = caseOf("01");
    const state = solve(def);
    const start: Profile = { ...defaultProfile(), session: { kind: "campaign", id: "01", state } };
    const closed = closeCampaignCase(start, def, state);
    expect(closed.profile.session).toBeNull();
    expect(closed.achievements).toEqual(
      expect.arrayContaining(["first-delivery", "clean-sheet", "unaided", "sharp-eyes"]),
    );
    expect(closed.events).toContainEqual({ type: "achievement-earned", id: "first-delivery" });
    expect(Object.keys(closed.profile.achievements).sort()).toEqual(
      [...closed.achievements].sort(),
    );
    const replay = closeCampaignCase(closed.profile, def, solve(def));
    expect(replay.achievements).toEqual([]);
  });

  it("fires second-look when a replay raises the best", () => {
    const def = caseOf("02");
    const first = closeCampaignCase(defaultProfile(), def, solve(def, { wrong: 1 }));
    expect(first.achievements).not.toContain("second-look");
    const replay = closeCampaignCase(first.profile, def, solve(def));
    expect(replay.achievements).toContain("second-look");
  });

  it("walks a whole perfect campaign and earns the campaign badges at the right case", () => {
    let profile = defaultProfile();
    const earnedAt: Record<string, string> = {};
    for (const item of CASES) {
      const closed = closeCampaignCase(profile, item, solve(item));
      for (const id of closed.achievements) earnedAt[id] = item.id;
      profile = closed.profile;
    }
    expect(earnedAt["first-delivery"]).toBe("01");
    expect(earnedAt["chapter-1"]).toBe("04");
    expect(earnedAt["stamp-collector"]).toBe("04");
    expect(earnedAt["chapter-2"]).toBe("08");
    expect(earnedAt["chapter-3"]).toBe("12");
    expect(earnedAt["postmasters-pride"]).toBe("12");
    expect(profile.postage).toBe(450);
  });

  it("does nothing for a case that is still open", () => {
    const def = caseOf("01");
    const open = { ...solve(def), closed: false };
    const start = defaultProfile();
    expect(closeCampaignCase(start, def, open).profile).toBe(start);
  });
});
