import { describe, expect, it } from "vitest";
import type { MergeCheckpoint, MergeSession } from "./contracts";
import {
  getConfig,
  getDaily,
  grantReward,
  provisionDaily,
  recordEvent,
  recordSocial,
  rollbackConfig,
  updateConfig,
} from "./data-service";
import type { MergeRelayClock, MergeRelayServiceDependencies } from "./dependencies";
import { InMemoryMergeRelayStore } from "./memory-store";
import { createChallenge, finalizeAttempt, reserveAttempt, submitMoves } from "./relay-service";
import { emptyMergeRelayState } from "./store";

const checkpoint: MergeCheckpoint = {
  board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  score: 0,
  moveCount: 0,
  seed: 7,
  rngState: 123,
  ruleVersion: "MR-2D-1",
};

class FixedClock implements MergeRelayClock {
  now(): Date {
    return new Date("2026-01-01T00:00:00.000Z");
  }
}

function session(subject: string, role: MergeSession["role"] = "player"): MergeSession {
  return { appId: "merge_relay", environment: "debug", subject, role };
}

function setup(): MergeRelayServiceDependencies {
  const initial = emptyMergeRelayState();
  const config = initial.configs[0];
  if (!config) throw new Error("test config missing");
  config.features.rankedRelay = true;
  return {
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
  };
}

describe("Merge Relay service policy guards", () => {
  it("freezes custom daily weights and rejects stale config revisions", async () => {
    const dependencies = setup();
    const admin = session("admin", "game_admin");
    const initial = await getConfig(dependencies, "debug");
    const next = await updateConfig(dependencies, "debug", admin, {
      expectedRevision: initial.revision,
      spawnTwoWeight: 80,
      spawnFourWeight: 20,
      features: { ...initial.features, cosmetics: true },
    });
    await provisionDaily(dependencies, "debug", admin, "2026-09-17");
    const daily = await getDaily(dependencies, "debug", "2026-09-17");
    expect(daily.checkpoint.spawnTwoWeight).toBe(80);
    expect(daily.checkpoint.spawnFourWeight).toBe(20);
    const rolled = await rollbackConfig(dependencies, "debug", admin, {
      targetRevision: initial.revision,
      expectedRevision: next.revision,
    });
    expect(rolled.active).toBe(true);
    const updates = await Promise.allSettled([
      updateConfig(dependencies, "debug", admin, {
        expectedRevision: rolled.revision,
        spawnTwoWeight: 70,
        spawnFourWeight: 30,
        features: rolled.features,
      }),
      updateConfig(dependencies, "debug", admin, {
        expectedRevision: rolled.revision,
        spawnTwoWeight: 60,
        spawnFourWeight: 40,
        features: rolled.features,
      }),
    ]);
    expect(updates.filter((update) => update.status === "fulfilled")).toHaveLength(1);
    expect(updates.filter((update) => update.status === "rejected")).toHaveLength(1);
  });

  it("binds event, reward, and social identities to complete requests", async () => {
    const dependencies = setup();
    const player = session("player");
    const config = await getConfig(dependencies, "debug");
    await updateConfig(dependencies, "debug", session("admin", "game_admin"), {
      expectedRevision: config.revision,
      spawnTwoWeight: config.spawnTwoWeight,
      spawnFourWeight: config.spawnFourWeight,
      features: { ...config.features, cosmetics: true },
    });
    const challenge = await createChallenge(dependencies, "debug", player, {
      idempotencyKey: "policy-create",
      creatorAlias: "Admin",
      checkpoint,
    });
    const reserved = await reserveAttempt(
      dependencies,
      "debug",
      player,
      challenge.challenge.challengeId,
      { reservationKey: "policy-reserve" },
    );
    const moved = await submitMoves(dependencies, "debug", player, reserved.attempt.attemptId, {
      expectedVersion: 0,
      moves: ["left"],
    });
    const result = await finalizeAttempt(dependencies, "debug", player, moved.attemptId, {
      idempotencyKey: "policy-finish",
      finishEarly: true,
    });
    const service = session("billing", "service");
    const reward = await grantReward(dependencies, "debug", service, {
      resultId: result.result.resultId,
      kind: "cosmetic",
      productId: "theme_1",
      providerTransactionId: "provider-policy",
    });
    const repeated = await grantReward(dependencies, "debug", service, {
      resultId: result.result.resultId,
      kind: "cosmetic",
      productId: "theme_1",
      providerTransactionId: "provider-policy",
    });
    expect(repeated.rewardId).toBe(reward.rewardId);
    dependencies.rewardProvider = {
      verifySettlement: async () => {
        throw new Error("provider outage");
      },
    };
    const outageRetry = await grantReward(dependencies, "debug", service, {
      resultId: result.result.resultId,
      kind: "cosmetic",
      productId: "theme_1",
      providerTransactionId: "provider-policy",
    });
    expect(outageRetry.rewardId).toBe(reward.rewardId);
    const event = await recordEvent(dependencies, "debug", player, {
      idempotencyKey: "event-policy",
      type: "replay_viewed",
      payload: {},
    });
    await expect(
      recordEvent(dependencies, "debug", player, {
        idempotencyKey: "event-policy",
        type: "replay_viewed",
        artifactId: "different-result",
        payload: {},
      }),
    ).rejects.toMatchObject({ code: "event_idempotency_conflict" });
    const social = await recordSocial(dependencies, "debug", player, "block", {
      targetSubject: "owner",
      reason: "spam",
    });
    const repeatedSocial = await recordSocial(dependencies, "debug", player, "block", {
      targetSubject: "owner",
      reason: "spam",
    });
    expect(event.eventId).toBeTruthy();
    expect(repeatedSocial.recordId).toBe(social.recordId);
    dependencies.rewardProvider = {
      verifySettlement: async (input) => ({
        verified: true,
        providerTransactionId: input.providerTransactionId,
        environment: "debug",
        subject: "player",
        resultId: input.resultId,
        productId: input.productId,
        kind: input.kind,
        refunded: true,
        cancelled: false,
      }),
    };
    await expect(
      grantReward(dependencies, "debug", service, {
        resultId: result.result.resultId,
        kind: "cosmetic",
        productId: "theme_1",
        providerTransactionId: "provider-refunded",
      }),
    ).rejects.toMatchObject({ code: "reward_not_verified" });
  });
});
