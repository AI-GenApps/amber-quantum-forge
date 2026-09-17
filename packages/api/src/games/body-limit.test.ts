import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import {
  createGameRoutes,
  type GameTokenConfig,
  InMemoryGameStore,
  SignedGameTokenVerifier,
  signGameToken,
} from "./index";

const config: GameTokenConfig = {
  appId: "merge_relay",
  environment: "debug",
  secret: "body-limit-test-secret-with-at-least-32-characters",
  issuer: "https://issuer.test/games",
  audience: "games-api-test",
};

const app = new Hono();
app.route(
  "/games",
  createGameRoutes({
    tokenVerifier: new SignedGameTokenVerifier(config),
    store: new InMemoryGameStore(),
  }),
);

describe("game API body limit", () => {
  it("rejects oversized JSON before route parsing", async () => {
    const token = await signGameToken(config, { subject: "owner", role: "player" });
    const response = await app.request("/games/merge_relay/debug/saves/main", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        schema_version: 1,
        expected_version: 0,
        payload: { large: "x".repeat(70_000) },
      }),
    });
    expect(response.status).toBe(413);
    expect((await response.json()).error).toBe("body_too_large");
  });
});
