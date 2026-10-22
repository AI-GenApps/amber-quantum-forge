import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MERGE_RELAY_THEME_PRODUCT_ID,
  type MergePlayPurchaseAttestation,
} from "./commerce-contracts";
import { parseCommercePurchase } from "./commerce-parsers";
import { GooglePlayPurchaseProvider } from "./commerce-provider";
import { purchaseIdForToken, requeryPurchase } from "./commerce-reconcile";
import { handleRtdn } from "./commerce-rtdn";
import { settleCommercePurchase } from "./commerce-service";
import type { MergeEnvironment, MergeSession } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { createGuest, upgradeGuest } from "./identity-service";
import { InMemoryMergeRelayStore } from "./memory-store";
import { emptyMergeRelayState } from "./store";

const packageName = "app.w3dev.mergerelay";
const buyer: MergeSession = {
  appId: "merge_relay",
  environment: "debug",
  subject: "buyer",
  role: "player",
};

interface Control {
  attestation: MergePlayPurchaseAttestation;
  acknowledges: number;
  voided: Array<{ purchaseToken: string; orderId: string | null; voidedTimeMillis: number }>;
}

function commerce(environment: MergeEnvironment = "debug") {
  const initial = emptyMergeRelayState();
  const config = initial.configs[0];
  if (!config) throw new Error("test config missing");
  config.features.cosmetics = true;
  const control: Control = {
    attestation: {
      state: "purchased",
      productId: MERGE_RELAY_THEME_PRODUCT_ID,
      orderId: "GPA.1",
      acknowledged: false,
      obfuscatedExternalAccountId: null,
    },
    acknowledges: 0,
    voided: [],
  };
  const dependencies: MergeRelayServiceDependencies = {
    store: new InMemoryMergeRelayStore({ [environment]: initial }),
    clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    rewardProvider: null,
    commerceRuntimeForEnvironment: (runtimeEnvironment) => ({
      environment: runtimeEnvironment,
      config: { packageName, productId: MERGE_RELAY_THEME_PRODUCT_ID },
      provider: {
        verifyPurchase: async () => control.attestation,
        acknowledgePurchase: async () => {
          control.acknowledges += 1;
        },
      },
      tokenVault: null,
      voidedProvider: { listVoidedPurchases: async () => control.voided },
      rtdnAuthenticator: { authenticate: async () => true },
    }),
  };
  return { control, dependencies, environment };
}

const buy = (
  context: ReturnType<typeof commerce>,
  token: string,
  session: MergeSession = { ...buyer, environment: context.environment },
) =>
  settleCommercePurchase(
    context.dependencies,
    context.environment,
    session,
    { productId: MERGE_RELAY_THEME_PRODUCT_ID, purchaseToken: token },
    false,
  );

const voidedEnvelope = (purchaseToken: string) => ({
  message: {
    data: Buffer.from(
      JSON.stringify({
        packageName,
        voidedPurchaseNotification: { purchaseToken, orderId: "GPA.1", productType: 1 },
      }),
    ).toString("base64"),
  },
});

