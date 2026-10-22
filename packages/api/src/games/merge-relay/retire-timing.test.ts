import { describe, expect, it } from "vitest";
import {
  parseAttemptArtifact,
  parseChallengeArtifact,
  parseEventArtifact,
} from "./artifact-parsers";
import type { MergeEnvironment } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { getAttempt, getResult, resolveChallenge, retireChallenge } from "./relay-queries";
import { createChallenge, finalizeAttempt, reserveAttempt, submitMoves } from "./relay-service";
import { rankedDependencies, testCheckpoint, testSession, testStores } from "./relay-test-support";

const environment: MergeEnvironment = "staging";
const admin = testSession("admin", environment, "game_admin");
const T0 = "2026-01-01T00:00:00.000Z";
const T25H = "2026-01-02T01:00:00.000Z";

function at(
  dependencies: MergeRelayServiceDependencies,
  iso: string,
): MergeRelayServiceDependencies {
  return { ...dependencies, clock: { now: () => new Date(iso) } };
}

async function setup(factory: () => import("./store").MergeRelayStore) {
  const deps = await rankedDependencies(factory(), environment);
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const owner = testSession(`owner_${suffix}`, environment);
  const player = testSession(`player_${suffix}`, environment);
  const created = await createChallenge(deps, environment, owner, {
    idempotencyKey: `rt-create-${suffix}`,
    creatorAlias: "Timing",
    checkpoint: testCheckpoint,
  });
  return { deps, suffix, owner, player, challengeId: created.challenge.challengeId };
}

async function eventCount(
  deps: MergeRelayServiceDependencies,
  idempotencyKey: string,
): Promise<number> {
  const page = await deps.store.readArtifacts(
    environment,
    { recordType: "event", idempotencyKey, limit: 10 },
    parseEventArtifact,
  );
  return page.items.length;
}

async function storedChallenge(deps: MergeRelayServiceDependencies, challengeId: string) {
  const page = await deps.store.readArtifacts(
    environment,
    { recordType: "challenge", recordId: challengeId, limit: 1 },
    parseChallengeArtifact,
  );
  return page.items[0];
}

async function resultsFor(deps: MergeRelayServiceDependencies, challengeId: string) {
  const page = await deps.store.readArtifacts(
    environment,
    { recordType: "result", challengeId, limit: 100 },
    (payload) => payload,
  );
  return page.items;
}

