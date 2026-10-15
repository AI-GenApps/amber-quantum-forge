import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { EnvironmentGameTokenVerifier, signGameToken } from "../tokens";
import { getEconomyConfig } from "./economy-config";
import { InMemoryLudoEconomyStore } from "./economy-store";
import { InMemoryLudoStore } from "./memory-store";
import { createLudoRoutes } from "./routes";

const TEST_GAME_TOKEN_SECRET = "ludo-wallet-route-test-secret-with-32plus-characters";
const TEST_GAME_TOKEN_ISSUER = "https://issuer.test/games";
const TEST_GAME_TOKEN_AUDIENCE = "ludo-api-test";

async function testHarness(subject = "wallet-subject") {
  const economyStore = new InMemoryLudoEconomyStore();
  const verifyGameToken = new EnvironmentGameTokenVerifier();
  process.env.GAME_TOKEN_SECRET_LUDO_DEBUG = TEST_GAME_TOKEN_SECRET;
  process.env.GAME_TOKEN_ISSUER = TEST_GAME_TOKEN_ISSUER;
  process.env.GAME_TOKEN_AUDIENCE = TEST_GAME_TOKEN_AUDIENCE;
  const gameToken = await signGameToken(
    {
      appId: "ludo",
      environment: "debug",
      secret: TEST_GAME_TOKEN_SECRET,
      issuer: TEST_GAME_TOKEN_ISSUER,
      audience: TEST_GAME_TOKEN_AUDIENCE,
    },
    { subject, role: "player" },
    300,
  );
  const app = new Hono();
  app.route(
    "/games/ludo",
    createLudoRoutes({
      signSessionToken: async () => "unused",
      verifyGameToken,
      store: new InMemoryLudoStore(),
      economyStore,
    }),
  );
  return { app, economyStore, gameToken };
}

function authHeaders(gameToken: string) {
  return { Authorization: `Bearer ${gameToken}` };
}

