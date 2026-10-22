import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertArtifactImmutable } from "./artifact-immutability";
import type { MergeChallenge, MergeResult } from "./contracts";
import { DrizzleMergeRelayStore } from "./drizzle-store";
import { challengePayloadHash, checkpointHash } from "./engine";
import { InMemoryMergeRelayStore } from "./memory-store";
import { emptyMergeRelayState, type MergeRelayStore } from "./store";

const databaseUrl = process.env.MERGE_RELAY_TEST_DATABASE_URL;

const stores: Array<[string, (() => MergeRelayStore) | null]> = [
  ["in-memory store", () => new InMemoryMergeRelayStore()],
  ["PostgreSQL store", databaseUrl ? () => new DrizzleMergeRelayStore() : null],
];

function challengeOf(id: string): MergeChallenge {
  const checkpoint = {
    board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    score: 0,
    moveCount: 0,
    seed: 7,
    rngState: 123,
    ruleVersion: "MR-2D-1" as const,
    maxLegalMoves: 3,
  };
  return {
    challengeId: id,
    environment: "staging",
    ownerSubject: "owner",
    creatorAlias: "Owner",
    mode: "rescue",
    originMode: "rescue",
    configRevision: 1,
    checkpoint,
    checkpointHash: checkpointHash(checkpoint),
    payloadHash: challengePayloadHash({
      checkpoint,
      configRevision: 1,
      mode: "rescue",
      originMode: "rescue",
    }),
    parentChallengeId: null,
    idempotencyKey: `${id}-key`,
    status: "open",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function resultOf(id: string): MergeResult {
  return {
    resultId: id,
    attemptId: `${id}-attempt`,
    challengeId: `${id}-challenge`,
    environment: "staging",
    recipientSubject: "recipient",
    scoreDelta: 4,
    finalScore: 4,
    maxTile: 4,
    movesUsed: 1,
    outcome: "early_finish",
    mode: "rescue",
    originMode: "rescue",
    configRevision: 1,
    returnChallengeId: null,
    idempotencyKey: `${id}-key`,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

for (const [name, create] of stores) {
  describe.skipIf(!create)(`Merge Relay record immutability on ${name}`, () => {
    const suffix = Date.now().toString(36);
    const challengeIds = [`imm_challenge_${suffix}`, `imm_retire_${suffix}`];

    beforeAll(async () => {
      const store = create?.();
      const config = emptyMergeRelayState().configs[0];
      if (!store || !config) return;
      await store.transactArtifacts("staging", async (transaction) => {
        const existing = await transaction.read(
          { recordType: "config", recordId: "1" },
          (payload) => payload,
        );
        if (!existing) await transaction.put("config", "1", config);
      });
    });

    afterAll(async () => {
      const store = create?.();
      if (!store) return;
      await store.transactArtifacts("staging", async (transaction) => {
        for (const id of challengeIds) await transaction.remove("challenge", id);
      });
    });

    it("rejects rewriting a challenge under a rolled-back config revision", async () => {
      const store = create?.();
      if (!store) return;
      const challenge = challengeOf(`imm_challenge_${suffix}`);
      await store.transactArtifacts("staging", (transaction) =>
        transaction.put("challenge", challenge.challengeId, challenge, {
          ownerSubject: challenge.ownerSubject,
          idempotencyKey: challenge.idempotencyKey,
        }),
      );
      const rewritten = { ...challenge, configRevision: 2 };
      await expect(
        store.transactArtifacts("staging", (transaction) =>
          transaction.put("challenge", challenge.challengeId, rewritten, {
            ownerSubject: challenge.ownerSubject,
            idempotencyKey: challenge.idempotencyKey,
          }),
        ),
      ).rejects.toThrow(/immutable/);
      const stored = await store.readArtifacts(
        "staging",
        { recordType: "challenge", recordId: challenge.challengeId, limit: 1 },
        (payload) => payload as MergeChallenge,
      );
      expect(stored.items[0]?.configRevision).toBe(1);
    });

    it("allows retiring a challenge but never reopening it", async () => {
      const store = create?.();
      if (!store) return;
      const challenge = challengeOf(`imm_retire_${suffix}`);
      const metadata = {
        ownerSubject: challenge.ownerSubject,
        idempotencyKey: challenge.idempotencyKey,
      };
      await store.transactArtifacts("staging", (transaction) =>
        transaction.put("challenge", challenge.challengeId, challenge, metadata),
      );
      await store.transactArtifacts("staging", (transaction) =>
        transaction.put(
          "challenge",
          challenge.challengeId,
          { ...challenge, status: "retired" },
          metadata,
        ),
      );
      await expect(
        store.transactArtifacts("staging", (transaction) =>
          transaction.put("challenge", challenge.challengeId, challenge, metadata),
        ),
      ).rejects.toThrow(/reopened/);
    });
  });
}

describe("Merge Relay result immutability rule", () => {
  it("freezes every result field including config revision", () => {
    const result = resultOf("rule_result");
    expect(() =>
      assertArtifactImmutable("result", result.resultId, result, { ...result }),
    ).not.toThrow();
    expect(() =>
      assertArtifactImmutable("result", result.resultId, result, { ...result, configRevision: 2 }),
    ).toThrow(/immutable/);
    expect(() =>
      assertArtifactImmutable("result", result.resultId, undefined, result),
    ).not.toThrow();
  });
});

describe("Merge Relay whole-state immutability", () => {
  it("rejects legacy state transactions that rewrite a stored challenge", async () => {
    const store = new InMemoryMergeRelayStore();
    const challenge = challengeOf("legacy_challenge");
    await store.transact("staging", async (state) => {
      state.challenges.push(challenge);
    });
    await expect(
      store.transact("staging", async (state) => {
        const stored = state.challenges[0];
        if (stored) stored.configRevision = 9;
      }),
    ).rejects.toThrow(/immutable/);
  });
});
