/// Rewarded-ad SSV callback (task 26h): a valid signed callback credits once,
/// a replayed `transaction_id` is a no-op, an unsigned/invalid-signature
/// callback credits nothing, and the per-type daily cap is rejected, including
/// under simultaneous callbacks. No network: the verifier keys are generated
/// in-process and injected through `admobKeyProvider`.
import { generateKeyPairSync, sign } from "node:crypto";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { EnvironmentGameTokenVerifier, signGameToken } from "../tokens";
import type { AdMobVerifierKeyProvider } from "./admob-ssv";
import { HttpAdMobVerifierKeyProvider } from "./admob-ssv";
import { getEconomyConfig } from "./economy-config";
import { InMemoryLudoEconomyStore } from "./economy-store";
import { InMemoryLudoStore } from "./memory-store";
import { createLudoRoutes, type LudoRouteDependencies } from "./routes";

const KEY_ID = "3335741209";
const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const otherKey = generateKeyPairSync("ec", { namedCurve: "P-256" });
const PUBLIC_PEM = publicKey.export({ type: "spki", format: "pem" }).toString();

const keyProvider: AdMobVerifierKeyProvider = {
  getPublicKeyPem: async (keyId) => (keyId === KEY_ID ? PUBLIC_PEM : null),
};

const CONFIG = getEconomyConfig().rewardedAds;
const GAME_TOKEN_SECRET = "ludo-ads-callback-test-secret-with-32plus-characters";