describe("Ludo wallet/profile/inventory routes", () => {
  it("returns a zero wallet and level-1 profile before any grant", async () => {
    const { app, gameToken } = await testHarness();
    const wallet = await app.request("/games/ludo/debug/wallet", {
      headers: authHeaders(gameToken),
    });
    expect(wallet.status).toBe(200);
    expect(await wallet.json()).toEqual({ coins: 0, diamonds: 0 });

    const profile = await app.request("/games/ludo/debug/profile", {
      headers: authHeaders(gameToken),
    });
    expect(profile.status).toBe(200);
    expect(await profile.json()).toEqual({ level: 1, xp: 0, xpRequiredForNextLevel: 100 });
  });

  it("lists the full theme catalog even with no owned items", async () => {
    const { app, gameToken } = await testHarness();
    const response = await app.request("/games/ludo/debug/inventory", {
      headers: authHeaders(gameToken),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.inventory).toEqual([]);
    expect(body.catalog.length).toBe(getEconomyConfig().themes.length);
    expect(body.catalog[0]).toHaveProperty("item_id");
  });
});

describe("Ludo starter-grant route", () => {
  it("is idempotent across two calls: currency is credited exactly once", async () => {
    const { app, economyStore, gameToken } = await testHarness("starter-subject");
    const config = getEconomyConfig();

    const first = await app.request("/games/ludo/debug/starter-grant", {
      method: "POST",
      headers: authHeaders(gameToken),
    });
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({
      granted: true,
      coins: config.startingBalance.coins,
      diamonds: config.startingBalance.diamonds,
    });

    const second = await app.request("/games/ludo/debug/starter-grant", {
      method: "POST",
      headers: authHeaders(gameToken),
    });
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({
      granted: false,
      coins: config.startingBalance.coins,
      diamonds: config.startingBalance.diamonds,
    });

    const coinTransactions = await economyStore.listWalletTransactions(
      "debug",
      "starter-subject",
      "coins",
    );
    const diamondTransactions = await economyStore.listWalletTransactions(
      "debug",
      "starter-subject",
      "diamonds",
    );
    expect(coinTransactions).toHaveLength(1);
    expect(diamondTransactions).toHaveLength(1);
    expect(coinTransactions[0].delta).toBe(config.startingBalance.coins);
  });
});

describe("Ludo xp/claim route", () => {
  it("credits xp and levels up, crediting the coin bonus in the same operation", async () => {
    const { app, economyStore, gameToken } = await testHarness("xp-subject");
    const config = getEconomyConfig();

    // 100 xp reaches level 2 (cumulative requirement for level 2 is
    // xpRequiredForLevel(1) === 100), earning levelUpCoinsPerLevel * 2.
    const response = await app.request("/games/ludo/debug/xp/claim", {
      method: "POST",
      headers: { ...authHeaders(gameToken), "Content-Type": "application/json" },
      body: JSON.stringify({
        xp_delta: 100,
        claim_id: "claim-1",
        elapsed_ms: 60_000,
        matches_completed: 1,
      }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      idempotent: false,
      xp: 100,
      level: 2,
      xpRequiredForNextLevel: 300,
      levelsGained: 1,
    });

    const coinTransactions = await economyStore.listWalletTransactions(
      "debug",
      "xp-subject",
      "coins",
    );
    expect(coinTransactions).toHaveLength(1);
    expect(coinTransactions[0]).toMatchObject({
      delta: config.xp.levelUpCoinsPerLevel * 2,
      reason: "level_up",
      balanceAfter: config.xp.levelUpCoinsPerLevel * 2,
    });
    const coins = await economyStore.getBalance("debug", "xp-subject", "coins");
    expect(coins).toBe(config.xp.levelUpCoinsPerLevel * 2);
  });

  it("rejects an implausible elapsed-time/match-count payload without crediting any xp", async () => {
    const { app, economyStore, gameToken } = await testHarness("implausible-subject");
    const response = await app.request("/games/ludo/debug/xp/claim", {
      method: "POST",
      headers: { ...authHeaders(gameToken), "Content-Type": "application/json" },
      body: JSON.stringify({
        xp_delta: 1000,
        claim_id: "claim-implausible",
        elapsed_ms: 60_000,
        matches_completed: 1,
      }),
    });
    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("ludo_xp_claim_implausible");

    const progression = await economyStore.getProgression("debug", "implausible-subject");
    expect(progression).toBeNull();
  });

  it("rejects a second claim that would exceed the daily cap, crediting zero xp", async () => {
    const { app, economyStore, gameToken } = await testHarness("cap-subject");
    const config = getEconomyConfig();
    const cap = config.xp.offlineDailyXpCap;

    // First claim: just under the cap, plausible for its own match count.
    const matchesForFirst = Math.ceil((cap - 100) / config.xp.matchWinXp);
    const first = await app.request("/games/ludo/debug/xp/claim", {
      method: "POST",
      headers: { ...authHeaders(gameToken), "Content-Type": "application/json" },
      body: JSON.stringify({
        xp_delta: cap - 100,
        claim_id: "claim-under-cap",
        elapsed_ms: matchesForFirst * 20_000,
        matches_completed: matchesForFirst,
      }),
    });
    expect(first.status).toBe(200);

    // Second claim: 200 more xp would push the daily total over the cap.
    const second = await app.request("/games/ludo/debug/xp/claim", {
      method: "POST",
      headers: { ...authHeaders(gameToken), "Content-Type": "application/json" },
      body: JSON.stringify({
        xp_delta: 200,
        claim_id: "claim-over-cap",
        elapsed_ms: 40_000,
        matches_completed: 2,
      }),
    });
    expect(second.status).toBe(429);
    expect((await second.json()).error.code).toBe("ludo_xp_daily_cap_exceeded");

    const progression = await economyStore.getProgression("debug", "cap-subject");
    expect(progression?.xp).toBe(cap - 100);
  });

  it("never exceeds the daily xp cap when concurrent claims race each other", async () => {
    const { app, economyStore, gameToken } = await testHarness("concurrent-cap-subject");
    const config = getEconomyConfig();
    const cap = config.xp.offlineDailyXpCap;
    // Chosen so 6 concurrent claims of this size request more than the
    // cap in total, forcing at least one to be rejected, while each
    // individual claim stays plausible for its own match count.
    const perClaimXp = Math.ceil(cap / 5);
    const matches = Math.ceil(perClaimXp / config.xp.matchWinXp);

    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        app.request("/games/ludo/debug/xp/claim", {
          method: "POST",
          headers: { ...authHeaders(gameToken), "Content-Type": "application/json" },
          body: JSON.stringify({
            xp_delta: perClaimXp,
            claim_id: `concurrent-claim-${i}`,
            elapsed_ms: matches * 20_000,
            matches_completed: matches,
          }),
        }),
      ),
    );

    const bodies = await Promise.all(responses.map((r) => r.json()));
    const succeeded = responses.filter((r) => r.status === 200);
    const capped = responses.filter((r) => r.status === 429);
    expect(succeeded.length + capped.length).toBe(6);
    expect(capped.length).toBeGreaterThan(0);
    for (const body of bodies) {
      if (body.error) expect(body.error.code).toBe("ludo_xp_daily_cap_exceeded");
    }

    const progression = await economyStore.getProgression("debug", "concurrent-cap-subject");
    expect(progression?.xp ?? 0).toBeLessThanOrEqual(cap);
    const today = new Date().toISOString().slice(0, 10);
    expect(
      await economyStore.sumXpClaimed("debug", "concurrent-cap-subject", today),
    ).toBeLessThanOrEqual(cap);
  });

  it("is idempotent under concurrent replays of the same claim id: xp credited exactly once", async () => {
    const { app, economyStore, gameToken } = await testHarness("concurrent-replay-subject");

    const responses = await Promise.all(
      Array.from({ length: 8 }, () =>
        app.request("/games/ludo/debug/xp/claim", {
          method: "POST",
          headers: { ...authHeaders(gameToken), "Content-Type": "application/json" },
          body: JSON.stringify({
            xp_delta: 50,
            claim_id: "concurrent-replay-claim",
            elapsed_ms: 60_000,
            matches_completed: 1,
          }),
        }),
      ),
    );

    for (const response of responses) {
      expect(response.status).toBe(200);
    }

    const progression = await economyStore.getProgression("debug", "concurrent-replay-subject");
    expect(progression?.xp).toBe(50);
  });
});

