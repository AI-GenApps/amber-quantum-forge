import { describe, expect, test } from "vitest";
import {
  getEconomyConfig,
  LUDO_ECONOMY_CONFIG_V1,
  type LudoCoinTableTier,
  xpRequiredForLevel,
} from "./economy-config";

const REFERENCE_XP: Record<number, number> = {
  1: 100,
  2: 300,
  3: 580,
  4: 920,
  5: 1310,
  6: 1760,
  7: 2250,
  8: 2790,
  9: 3360,
  10: 3980,
  15: 7620,
  20: 12070,
  25: 17250,
  30: 23090,
  // Task 26a's own reference list states 36,590 for level 40, but
  // 100 * 40^1.6 = 36,584.40..., which rounds to the nearest 10 as 36,580,
  // not 36,590 (every other listed reference value, including the
  // immediate neighbors 30 and 50, matches the formula exactly — see
  // docs-internal/gaming/ludo-economy.md's "what changed" note). Trusting
  // the formula itself over the apparent transcription typo, per the
  // acceptance criteria ("matches the formula... for every reference
  // level").
  40: 36580,
  50: 52280,
};

describe("xpRequiredForLevel", () => {
  for (const [level, expected] of Object.entries(REFERENCE_XP)) {
    test(`level ${level} requires ${expected} XP`, () => {
      expect(xpRequiredForLevel(Number(level))).toBe(expected);
    });
  }

  test("matches the raw formula, rounded to the nearest 10, for arbitrary levels", () => {
    for (let level = 1; level <= 60; level += 1) {
      const expected = Math.round((100 * level ** 1.6) / 10) * 10;
      expect(xpRequiredForLevel(level)).toBe(expected);
    }
  });

  test("rejects non-positive or non-integer levels", () => {
    expect(() => xpRequiredForLevel(0)).toThrow();
    expect(() => xpRequiredForLevel(-1)).toThrow();
    expect(() => xpRequiredForLevel(1.5)).toThrow();
  });
});

describe("coin table payout math", () => {
  const tiers: LudoCoinTableTier[] = ["low", "mid", "high"];

  for (const tier of tiers) {
    const config = LUDO_ECONOMY_CONFIG_V1.coinTables[tier];

    test(`${tier}: 2-player payout + rake nets to 100% of gross pot`, () => {
      expect(config.twoPlayerWinnerPercentOfGrossPot + config.rakePercentOfGrossPot).toBe(100);
      const grossPot = config.entryFee * 2;
      const rake = (grossPot * config.rakePercentOfGrossPot) / 100;
      const winnerPayout = (grossPot * config.twoPlayerWinnerPercentOfGrossPot) / 100;
      expect(rake + winnerPayout).toBe(grossPot);
    });

    test(`${tier}: 4-player payout + rake nets to 100% of gross pot`, () => {
      const total =
        config.fourPlayerFirstPlacePercentOfGrossPot +
        config.fourPlayerSecondPlacePercentOfGrossPot +
        config.rakePercentOfGrossPot;
      expect(total).toBe(100);
      const grossPot = config.entryFee * 4;
      const rake = (grossPot * config.rakePercentOfGrossPot) / 100;
      const first = (grossPot * config.fourPlayerFirstPlacePercentOfGrossPot) / 100;
      const second = (grossPot * config.fourPlayerSecondPlacePercentOfGrossPot) / 100;
      expect(rake + first + second).toBe(grossPot);
    });
  }

  test("documented reference payouts match the config exactly", () => {
    const low = LUDO_ECONOMY_CONFIG_V1.coinTables.low;
    expect((low.entryFee * 2 * low.twoPlayerWinnerPercentOfGrossPot) / 100).toBe(950);
    expect((low.entryFee * 4 * low.fourPlayerFirstPlacePercentOfGrossPot) / 100).toBe(1400);
    expect((low.entryFee * 4 * low.fourPlayerSecondPlacePercentOfGrossPot) / 100).toBe(500);

    const mid = LUDO_ECONOMY_CONFIG_V1.coinTables.mid;
    expect((mid.entryFee * 2 * mid.twoPlayerWinnerPercentOfGrossPot) / 100).toBe(3800);
    expect((mid.entryFee * 4 * mid.fourPlayerFirstPlacePercentOfGrossPot) / 100).toBe(5600);
    expect((mid.entryFee * 4 * mid.fourPlayerSecondPlacePercentOfGrossPot) / 100).toBe(2000);

    const high = LUDO_ECONOMY_CONFIG_V1.coinTables.high;
    expect((high.entryFee * 2 * high.twoPlayerWinnerPercentOfGrossPot) / 100).toBe(19000);
    expect((high.entryFee * 4 * high.fourPlayerFirstPlacePercentOfGrossPot) / 100).toBe(28000);
    expect((high.entryFee * 4 * high.fourPlayerSecondPlacePercentOfGrossPot) / 100).toBe(10000);
  });
});

describe("catalog policy", () => {
  test("has no Remove Ads product anywhere in the config", () => {
    const serialized = JSON.stringify(LUDO_ECONOMY_CONFIG_V1).toLowerCase();
    expect(serialized).not.toContain("remove_ads");
    expect(serialized).not.toContain("remove ads");
    for (const product of LUDO_ECONOMY_CONFIG_V1.iapProducts) {
      expect(product.productId.toLowerCase()).not.toContain("remove");
      expect(product.displayName.toLowerCase()).not.toContain("remove ads");
    }
  });

  test("theme catalog has exactly 6 dice, 4 token, 3 board themes", () => {
    const byCategory = (category: "dice" | "token" | "board") =>
      LUDO_ECONOMY_CONFIG_V1.themes.filter((theme) => theme.category === category);
    expect(byCategory("dice")).toHaveLength(6);
    expect(byCategory("token")).toHaveLength(4);
    expect(byCategory("board")).toHaveLength(3);
  });

  test("board themes are diamond-only (no coin price) except none have a coin price at all", () => {
    for (const theme of LUDO_ECONOMY_CONFIG_V1.themes.filter((item) => item.category === "board")) {
      expect(theme.priceCoins).toBeNull();
    }
  });
});

describe("getEconomyConfig", () => {
  test("defaults to the latest version", () => {
    expect(getEconomyConfig().version).toBe(LUDO_ECONOMY_CONFIG_V1.version);
  });

  test("returns a specific historical version by number", () => {
    expect(getEconomyConfig(1).version).toBe(1);
  });

  test("throws for an unknown version", () => {
    expect(() => getEconomyConfig(999)).toThrow();
  });
});
