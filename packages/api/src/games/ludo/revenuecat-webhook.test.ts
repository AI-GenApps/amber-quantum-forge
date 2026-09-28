import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import { getEconomyConfig } from "./economy-config";
import { InMemoryLudoEconomyStore } from "./economy-store";
import { InMemoryLudoStore } from "./memory-store";
import { createLudoRoutes } from "./routes";

const WEBHOOK_SECRET = "ludo-revenuecat-webhook-test-secret";

function testHarness() {
  const economyStore = new InMemoryLudoEconomyStore();
  const app = new Hono();
  app.route(
    "/games/ludo",
    createLudoRoutes({
      signSessionToken: async () => "unused",
      verifyGameToken: { verify: async () => ({ subject: "unused", appId: "ludo" }) } as never,
      store: new InMemoryLudoStore(),
      economyStore,
      revenueCatWebhookSecret: WEBHOOK_SECRET,
    }),
  );
  return { app, economyStore };
}

function webhookHeaders() {
  return { Authorization: WEBHOOK_SECRET, "Content-Type": "application/json" };
}

function fixture(
  overrides: Partial<{
    id: string;
    type: string;
    app_user_id: string;
    product_id: string;
    expiration_at_ms: number | null;
  }>,
) {
  return {
    event: {
      id: "evt_1",
      type: "INITIAL_PURCHASE",
      app_user_id: "subject-1",
      product_id: "ludo_coins_small",
      ...overrides,
    },
  };
}

async function postWebhook(app: Hono, body: unknown) {
  return app.request("/games/ludo/debug/revenuecat/webhook", {
    method: "POST",
    headers: webhookHeaders(),
    body: JSON.stringify(body),
  });
}

describe("Ludo RevenueCat webhook: auth", () => {
  it("rejects a missing/mismatched Authorization header", async () => {
    const { app } = testHarness();
    const response = await app.request("/games/ludo/debug/revenuecat/webhook", {
      method: "POST",
      headers: { Authorization: "wrong-secret", "Content-Type": "application/json" },
      body: JSON.stringify(fixture({})),
    });
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("ludo_revenuecat_unauthorized");
  });

  it("rejects every call when no secret is configured, never accepting an unauthenticated header", async () => {
    const economyStore = new InMemoryLudoEconomyStore();
    const app = new Hono();
    app.route(
      "/games/ludo",
      createLudoRoutes({
        signSessionToken: async () => "unused",
        verifyGameToken: { verify: async () => ({ subject: "unused", appId: "ludo" }) } as never,
        store: new InMemoryLudoStore(),
        economyStore,
      }),
    );
    const response = await app.request("/games/ludo/debug/revenuecat/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fixture({})),
    });
    expect(response.status).toBe(401);
  });
});

describe("Ludo RevenueCat webhook: currency grants", () => {
  let harness: ReturnType<typeof testHarness>;
  beforeEach(() => {
    harness = testHarness();
  });

  it("grants coins for INITIAL_PURCHASE of a coin product", async () => {
    const { app, economyStore } = harness;
    const response = await postWebhook(app, fixture({}));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, applied: true });
    const config = getEconomyConfig();
    const product = config.iapProducts.find((p) => p.productId === "ludo_coins_small");
    const balance = await economyStore.getBalance("debug", "subject-1", "coins");
    expect(balance).toBe(product?.grantsCoins);
  });

  it("grants both coins and diamonds for NON_SUBSCRIPTION_PURCHASE of the starter pack", async () => {
    const { app, economyStore } = harness;
    const response = await postWebhook(
      app,
      fixture({
        id: "evt_starter",
        type: "NON_SUBSCRIPTION_PURCHASE",
        product_id: "ludo_starter_pack",
      }),
    );
    expect(response.status).toBe(200);
    const config = getEconomyConfig();
    const product = config.iapProducts.find((p) => p.productId === "ludo_starter_pack");
    expect(await economyStore.getBalance("debug", "subject-1", "coins")).toBe(product?.grantsCoins);
    expect(await economyStore.getBalance("debug", "subject-1", "diamonds")).toBe(
      product?.grantsDiamonds,
    );
  });

  it("is idempotent: replaying the same event id grants coins exactly once", async () => {
    const { app, economyStore } = harness;
    const first = await postWebhook(app, fixture({}));
    expect((await first.json()).applied).toBe(true);
    const second = await postWebhook(app, fixture({}));
    expect((await second.json()).applied).toBe(false);
    const config = getEconomyConfig();
    const product = config.iapProducts.find((p) => p.productId === "ludo_coins_small");
    expect(await economyStore.getBalance("debug", "subject-1", "coins")).toBe(product?.grantsCoins);
  });

  it("debits back a coin grant on REFUND via a negative-delta ledger row, never deleting the original", async () => {
    const { app, economyStore } = harness;
    await postWebhook(app, fixture({}));
    const refundResponse = await postWebhook(app, fixture({ id: "evt_refund", type: "REFUND" }));
    expect(refundResponse.status).toBe(200);
    expect(await economyStore.getBalance("debug", "subject-1", "coins")).toBe(0);
    const transactions = await economyStore.listWalletTransactions("debug", "subject-1", "coins");
    expect(transactions).toHaveLength(2);
    expect(transactions[0]?.reason).toBe("iap_purchase");
    expect(transactions[0]?.delta).toBeGreaterThan(0);
    expect(transactions[1]?.reason).toBe("refund");
    expect(transactions[1]?.delta).toBeLessThan(0);
  });

  it("rejects an unrecognized product id rather than silently ignoring it", async () => {
    const { app, economyStore } = harness;
    const response = await postWebhook(
      app,
      fixture({ id: "evt_unknown", product_id: "ludo_noads" }),
    );
    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("ludo_revenuecat_unknown_product");
    expect(await economyStore.getBalance("debug", "subject-1", "coins")).toBe(0);
  });
});

