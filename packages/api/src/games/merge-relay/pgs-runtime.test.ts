import { afterEach, describe, expect, it } from "vitest";
import { createPgsRuntimeFromEnvironment } from "./pgs-runtime";

const key = Buffer.alloc(32, 7).toString("base64url");
const environmentKeys = [
  "MERGE_RELAY_PGS_DEBUG_APPLICATION_ID",
  "MERGE_RELAY_PGS_DEBUG_WEB_CLIENT_ID",
  "MERGE_RELAY_PGS_DEBUG_WEB_CLIENT_SECRET",
  "MERGE_RELAY_PGS_DEBUG_CREDENTIAL_KEY",
  "MERGE_RELAY_PGS_DEBUG_ACHIEVEMENT_TARGETS_JSON",
  "MERGE_RELAY_PGS_DEBUG_LEADERBOARD_ID",
  "MERGE_RELAY_PGS_DEBUG_LEADERBOARD_COHORT_HASH",
  "MERGE_RELAY_PGS_STAGING_APPLICATION_ID",
  "MERGE_RELAY_PGS_STAGING_WEB_CLIENT_ID",
  "MERGE_RELAY_PGS_STAGING_WEB_CLIENT_SECRET",
  "MERGE_RELAY_PGS_STAGING_CREDENTIAL_KEY",
  "MERGE_RELAY_PGS_APPLICATION_ID",
  "MERGE_RELAY_PGS_WEB_CLIENT_ID",
  "MERGE_RELAY_PGS_WEB_CLIENT_SECRET",
  "MERGE_RELAY_PGS_CREDENTIAL_KEY",
];
const originalEnvironment = new Map(environmentKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of environmentKeys) {
    const value = originalEnvironment.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Google Play Games environment configuration", () => {
  it("selects only the requested environment credentials and targets", () => {
    process.env.MERGE_RELAY_PGS_DEBUG_APPLICATION_ID = "debug-app";
    process.env.MERGE_RELAY_PGS_DEBUG_WEB_CLIENT_ID = "debug-client";
    process.env.MERGE_RELAY_PGS_DEBUG_WEB_CLIENT_SECRET = "debug-secret";
    process.env.MERGE_RELAY_PGS_DEBUG_CREDENTIAL_KEY = key;
    process.env.MERGE_RELAY_PGS_DEBUG_ACHIEVEMENT_TARGETS_JSON = JSON.stringify({
      relay_result: "debug-achievement",
    });
    process.env.MERGE_RELAY_PGS_DEBUG_LEADERBOARD_ID = "debug-leaderboard";
    process.env.MERGE_RELAY_PGS_DEBUG_LEADERBOARD_COHORT_HASH = "debug-cohort";
    process.env.MERGE_RELAY_PGS_STAGING_APPLICATION_ID = "staging-app";
    process.env.MERGE_RELAY_PGS_STAGING_WEB_CLIENT_ID = "staging-client";
    process.env.MERGE_RELAY_PGS_STAGING_WEB_CLIENT_SECRET = "staging-secret";
    process.env.MERGE_RELAY_PGS_STAGING_CREDENTIAL_KEY = key;

    const debug = createPgsRuntimeFromEnvironment("debug");
    const staging = createPgsRuntimeFromEnvironment("staging");
    expect(debug?.config.applicationId).toBe("debug-app");
    expect(debug?.config.achievementTargets.relay_result).toBe("debug-achievement");
    expect(debug?.config.leaderboardTarget?.leaderboardId).toBe("debug-leaderboard");
    expect(staging?.config.applicationId).toBe("staging-app");
    expect(staging?.config.achievementTargets).toEqual({});
    expect(staging?.config.leaderboardTarget).toBeNull();
  });

  it("ignores legacy unscoped credentials instead of sharing them across environments", () => {
    process.env.MERGE_RELAY_PGS_APPLICATION_ID = "legacy-app";
    process.env.MERGE_RELAY_PGS_WEB_CLIENT_ID = "legacy-client";
    process.env.MERGE_RELAY_PGS_WEB_CLIENT_SECRET = "legacy-secret";
    process.env.MERGE_RELAY_PGS_CREDENTIAL_KEY = key;
    expect(createPgsRuntimeFromEnvironment("debug")).toBeNull();
    expect(createPgsRuntimeFromEnvironment("production")).toBeNull();
  });
});
