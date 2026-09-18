import { describe, expect, it } from "vitest";
import type { MergeSession } from "./contracts";
import { getConfig, provisionInitialConfig, rollbackConfig, updateConfig } from "./data-service";
import type { MergeRelayClock, MergeRelayServiceDependencies } from "./dependencies";
import { InMemoryMergeRelayStore } from "./memory-store";
import { createChallenge } from "./relay-service";

class FixedClock implements MergeRelayClock {
  now(): Date {
    return new Date("2026-01-01T00:00:00.000Z");
  }
}

function session(subject: string, role: MergeSession["role"]): MergeSession {
  return { appId: "merge_relay", environment: "debug", subject, role };
}

function setup(): MergeRelayServiceDependencies {
  return {
    store: new InMemoryMergeRelayStore(),
    clock: new FixedClock(),
    rewardProvider: null,
  };
}

async function advanceConfig(
  dependencies: MergeRelayServiceDependencies,
  admin: MergeSession,
): Promise<void> {
  const current = await getConfig(dependencies, "debug");
  await updateConfig(dependencies, "debug", admin, {
    expectedRevision: current.revision,
    spawnTwoWeight: current.spawnTwoWeight,
    spawnFourWeight: current.spawnFourWeight,
    features: { ...current.features, rankedRelay: true },
    contentRevision: current.contentRevision,
  });
}

describe("Merge Relay configuration revisions", () => {
  it("orders numeric revisions and preserves lifecycle after two-digit boundaries", async () => {
    const dependencies = setup();
    const admin = session("admin", "game_admin");
    await expect(provisionInitialConfig(dependencies, "debug", admin)).resolves.toMatchObject({
      revision: 1,
    });
    for (let revision = 2; revision <= 11; revision += 1) await advanceConfig(dependencies, admin);
    await expect(getConfig(dependencies, "debug")).resolves.toMatchObject({ revision: 11 });
    for (let revision = 12; revision <= 100; revision += 1)
      await advanceConfig(dependencies, admin);
    await expect(getConfig(dependencies, "debug")).resolves.toMatchObject({ revision: 100 });

    const rolledBack = await rollbackConfig(dependencies, "debug", admin, {
      expectedRevision: 100,
      targetRevision: 99,
    });
    expect(rolledBack.revision).toBe(101);
    expect(await getConfig(dependencies, "debug")).toMatchObject({ revision: 101 });

    const created = await createChallenge(dependencies, "debug", session("player", "player"), {
      idempotencyKey: "numeric-config-challenge",
      creatorAlias: "QA",
      checkpoint: {
        board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        score: 0,
        moveCount: 0,
        seed: 7,
        rngState: 123,
        ruleVersion: "MR-2D-1",
      },
    });
    expect(created.challenge.configRevision).toBe(101);
  });
});
