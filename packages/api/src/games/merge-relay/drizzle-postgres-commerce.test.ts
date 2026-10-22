import { describe, expect, it } from "vitest";
import {
  MERGE_RELAY_THEME_PRODUCT_ID,
  type MergeCommercePurchaseState,
  type MergePlayPurchaseProvider,
} from "./commerce-contracts";
import { parseCommerceEntitlement, parseCommercePurchase } from "./commerce-parsers";
import { reconcileVoided, requeryPurchase } from "./commerce-reconcile";
import { settleCommercePurchase } from "./commerce-service";
import type { MergeSession } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { DrizzleMergeRelayStore } from "./drizzle-store";
import { MergeRelayError } from "./errors";

const databaseUrl = process.env.MERGE_RELAY_TEST_DATABASE_URL;
const suite = describe.skipIf(!databaseUrl);

function session(subject: string): MergeSession {
  return { appId: "merge_relay", environment: "staging", subject, role: "player" };
}

function setup(state: () => MergeCommercePurchaseState) {
  const calls = { verify: 0, acknowledge: 0 };
  const provider: MergePlayPurchaseProvider = {
    verifyPurchase: async () => {
      calls.verify += 1;
      return {
        state: state(),
        productId: MERGE_RELAY_THEME_PRODUCT_ID,
        orderId: "GPA.1234-5678-9012-34567",
        acknowledged: false,
        obfuscatedExternalAccountId: null,
      };
    },
    acknowledgePurchase: async () => {
      calls.acknowledge += 1;
    },
  };
  const dependencies: MergeRelayServiceDependencies = {
    store: new DrizzleMergeRelayStore(),
    clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    rewardProvider: null,
    commerceRuntimeForEnvironment: (environment) => ({
      environment,
      config: { packageName: "app.w3dev.mergerelay", productId: MERGE_RELAY_THEME_PRODUCT_ID },
      provider,
      tokenVault: null,
    }),
  };
  return { calls, dependencies };
}

const input = (purchaseToken: string, clientRequestId?: string) => ({
  productId: MERGE_RELAY_THEME_PRODUCT_ID,
  purchaseToken,
  ...(clientRequestId === undefined ? {} : { clientRequestId }),
});

suite("Merge Relay PostgreSQL commerce lifecycle", () => {
  it("settles purchased, refunded, and revoked states durably", async () => {
    const suffix = Date.now().toString(36);
    let state: MergeCommercePurchaseState = "purchased";
    const { dependencies } = setup(() => state);
    const player = session(`buyer_${suffix}`);
    const token = `token_${suffix}`;
    const granted = await settleCommercePurchase(
      dependencies,
      "staging",
      player,
      input(token),
      true,
    );
    expect(granted.entitlement?.status).toBe("active");
    state = "refunded";
    const refunded = await settleCommercePurchase(
      dependencies,
      "staging",
      player,
      input(token),
      true,
    );
    expect(refunded.purchase.state).toBe("refunded");
    expect(refunded.entitlement?.status).toBe("revoked");
    const store = new DrizzleMergeRelayStore();
    const entitlements = await store.readArtifacts(
      "staging",
      { recordType: "commerce_entitlement", ownerSubject: player.subject, limit: 10 },
      parseCommerceEntitlement,
    );
    expect(entitlements.items.map((item) => item.status)).toEqual(["revoked"]);
    state = "purchased";
    const regrant = await settleCommercePurchase(
      dependencies,
      "staging",
      player,
      input(token),
      true,
    );
    expect(regrant.purchase.state).toBe("refunded");
    expect(regrant.entitlement?.status).toBe("revoked");
  });

  it("collapses concurrent same-token settlements into one purchase", async () => {
    const suffix = Date.now().toString(36);
    const { calls, dependencies } = setup(() => "purchased");
    const player = session(`racer_${suffix}`);
    const token = `race_${suffix}`;
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        settleCommercePurchase(dependencies, "staging", player, input(token), true),
      ),
    );
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    expect(fulfilled.length).toBeGreaterThan(0);
    for (const result of results)
      if (result.status === "rejected") expect(result.reason).toBeInstanceOf(MergeRelayError);
    expect(calls.verify).toBeGreaterThan(0);
    const store = new DrizzleMergeRelayStore();
    const purchases = await store.readArtifacts(
      "staging",
      { recordType: "commerce_purchase", ownerSubject: player.subject, limit: 10 },
      parseCommercePurchase,
    );
    expect(purchases.items).toHaveLength(1);
    const entitlements = await store.readArtifacts(
      "staging",
      { recordType: "commerce_entitlement", ownerSubject: player.subject, limit: 10 },
      parseCommerceEntitlement,
    );
    expect(entitlements.items).toHaveLength(1);
  });

  it("rejects a token already owned by another subject", async () => {
    const suffix = Date.now().toString(36);
    const { dependencies } = setup(() => "purchased");
    const token = `owned_${suffix}`;
    await settleCommercePurchase(
      dependencies,
      "staging",
      session(`first_${suffix}`),
      input(token),
      true,
    );
    const outcomes = await Promise.allSettled([
      settleCommercePurchase(
        dependencies,
        "staging",
        session(`second_${suffix}`),
        input(token),
        true,
      ),
    ]);
    const outcome = outcomes[0];
    expect(outcome?.status).toBe("rejected");
    if (outcome?.status === "rejected")
      expect((outcome.reason as MergeRelayError).code).toBe("purchase_token_owner_conflict");
    const store = new DrizzleMergeRelayStore();
    const other = await store.readArtifacts(
      "staging",
      { recordType: "commerce_entitlement", ownerSubject: `second_${suffix}`, limit: 10 },
      parseCommerceEntitlement,
    );
    expect(other.items).toHaveLength(0);
  });

  it("isolates identical tokens across environments", async () => {
    const suffix = Date.now().toString(36);
    const { dependencies } = setup(() => "purchased");
    const token = `env_${suffix}`;
    const player = session(`env_${suffix}`);
    await settleCommercePurchase(dependencies, "staging", player, input(token), true);
    const production = await settleCommercePurchase(
      dependencies,
      "production",
      { ...player, environment: "production" },
      input(token),
      true,
    );
    expect(production.entitlement?.environment).toBe("production");
  });

  it("requeries and refunds durably through the reconcile path", async () => {
    const suffix = Date.now().toString(36);
    let state: MergeCommercePurchaseState = "purchased";
    const { dependencies } = setup(() => state);
    const player = session(`rtdn_${suffix}`);
    const token = `rtdn_${suffix}`;
    await settleCommercePurchase(dependencies, "staging", player, input(token), true);
    state = "cancelled";
    const requeried = await requeryPurchase(dependencies, "staging", token);
    expect(requeried?.purchase.state).toBe("cancelled");
    expect(requeried?.entitlement?.status).toBe("revoked");
    expect(await requeryPurchase(dependencies, "staging", `missing_${suffix}`)).toBeNull();
    const voided = await reconcileVoided(
      {
        ...dependencies,
        commerceRuntimeForEnvironment: (environment) => {
          const runtime = dependencies.commerceRuntimeForEnvironment?.(environment);
          if (!runtime) return null;
          return {
            ...runtime,
            voidedProvider: {
              listVoidedPurchases: async () => [
                { purchaseToken: token, orderId: null, voidedTimeMillis: 1 },
              ],
            },
          };
        },
      },
      "staging",
    );
    expect(voided.voided).toBe(1);
  });
});
