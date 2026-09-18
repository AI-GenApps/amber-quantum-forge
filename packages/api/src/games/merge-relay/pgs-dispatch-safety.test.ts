import { describe, expect, it } from "vitest";
import type { MergeResult, MergeSession } from "./contracts";
import type { MergeRelayClock, MergeRelayServiceDependencies } from "./dependencies";
import { InMemoryMergeRelayStore } from "./memory-store";
import type {
  MergePgsAccessToken,
  MergePgsOAuthCredential,
  MergePgsOutbox,
  MergePgsProvider,
  MergePgsProviderDelivery,
  MergePgsRuntime,
} from "./pgs-contracts";
import { markReauthorization } from "./pgs-dispatch-storage";
import { putPgsOutbox } from "./pgs-outbox";
import {
  parsePgsCredentialArtifact,
  parsePgsIdentityArtifact,
  parsePgsOutboxArtifact,
} from "./pgs-parsers";
import { linkPgsIdentity } from "./pgs-service";
import { createPgsCredentialVault } from "./pgs-vault";

class FixedClock implements MergeRelayClock {
  now(): Date {
    return new Date("2026-01-01T00:00:00.000Z");
  }
}

class Provider implements MergePgsProvider {
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
    return { status: "succeeded", errorCode: null };
  }

  async submitLeaderboard(): Promise<MergePgsProviderDelivery> {
    return { status: "succeeded", errorCode: null };
  }
}

function session(subject: string, role: MergeSession["role"] = "player"): MergeSession {
  return { appId: "merge_relay", environment: "debug", subject, role };
}

function result(): MergeResult {
  return {
    resultId: "result_safety",
    attemptId: "attempt_safety",
    challengeId: "challenge_safety",
    environment: "debug",
    recipientSubject: "player",
    scoreDelta: 1,
    finalScore: 1,
    maxTile: 2,
    movesUsed: 1,
    outcome: "complete",
    mode: "rescue",
    originMode: "rescue",
    configRevision: 1,
    challengePayloadHash: "cohort-1",
    returnChallengeId: null,
    idempotencyKey: "finish_safety",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("Merge Relay PGS lease safety", () => {
  it("does not downgrade a relinked identity from a stale lease", async () => {
    const provider = new Provider();
    let sequence = 0;
    const dependencies: MergeRelayServiceDependencies = {
      store: new InMemoryMergeRelayStore(),
      clock: new FixedClock(),
      rewardProvider: null,
      pgsRuntime: {
        config: {
          applicationId: "com.example.merge",
          webClientId: "web-client",
          webClientSecret: "secret",
          achievementTargets: { relay_result: "achievement-1" },
          leaderboardTarget: null,
        },
        provider,
        vault: createPgsCredentialVault(Buffer.alloc(32, 7)),
      } satisfies MergePgsRuntime,
      idFactory: (prefix) => `${prefix}_${++sequence}`,
    };
    const identity = await linkPgsIdentity(dependencies, "debug", session("player"), "auth-code");
    const credential = (
      await dependencies.store.readArtifacts(
        "debug",
        { recordType: "pgs_credential", recordId: identity.credentialId, limit: 1 },
        parsePgsCredentialArtifact,
      )
    ).items[0];
    if (!credential) throw new Error("credential fixture missing");
    let leased: MergePgsOutbox | undefined;
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      await putPgsOutbox(transaction, result(), {
        kind: "achievement",
        targetKey: "relay_result",
        targetId: "achievement-1",
        cohortHash: null,
        scoreDelta: null,
        maxTile: null,
        providerScore: null,
        status: "pending",
        disabledReason: null,
        identity,
        credential,
        now: "2026-01-01T00:00:00.000Z",
      });
      const outbox = (
        await transaction.list({ recordType: "pgs_outbox", limit: 1 }, parsePgsOutboxArtifact)
      ).items[0];
      if (!outbox) throw new Error("outbox fixture missing");
      leased = { ...outbox, status: "leased", leaseId: "lease_1" };
      await transaction.put("pgs_outbox", outbox.outboxId, leased, {
        ownerSubject: outbox.subject,
        resultId: outbox.resultId,
        idempotencyKey: outbox.idempotencyKey,
        parentRecordType: "result",
        parentRecordId: outbox.resultId,
      });
    });
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      await transaction.put(
        "pgs_identity",
        identity.identityId,
        { ...identity, updatedAt: "2026-01-01T00:00:01.000Z" },
        { ownerSubject: identity.subject, lookupKey: identity.playerId },
      );
    });
    if (!leased) throw new Error("lease fixture missing");
    await markReauthorization(dependencies, "debug", leased, identity);
    const currentIdentity = (
      await dependencies.store.readArtifacts(
        "debug",
        { recordType: "pgs_identity", recordId: identity.identityId, limit: 1 },
        parsePgsIdentityArtifact,
      )
    ).items[0];
    expect(currentIdentity?.status).toBe("active");
  });
});
