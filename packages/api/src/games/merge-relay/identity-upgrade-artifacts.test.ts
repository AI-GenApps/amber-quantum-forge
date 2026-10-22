import { describe, expect, it } from "vitest";
import {
  parseAttemptArtifact,
  parseChallengeArtifact,
  parseResultArtifact,
} from "./artifact-parsers";
import type { MergeEnvironment } from "./contracts";
import { createGuest, upgradeGuest } from "./identity-service";
import { createChallenge, finalizeAttempt, reserveAttempt } from "./relay-service";
import { rankedDependencies, testCheckpoint, testSession, testStores } from "./relay-test-support";

const environment: MergeEnvironment = "staging";
const session = (subject: string) => testSession(subject, environment);
const checkpoint = testCheckpoint;

for (const [name, factory] of testStores) {
  describe.skipIf(!factory)(`Merge Relay guest upgrade artifacts on ${name}`, () => {
    it("rebinds challenges, attempts, results and return challenges without unfreezing them", async () => {
      if (!factory) return;
      const store = factory();
      const deps = await rankedDependencies(store, environment);
      const suffix = Date.now().toString(36);
      const owner = await createGuest(deps, environment);
      const player = await createGuest(deps, environment);
      const challenge = await createChallenge(deps, environment, session(owner.subject), {
        idempotencyKey: `up-challenge-${suffix}`,
        creatorAlias: "Owner",
        checkpoint,
      });
      const challengeId = challenge.challenge.challengeId;
      const reserved = await reserveAttempt(
        deps,
        environment,
        session(player.subject),
        challengeId,
        {
          reservationKey: `up-reserve-${suffix}`,
        },
      );
      const finalized = await finalizeAttempt(
        deps,
        environment,
        session(player.subject),
        reserved.attempt.attemptId,
        { idempotencyKey: `up-finish-${suffix}`, finishEarly: true, returnAlias: `Back${suffix}` },
      );
      const returnId = finalized.returnChallenge?.challengeId;
      expect(returnId).toBeDefined();

      await upgradeGuest(deps, environment, session(`acct_owner_${suffix}`), {
        recoveryToken: owner.recoveryToken,
      });
      await upgradeGuest(deps, environment, session(`acct_player_${suffix}`), {
        recoveryToken: player.recoveryToken,
      });

      const read = <T>(
        type: "challenge" | "attempt" | "result",
        recordId: string,
        parse: (payload: unknown) => T,
      ) => store.readArtifacts(environment, { recordType: type, recordId, limit: 1 }, parse);
      const owned = await read("challenge", challengeId, parseChallengeArtifact);
      expect(owned.items[0]).toMatchObject({
        ownerSubject: `acct_owner_${suffix}`,
        checkpointHash: challenge.challenge.checkpointHash,
      });
      const back = await read("challenge", returnId ?? "", parseChallengeArtifact);
      expect(back.items[0]?.ownerSubject).toBe(`acct_player_${suffix}`);
      const attempt = await read("attempt", reserved.attempt.attemptId, parseAttemptArtifact);
      expect(attempt.items[0]?.recipientSubject).toBe(`acct_player_${suffix}`);
      const result = await read("result", finalized.result.resultId, parseResultArtifact);
      expect(result.items[0]).toMatchObject({
        recipientSubject: `acct_player_${suffix}`,
        finalScore: finalized.result.finalScore,
      });

      await expect(
        store.transactArtifacts(environment, (transaction) =>
          transaction.put(
            "result",
            finalized.result.resultId,
            { ...finalized.result, recipientSubject: "x", finalScore: 9999 },
            { rebindIdentity: true },
          ),
        ),
      ).rejects.toThrow(/immutable/);
      await expect(
        store.transactArtifacts(environment, (transaction) =>
          transaction.put(
            "challenge",
            challengeId,
            { ...challenge.challenge, ownerSubject: "x", creatorAlias: "Hijack" },
            { rebindIdentity: true },
          ),
        ),
      ).rejects.toThrow(/immutable/);
    });
  });
}
