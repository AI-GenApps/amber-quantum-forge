import { describe, expect, it } from "vitest";
import type { MergeResult, MergeSession } from "./contracts";
import type { MergeRelayClock, MergeRelayServiceDependencies } from "./dependencies";
import { InMemoryMergeRelayStore } from "./memory-store";
import type {
  MergePgsAccessToken,
  MergePgsCredential,
  MergePgsIdentity,
  MergePgsOAuthCredential,
  MergePgsProvider,
  MergePgsProviderDelivery,
  MergePgsRuntime,
} from "./pgs-contracts";
import { MERGE_PGS_MAX_ATTEMPTS } from "./pgs-contracts";
import { dispatchPgsOutbox } from "./pgs-dispatch";
import { listPgsOutbox } from "./pgs-dispatch-test-support";
import { putPgsOutbox, reactivatePgsOutbox } from "./pgs-outbox";
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
  unlockCalls = 0;
  retry = false;

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
      scopes: ["games"],
    };
  }

  async unlockAchievement(): Promise<MergePgsProviderDelivery> {
    this.unlockCalls += 1;
    return this.retry
      ? { status: "retryable", errorCode: "provider_timeout" }
      : { status: "succeeded", errorCode: null };
  }

  async submitLeaderboard(): Promise<MergePgsProviderDelivery> {
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
    originMode: "rescue",
    configRevision: 1,
    challengePayloadHash: "cohort-1",
    returnChallengeId: null,
    idempotencyKey: `finish_${resultId}`,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function setup(): {
  dependencies: MergeRelayServiceDependencies;
  provider: Provider;
} {
  const provider = new Provider();
  let sequence = 0;
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
  return {
    provider,
    dependencies: {
      store: new InMemoryMergeRelayStore(),
      clock: new FixedClock(),
      rewardProvider: null,
      pgsRuntime: runtime,
      idFactory: (prefix) => `${prefix}_test_${++sequence}`,
    },
  };
}

async function linkedArtifacts(
  dependencies: MergeRelayServiceDependencies,
): Promise<{ identity: MergePgsIdentity; credential: MergePgsCredential }> {
  await linkPgsIdentity(dependencies, "debug", session("player"), "auth-code");
  const identity = (
    await dependencies.store.readArtifacts(
      "debug",
      { recordType: "pgs_identity", ownerSubject: "player", limit: 10 },
      parsePgsIdentityArtifact,
    )
  ).items[0];
  if (!identity) throw new Error("identity fixture missing");
  const credential = (
    await dependencies.store.readArtifacts(
      "debug",
      { recordType: "pgs_credential", ownerSubject: "player", limit: 10 },
      parsePgsCredentialArtifact,
    )
  ).items[0];
  if (!credential) throw new Error("credential fixture missing");
  return { identity, credential };
}

describe("Merge Relay PGS dispatch regressions", () => {
  it("does not starve pending records behind more than one page of terminal rows", async () => {
    const { dependencies, provider } = setup();
    const { identity, credential } = await linkedArtifacts(dependencies);
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      for (let index = 0; index < 102; index += 1)
        await putPgsOutbox(transaction, result(`bulk_${index}`), {
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
      const records = await listPgsOutbox(transaction);
      const pending = records.at(-1);
      if (!pending) throw new Error("outbox fixture missing");
      for (const item of records.slice(0, -1))
        await transaction.put(
          "pgs_outbox",
          item.outboxId,
          { ...item, status: "succeeded" },
          {
            ownerSubject: item.subject,
            resultId: item.resultId,
            idempotencyKey: item.idempotencyKey,
            parentRecordType: "result",
            parentRecordId: item.resultId,
          },
        );
    });
    const summary = await dispatchPgsOutbox(dependencies, "debug", session("worker", "service"), 1);
    expect(summary.succeeded).toBe(1);
    expect(provider.unlockCalls).toBe(1);
  });

  it("does not reactivate targetless disabled records", async () => {
    const { dependencies } = setup();
    const { identity, credential } = await linkedArtifacts(dependencies);
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      await putPgsOutbox(transaction, result("targetless"), {
        kind: "achievement",
        targetKey: "relay_missing",
        targetId: null,
        cohortHash: null,
        scoreDelta: null,
        maxTile: null,
        providerScore: null,
        status: "disabled",
        disabledReason: "target_unconfigured",
        identity: null,
        credential: null,
        now: "2026-01-01T00:00:00.000Z",
      });
      await reactivatePgsOutbox(
        transaction,
        "player",
        identity,
        credential,
        "2026-01-01T00:00:00.000Z",
      );
    });
    const records = await dependencies.store.readArtifacts(
      "debug",
      { recordType: "pgs_outbox", ownerSubject: "player", limit: 10 },
      parsePgsOutboxArtifact,
    );
    expect(records.items[0]?.status).toBe("disabled");
    expect(records.items[0]?.disabledReason).toBe("target_unconfigured");
  });

  it("serializes concurrent workers and dead-letters exhausted retries", async () => {
    const { dependencies, provider } = setup();
    const { identity, credential } = await linkedArtifacts(dependencies);
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      await putPgsOutbox(transaction, result("concurrent"), {
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
    });
    const summaries = await Promise.all([
      dispatchPgsOutbox(dependencies, "debug", session("worker-1", "service"), 1),
      dispatchPgsOutbox(dependencies, "debug", session("worker-2", "service"), 1),
    ]);
    expect(summaries.map((item) => item.succeeded).reduce((sum, value) => sum + value, 0)).toBe(1);
    expect(provider.unlockCalls).toBe(1);

    provider.retry = true;
    await dependencies.store.transactArtifacts("debug", async (transaction) => {
      await putPgsOutbox(transaction, result("exhausted"), {
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
      const item = (await listPgsOutbox(transaction)).find(
        (value) => value.resultId === "exhausted",
      );
      if (!item) throw new Error("retry fixture missing");
      await transaction.put(
        "pgs_outbox",
        item.outboxId,
        { ...item, attemptCount: MERGE_PGS_MAX_ATTEMPTS - 1 },
        {
          ownerSubject: item.subject,
          resultId: item.resultId,
          idempotencyKey: item.idempotencyKey,
          parentRecordType: "result",
          parentRecordId: item.resultId,
        },
      );
    });
    const exhausted = await dispatchPgsOutbox(
      dependencies,
      "debug",
      session("worker", "service"),
      1,
    );
    expect(exhausted.failed).toBe(1);
    const retryRecord = (
      await dependencies.store.readArtifacts(
        "debug",
        { recordType: "pgs_outbox", limit: 10 },
        parsePgsOutboxArtifact,
      )
    ).items.find((item) => item.resultId === "exhausted");
    expect(retryRecord?.status).toBe("permanent_failure");
    expect(retryRecord?.lastErrorCode).toBe("retry_exhausted");
  });
});
