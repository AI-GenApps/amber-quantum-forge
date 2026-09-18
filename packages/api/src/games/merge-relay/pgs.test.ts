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
import { parsePgsOutboxArtifact } from "./pgs-parsers";
import { enqueuePgsResult, getPgsIdentityStatus, linkPgsIdentity } from "./pgs-service";
import { createPgsCredentialVault } from "./pgs-vault";

class FixedClock implements MergeRelayClock {
  now(): Date {
    return new Date("2026-01-01T00:00:00.000Z");
  }
}

class FakePgsProvider implements MergePgsProvider {
  unlockCalls = 0;
  leaderboardCalls = 0;
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
    this.leaderboardCalls += 1;
    return { status: "succeeded", errorCode: null };
  }
}

function session(subject: string, role: MergeSession["role"] = "player"): MergeSession {
  return { appId: "merge_relay", environment: "debug", subject, role };
}

function result(): MergeResult {
  return {
    resultId: "result_1",
    attemptId: "attempt_1",
    challengeId: "challenge_1",
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

describe("Merge Relay Google Play Games boundary", () => {
  it("reports environment-scoped link status without exposing provider identifiers", async () => {
    const { dependencies } = setup();
    expect(await getPgsIdentityStatus(dependencies, "debug", session("player"))).toEqual({
      provider: "google_play_games",
      configured: true,
      status: "unlinked",
    });
    const identity = await linkPgsIdentity(dependencies, "debug", session("player"), "auth-code");
    expect(await getPgsIdentityStatus(dependencies, "debug", session("player"))).toEqual({
      provider: "google_play_games",
      configured: true,
      status: "active",
    });
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      await transaction.put(
        "pgs_identity",
        identity.identityId,
        { ...identity, status: "reauthorization_required" },
        { ownerSubject: identity.subject, lookupKey: identity.playerId },
      );
    });
    expect((await getPgsIdentityStatus(dependencies, "debug", session("player"))).status).toBe(
      "reauthorization_required",
    );
  });

  it("seals credentials and rejects authenticated tampering", () => {
    const vault = createPgsCredentialVault(Buffer.alloc(32, 9));
    const sealed = vault.seal({
      environment: "debug",
      principalSubject: "player",
      playerId: "player-123",
      credential: {
        accessToken: "access-token",
        accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
        refreshToken: "refresh-token",
        scopes: ["games"],
      },
    });
    expect(
      vault.open({
        record: {
          ...sealed,
          credentialId: "credential_1",
          environment: "debug",
          subject: "player",
          principalSubject: "player",
          provider: "google_play_games",
          playerId: "player-123",
          version: 1,
          accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
          scopes: ["games"],
          hasRefreshToken: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      }).accessToken,
    ).toBe("access-token");
    expect(() =>
      vault.open({
        record: {
          ...sealed,
          credentialId: "credential_1",
          environment: "debug",
          subject: "other",
          principalSubject: "other",
          provider: "google_play_games",
          playerId: "player-123",
          version: 1,
          accessTokenExpiresAt: "2030-01-01T00:00:00.000Z",
          scopes: ["games"],
          hasRefreshToken: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    ).toThrow("could not be opened");
  });

  it("links a verified player and dispatches only comparable server results", async () => {
    const { dependencies, provider } = setup();
    const identity = await linkPgsIdentity(dependencies, "debug", session("player"), "auth-code");
    expect(identity.status).toBe("active");
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      await enqueuePgsResult(transaction, dependencies, result());
    });
    const summary = await dispatchPgsOutbox(
      dependencies,
      "debug",
      session("worker", "service"),
      20,
    );
    expect(summary.succeeded).toBe(2);
    expect(provider.unlockCalls).toBe(1);
    expect(provider.leaderboardCalls).toBe(1);
  });

  it("keeps missing provider configuration disabled", async () => {
    const dependencies: MergeRelayServiceDependencies = {
      store: new InMemoryMergeRelayStore(),
      clock: new FixedClock(),
      rewardProvider: null,
      pgsRuntime: null,
    };
    await expect(
      linkPgsIdentity(dependencies, "debug", session("player"), "auth-code"),
    ).rejects.toMatchObject({
      code: "pgs_unconfigured",
    });
  });

  it("disables leaderboard delivery when the score cannot be represented safely", async () => {
    const { dependencies } = setup();
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      await enqueuePgsResult(transaction, dependencies, {
        ...result(),
        scoreDelta: Number.MAX_SAFE_INTEGER,
      });
    });
    const outbox = await dependencies.store.readArtifacts(
      "debug",
      { recordType: "pgs_outbox", limit: 20 },
      parsePgsOutboxArtifact,
    );
    const leaderboard = outbox.items.find((item) => item.kind === "leaderboard");
    expect(leaderboard?.status).toBe("disabled");
    expect(leaderboard?.disabledReason).toBe("not_comparable");
  });

  it("reclaims an expired worker lease", async () => {
    const { dependencies, provider } = setup();
    await linkPgsIdentity(dependencies, "debug", session("player"), "auth-code");
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      await enqueuePgsResult(transaction, dependencies, result());
      const page = await transaction.list(
        { recordType: "pgs_outbox", limit: 20 },
        parsePgsOutboxArtifact,
      );
      const first = page.items[0];
      if (!first) throw new Error("PGS outbox fixture missing");
      await transaction.put(
        "pgs_outbox",
        first.outboxId,
        {
          ...first,
          status: "leased",
          leaseId: "lease_old",
          leaseExpiresAt: "2025-12-31T23:59:00.000Z",
        },
        {
          ownerSubject: first.subject,
          resultId: first.resultId,
          idempotencyKey: first.idempotencyKey,
          parentRecordType: "result",
          parentRecordId: first.resultId,
        },
      );
    });
    const summary = await dispatchPgsOutbox(
      dependencies,
      "debug",
      session("worker", "service"),
      20,
    );
    expect(summary.succeeded).toBe(2);
    expect(provider.unlockCalls).toBe(1);
  });

  it("binds one provider profile to one game subject", async () => {
    const { dependencies, provider } = setup();
    await linkPgsIdentity(dependencies, "debug", session("player"), "auth-code");
    await expect(
      linkPgsIdentity(dependencies, "debug", session("other"), "auth-code"),
    ).rejects.toMatchObject({ code: "pgs_identity_already_linked" });
    provider.playerId = "player-456";
    await expect(
      linkPgsIdentity(dependencies, "debug", session("player"), "auth-code"),
    ).rejects.toMatchObject({ code: "pgs_identity_conflict" });
  });
});