describe("Ludo daily-reward/claim route", () => {
  it("enforces one claim per UTC day and advances/resets the streak", async () => {
    const { app, economyStore, gameToken } = await testHarness("daily-subject");
    const config = getEconomyConfig();

    const first = await app.request("/games/ludo/debug/daily-reward/claim", {
      method: "POST",
      headers: authHeaders(gameToken),
    });
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.streakDay).toBe(1);
    expect(firstBody.coinsGranted).toBe(config.dailyRewards[0].coins);

    // A second claim the same UTC day is rejected, not a fresh streak day.
    const repeat = await app.request("/games/ludo/debug/daily-reward/claim", {
      method: "POST",
      headers: authHeaders(gameToken),
    });
    expect(repeat.status).toBe(409);
    expect((await repeat.json()).error.code).toBe("ludo_daily_reward_already_claimed");

    // Simulate a missed day by backdating stored state to two days ago:
    // the streak resets to day 1 rather than advancing to day 2.
    const state = await economyStore.getDailyRewardState("debug", "daily-subject");
    if (!state) throw new Error("expected daily reward state after first claim");
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await economyStore.setDailyRewardState("debug", { ...state, lastClaimDate: twoDaysAgo });

    const afterMiss = await app.request("/games/ludo/debug/daily-reward/claim", {
      method: "POST",
      headers: authHeaders(gameToken),
    });
    expect(afterMiss.status).toBe(200);
    expect((await afterMiss.json()).streakDay).toBe(1);

    // Simulate a consecutive-day claim: the streak advances to day 2.
    const stateAfterMiss = await economyStore.getDailyRewardState("debug", "daily-subject");
    if (!stateAfterMiss) throw new Error("expected daily reward state after miss-reset claim");
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await economyStore.setDailyRewardState("debug", {
      ...stateAfterMiss,
      lastClaimDate: yesterday,
    });

    const consecutive = await app.request("/games/ludo/debug/daily-reward/claim", {
      method: "POST",
      headers: authHeaders(gameToken),
    });
    expect(consecutive.status).toBe(200);
    expect((await consecutive.json()).streakDay).toBe(2);
  });
});

