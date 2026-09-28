import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { EnvironmentGameTokenVerifier, signGameToken } from "../tokens";
import { getEconomyConfig } from "./economy-config";
import { InMemoryLudoEconomyStore } from "./economy-store";
import { InMemoryLudoStore } from "./memory-store";
import type { RevenueCatCustomerInfo } from "./revenuecat-client";
import { FakeRevenueCatClient } from "./revenuecat-client";
import { createLudoRoutes } from "./routes";

const TEST_GAME_TOKEN_SECRET = "ludo-revenuecat-sync-test-secret-with-32plus-characters";
const TEST_GAME_TOKEN_ISSUER = "https://issuer.test/games";
const TEST_GAME_TOKEN_AUDIENCE = "ludo-api-test";

async function testHarness(subject = "sync-subject", revenueCatClient?: FakeRevenueCatClient) {
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
      revenueCatClient,
    }),
  );
  return { app, economyStore, gameToken };
}

function authHeaders(gameToken: string) {
  return { Authorization: `Bearer ${gameToken}` };
}

describe("Ludo RevenueCat sync route", () => {
  it("degrades gracefully when no RevenueCat client is configured", async () => {
    const { app, gameToken } = await testHarness();
    const response = await app.request("/games/ludo/debug/revenuecat/sync", {
      method: "POST",
      headers: authHeaders(gameToken),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ synced: false, reason: "revenuecat_unavailable" });
  });

  it("requires a valid game token", async () => {
    const { app } = await testHarness();
    const response = await app.request("/games/ludo/debug/revenuecat/sync", { method: "POST" });
    expect(response.status).toBe(401);
  });

  it("reconciles a mocked CustomerInfo: grants an unsynced non-subscription purchase and activates the pass", async () => {
    const fake = new FakeRevenueCatClient();
    const { app, economyStore, gameToken } = await testHarness("sync-subject", fake);
    const config = getEconomyConfig();
    const customerInfo: RevenueCatCustomerInfo = {
      appUserId: "sync-subject",
      entitlements: [
        {
          entitlementId: "vortex_pass",
          productId: config.vortexPass.productId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      nonSubscriptionPurchases: [
        {
          purchaseId: "rc_purchase_1",
          productId: "ludo_coins_small",
          purchasedAt: new Date().toISOString(),
        },
      ],
    };
    fake.setResponse("sync-subject", customerInfo);

    const response = await app.request("/games/ludo/debug/revenuecat/sync", {
      method: "POST",
      headers: authHeaders(gameToken),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.synced).toBe(true);
    expect(body.grantedPurchases).toBe(1);
    expect(body.subscription.status).toBe("active");

    const product = config.iapProducts.find((p) => p.productId === "ludo_coins_small");
    expect(await economyStore.getBalance("debug", "sync-subject", "coins")).toBe(
      product?.grantsCoins,
    );
    const subscription = await economyStore.getSubscription("debug", "sync-subject");
    expect(subscription?.status).toBe("active");
  });

  it("never double-grants a non-subscription purchase the webhook already granted", async () => {
    const fake = new FakeRevenueCatClient();
    const { app, economyStore, gameToken } = await testHarness("sync-subject", fake);
    const config = getEconomyConfig();
    const product = config.iapProducts.find((p) => p.productId === "ludo_coins_small");

    // Simulate the webhook having already granted this purchase under the
    // same idempotency key the sync path derives from the purchase id.
    await economyStore.appendLedgerEntry("debug", {
      subject: "sync-subject",
      currency: "coins",
      delta: product?.grantsCoins ?? 0,
      reason: "iap_purchase",
      sourceRef: "ludo_coins_small",
      idempotencyKey: "rc_purchase_1:coins",
      now: new Date().toISOString(),
    });

    fake.setResponse("sync-subject", {
      appUserId: "sync-subject",
      entitlements: [],
      nonSubscriptionPurchases: [
        {
          purchaseId: "rc_purchase_1",
          productId: "ludo_coins_small",
          purchasedAt: new Date().toISOString(),
        },
      ],
    });

    const response = await app.request("/games/ludo/debug/revenuecat/sync", {
      method: "POST",
      headers: authHeaders(gameToken),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).grantedPurchases).toBe(0);
    expect(await economyStore.getBalance("debug", "sync-subject", "coins")).toBe(
      product?.grantsCoins,
    );
  });
});
