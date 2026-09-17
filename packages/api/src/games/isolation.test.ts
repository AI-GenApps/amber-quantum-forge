import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { signAccessToken } from "../lib/jwt";
import type { GameAppId, GameEnvironment, GameSession } from "./contracts";
import {
  createGameRoutes,
  type GameTokenConfig,
  type GameTokenVerifier,
  InMemoryGameStore,
  SignedGameTokenVerifier,
  signGameToken,
} from "./index";

const secret = "game-test-secret-with-at-least-32-characters";
const configs: GameTokenConfig[] = [
  config("merge_relay", "debug"),
  config("merge_relay", "staging"),
  config("pocket_biome", "debug"),
];

function config(appId: GameAppId, environment: GameEnvironment): GameTokenConfig {
  return {
    appId,
    environment,
    secret: secret + appId + environment,
    issuer: "https://issuer.test/games",
    audience: "games-api-test",
  };
}

class MultiVerifier implements GameTokenVerifier {
  async verify(
    token: string,
    expected: { appId: GameAppId; environment: GameEnvironment },
  ): Promise<GameSession> {
    const selected = configs.find(
      (item) => item.appId === expected.appId && item.environment === expected.environment,
    );
    if (!selected) throw new Error("scope is not configured");
    return new SignedGameTokenVerifier(selected).verify(token, expected);
  }
}

function makeApp() {
  const app = new Hono();
  app.route(
    "/games",
    createGameRoutes({
      tokenVerifier: new MultiVerifier(),
      store: new InMemoryGameStore(),
    }),
  );
  return app;
}

async function token(
  appId: GameAppId,
  environment: GameEnvironment,
  subject = "user-1",
  role: "player" | "service" = "player",
) {
  const selected = configs.find((item) => item.appId === appId && item.environment === environment);
  if (!selected) throw new Error("test scope is not configured");
  return signGameToken(selected, { subject, role });
}

function headers(value: string): HeadersInit {
  return { Authorization: `Bearer ${value}`, "Content-Type": "application/json" };
}

describe("game API token and storage isolation", () => {
  it("writes and reads an optimistic-versioned save", async () => {
    const app = makeApp();
    const bearer = await token("merge_relay", "debug");
    const path = "/games/merge_relay/debug/saves/main";
    const first = await app.request(path, {
      method: "PUT",
      headers: headers(bearer),
      body: JSON.stringify({ schema_version: 1, expected_version: 0, payload: { score: 2 } }),
    });
    expect(first.status).toBe(200);
    const second = await app.request(path, {
      method: "PUT",
      headers: headers(bearer),
      body: JSON.stringify({ schema_version: 1, expected_version: 0, payload: { score: 3 } }),
    });
    expect(second.status).toBe(409);
    const read = await app.request(path, { headers: headers(bearer) });
    expect(read.status).toBe(200);
    const body = (await read.json()) as { save: { version: number; payload: { score: number } } };
    expect(body.save.version).toBe(1);
    expect(body.save.payload.score).toBe(2);
  });

  it("rejects a token from another app or environment", async () => {
    const app = makeApp();
    const pocket = await token("pocket_biome", "debug");
    const staging = await token("merge_relay", "staging");
    const otherApp = await app.request("/games/merge_relay/debug/session", {
      headers: headers(pocket),
    });
    const otherEnvironment = await app.request("/games/merge_relay/debug/session", {
      headers: headers(staging),
    });
    expect(otherApp.status).toBe(401);
    expect(otherEnvironment.status).toBe(401);
  });

  it("rejects forged tokens and client app scope spoofing", async () => {
    const app = makeApp();
    const bearer = await token("merge_relay", "debug");
    const forged = `${bearer.slice(0, -2)}xx`;
    const forgedResponse = await app.request("/games/merge_relay/debug/session", {
      headers: headers(forged),
    });
    const headerSpoof = await app.request("/games/merge_relay/debug/session", {
      headers: { ...headers(bearer), "X-App-Id": "pocket_biome" },
    });
    const bodySpoof = await app.request("/games/merge_relay/debug/saves/main", {
      method: "PUT",
      headers: headers(bearer),
      body: JSON.stringify({
        app_id: "pocket_biome",
        schema_version: 1,
        expected_version: 0,
        payload: {},
      }),
    });
    expect(forgedResponse.status).toBe(401);
    expect(headerSpoof.status).toBe(400);
    expect(bodySpoof.status).toBe(400);
  });

  it("does not accept a legacy admin token as a game token", async () => {
    const app = makeApp();
    const legacy = await signAccessToken({
      sub: "legacy-admin",
      uid: "legacy-admin",
      email: "legacy@example.test",
      emailVerified: true,
      provider: "test",
      admin: true,
    });
    const response = await app.request("/games/merge_relay/debug/session", {
      headers: headers(legacy),
    });
    expect(response.status).toBe(401);
  });

  it("keeps saves in app and user namespaces", async () => {
    const app = makeApp();
    const merge = await token("merge_relay", "debug", "owner");
    const pocket = await token("pocket_biome", "debug", "owner");
    const write = await app.request("/games/merge_relay/debug/saves/shared", {
      method: "PUT",
      headers: headers(merge),
      body: JSON.stringify({ schema_version: 1, expected_version: 0, payload: { app: "merge" } }),
    });
    const otherApp = await app.request("/games/pocket_biome/debug/saves/shared", {
      headers: headers(pocket),
    });
    expect(write.status).toBe(200);
    expect(otherApp.status).toBe(404);
  });

  it("denies another user and environment access to a save", async () => {
    const app = makeApp();
    const owner = await token("merge_relay", "debug", "owner");
    const stranger = await token("merge_relay", "debug", "stranger");
    const staging = await token("merge_relay", "staging", "owner");
    const write = await app.request("/games/merge_relay/debug/saves/private", {
      method: "PUT",
      headers: headers(owner),
      body: JSON.stringify({ schema_version: 1, expected_version: 0, payload: { private: true } }),
    });
    const otherUser = await app.request("/games/merge_relay/debug/saves/private", {
      headers: headers(stranger),
    });
    const otherEnvironment = await app.request("/games/merge_relay/staging/saves/private", {
      headers: headers(staging),
    });
    expect(write.status).toBe(200);
    expect(otherUser.status).toBe(404);
    expect(otherEnvironment.status).toBe(404);
  });

  it("keeps purchases in the app namespace", async () => {
    const app = makeApp();
    const billing = await token("merge_relay", "debug", "billing", "service");
    const pocketUser = await token("pocket_biome", "debug", "owner");
    const grant = await app.request("/games/merge_relay/debug/purchases/grants", {
      method: "POST",
      headers: headers(billing),
      body: JSON.stringify({
        entitlement_id: "ent-1",
        product_id: "product-1",
        purchase_id: "purchase-1",
        user_id: "owner",
      }),
    });
    const otherApp = await app.request("/games/pocket_biome/debug/entitlements", {
      headers: headers(pocketUser),
    });
    expect(grant.status).toBe(200);
    expect(otherApp.status).toBe(200);
    expect((await otherApp.json()).entitlements).toHaveLength(0);
  });
});