describe("Ludo daily-reward status route and Vortex Pass bonus (task 26h)", () => {
  const claim = (app: Hono, gameToken: string) =>
    app.request("/games/ludo/debug/daily-reward/claim", {
      method: "POST",
      headers: authHeaders(gameToken),
    });
  const status = async (app: Hono, gameToken: string) => {
    const response = await app.request("/games/ludo/debug/daily-reward", {
      headers: authHeaders(gameToken),
    });
    expect(response.status).toBe(200);
    return response.json();
  };
  const activePass = {
    productId: "ludo_vortex_pass_monthly",
    status: "active" as const,
    willRenew: true,
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  };

  it("requires a game token", async () => {
    const { app } = await testHarness("status-anon");
    expect((await app.request("/games/ludo/debug/daily-reward")).status).toBe(401);
  });

  it("reports an unclaimed calendar, then the claimed day and the next one", async () => {
    const { app, gameToken } = await testHarness("status-subject");
    const config = getEconomyConfig();
    const before = await status(app, gameToken);
    expect(before).toMatchObject({
      claimedToday: false,
      streakDay: 0,
      nextDay: 1,
      passActive: false,
      passBonusPercent: config.vortexPass.dailyRewardBonusPercent,
    });
    expect(before.calendar).toEqual(
      config.dailyRewards.map(({ day, coins, diamonds }) => ({ day, coins, diamonds })),
    );
    await claim(app, gameToken);
    expect(await status(app, gameToken)).toMatchObject({
      claimedToday: true,
      streakDay: 1,
      nextDay: 2,
    });
  });

  it("applies the pass bonus server-side and reports it in the claim response", async () => {
    const { app, economyStore, gameToken } = await testHarness("pass-subject");
    const config = getEconomyConfig();
    await economyStore.processRevenueCatEvent("debug", {
      eventId: "pass-evt",
      eventType: "INITIAL_PURCHASE",
      productId: activePass.productId,
      subject: "pass-subject",
      now: new Date().toISOString(),
      ledgerEntries: [],
      subscription: activePass,
    });
    expect((await status(app, gameToken)).passActive).toBe(true);
    const response = await claim(app, gameToken);
    expect(response.status).toBe(200);
    const body = await response.json();
    const base = config.dailyRewards[0].coins;
    const bonus = Math.floor((base * config.vortexPass.dailyRewardBonusPercent) / 100);
    expect(body).toMatchObject({
      passBonusApplied: true,
      bonusCoins: bonus,
      coinsGranted: base + bonus,
      coins: base + bonus,
    });
  });

  it("applies no bonus for an expired pass", async () => {
    const { app, economyStore, gameToken } = await testHarness("expired-pass-subject");
    await economyStore.processRevenueCatEvent("debug", {
      eventId: "expired-evt",
      eventType: "EXPIRATION",
      productId: activePass.productId,
      subject: "expired-pass-subject",
      now: new Date().toISOString(),
      ledgerEntries: [],
      subscription: { ...activePass, status: "expired", willRenew: false },
    });
    const body = await (await claim(app, gameToken)).json();
    expect(body).toMatchObject({ passBonusApplied: false, bonusCoins: 0 });
    expect(body.coinsGranted).toBe(getEconomyConfig().dailyRewards[0].coins);
  });

  it("credits one day when many claims arrive simultaneously", async () => {
    const { app, economyStore, gameToken } = await testHarness("daily-race-subject");
    const responses = await Promise.all(Array.from({ length: 12 }, () => claim(app, gameToken)));
    const statuses = responses.map((response) => response.status).sort();
    expect(statuses.filter((code) => code === 200)).toHaveLength(1);
    expect(statuses.filter((code) => code === 409)).toHaveLength(11);
    expect(await economyStore.getBalance("debug", "daily-race-subject", "coins")).toBe(
      getEconomyConfig().dailyRewards[0].coins,
    );
  });
});

