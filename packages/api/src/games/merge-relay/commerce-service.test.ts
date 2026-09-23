import { describe, expect, it } from "vitest";
import {
  MERGE_RELAY_THEME_PRODUCT_ID,
  type MergeCommercePurchaseState,
  type MergePlayPurchaseProvider,
} from "./commerce-contracts";
import { parseCommerceEntitlement, parseCommercePurchase } from "./commerce-parsers";
import { settleCommercePurchase } from "./commerce-service";
import type { MergeEnvironment, MergeSession } from "./contracts";
import type { MergeRelayClock, MergeRelayServiceDependencies } from "./dependencies";
import { InMemoryMergeRelayStore } from "./memory-store";
import { emptyMergeRelayState } from "./store";

class FixedClock implements MergeRelayClock {
  now(): Date {
    return new Date("2026-01-01T00:00:00.000Z");
  }
}

function session(subject: string, environment: MergeEnvironment = "debug"): MergeSession {
  return { appId: "merge_relay", environment, subject, role: "player" };
}

function setup(states: MergeCommercePurchaseState[] = []) {
  const initial = emptyMergeRelayState();
  const config = initial.configs[0];
  if (!config) throw new Error("test config missing");
  config.features.cosmetics = true;
  const store = new InMemoryMergeRelayStore({ debug: initial });
  const calls = { verify: 0, acknowledge: 0 };
  const provider: MergePlayPurchaseProvider = {
    verifyPurchase: async () => {
      calls.verify += 1;
      return {
        state: states[calls.verify - 1] ?? states.at(-1) ?? "purchased",
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
    store,
    clock: new FixedClock(),
    rewardProvider: null,
    commerceRuntimeForEnvironment: (environment) => ({
      environment,
      config: { packageName: "app.w3dev.mergerelay", productId: MERGE_RELAY_THEME_PRODUCT_ID },
      provider,
      tokenVault: null,
    }),
  };
  return { calls, dependencies, store };
}

const input = (purchaseToken: string, clientRequestId?: string) => ({
  productId: MERGE_RELAY_THEME_PRODUCT_ID,
  purchaseToken,
  ...(clientRequestId === undefined ? {} : { clientRequestId }),
});

describe("Merge Relay Google Play purchase settlement", () => {
  it("verifies and grants a non-consumable once without storing the raw token", async () => {
    const { calls, dependencies, store } = setup(["purchased"]);
    const result = await settleCommercePurchase(
      dependencies,
      "debug",
      session("player"),
      input("private-token", "request-1"),
      false,
    );
    expect(result.purchase.state).toBe("purchased");
    expect(result.entitlement?.status).toBe("active");
    expect(calls).toEqual({ verify: 1, acknowledge: 1 });
    const purchase = (
      await store.readArtifacts(
        "debug",
        { recordType: "commerce_purchase", limit: 1 },
        parseCommercePurchase,
      )
    ).items[0];
    expect(JSON.stringify(purchase)).not.toContain("private-token");
    const replay = await settleCommercePurchase(
      dependencies,
      "debug",
      session("player"),
      input("private-token", "request-1"),
      false,
    );
    expect(replay.replayed).toBe(true);
    expect(calls.verify).toBe(1);
  });

  it("moves pending to purchased and acknowledges only after purchase", async () => {
    const { calls, dependencies } = setup(["pending", "purchased"]);
    const pending = await settleCommercePurchase(
      dependencies,
      "debug",
      session("player"),
      input("pending-token"),
      false,
    );
    expect(pending.purchase.state).toBe("pending");
    expect(pending.entitlement).toBeNull();
    expect(calls.acknowledge).toBe(0);
    const purchased = await settleCommercePurchase(
      dependencies,
      "debug",
      session("player"),
      input("pending-token"),
      true,
    );
    expect(purchased.purchase.state).toBe("purchased");
    expect(purchased.entitlement?.status).toBe("active");
    expect(calls.acknowledge).toBe(1);
  });

  it("rejects token reuse by another subject and request ID reuse by another token", async () => {
    const { dependencies } = setup(["purchased"]);
    await settleCommercePurchase(
      dependencies,
      "debug",
      session("one"),
      input("token-one", "same"),
      false,
    );
    await expect(
      settleCommercePurchase(dependencies, "debug", session("two"), input("token-one"), true),
    ).rejects.toMatchObject({ code: "purchase_token_owner_conflict" });
    await expect(
      settleCommercePurchase(
        dependencies,
        "debug",
        session("one"),
        input("token-two", "same"),
        false,
      ),
    ).rejects.toMatchObject({ code: "purchase_request_conflict" });
  });

  it.each([
    "refunded",
    "revoked",
  ] as const)("revokes an entitlement when a later authorized restore is %s", async (state) => {
    const { dependencies, store } = setup(["purchased", state]);
    await settleCommercePurchase(dependencies, "debug", session("player"), input("token"), false);
    const result = await settleCommercePurchase(
      dependencies,
      "debug",
      session("player"),
      input("token"),
      true,
    );
    expect(result.purchase.state).toBe(state);
    expect(result.entitlement?.status).toBe("revoked");
    const entitlements = (
      await store.readArtifacts(
        "debug",
        { recordType: "commerce_entitlement", limit: 10 },
        parseCommerceEntitlement,
      )
    ).items;
    expect(entitlements[0]?.status).toBe("revoked");
  });

  it("allows restore after the shop kill switch hides new offers", async () => {
    const { dependencies, store } = setup(["purchased"]);
    await settleCommercePurchase(
      dependencies,
      "debug",
      session("player"),
      input("old-token"),
      false,
    );
    await store.transact("debug", async (state) => {
      const config = state.configs[0];
      if (!config) throw new Error("test config missing");
      config.features.cosmetics = false;
    });
    const restored = await settleCommercePurchase(
      dependencies,
      "debug",
      session("player"),
      input("old-token"),
      true,
    );
    expect(restored.entitlement?.status).toBe("active");
  });
});
