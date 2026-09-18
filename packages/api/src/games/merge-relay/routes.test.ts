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

const checkpoint = {
  board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  score: 0,
  move_count: 0,
  seed: 7,
  rng_state: 123,
  rule_version: "MR-2D-1",
};

function setup() {
  const initial = emptyMergeRelayState();
  const config = initial.configs[0];
  if (!config) throw new Error("test config missing");
  config.features.rankedRelay = true;
  const dependencies: MergeRelayServiceDependencies & {
    tokenVerifier: SignedGameTokenVerifier;
    issueGuestToken: () => Promise<string>;
  } = {
    store: new InMemoryMergeRelayStore({ debug: initial }),
    clock: new FixedClock(),
    rewardProvider: {
      verifySettlement: async (input) => ({
        verified: true,
        providerTransactionId: input.providerTransactionId,
        environment: "debug",
        subject: "player",
        resultId: input.resultId,
        productId: input.productId,
        kind: input.kind,
        refunded: false,
        cancelled: false,
      }),
    },
    tokenVerifier: new SignedGameTokenVerifier(tokenConfig),
    issueGuestToken: async () => "guest-token",
  };
  const app = new Hono();
  app.route("/games/merge_relay", createMergeRelayRoutes(dependencies));
  return app;
}

async function token(subject: string, role: "player" | "game_admin" | "service" = "player") {
  return signGameToken(tokenConfig, { subject, role });
}

