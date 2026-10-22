import { describe, expect, it } from "vitest";
import { adSsvRuntimeFromEnvironment } from "./ad-ssv-keys";
import { createCommerceRuntimeFromEnvironment } from "./commerce-runtime";
import type { MergeCheckpoint, MergeSession } from "./contracts";
import { getConfig, grantReward, rollbackConfig, updateConfig } from "./data-service";
import type { MergeRelayServiceDependencies } from "./dependencies";
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
const clock = { now: () => new Date("2026-01-01T00:00:00.000Z") };
const admin: MergeSession = {
  appId: "merge_relay",
  environment: "debug",
  subject: "admin",
  role: "game_admin",
};
const player: MergeSession = { ...admin, subject: "player", role: "player" };
const service: MergeSession = { ...admin, subject: "billing", role: "service" };

function dependencies(): MergeRelayServiceDependencies {
  const initial = emptyMergeRelayState();
  const config = initial.configs[0];
  if (!config) throw new Error("test config missing");
  config.features.rankedRelay = true;
  return { store: new InMemoryMergeRelayStore({ debug: initial }), clock, rewardProvider: null };
}

async function finishedResult(deps: MergeRelayServiceDependencies): Promise<string> {
  const challenge = await createChallenge(deps, "debug", player, {
    idempotencyKey: "gate-create",
    creatorAlias: "Admin",
    checkpoint,
  });
  const reserved = await reserveAttempt(deps, "debug", player, challenge.challenge.challengeId, {
    reservationKey: "gate-reserve",
  });
  const moved = await submitMoves(deps, "debug", player, reserved.attempt.attemptId, {
    expectedVersion: 0,
    moves: ["left"],
  });
  const done = await finalizeAttempt(deps, "debug", player, moved.attemptId, {
    idempotencyKey: "gate-finish",
    finishEarly: true,
  });
  return done.result.resultId;
}

const reward = (resultId: string) => ({
  resultId,
  kind: "ad_reward" as const,
  productId: "hint",
  providerTransactionId: "gate-tx",
});

async function setFeatures(
  deps: MergeRelayServiceDependencies,
  patch: { rewardedAds?: boolean },
): Promise<void> {
  const config = await getConfig(deps, "debug");
  await updateConfig(deps, "debug", admin, {
    expectedRevision: config.revision,
    spawnTwoWeight: config.spawnTwoWeight,
    spawnFourWeight: config.spawnFourWeight,
    features: { ...config.features, ...patch },
  });
}

describe("Merge Relay sandbox provider gates", () => {
  it("leaves commerce and ad providers off when configuration is absent", () => {
    for (const environment of ["debug", "staging", "production"] as const) {
      expect(createCommerceRuntimeFromEnvironment(environment)).toBeNull();
      expect(adSsvRuntimeFromEnvironment(environment)).toBeNull();
    }
  });

  it("ships with rewards and cosmetics disabled in the default config", async () => {
    const config = await getConfig(dependencies(), "debug");
    expect(config.features.rewardedAds).toBe(false);
    expect(config.features.cosmetics).toBe(false);
  });

  it("refuses rewards while the remote flag is off even with a provider", async () => {
    const deps = dependencies();
    const resultId = await finishedResult(deps);
    deps.rewardProvider = { verifySettlement: async () => Promise.reject(new Error("called")) };
    await expect(grantReward(deps, "debug", service, reward(resultId))).rejects.toMatchObject({
      code: "rewards_disabled",
    });
  });

  it("refuses rewards without a provider even when the flag is on", async () => {
    const deps = dependencies();
    const resultId = await finishedResult(deps);
    await setFeatures(deps, { rewardedAds: true });
    await expect(grantReward(deps, "debug", service, reward(resultId))).rejects.toMatchObject({
      code: "rewards_disabled",
    });
  });

  it("rolls the reward flag back to disabled through the remote config", async () => {
    const deps = dependencies();
    const resultId = await finishedResult(deps);
    const initial = await getConfig(deps, "debug");
    await setFeatures(deps, { rewardedAds: true });
    const enabled = await getConfig(deps, "debug");
    await rollbackConfig(deps, "debug", admin, {
      targetRevision: initial.revision,
      expectedRevision: enabled.revision,
    });
    expect((await getConfig(deps, "debug")).features.rewardedAds).toBe(false);
    await expect(grantReward(deps, "debug", service, reward(resultId))).rejects.toMatchObject({
      code: "rewards_disabled",
    });
  });
});