for (const [name, factory] of testStores) {
  describe.skipIf(!factory)(`Merge Relay retirement timing on ${name}`, () => {
    it("retire before reserve blocks reservation and is idempotent", async () => {
      if (!factory) return;
      const { deps, suffix, player, challengeId } = await setup(factory);
      const first = await retireChallenge(deps, environment, admin, challengeId);
      expect(first.status).toBe("retired");
      const second = await retireChallenge(deps, environment, admin, challengeId);
      expect(second).toEqual(first);
      expect(await eventCount(deps, `retire:${challengeId}`)).toBe(1);
      await expect(
        reserveAttempt(deps, environment, player, challengeId, { reservationKey: `k-${suffix}` }),
      ).rejects.toMatchObject({ status: 409, code: "challenge_retired" });
      expect((await resolveChallenge(deps, environment, challengeId)).status).toBe("retired");
    });

    it("retire after reserve cancels the attempt and never reopens", async () => {
      if (!factory) return;
      const { deps, suffix, player, challengeId } = await setup(factory);
      const reserved = await reserveAttempt(deps, environment, player, challengeId, {
        reservationKey: `k-${suffix}`,
      });
      const attemptId = reserved.attempt.attemptId;
      await retireChallenge(deps, environment, admin, challengeId);
      expect((await getAttempt(deps, environment, player, attemptId)).status).toBe("cancelled");
      expect(await eventCount(deps, `cancel:${attemptId}`)).toBe(1);
      await expect(
        submitMoves(deps, environment, player, attemptId, { expectedVersion: 0, moves: ["left"] }),
      ).rejects.toMatchObject({ status: 409, code: "attempt_not_playable" });
      await expect(
        finalizeAttempt(deps, environment, player, attemptId, {
          idempotencyKey: `f-${suffix}`,
          finishEarly: true,
        }),
      ).rejects.toMatchObject({ status: 409, code: "attempt_not_playable" });
      await expect(
        reserveAttempt(deps, environment, player, challengeId, { reservationKey: `k-${suffix}` }),
      ).rejects.toMatchObject({ code: "challenge_retired" });
      await retireChallenge(deps, environment, admin, challengeId);
      expect(await eventCount(deps, `cancel:${attemptId}`)).toBe(1);
      expect((await getAttempt(deps, environment, player, attemptId)).status).toBe("cancelled");
      expect(await resultsFor(deps, challengeId)).toEqual([]);
    });

    it("retire mid-attempt freezes moves and blocks any result", async () => {
      if (!factory) return;
      const { deps, suffix, player, challengeId } = await setup(factory);
      const reserved = await reserveAttempt(deps, environment, player, challengeId, {
        reservationKey: `k-${suffix}`,
      });
      const attemptId = reserved.attempt.attemptId;
      const moved = await submitMoves(deps, environment, player, attemptId, {
        expectedVersion: 0,
        moves: ["left"],
      });
      await retireChallenge(deps, environment, admin, challengeId);
      const after = await getAttempt(deps, environment, player, attemptId);
      expect(after.status).toBe("cancelled");
      expect(after.moves).toEqual(moved.moves);
      expect(after.version).toBe(moved.version);
      await expect(
        submitMoves(deps, environment, player, attemptId, {
          expectedVersion: moved.version,
          moves: ["up"],
        }),
      ).rejects.toMatchObject({ code: "attempt_not_playable" });
      await expect(
        finalizeAttempt(deps, environment, player, attemptId, {
          idempotencyKey: `f-${suffix}`,
          finishEarly: true,
        }),
      ).rejects.toMatchObject({ code: "attempt_not_playable" });
      expect(await resultsFor(deps, challengeId)).toEqual([]);
      expect((await getAttempt(deps, environment, player, attemptId)).moves).toEqual(moved.moves);
    });

    it("retire after finalize keeps the result and replays it unchanged", async () => {
      if (!factory) return;
      const { deps, suffix, player, challengeId } = await setup(factory);
      const reserved = await reserveAttempt(deps, environment, player, challengeId, {
        reservationKey: `k-${suffix}`,
      });
      const attemptId = reserved.attempt.attemptId;
      await submitMoves(deps, environment, player, attemptId, {
        expectedVersion: 0,
        moves: ["left"],
      });
      const request = { idempotencyKey: `f-${suffix}`, finishEarly: true };
      const finalized = await finalizeAttempt(deps, environment, player, attemptId, request);
      const before = await getResult(deps, environment, player, finalized.result.resultId);
      await retireChallenge(deps, environment, admin, challengeId);
      await retireChallenge(deps, environment, admin, challengeId);
      const after = await getResult(deps, environment, player, finalized.result.resultId);
      expect(after).toEqual(before);
      expect((await getAttempt(deps, environment, player, attemptId)).status).toBe("completed");
      expect(await eventCount(deps, `cancel:${attemptId}`)).toBe(0);
      const replay = await finalizeAttempt(deps, environment, player, attemptId, request);
      expect(replay.idempotent).toBe(true);
      expect(replay.result).toEqual(before);
      await expect(
        finalizeAttempt(deps, environment, player, attemptId, {
          idempotencyKey: `other-${suffix}`,
          finishEarly: true,
        }),
      ).rejects.toMatchObject({ status: 409, code: "idempotency_conflict" });
      await expect(
        submitMoves(deps, environment, player, attemptId, { expectedVersion: 1, moves: ["up"] }),
      ).rejects.toMatchObject({ code: "attempt_not_playable" });
      expect(await resultsFor(deps, challengeId)).toHaveLength(1);
    });

    it("cancels a reservation that expired without being touched", async () => {
      if (!factory) return;
      const { deps, suffix, player, challengeId } = await setup(factory);
      const reserved = await reserveAttempt(at(deps, T0), environment, player, challengeId, {
        reservationKey: `k-${suffix}`,
      });
      const attemptId = reserved.attempt.attemptId;
      await retireChallenge(at(deps, T25H), environment, admin, challengeId);
      expect((await getAttempt(deps, environment, player, attemptId)).status).toBe("cancelled");
      await expect(
        submitMoves(at(deps, T25H), environment, player, attemptId, {
          expectedVersion: 0,
          moves: ["left"],
        }),
      ).rejects.toMatchObject({ status: 409, code: "attempt_not_playable" });
      expect(await resultsFor(deps, challengeId)).toEqual([]);
    });

    it("keeps an already abandoned attempt abandoned through retirement", async () => {
      if (!factory) return;
      const { deps, suffix, player, challengeId } = await setup(factory);
      const reserved = await reserveAttempt(at(deps, T0), environment, player, challengeId, {
        reservationKey: `k-${suffix}`,
      });
      const attemptId = reserved.attempt.attemptId;
      await expect(
        submitMoves(at(deps, T25H), environment, player, attemptId, {
          expectedVersion: 0,
          moves: ["left"],
        }),
      ).rejects.toMatchObject({ code: "reservation_expired" });
      await retireChallenge(at(deps, T25H), environment, admin, challengeId);
      expect((await getAttempt(deps, environment, player, attemptId)).status).toBe("abandoned");
      expect(await eventCount(deps, `cancel:${attemptId}`)).toBe(0);
      await expect(
        reserveAttempt(at(deps, T25H), environment, player, challengeId, {
          reservationKey: `k2-${suffix}`,
        }),
      ).rejects.toMatchObject({ code: "challenge_retired" });
    });

    it("retiring a parent does not cascade to its return challenge", async () => {
      if (!factory) return;
      const { deps, suffix, owner, player, challengeId } = await setup(factory);
      const reserved = await reserveAttempt(deps, environment, player, challengeId, {
        reservationKey: `k-${suffix}`,
      });
      const attemptId = reserved.attempt.attemptId;
      await submitMoves(deps, environment, player, attemptId, {
        expectedVersion: 0,
        moves: ["left"],
      });
      const finalized = await finalizeAttempt(deps, environment, player, attemptId, {
        idempotencyKey: `f-${suffix}`,
        finishEarly: true,
        returnAlias: "Back",
      });
      const returnId = finalized.returnChallenge?.challengeId;
      if (!returnId) throw new Error("return challenge missing");
      const pending = await reserveAttempt(deps, environment, owner, returnId, {
        reservationKey: `rk-${suffix}`,
      });
      await retireChallenge(deps, environment, admin, challengeId);
      expect((await storedChallenge(deps, returnId))?.status).toBe("open");
      expect((await getAttempt(deps, environment, owner, pending.attempt.attemptId)).status).toBe(
        "reserved",
      );
      expect(
        (await getResult(deps, environment, player, finalized.result.resultId)).returnChallengeId,
      ).toBe(returnId);
      await retireChallenge(deps, environment, admin, returnId);
      expect((await getAttempt(deps, environment, owner, pending.attempt.attemptId)).status).toBe(
        "cancelled",
      );
      await expect(
        reserveAttempt(deps, environment, owner, returnId, { reservationKey: `rk2-${suffix}` }),
      ).rejects.toMatchObject({ code: "challenge_retired" });
      expect((await storedChallenge(deps, challengeId))?.status).toBe("retired");
    });

    it("cancels every reserved attempt across recipients and keeps replay links readable", async () => {
      if (!factory) return;
      const { deps, suffix, player, challengeId } = await setup(factory);
      const second = testSession(`second_${suffix}`, environment);
      const a = await reserveAttempt(deps, environment, player, challengeId, {
        reservationKey: `a-${suffix}`,
      });
      const b = await reserveAttempt(deps, environment, second, challengeId, {
        reservationKey: `b-${suffix}`,
      });
      const before = await resolveChallenge(deps, environment, challengeId);
      await retireChallenge(deps, environment, admin, challengeId);
      expect((await getAttempt(deps, environment, player, a.attempt.attemptId)).status).toBe(
        "cancelled",
      );
      expect((await getAttempt(deps, environment, second, b.attempt.attemptId)).status).toBe(
        "cancelled",
      );
      const after = await resolveChallenge(deps, environment, challengeId);
      expect({ ...after, status: "open" }).toEqual(before);
      expect(after.status).toBe("retired");
      const attempts = await deps.store.readArtifacts(
        environment,
        { recordType: "attempt", challengeId, limit: 100 },
        parseAttemptArtifact,
      );
      expect(attempts.items.every((item) => item.status === "cancelled")).toBe(true);
    });

    it("rejects retirement by non-admins and for unknown challenges", async () => {
      if (!factory) return;
      const { deps, player, challengeId } = await setup(factory);
      await expect(retireChallenge(deps, environment, player, challengeId)).rejects.toMatchObject({
        status: 403,
        code: "game_admin_role_required",
      });
      await expect(
        retireChallenge(deps, environment, admin, "chal_does_not_exist"),
      ).rejects.toMatchObject({ status: 404, code: "challenge_not_found" });
      expect((await resolveChallenge(deps, environment, challengeId)).status).toBe("open");
    });
  });
}
