import { describe, expect, it } from "vitest";
import type { MergeCheckpoint, MergeSession } from "./contracts";
import { getConfig, getDaily, provisionDaily, recordSocial, updateConfig } from "./data-service";
import type { MergeRelayClock, MergeRelayServiceDependencies } from "./dependencies";
import { InMemoryMergeRelayStore } from "./memory-store";
import { retireChallenge } from "./relay-queries";
import { createChallenge, reserveAttempt } from "./relay-service";
import { parseMergeRelayState } from "./state-validation";
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

function setup(): { store: InMemoryMergeRelayStore; dependencies: MergeRelayServiceDependencies } {
  const initial = emptyMergeRelayState();
  const config = initial.configs[0];
  if (!config) throw new Error("test config missing");
  config.features.rankedRelay = true;
  const store = new InMemoryMergeRelayStore({ debug: initial });
  return {
    store,
    dependencies: { store, clock: new FixedClock(), rewardProvider: null },
  };
}

describe("Merge Relay contract regressions", () => {
  it("serves an explicitly provisioned immutable daily record", async () => {
    const { store, dependencies } = setup();
    await provisionDaily(dependencies, "debug", session("admin", "game_admin"), "2026-09-17");
    const first = await getDaily(dependencies, "debug", "2026-09-17");
    const second = await getDaily(dependencies, "debug", "2026-09-17");
    expect(second.checkpoint).toEqual(first.checkpoint);
    expect(first.mode).toBe("daily");
    expect(first.maxLegalMoves).toBe(3);
    expect(store.snapshot("debug").daily).toHaveLength(1);
  });

  it("does not synthesize an unprovisioned daily record on read", async () => {
    const { dependencies } = setup();
    await expect(getDaily(dependencies, "debug", "2026-09-17")).rejects.toMatchObject({
      code: "daily_unavailable",
    });
  });

  it("creates a daily relay from the provisioned revision after tuning changes", async () => {
    const { dependencies } = setup();
    const admin = session("admin", "game_admin");
    await provisionDaily(dependencies, "debug", admin, "2026-09-17");
    const daily = await getDaily(dependencies, "debug", "2026-09-17");
    const current = await getConfig(dependencies, "debug");
    await updateConfig(dependencies, "debug", admin, {
      expectedRevision: current.revision,
      spawnTwoWeight: 70,
      spawnFourWeight: 30,
      features: current.features,
    });
    const challenge = await createChallenge(dependencies, "debug", session("owner"), {
      idempotencyKey: "daily-frozen-reference",
      creatorAlias: "Ada",
      mode: "daily",
      contentId: daily.checkpoint.contentId,
      checkpoint: daily.checkpoint,
    });
    expect(challenge.challenge.configRevision).toBe(daily.configRevision);
    expect(challenge.challenge.checkpoint.spawnTwoWeight).toBe(90);
    expect(challenge.challenge.checkpoint.spawnFourWeight).toBe(10);
  });

  it("rejects a daily request whose content ID is outside the provisioned record", async () => {
    const { dependencies } = setup();
    await provisionDaily(dependencies, "debug", session("admin", "game_admin"), "2026-09-17");
    const daily = await getDaily(dependencies, "debug", "2026-09-17");
    await expect(
      createChallenge(dependencies, "debug", session("owner"), {
        idempotencyKey: "daily-content-mismatch",
        creatorAlias: "Ada",
        mode: "daily",
        contentId: "daily_20260917",
        checkpoint: { ...daily.checkpoint, contentId: "daily_20260918" },
      }),
    ).rejects.toMatchObject({ code: "daily_config_mismatch" });
  });

  it("rejects relay creation when the active ranked feature is disabled", async () => {
    const { dependencies } = setup();
    const config = await getConfig(dependencies, "debug");
    await updateConfig(dependencies, "debug", session("admin", "game_admin"), {
      expectedRevision: config.revision,
      spawnTwoWeight: config.spawnTwoWeight,
      spawnFourWeight: config.spawnFourWeight,
      features: { ...config.features, rankedRelay: false },
    });
    await expect(
      createChallenge(dependencies, "debug", session("owner"), {
        idempotencyKey: "disabled-ranked",
        creatorAlias: "Ada",
        checkpoint,
      }),
    ).rejects.toMatchObject({ code: "feature_disabled" });
  });

  it("rejects daily reads when the active daily feature is disabled", async () => {
    const { dependencies } = setup();
    const config = await getConfig(dependencies, "debug");
    await updateConfig(dependencies, "debug", session("admin", "game_admin"), {
      expectedRevision: config.revision,
      spawnTwoWeight: config.spawnTwoWeight,
      spawnFourWeight: config.spawnFourWeight,
      features: { ...config.features, daily: false },
    });
    await expect(getDaily(dependencies, "debug", "2026-09-17")).rejects.toMatchObject({
      code: "feature_disabled",
    });
  });

  it("retains the origin mode while freezing rescue spawn rules", async () => {
    const { dependencies } = setup();
    await provisionDaily(dependencies, "debug", session("admin", "game_admin"), "2026-09-17");
    const daily = await getDaily(dependencies, "debug", "2026-09-17");
    const challenge = await createChallenge(dependencies, "debug", session("owner"), {
      idempotencyKey: "origin-1",
      creatorAlias: "Ada",
      checkpoint,
      mode: "daily",
      contentId: daily.checkpoint.contentId,
    });
    expect(challenge.challenge.mode).toBe("rescue");
    expect(challenge.challenge.originMode).toBe("daily");
    expect(challenge.challenge.checkpoint.maxLegalMoves).toBe(3);
    expect(challenge.challenge.checkpoint.spawnTwoWeight).toBe(90);
    expect(challenge.challenge.checkpoint.spawnFourWeight).toBe(10);
  });

  it("cancels reserved attempts when a challenge is retired", async () => {
    const { dependencies, store } = setup();
    const challenge = await createChallenge(dependencies, "debug", session("owner"), {
      idempotencyKey: "retire-1",
      creatorAlias: "Ada",
      checkpoint,
    });
    await reserveAttempt(
      dependencies,
      "debug",
      session("player"),
      challenge.challenge.challengeId,
      { reservationKey: "reserve-1" },
    );
    await retireChallenge(
      dependencies,
      "debug",
      session("moderator", "game_admin"),
      challenge.challenge.challengeId,
    );
    expect(store.snapshot("debug").attempts[0]?.status).toBe("cancelled");
    expect(store.snapshot("debug").results).toHaveLength(0);
  });

  it("rejects ambiguous aliases before creating social records", async () => {
    const { dependencies } = setup();
    for (const [subject, key] of [
      ["owner-1", "alias-1"],
      ["owner-2", "alias-2"],
    ])
      await createChallenge(dependencies, "debug", session(subject), {
        idempotencyKey: key,
        creatorAlias: "Ada",
        checkpoint,
      });
    await expect(
      recordSocial(dependencies, "debug", session("player"), "block", {
        targetAlias: "Ada",
        reason: "spam",
      }),
    ).rejects.toMatchObject({ code: "ambiguous_target_alias" });
  });

  it("rejects copied state with an orphan attempt", () => {
    const state = emptyMergeRelayState();
    state.attempts.push({
      attemptId: "att_1",
      challengeId: "ch_missing",
      environment: "debug",
      recipientSubject: "player",
      checkpoint,
      maxLegalMoves: 3,
      moves: [],
      status: "reserved",
      reservationKey: "reserve-1",
      reservedAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-01-02T00:00:00.000Z",
      version: 0,
      resultId: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(() => parseMergeRelayState(state, "debug")).toThrow(
      "Attempt challenge relation is invalid",
    );
  });
});
