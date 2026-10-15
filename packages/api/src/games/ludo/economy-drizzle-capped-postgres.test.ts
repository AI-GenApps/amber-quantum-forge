import { describe, expect, it } from "vitest";
import { DrizzleLudoEconomyStore } from "./economy-drizzle-store";

/**
 * Task 26h: the Drizzle (advisory-lock + single transaction) implementation of
 * the atomic capped claims, fired with simultaneous callers against a real
 * PostgreSQL. Gated exactly like `drizzle-postgres.test.ts`: it only runs when
 * a dedicated test-only database is configured through
 * `LUDO_TEST_DATABASE_URL` (with the checked-in migrations applied, including
 * `0010` for `ludo_free_play_win_claims`), and reports as skipped (NOT RUN)
 * otherwise. It never runs against `DATABASE_URL`.
 */
const databaseUrl = process.env.LUDO_TEST_DATABASE_URL;
const suite = describe.skipIf(!databaseUrl);

suite("Ludo Drizzle economy store: atomic capped claims", () => {
  const unique = () => `pg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const claimDate = now.slice(0, 10);

  it("credits at most the rewarded-ad cap under simultaneous claims", async () => {
    const store = new DrizzleLudoEconomyStore();
    const subject = unique();
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        store.claimAdRewardWithCap("staging", {
          subject,
          adTransactionId: `${subject}_${i}`,
          rewardType: "coins",
          claimDate,
          dailyCap: 5,
          amount: 100,
          now,
        }),
      ),
    );
    expect(results.filter((r) => r.outcome === "credited")).toHaveLength(5);
    expect(await store.getBalance("staging", subject, "coins")).toBe(500);
  });

  it("credits at most the free-play win cap under simultaneous claims", async () => {
    const store = new DrizzleLudoEconomyStore();
    const subject = unique();
    const results = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        store.claimFreePlayWinWithCap("staging", {
          subject,
          matchId: `${subject}_${i}`,
          claimDate,
          dailyCap: 10,
          amount: 50,
          now,
        }),
      ),
    );
    expect(results.filter((r) => r.outcome === "credited")).toHaveLength(10);
    expect(await store.getBalance("staging", subject, "coins")).toBe(500);
  });

  it("credits one daily reward under simultaneous claims", async () => {
    const store = new DrizzleLudoEconomyStore();
    const subject = unique();
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        store.claimDailyReward("staging", {
          subject,
          today: claimDate,
          yesterday,
          calendar: [{ day: 1, coins: 200, diamonds: 0 }],
          passBonusPercent: 0,
          now,
        }),
      ),
    );
    expect(results.filter((r) => r.outcome === "claimed")).toHaveLength(1);
    expect(await store.getBalance("staging", subject, "coins")).toBe(200);
  });
});
