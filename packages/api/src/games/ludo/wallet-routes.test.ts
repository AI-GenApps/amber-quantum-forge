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
