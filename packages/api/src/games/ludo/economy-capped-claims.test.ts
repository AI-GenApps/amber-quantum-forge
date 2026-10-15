/// Atomic capped claims (task 26h): rewarded-ad credits, online free-play
/// win credits and the daily calendar claim. Each is a single check-and-write
/// (`recordXpClaimWithCap`'s pattern, commit f755ac1), so simultaneous claims
/// can never credit more than the cap's worth, which every test below fires.
import { describe, expect, test } from "vitest";
import { settleCoinStakeMatch } from "./coin-stake";
import type { LudoMatchView } from "./contracts";
import { getEconomyConfig } from "./economy-config";
import { InMemoryLudoEconomyStore } from "./economy-store";
import { grantFreePlayWinReward } from "./free-play-reward";
import { InMemoryLudoStore } from "./memory-store";

const ENV = "debug" as const;
const NOW = "2026-10-16T10:00:00.000Z";
const CONFIG = getEconomyConfig();

const adClaim = (subject: string, i: number, rewardType: "coins" | "diamonds", cap: number) => ({
  subject,
  adTransactionId: `ad-${rewardType}-${i}`,
  rewardType,
  claimDate: "2026-10-16",
  dailyCap: cap,
  amount: rewardType === "coins" ? CONFIG.rewardedAds.coinsPerAd : CONFIG.rewardedAds.diamondsPerAd,
  now: NOW,
});

describe("claimAdRewardWithCap", () => {
  test("credits the ledger and records the claim together", async () => {
    const store = new InMemoryLudoEconomyStore();
    const result = await store.claimAdRewardWithCap(ENV, adClaim("u", 0, "coins", 5));
    expect(result.outcome).toBe("credited");
    expect(await store.getBalance(ENV, "u", "coins")).toBe(100);
    expect(await store.countAdClaims(ENV, "u", "coins", "2026-10-16")).toBe(1);
  });

  test("never credits more than the coin cap under simultaneous claims", async () => {
    const store = new InMemoryLudoEconomyStore();
    const results = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        store.claimAdRewardWithCap(ENV, adClaim("u", i, "coins", 5)),
      ),
    );
    expect(results.filter((r) => r.outcome === "credited")).toHaveLength(5);
    expect(results.filter((r) => r.outcome === "cap_exceeded")).toHaveLength(20);
    expect(await store.getBalance(ENV, "u", "coins")).toBe(5 * 100);
    expect(await store.countAdClaims(ENV, "u", "coins", "2026-10-16")).toBe(5);
  });

  test("never credits more than the diamond cap under simultaneous claims", async () => {
    const store = new InMemoryLudoEconomyStore();
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        store.claimAdRewardWithCap(ENV, adClaim("u", i, "diamonds", 2)),
      ),
    );
    expect(results.filter((r) => r.outcome === "credited")).toHaveLength(2);
    expect(await store.getBalance(ENV, "u", "diamonds")).toBe(2 * 5);
  });

  test("a simultaneously repeated transaction id is credited once, the rest are duplicates", async () => {
    const store = new InMemoryLudoEconomyStore();
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        store.claimAdRewardWithCap(ENV, adClaim("u", 1, "coins", 5)),
      ),
    );
    expect(results.filter((r) => r.outcome === "credited")).toHaveLength(1);
    expect(results.filter((r) => r.outcome === "duplicate")).toHaveLength(9);
    expect(await store.getBalance(ENV, "u", "coins")).toBe(100);
  });

  test("a duplicate at the cap stays a duplicate, not a cap rejection", async () => {
    const store = new InMemoryLudoEconomyStore();
    for (let i = 0; i < 5; i++) await store.claimAdRewardWithCap(ENV, adClaim("u", i, "coins", 5));
    const replay = await store.claimAdRewardWithCap(ENV, adClaim("u", 2, "coins", 5));
    expect(replay.outcome).toBe("duplicate");
  });

  test("the cap is per subject, per type and per day", async () => {
    const store = new InMemoryLudoEconomyStore();
    for (let i = 0; i < 5; i++) await store.claimAdRewardWithCap(ENV, adClaim("a", i, "coins", 5));
    const otherSubject = await store.claimAdRewardWithCap(ENV, adClaim("b", 0, "coins", 5));
    const otherType = await store.claimAdRewardWithCap(ENV, adClaim("a", 0, "diamonds", 2));
    const nextDay = await store.claimAdRewardWithCap(ENV, {
      ...adClaim("a", 99, "coins", 5),
      claimDate: "2026-10-17",
    });
    expect([otherSubject, otherType, nextDay].map((r) => r.outcome)).toEqual([
      "credited",
      "credited",
      "credited",
    ]);
  });
});

describe("claimFreePlayWinWithCap", () => {
  const winClaim = (subject: string, matchId: string, cap = CONFIG.onlineFreePlayWinDailyCap) => ({
    subject,
    matchId,
    claimDate: "2026-10-16",
    dailyCap: cap,
    amount: CONFIG.onlineFreePlayWinCoins,
    now: NOW,
  });

  test("never credits more than the daily win cap under simultaneous claims", async () => {
    const store = new InMemoryLudoEconomyStore();
    const results = await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        store.claimFreePlayWinWithCap(ENV, winClaim("w", `m-${i}`)),
      ),
    );
    expect(results.filter((r) => r.outcome === "credited")).toHaveLength(10);
    expect(results.filter((r) => r.outcome === "cap_exceeded")).toHaveLength(20);
    expect(await store.getBalance(ENV, "w", "coins")).toBe(10 * CONFIG.onlineFreePlayWinCoins);
    const txs = await store.listWalletTransactions(ENV, "w", "coins");
    expect(txs.every((tx) => tx.reason === "online_match_win")).toBe(true);
  });

  test("the same match is credited once even when claimed simultaneously", async () => {
    const store = new InMemoryLudoEconomyStore();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => store.claimFreePlayWinWithCap(ENV, winClaim("w", "m-1"))),
    );
    expect(results.filter((r) => r.outcome === "credited")).toHaveLength(1);
    expect(await store.getBalance(ENV, "w", "coins")).toBe(CONFIG.onlineFreePlayWinCoins);
  });
});

