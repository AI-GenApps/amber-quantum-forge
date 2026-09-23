import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MERGE_RELAY_THEME_PRODUCT_ID } from "./commerce-contracts";
import { GooglePlayPurchaseProvider } from "./commerce-provider";

const productId = MERGE_RELAY_THEME_PRODUCT_ID;

function provider(
  body: unknown,
  status = 200,
  requests: string[] = [],
): GooglePlayPurchaseProvider {
  return new GooglePlayPurchaseProvider(
    "app.w3dev.mergerelay",
    { getAccessToken: async () => "publisher-token" },
    async (input, init) => {
      requests.push(`${init?.method ?? "GET"} ${String(input)}`);
      return new Response(init?.method === "POST" || body === null ? null : JSON.stringify(body), {
        status,
      });
    },
  );
}

function purchase(state: "PURCHASED" | "PENDING" | "CANCELLED", acknowledged = false) {
  const fixture = JSON.parse(
    readFileSync(
      new URL("./fixtures/google-play-product-purchase-v2.json", import.meta.url),
      "utf8",
    ),
  ) as Record<string, unknown>;
  fixture.purchaseStateContext = { purchaseState: state };
  fixture.acknowledgementState = acknowledged
    ? "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED"
    : "ACKNOWLEDGEMENT_STATE_PENDING";
  return fixture;
}

describe("Google Play one-time purchase verifier", () => {
  it.each([
    ["PURCHASED", "purchased"],
    ["PENDING", "pending"],
    ["CANCELLED", "cancelled"],
  ] as const)("maps the official ProductPurchaseV2 %s state", async (state, expected) => {
    const result = await provider(purchase(state)).verifyPurchase({
      productId,
      purchaseToken: "token-1",
    });
    expect(result).toMatchObject({
      state: expected,
      productId,
      orderId: "GPA.1234-5678-9012-34567",
      acknowledged: false,
      obfuscatedExternalAccountId: "opaque-account",
    });
  });

  it("uses the documented productsV2 and acknowledge paths", async () => {
    const requests: string[] = [];
    const instance = provider(purchase("PURCHASED"), 200, requests);
    await instance.verifyPurchase({ productId, purchaseToken: "token/one" });
    await instance.acknowledgePurchase({ productId, purchaseToken: "token/one" });
    expect(requests).toEqual([
      "GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/app.w3dev.mergerelay/purchases/productsv2/tokens/token%2Fone",
      "POST https://androidpublisher.googleapis.com/androidpublisher/v3/applications/app.w3dev.mergerelay/purchases/products/merge_relay_theme_pack_v1/tokens/token%2Fone:acknowledge",
    ]);
  });

  it("rejects a provider response for another product", async () => {
    await expect(
      provider({
        ...purchase("PURCHASED"),
        productLineItem: [{ productId: "another_product" }],
      }).verifyPurchase({ productId, purchaseToken: "token-1" }),
    ).rejects.toMatchObject({ code: "provider_product_mismatch" });
  });

  it("rejects fabricated or incomplete response shapes", async () => {
    await expect(
      provider({
        ...purchase("PURCHASED"),
        kind: "androidpublisher#productPurchase",
      }).verifyPurchase({ productId, purchaseToken: "token-1" }),
    ).rejects.toMatchObject({ code: "provider_response_invalid" });
    await expect(
      provider({ ...purchase("PURCHASED"), acknowledgementState: "ACKNOWLEDGED" }).verifyPurchase({
        productId,
        purchaseToken: "token-1",
      }),
    ).rejects.toMatchObject({ code: "provider_response_invalid" });
  });

  it("does not expose the purchase token in provider errors", async () => {
    const token = "private-token-value";
    await expect(
      provider(null, 404).verifyPurchase({ productId, purchaseToken: token }),
    ).rejects.toMatchObject({ code: "purchase_not_found" });
    try {
      await provider(null, 404).verifyPurchase({ productId, purchaseToken: token });
    } catch (error) {
      expect(String(error)).not.toContain(token);
    }
  });
});