describe("Ludo RevenueCat webhook: Vortex Pass subscription lifecycle", () => {
  it("transitions active -> renewed -> cancelled -> expired", async () => {
    const { app, economyStore } = testHarness();
    const dayMs = 24 * 60 * 60 * 1000;

    const initial = await postWebhook(
      app,
      fixture({
        id: "evt_pass_initial",
        type: "INITIAL_PURCHASE",
        product_id: "ludo_vortex_pass_monthly",
        expiration_at_ms: Date.now() + 30 * dayMs,
      }),
    );
    expect(initial.status).toBe(200);
    let subscription = await economyStore.getSubscription("debug", "subject-1");
    expect(subscription?.status).toBe("active");
    expect(subscription?.willRenew).toBe(true);

    const renewal = await postWebhook(
      app,
      fixture({
        id: "evt_pass_renewal",
        type: "RENEWAL",
        product_id: "ludo_vortex_pass_monthly",
        expiration_at_ms: Date.now() + 60 * dayMs,
      }),
    );
    expect(renewal.status).toBe(200);
    const afterRenewal = await economyStore.getSubscription("debug", "subject-1");
    expect(afterRenewal?.status).toBe("active");
    expect(afterRenewal?.expiresAt).not.toBe(subscription?.expiresAt);

    const cancellation = await postWebhook(
      app,
      fixture({
        id: "evt_pass_cancel",
        type: "CANCELLATION",
        product_id: "ludo_vortex_pass_monthly",
        expiration_at_ms: afterRenewal ? new Date(afterRenewal.expiresAt ?? "").getTime() : null,
      }),
    );
    expect(cancellation.status).toBe(200);
    subscription = await economyStore.getSubscription("debug", "subject-1");
    expect(subscription?.status).toBe("cancelled");
    expect(subscription?.willRenew).toBe(false);

    const expiration = await postWebhook(
      app,
      fixture({
        id: "evt_pass_expire",
        type: "EXPIRATION",
        product_id: "ludo_vortex_pass_monthly",
        expiration_at_ms: Date.now(),
      }),
    );
    expect(expiration.status).toBe(200);
    subscription = await economyStore.getSubscription("debug", "subject-1");
    expect(subscription?.status).toBe("expired");
  });

  it("revokes the pass entitlement on REFUND without any ledger currency debit", async () => {
    const { app, economyStore } = testHarness();
    await postWebhook(
      app,
      fixture({
        id: "evt_pass_initial2",
        type: "INITIAL_PURCHASE",
        product_id: "ludo_vortex_pass_monthly",
        expiration_at_ms: Date.now() + 30 * 24 * 60 * 60 * 1000,
      }),
    );
    const refund = await postWebhook(
      app,
      fixture({ id: "evt_pass_refund", type: "REFUND", product_id: "ludo_vortex_pass_monthly" }),
    );
    expect(refund.status).toBe(200);
    const subscription = await economyStore.getSubscription("debug", "subject-1");
    expect(subscription?.status).toBe("revoked");
    expect(subscription?.willRenew).toBe(false);
    expect(await economyStore.getBalance("debug", "subject-1", "coins")).toBe(0);
    expect(await economyStore.getBalance("debug", "subject-1", "diamonds")).toBe(0);
  });
});
