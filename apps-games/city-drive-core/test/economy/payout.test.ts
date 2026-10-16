import { describe, expect, it } from "vitest";
import { missionPayout, REPLAY_BONUS_FRACTION, replayBonus } from "../../src/index";

const REWARDS = { "1": 40, "2": 64, "3": 96 } as const;

describe("missionPayout", () => {
  it("pays the reward for the stars earned on a first clear", () => {
    for (const stars of [1, 2, 3] as const) {
      const payout = missionPayout(REWARDS, 0, stars);
      expect(payout.coins).toBe(REWARDS[String(stars) as "1" | "2" | "3"]);
      expect(payout).toMatchObject({ firstClear: true, improved: true });
    }
  });

  it("pays only the gap to the best stars on an upgrade, plus the replay bonus", () => {
    const payout = missionPayout(REWARDS, 1, 3);
    expect(payout.coins).toBe(96 - 40 + replayBonus(REWARDS));
    expect(payout).toMatchObject({ firstClear: false, improved: true });
    expect(missionPayout(REWARDS, 2, 3).coins).toBe(96 - 64 + 4);
  });

  it("pays only the replay bonus when the stars match or fall below the best", () => {
    expect(missionPayout(REWARDS, 3, 3).coins).toBe(4);
    expect(missionPayout(REWARDS, 3, 1).coins).toBe(4);
    expect(missionPayout(REWARDS, 2, 1)).toMatchObject({ coins: 4, improved: false });
  });

  it("replay bonus is 10% of the 1-star reward, rounded", () => {
    expect(REPLAY_BONUS_FRACTION).toBe(0.1);
    expect(replayBonus({ "1": 40, "2": 64, "3": 96 })).toBe(4);
    expect(replayBonus({ "1": 44, "2": 70, "3": 106 })).toBe(4);
    expect(replayBonus({ "1": 48, "2": 77, "3": 115 })).toBe(5);
  });

  it("pays nothing for a failed run", () => {
    expect(missionPayout(REWARDS, 0, 0).coins).toBe(0);
    expect(missionPayout(REWARDS, 3, 0)).toEqual({ coins: 0, firstClear: false, improved: false });
  });

  it("never pays a negative amount, even with odd reward tables", () => {
    const odd = { "1": 50, "2": 40, "3": 30 };
    for (const best of [0, 1, 2, 3] as const) {
      for (const stars of [0, 1, 2, 3] as const) {
        expect(missionPayout(odd, best, stars).coins).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("total paid for upgrading one star at a time equals the 3-star reward plus bonuses", () => {
    const first = missionPayout(REWARDS, 0, 1).coins;
    const second = missionPayout(REWARDS, 1, 2).coins - replayBonus(REWARDS);
    const third = missionPayout(REWARDS, 2, 3).coins - replayBonus(REWARDS);
    expect(first + second + third).toBe(REWARDS["3"]);
  });
});
