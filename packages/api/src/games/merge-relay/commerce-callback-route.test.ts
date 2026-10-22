import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { type GameTokenConfig, SignedGameTokenVerifier, signGameToken } from "../tokens";
import { MERGE_RELAY_THEME_PRODUCT_ID } from "./commerce-contracts";
import { InMemoryMergeRelayStore } from "./memory-store";
import type { MergeRelayRouteDependencies } from "./route-context";
import { createMergeRelayRoutes } from "./routes";

const tokenConfig: GameTokenConfig = {
  appId: "merge_relay",
  environment: "debug",
  secret: "merge-relay-callback-route-secret-with-at-least-32-characters",
  issuer: "https://issuer.test/games",
  audience: "merge-relay-callback-route",
};

function setup(authorized: boolean) {
  const dependencies: MergeRelayRouteDependencies = {
    store: new InMemoryMergeRelayStore(),
    clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    rewardProvider: null,
    tokenVerifier: new SignedGameTokenVerifier(tokenConfig),
    adSsvRuntimeForEnvironment: () => null,
    commerceRuntimeForEnvironment: (environment) => ({
      environment,
      config: { packageName: "app.w3dev.mergerelay", productId: MERGE_RELAY_THEME_PRODUCT_ID },
      provider: {
        verifyPurchase: async () => {
          throw new Error("unused");
        },
        acknowledgePurchase: async () => undefined,
      },
      tokenVault: null,
      voidedProvider: { listVoidedPurchases: async () => [] },
      rtdnAuthenticator: { authenticate: async () => authorized },
    }),
  };
  const app = new Hono();
  app.route("/games/merge_relay", createMergeRelayRoutes(dependencies));
  return app;
}

const base = "/games/merge_relay/debug";

describe("Merge Relay commerce callback routes", () => {
  it("serves RTDN without a game token but requires Pub/Sub authentication", async () => {
    const denied = await setup(false).request(`${base}/commerce/google-play/rtdn`, {
      method: "POST",
      body: "{}",
    });
    expect(denied.status).toBe(401);
    const invalid = await setup(true).request(`${base}/commerce/google-play/rtdn`, {
      method: "POST",
      body: "not json",
    });
    expect(invalid.status).toBe(422);
  });

  it("fails closed for unsigned or unconfigured SSV callbacks", async () => {
    const response = await setup(true).request(`${base}/rewards/admob/ssv?ad_unit=x`);
    expect(response.status).toBe(503);
  });

  it("requires a service session for voided reconciliation", async () => {
    const app = setup(true);
    const unauthenticated = await app.request(`${base}/commerce/google-play/voided/reconcile`, {
      method: "POST",
    });
    expect(unauthenticated.status).toBe(401);
    const token = await signGameToken(tokenConfig, { subject: "player", role: "player" });
    const player = await app.request(`${base}/commerce/google-play/voided/reconcile`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(player.status).toBe(403);
    const service = await signGameToken(tokenConfig, { subject: "svc", role: "service" });
    const ok = await app.request(`${base}/commerce/google-play/voided/reconcile`, {
      method: "POST",
      headers: { Authorization: `Bearer ${service}` },
    });
    expect(ok.status).toBe(200);
  });
});
