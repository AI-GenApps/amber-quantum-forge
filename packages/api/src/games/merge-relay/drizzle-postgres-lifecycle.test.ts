import { describe, expect, it } from "vitest";
import { parseConfigArtifact } from "./artifact-parsers";
import type { MergeSession } from "./contracts";
import { getConfig, provisionInitialConfig, rollbackConfig, updateConfig } from "./data-service";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { DrizzleMergeRelayStore } from "./drizzle-store";
import { createGuest } from "./identity-service";
import { createChallenge, finalizeAttempt, reserveAttempt } from "./relay-service";

const databaseUrl = process.env.MERGE_RELAY_TEST_DATABASE_URL;
const suite = describe.skipIf(!databaseUrl);

const checkpoint = {
  board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  score: 0,
  moveCount: 0,
  seed: 7,
  rngState: 123,
  ruleVersion: "MR-2D-1" as const,
};

suite("Merge Relay fresh PostgreSQL lifecycle", () => {
  it("boots config, crosses numeric revisions, and completes a guest relay", async () => {
    if (!databaseUrl) return;
    const store = new DrizzleMergeRelayStore();
    const suffix = Date.now().toString(36);
    const environment = "production" as const;
    const admin = session(`admin_${suffix}`, "game_admin", environment);
    const dependencies: MergeRelayServiceDependencies = {
      store,
      clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
      rewardProvider: null,
    };
    const existing = await store.readArtifacts(
      environment,
      { recordType: "config", direction: "desc", limit: 1 },
      parseConfigArtifact,
    );
    if (existing.items.length > 0) return;
    const bootstrapped = await provisionInitialConfig(dependencies, environment, admin);
    expect(bootstrapped.revision).toBe(1);
    for (let revision = bootstrapped.revision + 1; revision <= 11; revision += 1)
      await advanceConfig(dependencies, environment, admin);
    expect((await getConfig(dependencies, environment)).revision).toBe(11);
    for (let revision = 12; revision <= 100; revision += 1)
      await advanceConfig(dependencies, environment, admin);
    expect((await getConfig(dependencies, environment)).revision).toBe(100);
    const rolledBack = await rollbackConfig(dependencies, environment, admin, {
      expectedRevision: 100,
      targetRevision: 99,
    });
    expect(rolledBack.revision).toBe(101);

    const guest = await createGuest(dependencies, environment);
    const challenge = await createChallenge(
      dependencies,
      environment,
      session(guest.subject, "player", environment),
      { idempotencyKey: `pg-config-${suffix}`, creatorAlias: "PG QA", checkpoint },
    );
    const recipient = session(`recipient_${suffix}`, "player", environment);
    const reserved = await reserveAttempt(
      dependencies,
      environment,
      recipient,
      challenge.challenge.challengeId,
      {
        reservationKey: `reserve-${suffix}`,
      },
    );
    const finalized = await finalizeAttempt(
      dependencies,
      environment,
      recipient,
      reserved.attempt.attemptId,
      { idempotencyKey: `finish-${suffix}`, finishEarly: true },
    );
    expect(finalized.result.configRevision).toBe(101);
  });
});

function session(
  subject: string,
  role: MergeSession["role"],
  environment: MergeSession["environment"],
): MergeSession {
  return { appId: "merge_relay", environment, subject, role };
}

async function advanceConfig(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeSession["environment"],
  admin: MergeSession,
): Promise<void> {
  const current = await getConfig(dependencies, environment);
  await updateConfig(dependencies, environment, admin, {
    expectedRevision: current.revision,
    spawnTwoWeight: current.spawnTwoWeight,
    spawnFourWeight: current.spawnFourWeight,
    features: { ...current.features, rankedRelay: true },
    contentRevision: current.contentRevision,
  });
}
