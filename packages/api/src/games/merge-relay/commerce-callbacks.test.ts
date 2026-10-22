import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { GooglePlayPurchaseProvider } from "./commerce-provider";
import { createRtdnAuthenticator } from "./commerce-rtdn-auth";
import { parseVoidedPage } from "./commerce-voided";

const audience = "https://api.example.test/rtdn";
const email = "pubsub@project.iam.gserviceaccount.com";

async function authenticatorWithToken(claims: Record<string, unknown>, aud = audience) {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), alg: "RS256", kid: "k1" };
  const token = await new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer("https://accounts.google.com")
    .setAudience(aud)
    .setExpirationTime("5m")
    .sign(privateKey);
  const keys = createLocalJWKSet({ keys: [jwk] });
  return { authenticate: createRtdnAuthenticator(audience, email, keys).authenticate, token };
}

describe("RTDN Pub/Sub OIDC authentication", () => {
  it("accepts the configured service account and audience", async () => {
    const { authenticate, token } = await authenticatorWithToken({ email, email_verified: true });
    expect(await authenticate(`Bearer ${token}`)).toBe(true);
  });

  it("rejects wrong account, audience, unverified email, and missing header", async () => {
    const wrong = await authenticatorWithToken({ email: "x@y.z", email_verified: true });
    expect(await wrong.authenticate(`Bearer ${wrong.token}`)).toBe(false);
    const aud = await authenticatorWithToken({ email, email_verified: true }, "other");
    expect(await aud.authenticate(`Bearer ${aud.token}`)).toBe(false);
    const unverified = await authenticatorWithToken({ email, email_verified: false });
    expect(await unverified.authenticate(`Bearer ${unverified.token}`)).toBe(false);
    expect(await unverified.authenticate(null)).toBe(false);
  });
});

describe("Google Play voided purchases", () => {
  const entry = {
    kind: "androidpublisher#voidedPurchase",
    purchaseToken: "token-1",
    orderId: "GPA.1",
    voidedTimeMillis: "1767225600000",
  };

  it("parses official-shape pages and pagination tokens", () => {
    expect(
      parseVoidedPage(
        JSON.stringify({ voidedPurchases: [entry], tokenPagination: { nextPageToken: "n" } }),
      ),
    ).toEqual({
      items: [{ purchaseToken: "token-1", orderId: "GPA.1", voidedTimeMillis: 1767225600000 }],
      nextPageToken: "n",
    });
    expect(parseVoidedPage("{}")).toEqual({ items: [], nextPageToken: null });
    expect(
      parseVoidedPage(JSON.stringify({ voidedPurchases: [{ ...entry, kind: "x" }] })),
    ).toBeNull();
    expect(parseVoidedPage("nope")).toBeNull();
  });

  it("pages through the provider with bearer auth", async () => {
    const urls: string[] = [];
    const pages = [
      { voidedPurchases: [entry], tokenPagination: { nextPageToken: "p2" } },
      { voidedPurchases: [{ ...entry, purchaseToken: "token-2" }] },
    ];
    const provider = new GooglePlayPurchaseProvider(
      "app.w3dev.mergerelay",
      { getAccessToken: async () => "tok" },
      async (input) => {
        urls.push(String(input));
        return new Response(JSON.stringify(pages[urls.length - 1]), { status: 200 });
      },
    );
    const result = await provider.listVoidedPurchases({ startTimeMillis: 5 });
    expect(result.map((item) => item.purchaseToken)).toEqual(["token-1", "token-2"]);
    expect(urls[0]).toContain("/purchases/voidedpurchases?startTime=5&type=0");
    expect(urls[1]).toContain("token=p2");
  });

  it("fails closed on provider errors", async () => {
    const provider = new GooglePlayPurchaseProvider(
      "app.w3dev.mergerelay",
      { getAccessToken: async () => "tok" },
      async () => new Response("{}", { status: 403 }),
    );
    await expect(provider.listVoidedPurchases({ startTimeMillis: 0 })).rejects.toMatchObject({
      code: "provider_authorization_rejected",
    });
  });
});
