import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { type GameTokenConfig, SignedGameTokenVerifier, signGameToken } from "../tokens";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { InMemoryMergeRelayStore } from "./memory-store";
import { createMergeRelayRoutes } from "./routes";
import { emptyMergeRelayState } from "./store";

const tokenConfig: GameTokenConfig = {
  appId: "merge_relay",
  environment: "debug",
  secret: "merge-relay-save-route-secret-with-at-least-32-characters",
  issuer: "https://issuer.test/games",
  audience: "merge-relay-save-route",
};

function setup() {
  const dependencies: MergeRelayServiceDependencies & {
    tokenVerifier: SignedGameTokenVerifier;
  } = {
    store: new InMemoryMergeRelayStore({ debug: emptyMergeRelayState() }),
    clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    rewardProvider: null,
    tokenVerifier: new SignedGameTokenVerifier(tokenConfig),
  };
  const app = new Hono();
  app.route("/games/merge_relay", createMergeRelayRoutes(dependencies));
  return app;
}

async function headers(): Promise<Record<string, string>> {
  const token = await signGameToken(tokenConfig, { subject: "player", role: "player" });
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

describe("Merge Relay save receipt HTTP contract", () => {
  it("returns an additive receipt and replays its original save version", async () => {
    const app = setup();
    const requestHeaders = await headers();
    const first = await app.request("/games/merge_relay/debug/saves/main", {
      method: "PUT",
      headers: requestHeaders,
      body: JSON.stringify({
        expected_version: 0,
        schema_version: 1,
        client_write_id: "write-1",
        payload: { score: 1 },
      }),
    });
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.data.save.version).toBe(1);
    expect(firstBody.data.write_receipt).toMatchObject({
      client_write_id: "write-1",
      save_id: "main",
      saved_version: 1,
      replayed: false,
    });
    const later = await app.request("/games/merge_relay/debug/saves/main", {
      method: "PUT",
      headers: requestHeaders,
      body: JSON.stringify({ expected_version: 1, schema_version: 1, payload: { score: 2 } }),
    });
    expect(later.status).toBe(200);
    const replay = await app.request("/games/merge_relay/debug/saves/main", {
      method: "PUT",
      headers: requestHeaders,
      body: JSON.stringify({
        expected_version: 0,
        schema_version: 1,
        client_write_id: "write-1",
        payload: { score: 1 },
      }),
    });
    expect(replay.status).toBe(200);
    const replayBody = await replay.json();
    expect(replayBody.data.save.version).toBe(1);
    expect(replayBody.data.write_receipt).toMatchObject({
      save_id: "main",
      saved_version: 1,
      replayed: true,
    });
    const current = await app.request("/games/merge_relay/debug/saves/main", {
      headers: requestHeaders,
    });
    expect((await current.json()).data.save.version).toBe(2);
  });

  it("rejects a tampered receipt request without changing the save", async () => {
    const app = setup();
    const requestHeaders = await headers();
    const body = {
      expected_version: 0,
      schema_version: 1,
      client_write_id: "write-1",
      payload: { score: 1 },
    };
    const first = await app.request("/games/merge_relay/debug/saves/main", {
      method: "PUT",
      headers: requestHeaders,
      body: JSON.stringify(body),
    });
    expect(first.status).toBe(200);
    const tampered = await app.request("/games/merge_relay/debug/saves/main", {
      method: "PUT",
      headers: requestHeaders,
      body: JSON.stringify({ ...body, payload: { score: 99 } }),
    });
    expect(tampered.status).toBe(409);
    expect((await tampered.json()).error.code).toBe("save_write_id_conflict");
    const current = await app.request("/games/merge_relay/debug/saves/main", {
      headers: requestHeaders,
    });
    expect((await current.json()).data.save.payload).toEqual({ score: 1 });
  });

  it("rejects unsafe numeric payloads as malformed input", async () => {
    const response = await setup().request("/games/merge_relay/debug/saves/main", {
      method: "PUT",
      headers: await headers(),
      body: JSON.stringify({
        expected_version: 0,
        schema_version: 1,
        payload: { score: Number.MAX_SAFE_INTEGER + 1 },
      }),
    });
    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("invalid_save");
  });
});
