import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { type GameTokenConfig, SignedGameTokenVerifier, signGameToken } from "../tokens";
import { MERGE_RELAY_THEME_PRODUCT_ID, type MergePlayPurchaseProvider } from "./commerce-contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { InMemoryMergeRelayStore } from "./memory-store";
import { createMergeRelayRoutes } from "./routes";
import { emptyMergeRelayState } from "./store";

const tokenConfig: GameTokenConfig = {
  appId: "merge_relay",
  environment: "debug",
  secret: "merge-relay-commerce-route-secret-with-at-least-32-characters",
  issuer: "https://issuer.test/games",
  audience: "merge-relay-commerce-route",
};

function setup(runtime = true) {
  const initial = emptyMergeRelayState();
  const config = initial.configs[0];
  if (!config) throw new Error("test config missing");
  config.features.cosmetics = runtime;
  const provider: MergePlayPurchaseProvider = {
    verifyPurchase: async () => ({
      state: "purchased",
      productId: MERGE_RELAY_THEME_PRODUCT_ID,
      orderId: "GPA.1234-5678-9012-34567",
      acknowledged: true,
      obfuscatedExternalAccountId: null,
    }),
    acknowledgePurchase: async () => undefined,
  };
  const dependencies: MergeRelayServiceDependencies & {
    tokenVerifier: SignedGameTokenVerifier;
  } = {
    store: new InMemoryMergeRelayStore({ debug: initial }),
    clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    rewardProvider: null,
    tokenVerifier: new SignedGameTokenVerifier(tokenConfig),
    commerceRuntimeForEnvironment: runtime
      ? (environment) => ({
          environment,
          config: {
            packageName: "app.w3dev.mergerelay",
            productId: MERGE_RELAY_THEME_PRODUCT_ID,
          },
          provider,
          tokenVault: null,
        })
      : () => null,
  };
  const app = new Hono();
  app.route("/games/merge_relay", createMergeRelayRoutes(dependencies));
  return app;
}

async function headers(subject: string): Promise<Record<string, string>> {
  const token = await signGameToken(tokenConfig, { subject, role: "player" });
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

describe("Merge Relay commerce HTTP contract", () => {
  it("returns an empty catalog when configuration or the shop kill switch is absent", async () => {
    const response = await setup(false).request("/games/merge_relay/debug/commerce/catalog", {
      headers: await headers("player"),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).data.catalog).toEqual({ enabled: false, products: [] });
  });

  it("rejects client app and environment claims", async () => {
    const response = await setup().request(
      "/games/merge_relay/debug/commerce/google-play/purchases",
      {
        method: "POST",
        headers: await headers("player"),
        body: JSON.stringify({
          app_id: "pocket_biome",
          environment: "production",
          product_id: MERGE_RELAY_THEME_PRODUCT_ID,
          purchase_token: "token-1",
        }),
      },
    );
    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("invalid_purchase");
  });

  it("settles through the signed session subject and isolates entitlements", async () => {
    const app = setup();
    const response = await app.request("/games/merge_relay/debug/commerce/google-play/purchases", {
      method: "POST",
      headers: await headers("one"),
      body: JSON.stringify({
        product_id: MERGE_RELAY_THEME_PRODUCT_ID,
        purchase_token: "token-1",
      }),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).data.entitlement.status).toBe("active");
    const reused = await app.request("/games/merge_relay/debug/commerce/google-play/restore", {
      method: "POST",
      headers: await headers("two"),
      body: JSON.stringify({
        product_id: MERGE_RELAY_THEME_PRODUCT_ID,
        purchase_token: "token-1",
      }),
    });
    expect(reused.status).toBe(409);
    const other = await app.request("/games/merge_relay/debug/commerce/entitlements", {
      headers: await headers("two"),
    });
    expect((await other.json()).data.entitlements).toHaveLength(0);
  });
});
