import { describe, expect, it } from "vitest";
import {
  archiveReward,
  chapterReward,
  dailyReward,
  grant,
  MILESTONE_DAYS,
  milestoneReward,
  spendHint,
  TOKEN_CONFIG,
} from "../../src/progress/tokens";

describe("rewards by source", () => {
  it.each([
    ["daily with hints", dailyReward(1), 1],
    ["daily with 3 hints", dailyReward(3), 1],
    ["daily without hints", dailyReward(0), 2],
    ["archive without hints", archiveReward(0), 1],
    ["archive with a hint", archiveReward(1), 0],
    ["chapter cleared", chapterReward(), 5],
    ["milestone 3", milestoneReward(3), 1],
    ["milestone 7", milestoneReward(7), 2],
    ["milestone 14", milestoneReward(14), 2],
    ["milestone 30", milestoneReward(30), 4],
    ["milestone 60", milestoneReward(60), 5],
    ["milestone 100", milestoneReward(100), 8],
    ["not a milestone", milestoneReward(4), 0],
  ])("%s pays %s", (_name, actual, expected) => {
    expect(actual).toBe(expected);
  });

  it("lists exactly six milestones", () => {
    expect(MILESTONE_DAYS).toEqual([3, 7, 14, 30, 60, 100]);
  });

  it("starts at 3 with a cap of 20 and a hint cost of 1", () => {
    expect(TOKEN_CONFIG.start).toBe(3);
    expect(TOKEN_CONFIG.cap).toBe(20);
    expect(TOKEN_CONFIG.hintCost).toBe(1);
  });
});

describe("grant", () => {
  it.each([
    [0, 2, 2, 2, false],
    [18, 2, 20, 2, false],
    [19, 2, 20, 1, true],
    [20, 1, 20, 0, true],
    [20, 8, 20, 0, true],
    [19, 1, 20, 1, false],
    [5, 0, 5, 0, false],
    [5, -3, 5, 0, false],
    [25, 1, 20, 0, true],
  ])("grant(%s, %s)", (balance, amount, after, granted, capped) => {
    expect(grant(balance, amount)).toEqual({ balance: after, granted, capped });
  });
});

describe("spendHint", () => {
  it("spends one token", () => {
    expect(spendHint(3)).toEqual({ ok: true, balance: 2 });
    expect(spendHint(1)).toEqual({ ok: true, balance: 0 });
  });

  it("is refused at zero and never goes negative", () => {
    expect(spendHint(0)).toEqual({ ok: false, balance: 0 });
    expect(spendHint(-4)).toEqual({ ok: false, balance: 0 });
    expect(spendHint(Number.NaN)).toEqual({ ok: false, balance: 0 });
  });
});