describe("Merge Relay commerce review fixes", () => {
  it("acknowledges and ignores a voided notification for a token that was never stored", async () => {
    const context = commerce();
    expect(
      await handleRtdn(context.dependencies, "debug", "Bearer x", voidedEnvelope("never")),
    ).toBe("ignored");
    await buy(context, "known");
    expect(
      await handleRtdn(context.dependencies, "debug", "Bearer x", voidedEnvelope("known")),
    ).toBe("unconfirmed");
    context.control.voided = [{ purchaseToken: "known", orderId: null, voidedTimeMillis: 1 }];
    expect(
      await handleRtdn(context.dependencies, "debug", "Bearer x", voidedEnvelope("known")),
    ).toBe("applied");
  });

  it("rejects a purchase bound to a different account and accepts matching ones", async () => {
    const context = commerce();
    context.control.attestation = {
      ...context.control.attestation,
      obfuscatedExternalAccountId: "someone_else",
    };
    await expect(buy(context, "tok-a")).rejects.toMatchObject({
      status: 403,
      code: "purchase_account_mismatch",
    });
    expect(context.control.acknowledges).toBe(0);
    context.control.attestation = {
      ...context.control.attestation,
      obfuscatedExternalAccountId: "buyer",
    };
    expect((await buy(context, "tok-a")).entitlement?.status).toBe("active");
    context.control.attestation = {
      ...context.control.attestation,
      obfuscatedExternalAccountId: null,
    };
    expect((await buy(context, "tok-b")).purchase.state).toBe("purchased");
  });

  it("accepts a purchase bound to the guest that was upgraded into the buyer", async () => {
    const context = commerce();
    const guest = await createGuest(context.dependencies, "debug");
    await upgradeGuest(context.dependencies, "debug", buyer, {
      recoveryToken: guest.recoveryToken,
    });
    context.control.attestation = {
      ...context.control.attestation,
      obfuscatedExternalAccountId: guest.subject,
    };
    expect((await buy(context, "tok-guest")).entitlement?.status).toBe("active");
    const other: MergeSession = { ...buyer, subject: "other_buyer" };
    await expect(buy(context, "tok-guest-2", other)).rejects.toMatchObject({
      code: "purchase_account_mismatch",
    });
  });

  it("rejects test purchases in production only", async () => {
    const production = commerce("production");
    production.control.attestation = { ...production.control.attestation, testPurchase: true };
    await expect(buy(production, "tok-test")).rejects.toMatchObject({
      status: 422,
      code: "purchase_test_rejected",
    });
    expect(production.control.acknowledges).toBe(0);
    const staging = commerce("staging");
    staging.control.attestation = { ...staging.control.attestation, testPurchase: true };
    expect((await buy(staging, "tok-test")).entitlement?.status).toBe("active");
  });

  it("detects testPurchaseContext in the provider response", async () => {
    const fixture = readFileSync(
      new URL("./fixtures/google-play-product-purchase-v2.json", import.meta.url),
      "utf8",
    );
    const parse = async (body: string) =>
      new GooglePlayPurchaseProvider(
        packageName,
        { getAccessToken: async () => "token" },
        async () => new Response(body, { status: 200 }),
      ).verifyPurchase({ productId: MERGE_RELAY_THEME_PRODUCT_ID, purchaseToken: "t" });
    expect((await parse(fixture)).testPurchase).toBe(true);
    const real = JSON.parse(fixture) as Record<string, unknown>;
    delete real.testPurchaseContext;
    expect((await parse(JSON.stringify(real))).testPurchase).toBe(false);
  });

  it("persists acknowledged when a requery acknowledges a stored purchase", async () => {
    const context = commerce();
    context.control.attestation = { ...context.control.attestation, acknowledged: true };
    const first = await buy(context, "tok-ack");
    const stored = { ...first.purchase, acknowledged: false };
    await context.dependencies.store.transactArtifacts("debug", (transaction) =>
      transaction.put("commerce_purchase", stored.purchaseId, stored, {
        ownerSubject: stored.subject,
        idempotencyKey: stored.clientRequestId,
        lookupKey: stored.purchaseTokenDigest,
      }),
    );
    context.control.attestation = { ...context.control.attestation, acknowledged: false };
    const requeried = await requeryPurchase(context.dependencies, "debug", "tok-ack");
    expect(context.control.acknowledges).toBe(1);
    expect(requeried?.purchase.acknowledged).toBe(true);
    const reread = await context.dependencies.store.readArtifacts(
      "debug",
      { recordType: "commerce_purchase", recordId: purchaseIdForToken("tok-ack"), limit: 1 },
      parseCommercePurchase,
    );
    expect(reread.items[0]?.acknowledged).toBe(true);
  });
});

describe("Google Play voided purchase paging", () => {
  function pagedProvider(pages: number | "endless") {
    let calls = 0;
    const provider = new GooglePlayPurchaseProvider(
      packageName,
      { getAccessToken: async () => "token" },
      async (input) => {
        const page = Number(new URL(String(input)).searchParams.get("token") ?? "0");
        calls += 1;
        const more = pages === "endless" || page + 1 < pages;
        return new Response(
          JSON.stringify({
            voidedPurchases: [
              {
                kind: "androidpublisher#voidedPurchase",
                purchaseToken: `token-${page}`,
                voidedTimeMillis: "1",
              },
            ],
            ...(more ? { tokenPagination: { nextPageToken: String(page + 1) } } : {}),
          }),
          { status: 200 },
        );
      },
    );
    return { provider, calls: () => calls };
  }

  it("pages past five pages until exhausted", async () => {
    const { provider, calls } = pagedProvider(8);
    const all = await provider.listVoidedPurchases({ startTimeMillis: 0 });
    expect(all.map((item) => item.purchaseToken)).toEqual(
      Array.from({ length: 8 }, (_, index) => `token-${index}`),
    );
    expect(calls()).toBe(8);
  });

  it("fails explicitly instead of truncating at the safety cap", async () => {
    const { provider } = pagedProvider("endless");
    await expect(provider.listVoidedPurchases({ startTimeMillis: 0 })).rejects.toMatchObject({
      code: "voided_pages_exceeded",
    });
  });
});
