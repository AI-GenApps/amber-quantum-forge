import { describe, expect, it } from "vitest";
import type { MergeResult, MergeSession } from "./contracts";
import type { MergeRelayClock, MergeRelayServiceDependencies } from "./dependencies";
import { createGuest, recoverGuest, upgradeGuest } from "./identity-service";
import { InMemoryMergeRelayStore } from "./memory-store";
import type {
  MergePgsAccessToken,
  MergePgsOAuthCredential,
  MergePgsProvider,
  MergePgsProviderDelivery,
  MergePgsRuntime,
} from "./pgs-contracts";
import { dispatchPgsOutbox } from "./pgs-dispatch";
import { parsePgsCredentialArtifact } from "./pgs-parsers";
import { enqueuePgsResult, linkPgsIdentity } from "./pgs-service";
import { createPgsCredentialVault } from "./pgs-vault";

class FixedClock implements MergeRelayClock {
  now(): Date {
    return new Date("2026-01-01T00:00:00.000Z");
  }
}

class FakePgsProvider implements MergePgsProvider {
  unlockCalls = 0;
  playerId = "player-123";

  async exchangeServerAuthCode(): Promise<MergePgsOAuthCredential> {
    return {
      accessToken: "access-token",
      accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
      refreshToken: "refresh-token",
      scopes: ["games"],
    };
  }

  async verifyPlayer(): Promise<{ playerId: string }> {
    return { playerId: this.playerId };
  }

  async refreshAccessToken(): Promise<MergePgsAccessToken> {
    return {
      accessToken: "refreshed-token",
      accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
      scopes: ["games"],
    };
  }

  async unlockAchievement(): Promise<MergePgsProviderDelivery> {
    this.unlockCalls += 1;
    return { status: "succeeded", errorCode: null };
  }

  async submitLeaderboard(): Promise<MergePgsProviderDelivery> {
    return { status: "succeeded", errorCode: null };
  }
}

function session(subject: string, role: MergeSession["role"] = "player"): MergeSession {
  return { appId: "merge_relay", environment: "debug", subject, role };
}

function result(subject: string): MergeResult {
  return {
    resultId: "guest_result",
    attemptId: "attempt_1",
    challengeId: "challenge_1",
    environment: "debug",
    recipientSubject: subject,
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
    idempotencyKey: "finish_1",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function setup(): { dependencies: MergeRelayServiceDependencies; provider: FakePgsProvider } {
  const provider = new FakePgsProvider();
  const runtime: MergePgsRuntime = {
    config: {
      applicationId: "com.example.merge",
      webClientId: "web-client",
      webClientSecret: "secret",
      achievementTargets: { relay_result: "achievement_1" },
      leaderboardTarget: {
        leaderboardId: "leaderboard_1",
        cohortHash: "cohort-1",
        maxTileBound: 1_000_000,
      },
    },
    provider,
    vault: createPgsCredentialVault(Buffer.alloc(32, 7)),
  };
  return {
    provider,
    dependencies: {
      store: new InMemoryMergeRelayStore(),
      clock: new FixedClock(),
      rewardProvider: null,
      pgsRuntime: runtime,
      idFactory: (prefix) => `${prefix}_test`,
    },
  };
}

describe("Merge Relay PGS guest identity migration", () => {
  it("preserves the encrypted principal through upgrade and dispatch", async () => {
    const { dependencies, provider } = setup();
    const guest = await createGuest(dependencies, "debug");
    const linked = await linkPgsIdentity(
      dependencies,
      "debug",
      session(guest.subject),
      "auth-code",
    );
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      await enqueuePgsResult(transaction, dependencies, result(guest.subject));
    });
    const upgraded = await upgradeGuest(dependencies, "debug", session("account"), {
      recoveryToken: guest.recoveryToken,
    });
    expect(upgraded.subject).toBe("account");
    expect(
      (await recoverGuest(dependencies, "debug", { recoveryToken: guest.recoveryToken })).subject,
    ).toBe("account");
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      await enqueuePgsResult(transaction, dependencies, {
        ...result("account"),
        resultId: "account_result",
        idempotencyKey: "account_finish",
      });
    });
    const credentials = await dependencies.store.readArtifacts(
      "debug",
      { recordType: "pgs_credential", ownerSubject: "account", limit: 10 },
      parsePgsCredentialArtifact,
    );
    expect(credentials.items[0]?.subject).toBe("account");
    expect(credentials.items[0]?.principalSubject).toBe(guest.subject);
    const relinked = await linkPgsIdentity(dependencies, "debug", session("account"), "auth-code");
    expect(relinked.identityId).toBe(linked.identityId);
    const summary = await dispatchPgsOutbox(
      dependencies,
      "debug",
      session("worker", "service"),
      20,
    );
    expect(summary.succeeded).toBe(4);
    expect(provider.unlockCalls).toBe(2);
  });

  it("keeps a guest recoverable when the account has another profile", async () => {
    const { dependencies, provider } = setup();
    const guest = await createGuest(dependencies, "debug");
    await linkPgsIdentity(dependencies, "debug", session(guest.subject), "auth-code");
    provider.playerId = "player-456";
    await linkPgsIdentity(dependencies, "debug", session("account"), "auth-code");
    await expect(
      upgradeGuest(dependencies, "debug", session("account"), {
        recoveryToken: guest.recoveryToken,
      }),
    ).rejects.toMatchObject({ code: "pgs_upgrade_conflict" });
    expect(
      (await recoverGuest(dependencies, "debug", { recoveryToken: guest.recoveryToken })).subject,
    ).toBe(guest.subject);
  });
});
