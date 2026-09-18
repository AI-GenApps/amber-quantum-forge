import { parseConfigArtifact, parseDailyArtifact } from "./artifact-parsers";
import { requireActiveConfig } from "./config-policy";
import type {
  MergeConfigRevision,
  MergeDailyChallenge,
  MergeEnvironment,
  MergeSession,
} from "./contracts";
import { MERGE_RELAY_MAX_MOVES } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { dailySeed, initialCheckpoint } from "./engine";
import { MergeRelayError } from "./errors";

export async function getDaily(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  date: string,
): Promise<MergeDailyChallenge> {
  const config = await currentConfig(dependencies, environment);
  requireActiveConfig(config, "daily");
  const existing = await dependencies.store.readArtifacts(
    environment,
    { recordType: "daily", recordId: date, limit: 1 },
    parseDailyArtifact,
  );
  const daily = existing.items[0];
  if (!daily)
    throw new MergeRelayError(
      404,
      "daily_unavailable",
      "The requested daily challenge has not been provisioned",
    );
  return daily;
}

export async function provisionDaily(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  date: string,
): Promise<MergeDailyChallenge> {
  if (session.role !== "game_admin" && session.role !== "service")
    throw new MergeRelayError(
      403,
      "daily_provision_role_required",
      "A game administrator or service role is required",
    );
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const existing = await transaction.read(
      { recordType: "daily", recordId: date },
      parseDailyArtifact,
    );
    if (existing) return existing;
    const config = requireActiveConfig(
      await transaction.read({ recordType: "config", direction: "desc" }, parseConfigArtifact),
      "daily",
    );
    const daily: MergeDailyChallenge = {
      date,
      configRevision: config.revision,
      mode: "daily",
      maxLegalMoves: MERGE_RELAY_MAX_MOVES,
      checkpoint: {
        ...initialCheckpoint(dailySeed(date), config.spawnTwoWeight, config.spawnFourWeight),
        maxLegalMoves: MERGE_RELAY_MAX_MOVES,
        contentId: `daily_${date.replaceAll("-", "")}`,
        contentVersion: config.contentRevision,
        spawnTwoWeight: config.spawnTwoWeight,
        spawnFourWeight: config.spawnFourWeight,
      },
      contentRevision: config.contentRevision,
      generated: true,
      updatedAt: dependencies.clock.now().toISOString(),
    };
    await transaction.put("daily", date, daily);
    return daily;
  });
}

async function currentConfig(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
): Promise<MergeConfigRevision | null> {
  const configs = await dependencies.store.readArtifacts(
    environment,
    { recordType: "config", direction: "desc", limit: 1 },
    parseConfigArtifact,
  );
  return configs.items[0] ?? null;
}
