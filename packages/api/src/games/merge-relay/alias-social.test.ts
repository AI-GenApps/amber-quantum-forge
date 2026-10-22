import { describe, expect, it } from "vitest";
import { parseAliasArtifact } from "./artifact-parsers";
import { parseSocial } from "./data-validation";
import { createChallenge, finalizeAttempt, reserveAttempt } from "./relay-service";
import { rankedDependencies, testCheckpoint, testSession, testStores } from "./relay-test-support";
import { recordSocial } from "./social-service";

for (const [name, factory] of testStores) {
  describe.skipIf(!factory)(`Merge Relay return aliases on ${name}`, () => {
    it("registers the return alias and reports duplicate aliases by challenge reference", async () => {
      if (!factory) return;
      const store = factory();
      const deps = await rankedDependencies(store);
      const suffix = Date.now().toString(36);
      const shared = `Dup${suffix}`.slice(0, 20);
      const owner = testSession(`owner_${suffix}`);
      const player = testSession(`player_${suffix}`);
      const squatter = testSession(`squatter_${suffix}`);
      const challenge = await createChallenge(deps, "staging", owner, {
        idempotencyKey: `alias-create-${suffix}`,
        creatorAlias: "Owner",
        checkpoint: testCheckpoint,
      });
      const reserved = await reserveAttempt(
        deps,
        "staging",
        player,
        challenge.challenge.challengeId,
        { reservationKey: `alias-reserve-${suffix}` },
      );
      const finalized = await finalizeAttempt(deps, "staging", player, reserved.attempt.attemptId, {
        idempotencyKey: `alias-finish-${suffix}`,
        finishEarly: true,
        returnAlias: shared,
      });
      const returnChallenge = finalized.returnChallenge;
      expect(returnChallenge?.creatorAlias).toBe(shared);
      const aliases = await store.readArtifacts(
        "staging",
        { recordType: "alias", alias: shared, limit: 5 },
        parseAliasArtifact,
      );
      expect(aliases.items.map((item) => item.subject)).toEqual([player.subject]);

      await createChallenge(deps, "staging", squatter, {
        idempotencyKey: `alias-squat-${suffix}`,
        creatorAlias: shared,
        checkpoint: testCheckpoint,
      });
      await expect(
        recordSocial(deps, "staging", owner, "block", { targetAlias: shared, reason: "alias" }),
      ).rejects.toMatchObject({ code: "ambiguous_target_alias" });
      const blocked = await recordSocial(deps, "staging", owner, "report", {
        targetChallengeId: returnChallenge?.challengeId,
        targetAlias: shared,
        reason: "alias",
      });
      expect(blocked.targetSubject).toBe(player.subject);
    });

    it("parses a challenge-referenced social request", () => {
      expect(parseSocial({ target_challenge_id: "ch_1", reason: "spam" })).toMatchObject({
        targetChallengeId: "ch_1",
      });
      expect(parseSocial({ target_challenge_id: "bad id", reason: "spam" })).toBeNull();
    });
  });
}
