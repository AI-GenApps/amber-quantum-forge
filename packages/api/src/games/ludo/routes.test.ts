import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { signAccessToken } from "../../lib/jwt";
import { EnvironmentGameTokenVerifier } from "../tokens";
import { createConfiguredLudoRoutes, createLudoRoutes } from "./routes";

const ENV_KEYS = [
  "GAME_TOKEN_SECRET_LUDO_DEBUG",
  "GAME_TOKEN_ISSUER",
  "GAME_TOKEN_AUDIENCE",
] as const;

function saveEnv() {
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
}

function restoreEnv(saved: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

async function apiToken(sub = "firebase-uid-123") {
  return signAccessToken({
    sub,
    uid: sub,
    email: "player@example.test",
    emailVerified: true,
    provider: "google.com",
    admin: false,
  });
}

describe("Ludo session route", () => {
  it("rejects a request without a valid API access token", async () => {
    const app = new Hono();
    app.route("/games/ludo", createLudoRoutes({ signSessionToken: async () => "unused" }));
    const response = await app.request("/games/ludo/debug/session", { method: "POST" });
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("ludo_authentication_required");
  });

  it("rejects a request whose :environment is not a recognized game environment", async () => {
    const app = new Hono();
    app.route("/games/ludo", createLudoRoutes({ signSessionToken: async () => "unused" }));
    const token = await apiToken();
    const response = await app.request("/games/ludo/production-typo/session", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("ludo_invalid_environment");
  });

  it("issues a token whose subject matches the caller's Firebase UID and verifies for appId ludo", async () => {
    const saved = saveEnv();
    process.env.GAME_TOKEN_SECRET_LUDO_DEBUG = "ludo-route-test-secret-with-at-least-32-characters";
    process.env.GAME_TOKEN_ISSUER = "https://issuer.test/games";
    process.env.GAME_TOKEN_AUDIENCE = "ludo-api-test";
    try {
      const app = new Hono();
      app.route("/games/ludo", createConfiguredLudoRoutes());
      const token = await apiToken("firebase-uid-abc");
      const response = await app.request("/games/ludo/debug/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.subject).toBe("firebase-uid-abc");
      expect(body.app_id).toBe("ludo");
      expect(body.environment).toBe("debug");
      const session = await new EnvironmentGameTokenVerifier().verify(body.game_token, {
        appId: "ludo",
        environment: "debug",
      });
      expect(session).toEqual({
        appId: "ludo",
        environment: "debug",
        subject: "firebase-uid-abc",
        role: "player",
      });
    } finally {
      restoreEnv(saved);
    }
  });

  it("fails closed with ludo_token_configuration_unavailable when unconfigured", async () => {
    const saved = saveEnv();
    delete process.env.GAME_TOKEN_SECRET_LUDO_DEBUG;
    delete process.env.GAME_TOKEN_ISSUER;
    delete process.env.GAME_TOKEN_AUDIENCE;
    try {
      const app = new Hono();
      app.route("/games/ludo", createConfiguredLudoRoutes());
      const token = await apiToken();
      const response = await app.request("/games/ludo/debug/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(503);
      expect((await response.json()).error.code).toBe("ludo_token_configuration_unavailable");
    } finally {
      restoreEnv(saved);
    }
  });
});
