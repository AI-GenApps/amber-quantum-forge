import { MERGE_PGS_MAX_TILE_BOUND, type MergePgsRuntime } from "./pgs-contracts";
import { GooglePlayGamesProvider } from "./pgs-provider";
import { createPgsCredentialVault, pgsCredentialKeyFromEnvironment } from "./pgs-vault";

export function createPgsRuntimeFromEnvironment(
  environment: "debug" | "staging" | "production",
): MergePgsRuntime | null {
  const prefix = `MERGE_RELAY_PGS_${environment.toUpperCase()}_`;
  const applicationId = process.env[`${prefix}APPLICATION_ID`];
  const webClientId = process.env[`${prefix}WEB_CLIENT_ID`];
  const webClientSecret = process.env[`${prefix}WEB_CLIENT_SECRET`];
  const credentialKey = pgsCredentialKeyFromEnvironment(environment);
  if (!applicationId || !webClientId || !webClientSecret || !credentialKey) return null;
  const achievementTargets = parseTargets(process.env[`${prefix}ACHIEVEMENT_TARGETS_JSON`]);
  const leaderboardId = process.env[`${prefix}LEADERBOARD_ID`];
  const cohortHash = process.env[`${prefix}LEADERBOARD_COHORT_HASH`];
  const leaderboardTarget =
    leaderboardId && cohortHash
      ? { leaderboardId, cohortHash, maxTileBound: MERGE_PGS_MAX_TILE_BOUND }
      : null;
  return {
    config: {
      applicationId,
      webClientId,
      webClientSecret,
      achievementTargets,
      leaderboardTarget,
    },
    provider: new GooglePlayGamesProvider(webClientId, webClientSecret),
    vault: createPgsCredentialVault(credentialKey),
  };
}

function parseTargets(value: string | undefined): Readonly<Record<string, string>> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed as Record<string, unknown>).filter(
      ([key, target]) =>
        /^[A-Za-z0-9._:-]{1,128}$/.test(key) &&
        typeof target === "string" &&
        /^[A-Za-z0-9._:-]{1,128}$/.test(target),
    );
    return Object.fromEntries(entries) as Record<string, string>;
  } catch {
    return {};
  }
}