function signedQuery(
  fields: Record<string, string>,
  options: { key?: typeof privateKey; keyId?: string } = {},
): string {
  const content = new URLSearchParams(fields).toString();
  const signature = sign("sha256", Buffer.from(content), options.key ?? privateKey)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${content}&signature=${signature}&key_id=${options.keyId ?? KEY_ID}`;
}

function callbackFields(transactionId: string, overrides: Record<string, string> = {}) {
  return {
    ad_network: "5450213213286189855",
    ad_unit: "1234567890",
    custom_data: "coins",
    reward_amount: "1",
    reward_item: "reward",
    timestamp: "1760000000000",
    transaction_id: transactionId,
    user_id: "ad-subject",
    ...overrides,
  };
}

function harness(overrides: Partial<LudoRouteDependencies> = {}) {
  const economyStore = new InMemoryLudoEconomyStore();
  const app = new Hono();
  app.route(
    "/games/ludo",
    createLudoRoutes({
      signSessionToken: async () => "unused",
      verifyGameToken: new EnvironmentGameTokenVerifier(),
      store: new InMemoryLudoStore(),
      economyStore,
      admobKeyProvider: keyProvider,
      ...overrides,
    }),
  );
  return { app, economyStore };
}

const callback = (app: Hono, query: string, method: "GET" | "POST" = "GET", env = "debug") =>
  app.request(`/games/ludo/${env}/ads/rewarded/callback?${query}`, { method });

const coins = (store: InMemoryLudoEconomyStore, subject = "ad-subject") =>
  store.getBalance("debug", subject, "coins");

describe("Ludo rewarded-ad SSV callback", () => {
  it("credits a valid signed callback exactly once", async () => {
    const { app, economyStore } = harness();
    const response = await callback(app, signedQuery(callbackFields("tx-1")));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      credited: true,
      rewardType: "coins",
      amount: CONFIG.coinsPerAd,
    });
    expect(await coins(economyStore)).toBe(CONFIG.coinsPerAd);
    const [row] = await economyStore.listWalletTransactions("debug", "ad-subject", "coins");
    expect(row).toMatchObject({ reason: "rewarded_ad", sourceRef: "tx-1" });
  });

  it("accepts the same signed callback over POST", async () => {
    const { app, economyStore } = harness();
    const response = await callback(app, signedQuery(callbackFields("tx-post")), "POST");
    expect(response.status).toBe(200);
    expect(await coins(economyStore)).toBe(CONFIG.coinsPerAd);
  });

  it("credits diamonds for a diamond callback", async () => {
    const { app, economyStore } = harness();
    const query = signedQuery(callbackFields("tx-d", { custom_data: "diamonds" }));
    expect((await callback(app, query)).status).toBe(200);
    expect(await economyStore.getBalance("debug", "ad-subject", "diamonds")).toBe(
      CONFIG.diamondsPerAd,
    );
    expect(await coins(economyStore)).toBe(0);
  });

  it("treats a replayed transaction_id as a no-op", async () => {
    const { app, economyStore } = harness();
    const query = signedQuery(callbackFields("tx-replay"));
    expect((await callback(app, query)).status).toBe(200);
    const replay = await callback(app, query);
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({ credited: false, duplicate: true });
    expect(await coins(economyStore)).toBe(CONFIG.coinsPerAd);
    expect(await economyStore.countAdClaims("debug", "ad-subject", "coins", today())).toBe(1);
  });

  describe("credits nothing without a valid signature", () => {
    const cases: [string, (query: string) => string][] = [
      ["no signature at all", (q) => q.slice(0, q.indexOf("&signature="))],
      ["a tampered user_id", (q) => q.replace("user_id=ad-subject", "user_id=attacker")],
      ["a tampered transaction_id", (q) => q.replace("transaction_id=tx-x", "transaction_id=tx-y")],
      ["garbage signature", (q) => q.replace(/signature=[^&]+/, "signature=AAAA")],
      ["an unknown key id", (q) => q.replace(`key_id=${KEY_ID}`, "key_id=42")],
      ["a non-numeric key id", (q) => q.replace(`key_id=${KEY_ID}`, "key_id=abc")],
    ];
    for (const [name, mutate] of cases) {
      it(name, async () => {
        const { app, economyStore } = harness();
        const query = mutate(signedQuery(callbackFields("tx-x")));
        const response = await callback(app, query);
        expect(response.status).toBe(403);
        expect((await response.json()).error.code).toBe("ludo_ad_signature_invalid");
        expect(await coins(economyStore)).toBe(0);
        expect(await coins(economyStore, "attacker")).toBe(0);
      });
    }

    it("a signature made by a different key", async () => {
      const { app, economyStore } = harness();
      const query = signedQuery(callbackFields("tx-forged"), { key: otherKey.privateKey });
      const response = await callback(app, query);
      expect(response.status).toBe(403);
      expect(await coins(economyStore)).toBe(0);
    });

    it("a signature that is not the last-but-one parameter", async () => {
      const { app, economyStore } = harness();
      const query = `${signedQuery(callbackFields("tx-order"))}&extra=1`;
      expect((await callback(app, query)).status).toBe(403);
      expect(await coins(economyStore)).toBe(0);
    });
  });

  it("rejects a signed callback with no transaction_id or user_id", async () => {
    const { app, economyStore } = harness();
    const noTx = signedQuery({ ...callbackFields("x"), transaction_id: "" });
    const noUser = signedQuery({ ...callbackFields("tx-u"), user_id: "" });
    for (const query of [noTx, noUser]) {
      const response = await callback(app, query);
      expect(response.status).toBe(422);
      expect((await response.json()).error.code).toBe("ludo_ad_callback_invalid");
    }
    expect(await coins(economyStore)).toBe(0);
  });

  it("rejects an unknown reward type in custom_data", async () => {
    const { app, economyStore } = harness();
    const query = signedQuery(callbackFields("tx-bad", { custom_data: "gems" }));
    expect((await callback(app, query)).status).toBe(422);
    expect(await coins(economyStore)).toBe(0);
  });

  it("rejects the callback past the daily cap and credits nothing more", async () => {
    const { app, economyStore } = harness();
    for (let i = 0; i < CONFIG.coinAdDailyCap; i++) {
      expect((await callback(app, signedQuery(callbackFields(`tx-cap-${i}`)))).status).toBe(200);
    }
    const over = await callback(app, signedQuery(callbackFields("tx-cap-over")));
    expect(over.status).toBe(429);
    expect((await over.json()).error.code).toBe("ludo_ad_daily_cap_reached");
    expect(await coins(economyStore)).toBe(CONFIG.coinAdDailyCap * CONFIG.coinsPerAd);
    // A replay of an already-credited callback stays a harmless no-op at the cap.
    const replay = await callback(app, signedQuery(callbackFields("tx-cap-0")));
    expect(replay.status).toBe(200);
    expect(await coins(economyStore)).toBe(CONFIG.coinAdDailyCap * CONFIG.coinsPerAd);
  });

  it("caps diamond ads separately from coin ads", async () => {
    const { app, economyStore } = harness();
    const fields = (id: string) => callbackFields(id, { custom_data: "diamonds" });
    for (let i = 0; i < CONFIG.diamondAdDailyCap; i++) {
      expect((await callback(app, signedQuery(fields(`d-${i}`)))).status).toBe(200);
    }
    expect((await callback(app, signedQuery(fields("d-over")))).status).toBe(429);
    expect((await callback(app, signedQuery(callbackFields("c-0")))).status).toBe(200);
    expect(await economyStore.getBalance("debug", "ad-subject", "diamonds")).toBe(
      CONFIG.diamondAdDailyCap * CONFIG.diamondsPerAd,
    );
  });

  it("never credits more than the daily cap under simultaneous callbacks", async () => {
    const { app, economyStore } = harness();
    const responses = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        callback(app, signedQuery(callbackFields(`tx-race-${i}`))),
      ),
    );
    const statuses = responses.map((response) => response.status);
    expect(statuses.filter((status) => status === 200)).toHaveLength(CONFIG.coinAdDailyCap);
    expect(statuses.filter((status) => status === 429)).toHaveLength(20 - CONFIG.coinAdDailyCap);
    expect(await coins(economyStore)).toBe(CONFIG.coinAdDailyCap * CONFIG.coinsPerAd);
  });

  it("credits a simultaneously replayed transaction_id once", async () => {
    const { app, economyStore } = harness();
    const query = signedQuery(callbackFields("tx-same"));
    await Promise.all(Array.from({ length: 10 }, () => callback(app, query)));
    expect(await coins(economyStore)).toBe(CONFIG.coinsPerAd);
  });

  describe("ad unit configuration", () => {
    it("takes the reward type from the signed ad_unit when configured", async () => {
      const { app, economyStore } = harness({
        admobAdUnitIds: { coins: "ca-app-pub-1/1111", diamonds: "2222" },
      });
      const diamondUnit = signedQuery(
        callbackFields("tx-u1", { ad_unit: "2222", custom_data: "diamonds" }),
      );
      expect((await callback(app, diamondUnit)).status).toBe(200);
      expect(await economyStore.getBalance("debug", "ad-subject", "diamonds")).toBe(
        CONFIG.diamondsPerAd,
      );
    });

    it("rejects an unknown ad unit and a custom_data that contradicts the unit", async () => {
      const { app, economyStore } = harness({
        admobAdUnitIds: { coins: "1111", diamonds: "2222" },
      });
      const unknown = signedQuery(callbackFields("tx-u2", { ad_unit: "9999" }));
      const spoofed = signedQuery(
        callbackFields("tx-u3", { ad_unit: "1111", custom_data: "diamonds" }),
      );
      expect((await callback(app, unknown)).status).toBe(422);
      expect((await callback(app, spoofed)).status).toBe(422);
      expect(await economyStore.getBalance("debug", "ad-subject", "diamonds")).toBe(0);
      expect(await coins(economyStore)).toBe(0);
    });

    it("refuses to grant in production when no ad units are configured", async () => {
      const { app, economyStore } = harness({ admobAdUnitIds: {} });
      const response = await callback(
        app,
        signedQuery(callbackFields("tx-prod")),
        "GET",
        "production",
      );
      expect(response.status).toBe(503);
      expect((await response.json()).error.code).toBe("ludo_ad_not_configured");
      expect(await economyStore.getBalance("production", "ad-subject", "coins")).toBe(0);
    });
  });

  it("rejects an unknown environment", async () => {
    const { app } = harness();
    expect((await callback(app, signedQuery(callbackFields("tx-e")), "GET", "bogus")).status).toBe(
      400,
    );
  });
});

describe("Ludo rewarded-ad status route", () => {
  async function authed(subject: string) {
    process.env.GAME_TOKEN_SECRET_LUDO_DEBUG = GAME_TOKEN_SECRET;
    process.env.GAME_TOKEN_ISSUER = "https://issuer.test/games";
    process.env.GAME_TOKEN_AUDIENCE = "ludo-api-test";
    const token = await signGameToken(
      {
        appId: "ludo",
        environment: "debug",
        secret: GAME_TOKEN_SECRET,
        issuer: "https://issuer.test/games",
        audience: "ludo-api-test",
      },
      { subject, role: "player" },
      300,
    );
    return { Authorization: `Bearer ${token}` };
  }

  it("requires a game token", async () => {
    const { app } = harness();
    expect((await app.request("/games/ludo/debug/ads/rewarded/status")).status).toBe(401);
  });

  it("reports the SSV user id and remaining ads today", async () => {
    const { app } = harness();
    await callback(app, signedQuery(callbackFields("tx-s1", { user_id: "status-subject" })));
    const response = await app.request("/games/ludo/debug/ads/rewarded/status", {
      headers: await authed("status-subject"),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ssvUserId: "status-subject",
      coins: {
        rewardAmount: CONFIG.coinsPerAd,
        dailyCap: CONFIG.coinAdDailyCap,
        claimedToday: 1,
        remaining: CONFIG.coinAdDailyCap - 1,
      },
      diamonds: {
        rewardAmount: CONFIG.diamondsPerAd,
        dailyCap: CONFIG.diamondAdDailyCap,
        claimedToday: 0,
        remaining: CONFIG.diamondAdDailyCap,
      },
    });
  });
});

describe("HttpAdMobVerifierKeyProvider", () => {
  const keysResponse = () =>
    new Response(JSON.stringify({ keys: [{ keyId: 3335741209, pem: PUBLIC_PEM }] }), {
      status: 200,
    });

  it("fetches Google's keys once and serves them from cache", async () => {
    let fetches = 0;
    const provider = new HttpAdMobVerifierKeyProvider(async () => {
      fetches += 1;
      return keysResponse();
    });
    expect(await provider.getPublicKeyPem(KEY_ID)).toBe(PUBLIC_PEM);
    expect(await provider.getPublicKeyPem(KEY_ID)).toBe(PUBLIC_PEM);
    expect(fetches).toBe(1);
  });

  it("rate-limits refetches for unknown key ids and never throws on failure", async () => {
    let fetches = 0;
    let clock = 1_000_000;
    const provider = new HttpAdMobVerifierKeyProvider(
      async () => {
        fetches += 1;
        throw new Error("offline");
      },
      () => clock,
    );
    expect(await provider.getPublicKeyPem("1")).toBeNull();
    expect(await provider.getPublicKeyPem("2")).toBeNull();
    expect(fetches).toBe(1);
    clock += 61_000;
    expect(await provider.getPublicKeyPem("3")).toBeNull();
    expect(fetches).toBeGreaterThan(1);
  });
});

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
