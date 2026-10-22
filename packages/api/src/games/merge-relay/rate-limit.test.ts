import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { type GameTokenConfig, SignedGameTokenVerifier, signGameToken } from "../tokens";
import { InMemoryMergeRelayStore } from "./memory-store";
import {
  createStoreRateLimiter,
  DEFAULT_RATE_LIMIT_RULES,
  InMemoryRateLimiter,
  type MergeRateLimiter,
  RATE_LIMIT_ACTIONS,
  type RateLimitAction,
  rateLimitRulesFromEnvironment,
  resolveRateLimitRules,
} from "./rate-limit";
import { testStores } from "./relay-test-support";
import { createMergeRelayRoutes } from "./routes";
import { emptyMergeRelayState } from "./store";

const config: GameTokenConfig = {
  appId: "merge_relay",
  environment: "debug",
  secret: "merge-relay-rate-limit-secret-with-at-least-32-characters",
  issuer: "https://issuer.test/games",
  audience: "merge-relay-rate-limit",
};

function clock(start: string) {
  let current = new Date(start).getTime();
  return {
    now: () => new Date(current),
    advance: (seconds: number) => {
      current += seconds * 1000;
    },
  };
}

function harness(
  rules: Parameters<typeof resolveRateLimitRules>[0],
  limiterKind: "store" | "memory",
) {
  const time = clock("2026-03-01T00:00:00.000Z");
  const store = new InMemoryMergeRelayStore({ debug: emptyMergeRelayState() });
  const rateLimiter: MergeRateLimiter =
    limiterKind === "store" ? createStoreRateLimiter(store, time) : new InMemoryRateLimiter(time);
  const app = new Hono();
  app.route(
    "/games/merge_relay",
    createMergeRelayRoutes({
      store,
      clock: time,
      rewardProvider: null,
      tokenVerifier: new SignedGameTokenVerifier(config),
      rateLimiter,
      rateLimits: rules,
    }),
  );
  return { app, time };
}

async function bearer(subject: string) {
  return { Authorization: `Bearer ${await signGameToken(config, { subject, role: "player" })}` };
}

const calls: Record<RateLimitAction, { path: string; method: string; subject: string | null }> = {
  guest_create: { path: "/games/merge_relay/debug/guest", method: "POST", subject: null },
  guest_recover: { path: "/games/merge_relay/debug/guest/recover", method: "POST", subject: null },
  challenge_create: {
    path: "/games/merge_relay/debug/challenges",
    method: "POST",
    subject: "alice",
  },
  event_post: { path: "/games/merge_relay/debug/events", method: "POST", subject: "alice" },
  social_post: { path: "/games/merge_relay/debug/social/report", method: "POST", subject: "alice" },
  attempt_reserve: {
    path: "/games/merge_relay/debug/challenges/chal_1/attempts",
    method: "POST",
    subject: "alice",
  },
};

async function send(
  app: Hono,
  action: RateLimitAction,
  options: { subject?: string; ip?: string } = {},
) {
  const call = calls[action];
  const subject = options.subject ?? call.subject;
  return app.request(call.path, {
    method: call.method,
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": options.ip ?? "203.0.113.1",
      ...(subject === null ? {} : await bearer(subject)),
    },
    body: "{}",
  });
}

