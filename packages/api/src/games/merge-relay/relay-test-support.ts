import type { MergeEnvironment, MergeSession } from "./contracts";
import { getConfig, provisionInitialConfig, updateConfig } from "./data-service";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { DrizzleMergeRelayStore } from "./drizzle-store";
import { InMemoryMergeRelayStore } from "./memory-store";
import type { MergeRelayStore } from "./store";

export const testDatabaseUrl = process.env.MERGE_RELAY_TEST_DATABASE_URL;

export const testStores: Array<[string, (() => MergeRelayStore) | null]> = [
  ["in-memory store", () => new InMemoryMergeRelayStore()],
  ["PostgreSQL store", testDatabaseUrl ? () => new DrizzleMergeRelayStore() : null],
];

export const testCheckpoint = {
  board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  score: 0,
  moveCount: 0,
  seed: 7,
  rngState: 123,
  ruleVersion: "MR-2D-1" as const,
};

export function testSession(
  subject: string,
  environment: MergeEnvironment = "staging",
  role: MergeSession["role"] = "player",
): MergeSession {
  return { appId: "merge_relay", environment, subject, role };
}

export async function rankedDependencies(
  store: MergeRelayStore,
  environment: MergeEnvironment = "staging",
): Promise<MergeRelayServiceDependencies> {
  const dependencies: MergeRelayServiceDependencies = {
    store,
    clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    rewardProvider: null,
  };
  const admin = testSession("admin", environment, "game_admin");
  await provisionInitialConfig(dependencies, environment, admin);
  const current = await getConfig(dependencies, environment);
  if (!current.features.rankedRelay || !current.features.cosmetics)
    await updateConfig(dependencies, environment, admin, {
      expectedRevision: current.revision,
      spawnTwoWeight: current.spawnTwoWeight,
      spawnFourWeight: current.spawnFourWeight,
      features: { ...current.features, rankedRelay: true, cosmetics: true },
      contentRevision: current.contentRevision,
    });
  return dependencies;
}
