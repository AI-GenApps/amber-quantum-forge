import { readFileSync } from "node:fs";
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
  secret: "merge-relay-fixture-secret-with-at-least-32-characters",
  issuer: "https://issuer.test/games",
  audience: "merge-relay-fixture",
};

const checkpoint = {
  board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  score: 0,
  move_count: 0,
  seed: 7,
  rng_state: 123,
  rule_version: "MR-2D-1",
};

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/merge-relay-v1-http.json", import.meta.url), "utf8"),
) as Record<string, unknown>;

describe("Merge Relay v1 HTTP fixture", () => {
  it("captures actual route-produced create and resolve responses", async () => {
    const app = createFixtureApp();
    const token = await signGameToken(tokenConfig, { subject: "owner", role: "player" });
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const adminToken = await signGameToken(tokenConfig, { subject: "admin", role: "game_admin" });
    const provisioned = await app.request("/games/merge_relay/debug/daily/2026-01-01/provision", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    });
    expect(provisioned.status).toBe(201);
    const created = await app.request("/games/merge_relay/debug/challenges", {
      method: "POST",
      headers,
      body: JSON.stringify({
        idempotency_key: "fixture-create",
        creator_alias: "Ada",
        mode: "daily",
        content_id: "daily_20260101",
        content_version: "MR-CONTENT-1",
        checkpoint,
      }),
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as Record<string, unknown>;
    const challenge = (createdBody.data as Record<string, unknown>).challenge as Record<
      string,
      unknown
    >;
    const challengeId = challenge.challenge_id as string;
    expect(createdBody).toEqual(fixture.create_challenge);

    const resolved = await app.request(
      `/games/merge_relay/debug/challenges/${challengeId}/resolve`,
    );
    expect(resolved.status).toBe(200);
    const resolvedBody = await resolved.json();
    expect(resolvedBody).toEqual(fixture.resolve_challenge);

    const reserved = await app.request(
      `/games/merge_relay/debug/challenges/${challengeId}/attempts`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ reservation_key: "fixture-reservation" }),
      },
    );
    expect(reserved.status).toBe(201);
    const reservedBody = (await reserved.json()) as Record<string, unknown>;
    expect(reservedBody).toEqual(fixture.reserve_attempt);
    const attempt = (reservedBody.data as Record<string, unknown>).attempt as Record<
      string,
      unknown
    >;
    const attemptId = attempt.attempt_id as string;

    const moved = await app.request(`/games/merge_relay/debug/attempts/${attemptId}/moves`, {
      method: "POST",
      headers,
      body: JSON.stringify({ expected_version: 0, moves: ["left"] }),
    });
    expect(moved.status).toBe(200);
    const movedBody = await moved.json();
    expect(movedBody).toEqual(fixture.submit_moves);

    const finalized = await app.request(`/games/merge_relay/debug/attempts/${attemptId}/finalize`, {
      method: "POST",
      headers,
      body: JSON.stringify({ idempotency_key: "fixture-finalize", finish_early: true }),
    });
    expect(finalized.status).toBe(200);
    const finalizedBody = await finalized.json();
    expect(finalizedBody).toEqual(fixture.finalize_attempt);

    const daily = await app.request("/games/merge_relay/debug/daily/2026-01-01");
    expect(daily.status).toBe(200);
    const dailyBody = await daily.json();
    expect(dailyBody).toEqual(fixture.daily);

    const invalid = await app.request("/games/merge_relay/debug/challenges", {
      method: "POST",
      headers,
      body: JSON.stringify({ creator_alias: "Ada" }),
    });
    expect(invalid.status).toBe(422);
    const invalidBody = await invalid.json();
    expect(invalidBody).toEqual(fixture.invalid_request);
  });
});

function createFixtureApp(): Hono {
  const initial = emptyMergeRelayState();
  const config = initial.configs[0];
  if (!config) throw new Error("test config missing");
  config.features.rankedRelay = true;
  const dependencies: MergeRelayServiceDependencies & {
    tokenVerifier: SignedGameTokenVerifier;
  } = {
    store: new InMemoryMergeRelayStore({ debug: initial }),
    clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    rewardProvider: null,
    tokenVerifier: new SignedGameTokenVerifier(tokenConfig),
    idFactory: fixtureIdFactory(),
  };
  const app = new Hono();
  app.route("/games/merge_relay", createMergeRelayRoutes(dependencies));
  return app;
}

function fixtureIdFactory(): (prefix: string) => string {
  const counters = new Map<string, number>();
  return (prefix) => {
    const next = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, next);
    return `${prefix}_fixture_${next}`;
  };
}
