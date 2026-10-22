import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { type GameTokenConfig, SignedGameTokenVerifier, signGameToken } from "../tokens";
import { createAdMobKeySource } from "./ad-ssv-keys";
import type { MergeSession } from "./contracts";
import { InMemoryMergeRelayStore } from "./memory-store";
import { getResult, retireChallenge } from "./relay-queries";
import { createChallenge, finalizeAttempt, reserveAttempt, submitMoves } from "./relay-service";
import { rankedDependencies, testCheckpoint, testSession, testStores } from "./relay-test-support";
import { createMergeRelayRoutes } from "./routes";
import { emptyMergeRelayState, MergeRelayStorageError, type MergeRelayStore } from "./store";

for (const [name, factory] of testStores) {
  describe.skipIf(!factory)(`Merge Relay parent challenge ownership on ${name}`, () => {
    it("allows a parent the caller owns or has a finalized result on, and hides others", async () => {
      if (!factory) return;
      const deps = await rankedDependencies(factory(), "staging");
      const suffix = Date.now().toString(36);
      const owner = testSession(`po_${suffix}`);
      const player = testSession(`pp_${suffix}`);
      const stranger = testSession(`ps_${suffix}`);
      const parent = await createChallenge(deps, "staging", owner, {
        idempotencyKey: `parent-${suffix}`,
        creatorAlias: "Parent",
        checkpoint: testCheckpoint,
      });
      const parentChallengeId = parent.challenge.challengeId;
      const child = (subject: MergeSession, key: string) =>
        createChallenge(deps, "staging", subject, {
          idempotencyKey: key,
          creatorAlias: "Child",
          checkpoint: testCheckpoint,
          parentChallengeId,
        });
      expect((await child(owner, `c-owner-${suffix}`)).challenge.parentChallengeId).toBe(
        parentChallengeId,
      );
      await expect(child(player, `c-player-${suffix}`)).rejects.toMatchObject({
        status: 404,
        code: "parent_challenge_not_found",
      });
      const reserved = await reserveAttempt(deps, "staging", player, parentChallengeId, {
        reservationKey: `r-${suffix}`,
      });
      await expect(child(player, `c-player-${suffix}`)).rejects.toMatchObject({
        code: "parent_challenge_not_found",
      });
      await submitMoves(deps, "staging", player, reserved.attempt.attemptId, {
        expectedVersion: 0,
        moves: ["left"],
      });
      const finalized = await finalizeAttempt(deps, "staging", player, reserved.attempt.attemptId, {
        idempotencyKey: `f-${suffix}`,
        finishEarly: true,
      });
      expect((await getResult(deps, "staging", player, finalized.result.resultId)).resultId).toBe(
        finalized.result.resultId,
      );
      expect((await child(player, `c-player-${suffix}`)).challenge.parentChallengeId).toBe(
        parentChallengeId,
      );
      await expect(child(stranger, `c-stranger-${suffix}`)).rejects.toMatchObject({
        code: "parent_challenge_not_found",
      });
      await retireChallenge(
        deps,
        "staging",
        testSession("admin", "staging", "game_admin"),
        parentChallengeId,
      );
    });
  });
}

describe("AdMob verifier key cache", () => {
  it("advances the fetch clock on a non-OK or failed fetch so it is not hammered", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
      let calls = 0;
      let mode: "error" | "throw" = "error";
      const source = createAdMobKeySource(async () => {
        calls += 1;
        if (mode === "throw") throw new Error("network");
        return new Response("nope", { status: 500 });
      });
      expect(await source.getKey("1")).toBeNull();
      expect(calls).toBe(1);
      expect(await source.getKey("1")).toBeNull();
      expect(calls).toBe(1);
      vi.setSystemTime(new Date("2026-01-01T00:01:01.000Z"));
      mode = "throw";
      expect(await source.getKey("1")).toBeNull();
      expect(calls).toBe(2);
      expect(await source.getKey("1")).toBeNull();
      expect(calls).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

const tokenConfig: GameTokenConfig = {
  appId: "merge_relay",
  environment: "debug",
  secret: "merge-relay-review-secret-with-at-least-32-characters",
  issuer: "https://issuer.test/games",
  audience: "merge-relay-review",
};

function routesFor(store: MergeRelayStore) {
  const app = new Hono();
  app.route(
    "/games/merge_relay",
    createMergeRelayRoutes({
      store,
      clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
      rewardProvider: null,
      tokenVerifier: new SignedGameTokenVerifier(tokenConfig),
      issueGuestToken: async (_environment, subject) =>
        signGameToken(tokenConfig, { subject, role: "player" }),
    }),
  );
  return app;
}

const authed = async (subject: string) => ({
  Authorization: `Bearer ${await signGameToken(tokenConfig, { subject, role: "player" })}`,
  "Content-Type": "application/json",
});

describe("Merge Relay guest identity routes", () => {
  it("returns 503 when the effective subject lookup hits a storage failure", async () => {
    const memory = new InMemoryMergeRelayStore({ debug: emptyMergeRelayState() });
    let reads = 0;
    const failing: MergeRelayStore = {
      read: (environment, operation) => memory.read(environment, operation),
      transact: (environment, operation) => memory.transact(environment, operation),
      transactArtifacts: (environment, operation) =>
        memory.transactArtifacts(environment, operation),
      readArtifacts: async () => {
        reads += 1;
        throw new MergeRelayStorageError("storage down");
      },
    };
    const app = routesFor(failing);
    const guestResponse = await app.request("/games/merge_relay/debug/challenges/chal_x", {
      headers: await authed("guest_abcdef"),
    });
    expect(guestResponse.status).toBe(503);
    expect((await guestResponse.json()).error.code).toBe("merge_relay_unavailable");
    expect(reads).toBe(1);
  });

  it("does not issue a guest token once the guest has been upgraded", async () => {
    const app = routesFor(new InMemoryMergeRelayStore({ debug: emptyMergeRelayState() }));
    const created = await app.request("/games/merge_relay/debug/guest", { method: "POST" });
    const guest = (await created.json()).data;
    expect(typeof guest.access_token).toBe("string");
    const before = await app.request("/games/merge_relay/debug/guest/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recovery_token: guest.recovery_token }),
    });
    const recovered = (await before.json()).data;
    expect(typeof recovered.access_token).toBe("string");
    expect(recovered.upgraded_subject).toBeNull();
    const upgrade = await app.request("/games/merge_relay/debug/guest/upgrade", {
      method: "POST",
      headers: await authed("account_1"),
      body: JSON.stringify({ recovery_token: guest.recovery_token }),
    });
    expect(upgrade.status).toBe(200);
    const after = await app.request("/games/merge_relay/debug/guest/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recovery_token: guest.recovery_token }),
    });
    const upgraded = (await after.json()).data;
    expect(upgraded.access_token).toBeNull();
    expect(upgraded.upgraded_subject).toBe("account_1");
  });
});