describe("Merge Relay rate limiting", () => {
  for (const action of RATE_LIMIT_ACTIONS) {
    it(`returns 429 with a stable code and retry-after for ${action}`, async () => {
      const { app, time } = harness({ [action]: { limit: 2, windowSeconds: 60 } }, "store");
      expect((await send(app, action)).status).not.toBe(429);
      expect((await send(app, action)).status).not.toBe(429);
      const blocked = await send(app, action);
      expect(blocked.status).toBe(429);
      expect((await blocked.json()).error.code).toBe("rate_limited");
      expect(Number(blocked.headers.get("Retry-After"))).toBe(60);
      time.advance(45);
      const stillBlocked = await send(app, action);
      expect(stillBlocked.status).toBe(429);
      expect(Number(stillBlocked.headers.get("Retry-After"))).toBe(15);
      time.advance(15);
      expect((await send(app, action)).status).not.toBe(429);
    });
  }

  it("isolates public limits per client address", async () => {
    const { app } = harness({ guest_create: { limit: 1, windowSeconds: 60 } }, "store");
    expect((await send(app, "guest_create", { ip: "198.51.100.7" })).status).toBe(200);
    expect((await send(app, "guest_create", { ip: "198.51.100.7" })).status).toBe(429);
    expect((await send(app, "guest_create", { ip: "198.51.100.8" })).status).toBe(200);
  });

  it("isolates authenticated limits per subject and per action", async () => {
    const { app } = harness(
      {
        event_post: { limit: 1, windowSeconds: 60 },
        social_post: { limit: 1, windowSeconds: 60 },
      },
      "store",
    );
    expect((await send(app, "event_post", { subject: "alice" })).status).not.toBe(429);
    expect((await send(app, "event_post", { subject: "alice" })).status).toBe(429);
    expect((await send(app, "event_post", { subject: "bob" })).status).not.toBe(429);
    expect((await send(app, "social_post", { subject: "alice" })).status).not.toBe(429);
  });

  it("does not limit when no limiter is injected", async () => {
    const store = new InMemoryMergeRelayStore({ debug: emptyMergeRelayState() });
    const app = new Hono();
    app.route(
      "/games/merge_relay",
      createMergeRelayRoutes({
        store,
        clock: clock("2026-03-01T00:00:00.000Z"),
        rewardProvider: null,
        tokenVerifier: new SignedGameTokenVerifier(config),
      }),
    );
    for (let index = 0; index < 40; index += 1)
      expect((await send(app, "guest_recover")).status).not.toBe(429);
  });

  it("supports the in-memory limiter with the same window rules", async () => {
    const { app, time } = harness({ guest_create: { limit: 1, windowSeconds: 10 } }, "memory");
    expect((await send(app, "guest_create")).status).toBe(200);
    expect((await send(app, "guest_create")).status).toBe(429);
    time.advance(10);
    expect((await send(app, "guest_create")).status).toBe(200);
  });

  it("parses limits from the environment and rejects invalid values", () => {
    expect(
      rateLimitRulesFromEnvironment({ MERGE_RELAY_RATE_LIMIT_EVENT_POST: "5:30" }).event_post,
    ).toEqual({ limit: 5, windowSeconds: 30 });
    expect(() =>
      rateLimitRulesFromEnvironment({ MERGE_RELAY_RATE_LIMIT_EVENT_POST: "x" }),
    ).toThrow();
    expect(() => resolveRateLimitRules({ event_post: { limit: 0, windowSeconds: 1 } })).toThrow();
    expect(resolveRateLimitRules().guest_create).toEqual(DEFAULT_RATE_LIMIT_RULES.guest_create);
  });
});

for (const [name, factory] of testStores) {
  describe.skipIf(!factory)(`Merge Relay store-backed limiter on ${name}`, () => {
    it("counts per key, rolls the window and survives a new limiter instance", async () => {
      if (!factory) return;
      const store = factory();
      const time = clock("2026-03-01T00:00:00.000Z");
      const suffix = Date.now().toString(36);
      const rule = { limit: 2, windowSeconds: 60 };
      const request = (key: string) => ({
        environment: "debug" as const,
        action: "event_post" as const,
        key: `${key}_${suffix}`,
        rule,
      });
      const first = createStoreRateLimiter(store, time);
      expect((await first.consume(request("a"))).allowed).toBe(true);
      expect((await first.consume(request("a"))).remaining).toBe(0);
      const second = createStoreRateLimiter(store, time);
      const denied = await second.consume(request("a"));
      expect(denied).toMatchObject({ allowed: false, retryAfterSeconds: 60 });
      expect((await second.consume(request("b"))).allowed).toBe(true);
      time.advance(60);
      expect((await second.consume(request("a"))).allowed).toBe(true);
    });
  });
}
