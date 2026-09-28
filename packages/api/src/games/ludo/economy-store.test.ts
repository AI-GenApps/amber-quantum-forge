import { describe, expect, test } from "vitest";
import { InMemoryLudoEconomyStore } from "./economy-store";

const ENV = "debug" as const;

function sumDelta(transactions: { delta: number }[]): number {
  return transactions.reduce((total, row) => total + row.delta, 0);
}

describe("InMemoryLudoEconomyStore ledger invariant", () => {
  test("balance always equals SUM(delta) across sequential appends", async () => {
    const store = new InMemoryLudoEconomyStore();
    const subject = "user-1";

    await store.appendLedgerEntry(ENV, {
      subject,
      currency: "coins",
      delta: 5000,
      reason: "starter_grant",
      idempotencyKey: "starter",
      now: "2026-09-25T00:00:00.000Z",
    });
    await store.appendLedgerEntry(ENV, {
      subject,
      currency: "coins",
      delta: -500,
      reason: "coin_table_entry",
      idempotencyKey: "entry-1",
      now: "2026-09-25T00:01:00.000Z",
    });
    await store.appendLedgerEntry(ENV, {
      subject,
      currency: "coins",
      delta: 950,
      reason: "coin_table_payout",
      idempotencyKey: "payout-1",
      now: "2026-09-25T00:02:00.000Z",
    });

    const transactions = await store.listWalletTransactions(ENV, subject, "coins");
    const balance = await store.getBalance(ENV, subject, "coins");
    expect(balance).toBe(sumDelta(transactions));
    expect(balance).toBe(5450);
  });

  test("a duplicate idempotency key never applies delta twice", async () => {
    const store = new InMemoryLudoEconomyStore();
    const subject = "user-2";
    const input = {
      subject,
      currency: "coins" as const,
      delta: 100,
      reason: "rewarded_ad" as const,
      idempotencyKey: "ad-claim-1",
      now: "2026-09-25T00:00:00.000Z",
    };

    const first = await store.appendLedgerEntry(ENV, input);
    const second = await store.appendLedgerEntry(ENV, {
      ...input,
      now: "2026-09-25T00:05:00.000Z",
    });

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    expect(first.transaction.id).toBe(second.transaction.id);

    const transactions = await store.listWalletTransactions(ENV, subject, "coins");
    const balance = await store.getBalance(ENV, subject, "coins");
    expect(transactions).toHaveLength(1);
    expect(balance).toBe(100);
    expect(balance).toBe(sumDelta(transactions));
  });

  test("a simulated concurrent double-write with the same idempotency key does not double-apply", async () => {
    const store = new InMemoryLudoEconomyStore();
    const subject = "user-3";
    const input = {
      subject,
      currency: "diamonds" as const,
      delta: 20,
      reason: "starter_grant" as const,
      idempotencyKey: "starter-diamonds",
      now: "2026-09-25T00:00:00.000Z",
    };

    // Fire both "concurrent" appends without awaiting the first, so they
    // race inside the store's single-flight serialization queue.
    const [first, second] = await Promise.all([
      store.appendLedgerEntry(ENV, input),
      store.appendLedgerEntry(ENV, input),
    ]);

    const applied = [first, second].filter((result) => result.applied);
    const replayed = [first, second].filter((result) => !result.applied);
    expect(applied).toHaveLength(1);
    expect(replayed).toHaveLength(1);
    expect(first.transaction.id).toBe(second.transaction.id);

    const transactions = await store.listWalletTransactions(ENV, subject, "diamonds");
    const balance = await store.getBalance(ENV, subject, "diamonds");
    expect(transactions).toHaveLength(1);
    expect(balance).toBe(20);
    expect(balance).toBe(sumDelta(transactions));
  });

  test("different currencies for the same subject maintain independent balances", async () => {
    const store = new InMemoryLudoEconomyStore();
    const subject = "user-4";
    await store.appendLedgerEntry(ENV, {
      subject,
      currency: "coins",
      delta: 5000,
      reason: "starter_grant",
      idempotencyKey: "starter-coins",
      now: "2026-09-25T00:00:00.000Z",
    });
    await store.appendLedgerEntry(ENV, {
      subject,
      currency: "diamonds",
      delta: 20,
      reason: "starter_grant",
      idempotencyKey: "starter-diamonds",
      now: "2026-09-25T00:00:00.000Z",
    });

    expect(await store.getBalance(ENV, subject, "coins")).toBe(5000);
    expect(await store.getBalance(ENV, subject, "diamonds")).toBe(20);
  });
});

