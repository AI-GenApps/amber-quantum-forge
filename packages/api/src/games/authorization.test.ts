import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import {
  createGameRoutes,
  type GameStorage,
  type GameTokenConfig,
  InMemoryGameStore,
  SignedGameTokenVerifier,
  signGameToken,
  UnavailableGameStore,
} from "./index";

const config: GameTokenConfig = {
  appId: "meme_court",
  environment: "debug",
  secret: "court-test-secret-with-at-least-32-characters",
  issuer: "https://issuer.test/games",
  audience: "games-api-test",
};

function makeApp(store: GameStorage = new InMemoryGameStore()) {
  const app = new Hono();
  app.route(
    "/games",
    createGameRoutes({
      tokenVerifier: new SignedGameTokenVerifier(config),
      store,
    }),
  );
  return app;
}

async function bearer(subject: string, role: "player" | "game_admin" | "service" = "player") {
  return signGameToken(config, { subject, role });
}

function auth(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

describe("game API resource authorization", () => {
  it("allows challenge members and rejects outsiders", async () => {
    const app = makeApp();
    const owner = await bearer("owner");
    const member = await bearer("member");
    const outsider = await bearer("outsider");
    const create = await app.request("/games/meme_court/debug/challenges/round-1", {
      method: "POST",
      headers: auth(owner),
      body: JSON.stringify({
        member_user_ids: ["member"],
        payload: { round: 1 },
      }),
    });
    const allowed = await app.request("/games/meme_court/debug/challenges/round-1", {
      headers: auth(member),
    });
    const denied = await app.request("/games/meme_court/debug/challenges/round-1", {
      headers: auth(outsider),
    });
    expect(create.status).toBe(201);
    expect(allowed.status).toBe(200);
    expect(denied.status).toBe(403);
  });

  it("keeps purchases server-writable and role-scoped", async () => {
    const app = makeApp();
    const player = await bearer("player");
    const service = await bearer("billing", "service");
    const playerWrite = await app.request("/games/meme_court/debug/purchases/grants", {
      method: "POST",
      headers: auth(player),
      body: JSON.stringify({
        entitlement_id: "ent-1",
        product_id: "coins-1",
        purchase_id: "purchase-1",
        user_id: "player",
      }),
    });
    const serviceWrite = await app.request("/games/meme_court/debug/purchases/grants", {
      method: "POST",
      headers: auth(service),
      body: JSON.stringify({
        entitlement_id: "ent-1",
        product_id: "coins-1",
        purchase_id: "purchase-1",
        user_id: "player",
      }),
    });
    const read = await app.request("/games/meme_court/debug/entitlements", {
      headers: auth(player),
    });
    expect(playerWrite.status).toBe(403);
    expect(serviceWrite.status).toBe(200);
    expect(read.status).toBe(200);
    expect((await read.json()).entitlements).toHaveLength(1);
  });

  it("requires the explicit game admin role for summaries", async () => {
    const app = makeApp();
    const player = await bearer("player");
    const admin = await bearer("admin", "game_admin");
    const denied = await app.request("/games/meme_court/debug/admin/summary", {
      headers: auth(player),
    });
    const allowed = await app.request("/games/meme_court/debug/admin/summary", {
      headers: auth(admin),
    });
    expect(denied.status).toBe(403);
    expect(allowed.status).toBe(200);
  });

  it("fails closed when no approved storage is configured", async () => {
    const app = makeApp(new UnavailableGameStore());
    const player = await bearer("player");
    const response = await app.request("/games/meme_court/debug/saves/main", {
      headers: auth(player),
    });
    expect(response.status).toBe(503);
    expect((await response.json()).error).toBe("game_storage_unavailable");
  });

  it("rejects a client-supplied owner identity", async () => {
    const app = makeApp();
    const owner = await bearer("owner");
    const response = await app.request("/games/meme_court/debug/challenges/round-2", {
      method: "POST",
      headers: auth(owner),
      body: JSON.stringify({
        owner_user_id: "other-user",
        member_user_ids: ["owner"],
        payload: {},
      }),
    });
    expect(response.status).toBe(400);
  });
});
