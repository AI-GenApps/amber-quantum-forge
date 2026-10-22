import { describe, expect, it } from "vitest";
import type { MergeResult } from "./contracts";
import { getDaily, provisionDaily } from "./data-service";
import { InMemoryMergeRelayStore } from "./memory-store";
import type { MergePgsProvider, MergePgsRuntime } from "./pgs-contracts";
import { parsePgsOutboxArtifact } from "./pgs-parsers";
import { enqueuePgsResult, linkPgsIdentity } from "./pgs-service";
import { createPgsCredentialVault } from "./pgs-vault";
import { createChallenge, reserveAttempt } from "./relay-service";
import { rankedDependencies, testCheckpoint, testSession, testStores } from "./relay-test-support";

for (const [name, factory] of testStores) {
  describe.skipIf(!factory)(`Merge Relay challenge trust on ${name}`, () => {
    it("rejects reserving your own challenge so self-play cannot forge ranked results", async () => {
      if (!factory) return;
      const deps = await rankedDependencies(factory());
      const suffix = Date.now().toString(36);
      const forged = { ...testCheckpoint, score: 999_999, moveCount: 0 };
      const challenge = await createChallenge(deps, "staging", testSession(`forger_${suffix}`), {
        idempotencyKey: `forged-${suffix}`,
        creatorAlias: "Forger",
        checkpoint: forged,
      });
      await expect(
        reserveAttempt(
          deps,
          "staging",
          testSession(`forger_${suffix}`),
          challenge.challenge.challengeId,
          { reservationKey: `self-${suffix}` },
        ),
      ).rejects.toMatchObject({ status: 403, code: "self_challenge_forbidden" });
      const other = await reserveAttempt(
        deps,
        "staging",
        testSession(`friend_${suffix}`),
        challenge.challenge.challengeId,
        { reservationKey: `friend-${suffix}` },
      );
      expect(other.attempt.recipientSubject).toBe(`friend_${suffix}`);
    });

    it("requires daily challenges to start from the provisioned daily checkpoint", async () => {
      if (!factory) return;
      const deps = await rankedDependencies(factory());
      const admin = testSession("admin", "staging", "game_admin");
      await provisionDaily(deps, "staging", admin, "2026-02-03");
      const daily = await getDaily(deps, "staging", "2026-02-03");
      const suffix = Date.now().toString(36);
      await expect(
        createChallenge(deps, "staging", testSession(`d_${suffix}`), {
          idempotencyKey: `daily-forged-${suffix}`,
          creatorAlias: "Forger",
          mode: "daily",
          contentId: daily.checkpoint.contentId,
          checkpoint: { ...daily.checkpoint, score: 5000, board: testCheckpoint.board },
        }),
      ).rejects.toMatchObject({ status: 422, code: "daily_checkpoint_mismatch" });
      const honest = await createChallenge(deps, "staging", testSession(`d_${suffix}`), {
        idempotencyKey: `daily-honest-${suffix}`,
        creatorAlias: "Honest",
        mode: "daily",
        contentId: daily.checkpoint.contentId,
        checkpoint: daily.checkpoint,
      });
      expect(honest.challenge.originMode).toBe("daily");
    });
  });
}

describe("PGS achievements require a server-known cohort", () => {
  it("skips achievements for results from unknown cohorts", async () => {
    const provider: MergePgsProvider = {
      exchangeServerAuthCode: async () => ({
        accessToken: "a",
        accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
        refreshToken: "r",
        scopes: ["games"],
      }),
      verifyPlayer: async () => ({ playerId: "player-1" }),
      refreshAccessToken: async () => ({
        accessToken: "b",
        accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
        scopes: [],
      }),
      unlockAchievement: async () => ({ status: "succeeded", errorCode: null }),
      submitLeaderboard: async () => ({ status: "succeeded", errorCode: null }),
    };
    const runtime: MergePgsRuntime = {
      config: {
        applicationId: "app",
        webClientId: "web",
        webClientSecret: "secret",
        achievementTargets: { relay_result: "ach-1" },
        leaderboardTarget: { leaderboardId: "lb-1", cohortHash: "known", maxTileBound: 4096 },
      },
      provider,
      vault: createPgsCredentialVault(Buffer.alloc(32, 7)),
    };
    const store = new InMemoryMergeRelayStore();
    const deps = {
      store,
      clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
      rewardProvider: null,
      pgsRuntime: runtime,
    };
    await linkPgsIdentity(deps, "debug", testSession("p", "debug"), "code");
    const base: MergeResult = {
      resultId: "res_known",
      attemptId: "att_1",
      challengeId: "ch_1",
      environment: "debug",
      recipientSubject: "p",
      scoreDelta: 10,
      finalScore: 10,
      maxTile: 8,
      movesUsed: 2,
      outcome: "complete",
      mode: "rescue",
      originMode: "rescue",
      configRevision: 1,
      challengePayloadHash: "known",
      returnChallengeId: null,
      idempotencyKey: "fin_known",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    await store.transactArtifacts("debug", async (transaction) => {
      await enqueuePgsResult(transaction, deps, base);
      await enqueuePgsResult(transaction, deps, {
        ...base,
        resultId: "res_forged",
        idempotencyKey: "fin_forged",
        challengePayloadHash: "forged",
      });
    });
    const outbox = await store.readArtifacts(
      "debug",
      { recordType: "pgs_outbox", limit: 50 },
      parsePgsOutboxArtifact,
    );
    expect(outbox.items.filter((item) => item.resultId === "res_known")).toHaveLength(1);
    expect(outbox.items.filter((item) => item.resultId === "res_forged")).toHaveLength(0);
  });
});