describe("InMemoryLudoEconomyStore inventory/progression/daily-reward/ad-claim/escrow", () => {
  test("grantInventoryItem is idempotent per (subject, itemId)", async () => {
    const store = new InMemoryLudoEconomyStore();
    const row = {
      subject: "user-5",
      itemId: "dice_gold",
      itemType: "dice" as const,
      acquiredVia: "store_purchase",
      acquiredAt: "2026-09-25T00:00:00.000Z",
    };
    const first = await store.grantInventoryItem(ENV, row);
    const second = await store.grantInventoryItem(ENV, { ...row, acquiredVia: "admin_adjustment" });
    expect(first).toEqual(second);
    expect(await store.listInventory(ENV, "user-5")).toHaveLength(1);
  });

  test("setProgression overwrites xp/level for a subject", async () => {
    const store = new InMemoryLudoEconomyStore();
    await store.setProgression(ENV, "user-6", 100, 1, "2026-09-25T00:00:00.000Z");
    const updated = await store.setProgression(ENV, "user-6", 450, 2, "2026-09-25T01:00:00.000Z");
    expect(updated).toEqual({
      environment: ENV,
      subject: "user-6",
      xp: 450,
      level: 2,
      updatedAt: "2026-09-25T01:00:00.000Z",
    });
    expect(await store.getProgression(ENV, "user-6")).toEqual(updated);
  });

  test("daily reward state round-trips", async () => {
    const store = new InMemoryLudoEconomyStore();
    expect(await store.getDailyRewardState(ENV, "user-7")).toBeNull();
    const row = {
      subject: "user-7",
      lastClaimDate: "2026-09-25",
      streakDay: 3,
      updatedAt: "2026-09-25T00:00:00.000Z",
    };
    await store.setDailyRewardState(ENV, row);
    expect(await store.getDailyRewardState(ENV, "user-7")).toEqual({ ...row, environment: ENV });
  });

  test("recordAdClaim is idempotent by adTransactionId and counts toward the daily cap once", async () => {
    const store = new InMemoryLudoEconomyStore();
    const row = {
      subject: "user-8",
      adTransactionId: "ad-tx-1",
      rewardType: "coins" as const,
      claimDate: "2026-09-25",
    };
    const first = await store.recordAdClaim(ENV, row, "2026-09-25T00:00:00.000Z");
    const second = await store.recordAdClaim(ENV, row, "2026-09-25T00:05:00.000Z");
    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    expect(await store.countAdClaims(ENV, "user-8", "coins", "2026-09-25")).toBe(1);
  });

  test("escrow create is idempotent by matchId and resolveEscrow transitions status", async () => {
    const store = new InMemoryLudoEconomyStore();
    const row = {
      matchId: "match-1",
      tier: "low" as const,
      pot: 2000,
      rake: 100,
      createdAt: "2026-09-25T00:00:00.000Z",
    };
    const created = await store.createEscrow(ENV, row);
    const createdAgain = await store.createEscrow(ENV, row);
    expect(created).toEqual(createdAgain);
    expect(created.status).toBe("held");

    const resolved = await store.resolveEscrow(
      ENV,
      "match-1",
      "paid_out",
      "2026-09-25T00:10:00.000Z",
    );
    expect(resolved.status).toBe("paid_out");
    expect(resolved.resolvedAt).toBe("2026-09-25T00:10:00.000Z");
    expect(await store.getEscrow(ENV, "match-1")).toEqual(resolved);
  });

  test("resolveEscrow throws for an unknown match", async () => {
    const store = new InMemoryLudoEconomyStore();
    await expect(
      store.resolveEscrow(ENV, "does-not-exist", "refunded", "2026-09-25T00:00:00.000Z"),
    ).rejects.toThrow();
  });
});
