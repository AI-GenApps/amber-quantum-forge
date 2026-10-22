import { describe, expect, it } from "vitest";
import { adSsvRecordId, parseAdSsvRecord } from "./ad-ssv-service";
import {
  MERGE_RELAY_THEME_PRODUCT_ID,
  type MergePlayPurchaseProvider,
  type MergePurchaseTokenVault,
} from "./commerce-contracts";
import { parseCommerceEntitlement, parseCommercePurchase } from "./commerce-parsers";
import { listCommerceEntitlements, settleCommercePurchase } from "./commerce-service";
import { entitlementRecordId } from "./commerce-service-helpers";
import { createGuest, upgradeGuest } from "./identity-service";
import { rankedDependencies, testSession, testStores } from "./relay-test-support";

const provider: MergePlayPurchaseProvider = {
  verifyPurchase: async () => ({
    state: "purchased",
    productId: MERGE_RELAY_THEME_PRODUCT_ID,
    orderId: "GPA.1111-2222-3333-44444",
    acknowledged: true,
    obfuscatedExternalAccountId: null,
  }),
  acknowledgePurchase: async () => undefined,
};

const vault: MergePurchaseTokenVault = {
  seal: ({ subject, purchaseToken }) => ({
    version: 1,
    ciphertext: Buffer.from(`${subject}|${purchaseToken}`).toString("base64url"),
    iv: "iv",
    authTag: "tag",
  }),
  open: ({ subject, envelope }) => {
    const [owner, token] = Buffer.from(envelope.ciphertext, "base64url").toString().split("|");
    if (owner !== subject || token === undefined) throw new Error("bad aad");
    return token;
  },
};

for (const [name, factory] of testStores) {
  describe.skipIf(!factory)(`Merge Relay guest upgrade commerce records on ${name}`, () => {
    it("moves purchases, entitlements and ad records so restore works for the account", async () => {
      if (!factory) return;
      const store = factory();
      const base = await rankedDependencies(store);
      const deps = {
        ...base,
        commerceRuntimeForEnvironment: (environment: "staging" | "debug" | "production") => ({
          environment,
          config: { packageName: "app.w3dev.mergerelay", productId: MERGE_RELAY_THEME_PRODUCT_ID },
          provider,
          tokenVault: vault,
        }),
      };
      const suffix = Date.now().toString(36);
      const token = `purchase-token-${suffix}`;
      const guest = await createGuest(deps, "staging");
      const input = { productId: MERGE_RELAY_THEME_PRODUCT_ID, purchaseToken: token };
      const bought = await settleCommercePurchase(
        deps,
        "staging",
        testSession(guest.subject),
        input,
        false,
      );
      const transactionId = `ad_tx_${suffix}`;
      await store.transactArtifacts("staging", (transaction) =>
        transaction.put(
          "ad_ssv",
          adSsvRecordId(transactionId),
          {
            transactionId,
            subject: guest.subject,
            resultId: "res_x",
            adUnit: "unit",
            rewardAmount: 1,
            rewardItem: "hint",
            timestampMs: 1,
            environment: "staging",
            receivedAt: "2026-01-01T00:00:00.000Z",
          },
          { ownerSubject: guest.subject, resultId: "res_x", idempotencyKey: transactionId },
        ),
      );
      const account = `acct_${suffix}`;
      await upgradeGuest(deps, "staging", testSession(account), {
        recoveryToken: guest.recoveryToken,
      });

      const restored = await settleCommercePurchase(
        deps,
        "staging",
        testSession(account),
        input,
        true,
      );
      expect(restored.purchase.purchaseId).toBe(bought.purchase.purchaseId);
      expect(restored.purchase.subject).toBe(account);
      const entitlements = await listCommerceEntitlements(deps, "staging", testSession(account));
      expect(entitlements.map((item) => item.status)).toEqual(["active"]);
      expect(await listCommerceEntitlements(deps, "staging", testSession(guest.subject))).toEqual(
        [],
      );
      const stored = await store.readArtifacts(
        "staging",
        { recordType: "commerce_purchase", recordId: bought.purchase.purchaseId, limit: 1 },
        parseCommercePurchase,
      );
      expect(stored.items[0]?.subject).toBe(account);
      const oldEntitlement = await store.readArtifacts(
        "staging",
        {
          recordType: "commerce_entitlement",
          recordId: entitlementRecordId(guest.subject),
          limit: 1,
        },
        parseCommerceEntitlement,
      );
      expect(oldEntitlement.items).toHaveLength(0);
      const ad = await store.readArtifacts(
        "staging",
        { recordType: "ad_ssv", recordId: adSsvRecordId(transactionId), limit: 1 },
        parseAdSsvRecord,
      );
      expect(ad.items[0]?.subject).toBe(account);
    });
  });
}