describe("claimDailyReward", () => {
  const dailyClaim = (subject: string, today: string, yesterday: string, bonus = 0) => ({
    subject,
    today,
    yesterday,
    calendar: CONFIG.dailyRewards,
    passBonusPercent: bonus,
    now: NOW,
  });

  test("two simultaneous claims credit the day once", async () => {
    const store = new InMemoryLudoEconomyStore();
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        store.claimDailyReward(ENV, dailyClaim("d", "2026-10-16", "2026-10-15")),
      ),
    );
    expect(results.filter((r) => r.outcome === "claimed")).toHaveLength(1);
    expect(results.filter((r) => r.outcome === "already_claimed")).toHaveLength(9);
    expect(await store.getBalance(ENV, "d", "coins")).toBe(CONFIG.dailyRewards[0].coins);
  });

  test("a streak continues on consecutive days, wraps after day 7 and resets after a gap", async () => {
    const store = new InMemoryLudoEconomyStore();
    const days = Array.from({ length: 8 }, (_, i) => `2026-10-${String(10 + i).padStart(2, "0")}`);
    const streak: number[] = [];
    for (let i = 0; i < days.length; i++) {
      const prev = i === 0 ? "2026-10-09" : days[i - 1];
      const result = await store.claimDailyReward(ENV, dailyClaim("s", days[i], prev));
      if (result.outcome === "claimed") streak.push(result.streakDay);
    }
    expect(streak).toEqual([1, 2, 3, 4, 5, 6, 7, 1]);
    const afterGap = await store.claimDailyReward(ENV, dailyClaim("s", "2026-10-25", "2026-10-24"));
    expect(afterGap).toMatchObject({ outcome: "claimed", streakDay: 1 });
  });

  test("day 7 grants its diamonds and a pass adds 50% of each currency as a separate perk entry", async () => {
    const store = new InMemoryLudoEconomyStore();
    await store.setDailyRewardState(ENV, {
      subject: "p",
      lastClaimDate: "2026-10-15",
      streakDay: 6,
      updatedAt: NOW,
    });
    const result = await store.claimDailyReward(
      ENV,
      dailyClaim("p", "2026-10-16", "2026-10-15", 50),
    );
    const day7 = CONFIG.dailyRewards[6];
    expect(result).toMatchObject({
      outcome: "claimed",
      streakDay: 7,
      coinsGranted: day7.coins + Math.floor(day7.coins / 2),
      diamondsGranted: day7.diamonds + Math.floor(day7.diamonds / 2),
      bonusCoins: Math.floor(day7.coins / 2),
      bonusDiamonds: Math.floor(day7.diamonds / 2),
    });
    const txs = await store.listWalletTransactions(ENV, "p", "coins");
    expect(txs.map((tx) => tx.reason).sort()).toEqual(["daily_login", "vortex_pass_perk"]);
  });
});

describe("free-play win reward on match finish", () => {
  const finishedMatch = (matchId: string, winnerSeat: number): LudoMatchView["matchState"] =>
    ({
      matchId,
      status: "finished",
      winnerOrder: [winnerSeat, 1 - winnerSeat],
      players: [
        { seat: 0, subject: "human" },
        { seat: 1, subject: "bot-1" },
      ],
    }) as unknown as LudoMatchView["matchState"];

  const settle = (store: InMemoryLudoEconomyStore, matchState: LudoMatchView["matchState"]) =>
    settleCoinStakeMatch(new InMemoryLudoStore(), ENV, matchState, { economyStore: store });

  test("pays the human winner once, however often the finished match is settled", async () => {
    const store = new InMemoryLudoEconomyStore();
    await Promise.all(Array.from({ length: 6 }, () => settle(store, finishedMatch("m-1", 0))));
    expect(await store.getBalance(ENV, "human", "coins")).toBe(CONFIG.onlineFreePlayWinCoins);
  });

  test("stops paying after the daily win cap", async () => {
    const store = new InMemoryLudoEconomyStore();
    await Promise.all(
      Array.from({ length: 15 }, (_, i) => settle(store, finishedMatch(`m-${i}`, 0))),
    );
    expect(await store.getBalance(ENV, "human", "coins")).toBe(
      CONFIG.onlineFreePlayWinDailyCap * CONFIG.onlineFreePlayWinCoins,
    );
  });

  test("does not pay an abandoned match", async () => {
    const store = new InMemoryLudoEconomyStore();
    const abandoned = {
      ...finishedMatch("m-ab", 0),
      status: "abandoned",
    } as LudoMatchView["matchState"];
    await settle(store, abandoned);
    expect(await store.getBalance(ENV, "human", "coins")).toBe(0);
  });

  test("never pays a bot winner", async () => {
    const store = new InMemoryLudoEconomyStore();
    const outcome = await grantFreePlayWinReward(
      store,
      ENV,
      finishedMatch("m-bot", 1),
      new Set(["bot-1"]),
      CONFIG,
    );
    expect(outcome).toBeNull();
    expect(await store.getBalance(ENV, "bot-1", "coins")).toBe(0);
  });
});
