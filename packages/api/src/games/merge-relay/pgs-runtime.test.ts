import { afterEach, describe, expect, it, vi } from "vitest";
import { createPgsRuntimeFromEnvironment } from "./pgs-runtime";

const key = Buffer.alloc(32, 7).toString("base64url");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Google Play Games environment configuration", () => {
  it("selects only the requested environment credentials and targets", () => {
    vi.stubEnv("MERGE_RELAY_PGS_DEBUG_APPLICATION_ID", "debug-app");
    vi.stubEnv("MERGE_RELAY_PGS_DEBUG_WEB_CLIENT_ID", "debug-client");
    vi.stubEnv("MERGE_RELAY_PGS_DEBUG_WEB_CLIENT_SECRET", "debug-secret");
    vi.stubEnv("MERGE_RELAY_PGS_DEBUG_CREDENTIAL_KEY", key);
    vi.stubEnv(
      "MERGE_RELAY_PGS_DEBUG_ACHIEVEMENT_TARGETS_JSON",
      JSON.stringify({ relay_result: "debug-achievement" }),
    );
    vi.stubEnv("MERGE_RELAY_PGS_DEBUG_LEADERBOARD_ID", "debug-leaderboard");
    vi.stubEnv("MERGE_RELAY_PGS_DEBUG_LEADERBOARD_COHORT_HASH", "debug-cohort");
    vi.stubEnv("MERGE_RELAY_PGS_STAGING_APPLICATION_ID", "staging-app");
    vi.stubEnv("MERGE_RELAY_PGS_STAGING_WEB_CLIENT_ID", "staging-client");
    vi.stubEnv("MERGE_RELAY_PGS_STAGING_WEB_CLIENT_SECRET", "staging-secret");
    vi.stubEnv("MERGE_RELAY_PGS_STAGING_CREDENTIAL_KEY", key);

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
    vi.stubEnv("MERGE_RELAY_PGS_APPLICATION_ID", "legacy-app");
    vi.stubEnv("MERGE_RELAY_PGS_WEB_CLIENT_ID", "legacy-client");
    vi.stubEnv("MERGE_RELAY_PGS_WEB_CLIENT_SECRET", "legacy-secret");
    vi.stubEnv("MERGE_RELAY_PGS_CREDENTIAL_KEY", key);
    expect(createPgsRuntimeFromEnvironment("debug")).toBeNull();
    expect(createPgsRuntimeFromEnvironment("production")).toBeNull();
  });
});