function headers(value: string, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${value}`, "Content-Type": "application/json", ...extra };
}

describe("Merge Relay HTTP contract", () => {
  it("keeps the app and environment scope in signed token verification", async () => {
    const app = setup();
    const player = await token("player");
    const response = await app.request("/games/merge_relay/debug/challenges", {
      method: "POST",
      headers: headers(player, { "X-App-Id": "pocket_biome" }),
      body: "{}",
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("client_app_scope_mismatch");
  });

  it("protects configuration mutations while keeping config reads public", async () => {
    const app = setup();
    const current = await app.request("/games/merge_relay/debug/config");
    expect(current.status).toBe(200);
    const config = (await current.json()).data;
    const payload = {
      expected_revision: config.revision,
      spawn_two_weight: config.spawn_two_weight,
      spawn_four_weight: config.spawn_four_weight,
      content_revision: config.content_revision,
      features: config.features,
    };
    const unauthenticated = await app.request("/games/merge_relay/debug/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(unauthenticated.status).toBe(401);
    const admin = await token("admin", "game_admin");
    const updated = await app.request("/games/merge_relay/debug/config", {
      method: "PUT",
      headers: headers(admin),
      body: JSON.stringify(payload),
    });
    expect(updated.status).toBe(200);
  });

  it("protects idempotent configuration bootstrap", async () => {
    const app = setup();
    const player = await token("player");
    const denied = await app.request("/games/merge_relay/debug/config/bootstrap", {
      method: "POST",
      headers: headers(player),
      body: "{}",
    });
    expect(denied.status).toBe(403);
    const admin = await token("admin", "game_admin");
    const first = await app.request("/games/merge_relay/debug/config/bootstrap", {
      method: "POST",
      headers: headers(admin),
      body: "{}",
    });
    const second = await app.request("/games/merge_relay/debug/config/bootstrap", {
      method: "POST",
      headers: headers(admin),
      body: "{}",
    });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect((await first.json()).data.config.revision).toBe(1);
    expect((await second.json()).data.config.revision).toBe(1);
  });

  it("creates and publicly resolves a snake case immutable challenge", async () => {
    const app = setup();
    const owner = await token("owner");
    const create = await app.request("/games/merge_relay/debug/challenges", {
      method: "POST",
      headers: headers(owner),
      body: JSON.stringify({ idempotency_key: "create-1", creator_alias: "Ada", checkpoint }),
    });
    expect(create.status).toBe(201);
    const created = await create.json();
    expect(created.data.challenge.checkpoint.move_count).toBe(0);
    const challengeId = created.data.challenge.challenge_id;
    const resolve = await app.request(`/games/merge_relay/debug/challenges/${challengeId}/resolve`);
    expect(resolve.status).toBe(200);
    const resolved = await resolve.json();
    expect(resolved.data.checkpoint.rule_version).toBe("MR-2D-1");
    expect(resolved.data).not.toHaveProperty("owner_subject");
  });

  it("rejects a token signed for another environment", async () => {
    const app = setup();
    const staging = await signGameToken(
      { ...tokenConfig, environment: "staging" },
      { subject: "player", role: "player" },
    );
    const response = await app.request("/games/merge_relay/debug/saves/main", {
      headers: headers(staging),
    });
    expect(response.status).toBe(401);
  });

  it("supports guest creation and recovery without client identity input", async () => {
    const app = setup();
    const created = await app.request("/games/merge_relay/debug/guest", { method: "POST" });
    expect(created.status).toBe(200);
    const guest = await created.json();
    expect(guest.data.access_token).toBe("guest-token");
    const recovered = await app.request("/games/merge_relay/debug/guest/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recovery_token: guest.data.recovery_token }),
    });
    expect(recovered.status).toBe(200);
    expect((await recovered.json()).data.subject).toBe(guest.data.guest.subject);
  });

  it("uses the upgraded account subject for an old guest token", async () => {
    const app = setup();
    const created = await app.request("/games/merge_relay/debug/guest", { method: "POST" });
    const guest = await created.json();
    const guestToken = await signGameToken(tokenConfig, {
      subject: guest.data.guest.subject,
      role: "player",
    });
    const accountToken = await token("account");
    const upgraded = await app.request("/games/merge_relay/debug/guest/upgrade", {
      method: "POST",
      headers: headers(accountToken),
      body: JSON.stringify({ recovery_token: guest.data.recovery_token }),
    });
    expect(upgraded.status).toBe(200);
    const saved = await app.request("/games/merge_relay/debug/saves/main", {
      method: "PUT",
      headers: headers(guestToken),
      body: JSON.stringify({ expected_version: 0, schema_version: 1, payload: { score: 8 } }),
    });
    expect(saved.status).toBe(200);
    const accountSave = await app.request("/games/merge_relay/debug/saves/main", {
      headers: headers(accountToken),
    });
    expect(accountSave.status).toBe(200);
    expect((await accountSave.json()).data.save.payload).toEqual({ score: 8 });
  });

  it("requires a service role for provider rewards and rejects malformed payloads", async () => {
    const app = setup();
    const player = await token("player");
    const denied = await app.request("/games/merge_relay/debug/rewards", {
      method: "POST",
      headers: headers(player),
      body: JSON.stringify({}),
    });
    expect(denied.status).toBe(403);
    const service = await token("billing", "service");
    const malformed = await app.request("/games/merge_relay/debug/rewards", {
      method: "POST",
      headers: headers(service),
      body: JSON.stringify({ result_id: "bad", kind: "cosmetic" }),
    });
    expect(malformed.status).toBe(422);
  });

  it("rejects save schema versions that are not supported", async () => {
    const app = setup();
    const player = await token("player");
    const response = await app.request("/games/merge_relay/debug/saves/main", {
      method: "PUT",
      headers: headers(player),
      body: JSON.stringify({ expected_version: 0, schema_version: 2, payload: {} }),
    });
    expect(response.status).toBe(422);
  });

  it("uses snake case social request fields", async () => {
    const app = setup();
    const player = await token("player");
    const response = await app.request("/games/merge_relay/debug/social/block", {
      method: "POST",
      headers: headers(player),
      body: JSON.stringify({ target_subject: "owner", reason: "spam" }),
    });
    expect(response.status).toBe(201);
    expect((await response.json()).data.record.target_subject).toBe("owner");
  });

  it("rejects oversized request bodies before JSON parsing", async () => {
    const app = setup();
    const player = await token("player");
    const response = await app.request("/games/merge_relay/debug/challenges", {
      method: "POST",
      headers: headers(player),
      body: JSON.stringify({
        idempotency_key: "large",
        creator_alias: "Ada",
        checkpoint,
        padding: "x".repeat(70_000),
      }),
    });
    expect(response.status).toBe(413);
  });

  it("keeps Google Play Games routes disabled without provider configuration", async () => {
    const app = setup();
    const player = await token("player");
    const identity = await app.request(
      "/games/merge_relay/debug/platform/google-play-games/identity",
      {
        method: "POST",
        headers: headers(player),
        body: JSON.stringify({ server_auth_code: "auth-code" }),
      },
    );
    expect(identity.status).toBe(503);
    expect((await identity.json()).error.code).toBe("pgs_unconfigured");
    const service = await token("worker", "service");
    const dispatch = await app.request(
      "/games/merge_relay/debug/platform/google-play-games/outbox/dispatch",
      { method: "POST", headers: headers(service), body: JSON.stringify({ limit: 1 }) },
    );
    expect(dispatch.status).toBe(503);
    expect((await dispatch.json()).error.code).toBe("pgs_unconfigured");
  });
});
