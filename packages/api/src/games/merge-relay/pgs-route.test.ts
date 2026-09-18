import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { type GameTokenConfig, SignedGameTokenVerifier, signGameToken } from "../tokens";
import type { MergeRelayClock, MergeRelayServiceDependencies } from "./dependencies";
import { InMemoryMergeRelayStore } from "./memory-store";
import { createMergeRelayRoutes } from "./routes";
import { emptyMergeRelayState } from "./store";

const tokenConfig: GameTokenConfig = {
  appId: "merge_relay",
  environment: "debug",
  secret: "merge-relay-route-test-secret-with-at-least-32-characters",
  issuer: "https://issuer.test/games",
  audience: "merge-relay-api-test",
};

class FixedClock implements MergeRelayClock {
  now(): Date {
    return new Date("2026-01-01T00:00:00.000Z");
  }
}

function setup(): Hono {
  const initial = emptyMergeRelayState();
  const dependencies: MergeRelayServiceDependencies & {
    tokenVerifier: SignedGameTokenVerifier;
    issueGuestToken: () => Promise<string>;
  } = {
    store: new InMemoryMergeRelayStore({ debug: initial }),
    clock: new FixedClock(),
    rewardProvider: null,
    tokenVerifier: new SignedGameTokenVerifier(tokenConfig),
    issueGuestToken: async () => "guest-token",
  };
  const app = new Hono();
  app.route("/games/merge_relay", createMergeRelayRoutes(dependencies));
  return app;
}

async function playerToken(): Promise<string> {
  return signGameToken(tokenConfig, { subject: "player", role: "player" });
}

describe("Merge Relay PGS status route", () => {
  it("returns scoped link status without provider identifiers", async () => {
    const app = setup();
    const response = await app.request(
      "/games/merge_relay/debug/platform/google-play-games/identity",
      {
        headers: { Authorization: `Bearer ${await playerToken()}` },
      },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.identity).toEqual({
      provider: "google_play_games",
      configured: false,
      status: "unlinked",
    });
    expect(body.data.identity).not.toHaveProperty("player_id");
  });

  it("requires a signed game session", async () => {
    const response = await setup().request(
      "/games/merge_relay/debug/platform/google-play-games/identity",
    );
    expect(response.status).toBe(401);
  });
});
