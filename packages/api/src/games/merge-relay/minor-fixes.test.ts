import { describe, expect, it } from "vitest";
import { MERGE_RELAY_THEME_PRODUCT_ID, type MergePlayPurchaseProvider } from "./commerce-contracts";
import { applyKnownPurchaseState, purchaseIdForToken } from "./commerce-reconcile";
import { listCommerceEntitlements, settleCommercePurchase } from "./commerce-service";
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

for (const [name, factory] of testStores) {
  describe.skipIf(!factory)(`Merge Relay minor hardening on ${name}`, () => {
    it("rejects a guest as the upgrade target", async () => {
      if (!factory) return;
      const deps = await rankedDependencies(factory());
      const source = await createGuest(deps, "staging");
      const target = await createGuest(deps, "staging");
      await expect(
        upgradeGuest(deps, "staging", testSession(target.subject), {
          recoveryToken: source.recoveryToken,
        }),
      ).rejects.toMatchObject({ code: "guest_upgrade_target_invalid" });
    });

    it("keeps the entitlement when an older purchase is refunded", async () => {
      if (!factory) return;
      const base = await rankedDependencies(factory());
      const deps = {
        ...base,
        commerceRuntimeForEnvironment: (environment: "staging" | "debug" | "production") => ({
          environment,
          config: { packageName: "app.w3dev.mergerelay", productId: MERGE_RELAY_THEME_PRODUCT_ID },
          provider,
          tokenVault: null,
        }),
      };
      const suffix = Date.now().toString(36);
      const player = testSession(`buyer_${suffix}`);
      const first = `token-a-${suffix}`;
      const second = `token-b-${suffix}`;
      for (const purchaseToken of [first, second])
        await settleCommercePurchase(
          deps,
          "staging",
          player,
          { productId: MERGE_RELAY_THEME_PRODUCT_ID, purchaseToken },
          false,
        );
      await applyKnownPurchaseState(deps, "staging", purchaseIdForToken(first), "refunded");
      const entitlements = await listCommerceEntitlements(deps, "staging", player);
      expect(entitlements.map((item) => item.status)).toEqual(["active"]);
    });
  });
}
