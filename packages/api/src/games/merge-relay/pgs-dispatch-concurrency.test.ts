import { describe, expect, it } from "vitest";
import type { MergeResult, MergeSession } from "./contracts";
import type { MergeRelayClock, MergeRelayServiceDependencies } from "./dependencies";
import { InMemoryMergeRelayStore } from "./memory-store";
import type {
  MergePgsAccessToken,
  MergePgsOAuthCredential,
  MergePgsProvider,
  MergePgsProviderDelivery,
  MergePgsRuntime,
} from "./pgs-contracts";
import { dispatchPgsOutbox } from "./pgs-dispatch";
import { enqueuePgsResult, linkPgsIdentity } from "./pgs-service";
import { createPgsCredentialVault } from "./pgs-vault";

class FixedClock implements MergeRelayClock {
  now(): Date {
    return new Date("2026-01-01T00:00:00.000Z");
  }
}

class SlowProvider implements MergePgsProvider {
  active = 0;
  peak = 0;

  async exchangeServerAuthCode(): Promise<MergePgsOAuthCredential> {
    return {
      accessToken: "access",
      accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
      refreshToken: "refresh",
      scopes: ["games"],
    };
  }

  async verifyPlayer(): Promise<{ playerId: string }> {
    return { playerId: "player-123" };
  }

  async refreshAccessToken(): Promise<MergePgsAccessToken> {
    return {
      accessToken: "refreshed",
      accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
      scopes: [],
    };
  }

  async unlockAchievement(): Promise<MergePgsProviderDelivery> {
    return this.deliver();
  }

  async submitLeaderboard(): Promise<MergePgsProviderDelivery> {
    return this.deliver();
  }

  private async deliver(): Promise<MergePgsProviderDelivery> {
    this.active += 1;
    this.peak = Math.max(this.peak, this.active);
    await new Promise((resolve) => setTimeout(resolve, 10));
    this.active -= 1;
    return { status: "succeeded", errorCode: null };
  }
}

function session(subject: string, role: MergeSession["role"] = "player"): MergeSession {
  return { appId: "merge_relay", environment: "debug", subject, role };
}

function result(resultId: string): MergeResult {
  return {
    resultId,
    attemptId: `attempt_${resultId}`,
    challengeId: `challenge_${resultId}`,
    environment: "debug",
    recipientSubject: "player",
    scoreDelta: 12,
    finalScore: 12,
    maxTile: 8,
    movesUsed: 3,
    outcome: "complete",
    mode: "rescue",
    originMode: "daily",
    configRevision: 1,
    challengePayloadHash: "cohort-1",
    returnChallengeId: null,
    idempotencyKey: `finish_${resultId}`,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("Merge Relay PGS dispatch concurrency", () => {
  it("dispatches a bounded batch within one provider window", async () => {
    const provider = new SlowProvider();
    const runtime: MergePgsRuntime = {
      config: {
        applicationId: "com.example.merge",
        webClientId: "web-client",
        webClientSecret: "secret",
        achievementTargets: { relay_result: "achievement-1" },
        leaderboardTarget: null,
      },
      provider,
      vault: createPgsCredentialVault(Buffer.alloc(32, 7)),
    };
    let sequence = 0;
    const dependencies: MergeRelayServiceDependencies = {
      store: new InMemoryMergeRelayStore(),
      clock: new FixedClock(),
      rewardProvider: null,
      pgsRuntime: runtime,
      idFactory: (prefix) => `${prefix}_${++sequence}`,
    };
    await linkPgsIdentity(dependencies, "debug", session("player"), "auth-code");
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      await enqueuePgsResult(transaction, dependencies, result("one"));
      await enqueuePgsResult(transaction, dependencies, result("two"));
    });
    const summary = await dispatchPgsOutbox(
      dependencies,
      "debug",
      session("worker", "service"),
      20,
    );
    expect(summary.succeeded).toBe(2);
    expect(provider.peak).toBeGreaterThan(1);
  });
});
