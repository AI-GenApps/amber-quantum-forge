import { describe, expect, it } from "vitest";
import {
  MERGE_RELAY_THEME_PRODUCT_ID,
  type MergeCommercePurchaseState,
  type MergeVoidedPurchase,
} from "./commerce-contracts";
import { purchaseIdForToken } from "./commerce-reconcile";
import { handleRtdn } from "./commerce-rtdn";
import { settleCommercePurchase } from "./commerce-service";
import type { MergeSession } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { MergeRelayError } from "./errors";
import { InMemoryMergeRelayStore } from "./memory-store";
import { emptyMergeRelayState } from "./store";

const packageName = "app.w3dev.mergerelay";
const player: MergeSession = {
  appId: "merge_relay",
  environment: "debug",
  subject: "buyer",
  role: "player",
};

function setup() {
  const initial = emptyMergeRelayState();
  const config = initial.configs[0];
  if (!config) throw new Error("test config missing");
  config.features.cosmetics = true;
  const control = {
    state: "purchased" as MergeCommercePurchaseState,
    acknowledged: false,
    voided: [] as MergeVoidedPurchase[],
    acknowledges: 0,
    authorized: true,
  };
  const dependencies: MergeRelayServiceDependencies = {
    store: new InMemoryMergeRelayStore({ debug: initial }),
    clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    rewardProvider: null,
    commerceRuntimeForEnvironment: (environment) => ({
      environment,
      config: { packageName, productId: MERGE_RELAY_THEME_PRODUCT_ID },
      provider: {
        verifyPurchase: async () => ({
          state: control.state,
          productId: MERGE_RELAY_THEME_PRODUCT_ID,
          orderId: "GPA.1",
          acknowledged: control.acknowledged,
          obfuscatedExternalAccountId: null,
        }),
        acknowledgePurchase: async () => {
          control.acknowledges += 1;
        },
      },
      tokenVault: null,
      voidedProvider: { listVoidedPurchases: async () => control.voided },
      rtdnAuthenticator: { authenticate: async () => control.authorized },
    }),
  };
  return { control, dependencies };
}

function envelope(payload: Record<string, unknown>) {
  const data = Buffer.from(JSON.stringify({ packageName, ...payload })).toString("base64");
  return { message: { data, messageId: "1" }, subscription: "projects/p/subscriptions/s" };
}

const oneTime = (
  purchaseToken: string,
  notificationType = 1,
  sku: string = MERGE_RELAY_THEME_PRODUCT_ID,
) =>
  envelope({
    oneTimeProductNotification: { version: "1.0", notificationType, purchaseToken, sku },
  });

const voided = (purchaseToken: string) =>
  envelope({ voidedPurchaseNotification: { purchaseToken, orderId: "GPA.1", productType: 1 } });

async function buy(
  dependencies: MergeRelayServiceDependencies,
  token: string,
  state: MergeCommercePurchaseState = "purchased",
  control?: { state: MergeCommercePurchaseState },
) {
  if (control) control.state = state;
  return settleCommercePurchase(
    dependencies,
    "debug",
    player,
    { productId: MERGE_RELAY_THEME_PRODUCT_ID, purchaseToken: token },
    false,
  );
}

async function entitlementStatus(dependencies: MergeRelayServiceDependencies, token: string) {
  const settled = await buy(dependencies, token);
  return settled.entitlement?.status ?? null;
}

describe("Merge Relay RTDN and voided purchase requery", () => {
  it("rejects unauthenticated and unconfigured callers", async () => {
    const { control, dependencies } = setup();
    control.authorized = false;
    await expect(handleRtdn(dependencies, "debug", null, oneTime("t"))).rejects.toMatchObject({
      code: "rtdn_unauthorized",
    });
    const bare: MergeRelayServiceDependencies = {
      ...dependencies,
      commerceRuntimeForEnvironment: () => null,
    };
    await expect(handleRtdn(bare, "debug", "Bearer x", oneTime("t"))).rejects.toBeInstanceOf(
      MergeRelayError,
    );
  });

  it("rejects malformed envelopes and ignores foreign packages, SKUs, and unknown tokens", async () => {
    const { dependencies } = setup();
    await expect(
      handleRtdn(dependencies, "debug", "Bearer x", { message: {} }),
    ).rejects.toMatchObject({
      code: "rtdn_invalid",
    });
    expect(
      await handleRtdn(dependencies, "debug", "Bearer x", {
        message: {
          data: Buffer.from(
            JSON.stringify({ packageName: "other.app", testNotification: { version: "1.0" } }),
          ).toString("base64"),
        },
      }),
    ).toBe("ignored");
    expect(await handleRtdn(dependencies, "debug", "Bearer x", oneTime("unknown"))).toBe("ignored");
    await buy(dependencies, "known");
    expect(
      await handleRtdn(dependencies, "debug", "Bearer x", oneTime("known", 1, "other_sku")),
    ).toBe("ignored");
  });

  it("promotes a pending purchase, acknowledges it, and replays idempotently", async () => {
    const { control, dependencies } = setup();
    await buy(dependencies, "pending-token", "pending", control);
    control.state = "purchased";
    expect(await handleRtdn(dependencies, "debug", "Bearer x", oneTime("pending-token"))).toBe(
      "applied",
    );
    expect(control.acknowledges).toBe(1);
    expect(await entitlementStatus(dependencies, "pending-token")).toBe("active");
    expect(await handleRtdn(dependencies, "debug", "Bearer x", oneTime("pending-token"))).toBe(
      "replayed",
    );
  });

  it("revokes the entitlement when a cancellation requery reports cancelled", async () => {
    const { control, dependencies } = setup();
    await buy(dependencies, "cancel-token");
    control.state = "cancelled";
    expect(await handleRtdn(dependencies, "debug", "Bearer x", oneTime("cancel-token", 2))).toBe(
      "applied",
    );
    const settled = await buy(dependencies, "cancel-token", "purchased", control);
    expect(settled.purchase.state).toBe("cancelled");
    expect(settled.entitlement?.status).toBe("revoked");
  });

  it("refunds only when the voided list confirms the token", async () => {
    const { control, dependencies } = setup();
    await buy(dependencies, "void-token");
    expect(await handleRtdn(dependencies, "debug", "Bearer x", voided("void-token"))).toBe(
      "unconfirmed",
    );
    expect(await entitlementStatus(dependencies, "void-token")).toBe("active");
    control.voided = [{ purchaseToken: "void-token", orderId: "GPA.1", voidedTimeMillis: 1 }];
    expect(await handleRtdn(dependencies, "debug", "Bearer x", voided("void-token"))).toBe(
      "applied",
    );
    expect(await handleRtdn(dependencies, "debug", "Bearer x", voided("void-token"))).toBe(
      "replayed",
    );
    const settled = await buy(dependencies, "void-token");
    expect(settled.purchase.state).toBe("refunded");
    expect(settled.entitlement?.status).toBe("revoked");
    expect(purchaseIdForToken("void-token")).toBe(settled.purchase.purchaseId);
  });
});