describe("Ludo inventory purchase route", () => {
  async function fund(
    economyStore: InMemoryLudoEconomyStore,
    subject: string,
    coins: number,
    diamonds = 0,
  ) {
    const now = "2026-10-16T00:00:00.000Z";
    await economyStore.appendLedgerEntry("debug", {
      subject,
      currency: "coins",
      delta: coins,
      reason: "starter_grant",
      idempotencyKey: "fund:coins",
      now,
    });
    if (diamonds > 0) {
      await economyStore.appendLedgerEntry("debug", {
        subject,
        currency: "diamonds",
        delta: diamonds,
        reason: "starter_grant",
        idempotencyKey: "fund:diamonds",
        now,
      });
    }
  }

  function buy(
    app: Hono,
    gameToken: string,
    body: Record<string, unknown>,
  ): Response | Promise<Response> {
    return app.request("/games/ludo/debug/inventory/purchase", {
      method: "POST",
      headers: { ...authHeaders(gameToken), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("debits the coin price and adds the item to inventory", async () => {
    const { app, economyStore, gameToken } = await testHarness("buyer-1");
    await fund(economyStore, "buyer-1", 2000);

    const response = await buy(app, gameToken, {
      item_id: "dice_gold",
      currency: "coins",
      idempotency_key: "buy-1",
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.idempotent).toBe(false);
    expect(body.item.item_id).toBe("dice_gold");
    expect(body.item.item_type).toBe("dice");
    expect(body.coins).toBe(500);
    expect(await economyStore.getBalance("debug", "buyer-1", "coins")).toBe(500);
    const owned = await economyStore.listInventory("debug", "buyer-1");
    expect(owned.map((row) => row.itemId)).toEqual(["dice_gold"]);
  });

  it("debits the diamond price for a diamond-only board theme", async () => {
    const { app, economyStore, gameToken } = await testHarness("buyer-2");
    await fund(economyStore, "buyer-2", 0, 100);

    const response = await buy(app, gameToken, {
      item_id: "board_cosmic",
      currency: "diamonds",
      idempotency_key: "buy-2",
    });

    expect(response.status).toBe(200);
    expect((await response.json()).diamonds).toBe(20);
  });

  it("rejects an insufficient balance with no partial debit and no inventory row", async () => {
    const { app, economyStore, gameToken } = await testHarness("buyer-3");
    await fund(economyStore, "buyer-3", 1499);

    const response = await buy(app, gameToken, {
      item_id: "dice_gold",
      currency: "coins",
      idempotency_key: "buy-3",
    });

    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("ludo_insufficient_balance");
    expect(await economyStore.getBalance("debug", "buyer-3", "coins")).toBe(1499);
    expect(await economyStore.listInventory("debug", "buyer-3")).toEqual([]);
    expect(await economyStore.listWalletTransactions("debug", "buyer-3", "coins")).toHaveLength(1);
  });

  it("replays the same idempotency key without debiting twice", async () => {
    const { app, economyStore, gameToken } = await testHarness("buyer-4");
    await fund(economyStore, "buyer-4", 5000);
    const request = { item_id: "dice_gold", currency: "coins", idempotency_key: "buy-4" };

    const first = await buy(app, gameToken, request);
    const second = await buy(app, gameToken, request);

    expect((await first.json()).idempotent).toBe(false);
    const replay = await second.json();
    expect(replay.idempotent).toBe(true);
    expect(replay.coins).toBe(3500);
    expect(await economyStore.getBalance("debug", "buyer-4", "coins")).toBe(3500);
  });

  it("rejects an already-owned item under a fresh key without debiting", async () => {
    const { app, economyStore, gameToken } = await testHarness("buyer-5");
    await fund(economyStore, "buyer-5", 5000);
    await buy(app, gameToken, { item_id: "dice_gold", currency: "coins", idempotency_key: "a" });

    const again = await buy(app, gameToken, {
      item_id: "dice_gold",
      currency: "coins",
      idempotency_key: "b",
    });

    expect(again.status).toBe(409);
    expect((await again.json()).error.code).toBe("ludo_item_already_owned");
    expect(await economyStore.getBalance("debug", "buyer-5", "coins")).toBe(3500);
  });

  it("rejects unknown items, unpriced currencies, free defaults and malformed bodies", async () => {
    const { app, economyStore, gameToken } = await testHarness("buyer-6");
    await fund(economyStore, "buyer-6", 100000, 1000);

    const unknown = await buy(app, gameToken, {
      item_id: "dice_nope",
      currency: "coins",
      idempotency_key: "u1",
    });
    expect(unknown.status).toBe(404);
    expect((await unknown.json()).error.code).toBe("ludo_item_not_found");

    const boardInCoins = await buy(app, gameToken, {
      item_id: "board_cosmic",
      currency: "coins",
      idempotency_key: "u2",
    });
    expect(boardInCoins.status).toBe(422);
    expect((await boardInCoins.json()).error.code).toBe("ludo_purchase_invalid");

    const freeDefault = await buy(app, gameToken, {
      item_id: "dice_default",
      currency: "coins",
      idempotency_key: "u3",
    });
    expect(freeDefault.status).toBe(422);

    const malformed = await buy(app, gameToken, { item_id: "dice_gold" });
    expect(malformed.status).toBe(422);
    expect(await economyStore.getBalance("debug", "buyer-6", "coins")).toBe(100000);
    expect(await economyStore.listInventory("debug", "buyer-6")).toEqual([]);
  });

  it("requires a game token", async () => {
    const { app } = await testHarness("buyer-7");
    const response = await app.request("/games/ludo/debug/inventory/purchase", {
      method: "POST",
      body: JSON.stringify({ item_id: "dice_gold", currency: "coins", idempotency_key: "x" }),
    });
    expect(response.status).toBe(401);
  });

  it("concurrent requests for different items cannot overspend", async () => {
    const { app, economyStore, gameToken } = await testHarness("buyer-8");
    await fund(economyStore, "buyer-8", 3000);
    const items = ["dice_classic_wood", "dice_neon_vortex", "dice_marble", "dice_galaxy"];

    const responses = await Promise.all(
      items.map((itemId, i) =>
        buy(app, gameToken, { item_id: itemId, currency: "coins", idempotency_key: `c${i}` }),
      ),
    );

    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([200, 200, 422, 422]);
    expect(await economyStore.getBalance("debug", "buyer-8", "coins")).toBe(0);
  });

  it("lists iap products alongside the theme catalog", async () => {
    const { app, gameToken } = await testHarness("buyer-9");
    const response = await app.request("/games/ludo/debug/inventory", {
      headers: authHeaders(gameToken),
    });
    const body = await response.json();
    expect(body.iap_products.length).toBe(getEconomyConfig().iapProducts.length);
    expect(body.iap_products[0]).toHaveProperty("product_id");
  });
});
