import { describe, expect, it } from "vitest";
import type { MergeCheckpoint, MergeSession } from "./contracts";
import { getSave, putSave } from "./data-service";
import type { MergeRelayClock, MergeRelayServiceDependencies } from "./dependencies";
import { createGuest, recoverGuest, upgradeGuest } from "./identity-service";
import { InMemoryMergeRelayStore } from "./memory-store";
import { createChallenge, finalizeAttempt, reserveAttempt, submitMoves } from "./relay-service";
import { emptyMergeRelayState } from "./store";

const checkpoint: MergeCheckpoint = {
  board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  score: 0,
  moveCount: 0,
  seed: 7,
  rngState: 123,
  ruleVersion: "MR-2D-1",
};

class FixedClock implements MergeRelayClock {
  constructor(private current = new Date("2026-01-01T00:00:00.000Z")) {}
  now(): Date {
    return new Date(this.current);
  }
  advance(hours: number): void {
    this.current = new Date(this.current.getTime() + hours * 60 * 60 * 1000);
  }
}

function session(subject: string, role: MergeSession["role"] = "player"): MergeSession {
  return { appId: "merge_relay", environment: "debug", subject, role };
}

function setup() {
  const clock = new FixedClock();
  const initial = emptyMergeRelayState();
  const config = initial.configs[0];
  if (!config) throw new Error("test config missing");
  config.features.rankedRelay = true;
  const store = new InMemoryMergeRelayStore({ debug: initial });
  const dependencies: MergeRelayServiceDependencies = {
    store,
    clock,
    rewardProvider: {
      verifySettlement: async (input) => ({
        verified: true,
        providerTransactionId: input.providerTransactionId,
        environment: "debug",
        subject: "player",
        resultId: input.resultId,
        productId: input.productId,
        kind: input.kind,
        refunded: false,
        cancelled: false,
      }),
    },
  };
  return { clock, store, dependencies };
}

describe("Merge Relay service", () => {
  it("creates an immutable challenge and idempotently returns it", async () => {
    const { dependencies } = setup();
    const owner = session("owner");
    const input = { idempotencyKey: "create-1", creatorAlias: "Ada", checkpoint };
    const first = await createChallenge(dependencies, "debug", owner, input);
    const second = await createChallenge(dependencies, "debug", owner, input);
    expect(second.idempotent).toBe(true);
    expect(second.challenge.challengeId).toBe(first.challenge.challengeId);
    const parent = await createChallenge(dependencies, "debug", owner, {
      ...input,
      idempotencyKey: "create-parent",
    });
    await expect(
      createChallenge(dependencies, "debug", owner, {
        ...input,
        parentChallengeId: parent.challenge.challengeId,
      }),
    ).rejects.toMatchObject({ code: "idempotency_conflict" });
    await expect(
      createChallenge(dependencies, "debug", owner, { ...input, creatorAlias: "Eve" }),
    ).rejects.toMatchObject({ code: "idempotency_conflict" });
  });

  it("reserves, validates three moves, finalizes once, and returns a relay", async () => {
    const { dependencies, store } = setup();
    const owner = session("owner");
    const player = session("player");
    const challenge = await createChallenge(dependencies, "debug", owner, {
      idempotencyKey: "create-2",
      creatorAlias: "Ada",
      checkpoint,
    });
    const reserved = await reserveAttempt(
      dependencies,
      "debug",
      player,
      challenge.challenge.challengeId,
      { reservationKey: "reserve-1" },
    );
    await expect(
      submitMoves(dependencies, "debug", player, reserved.attempt.attemptId, {
        expectedVersion: 0,
        moves: ["left", "up", "right", "down"],
      }),
    ).rejects.toMatchObject({ code: "move_budget_exceeded" });
    const moved = await submitMoves(dependencies, "debug", player, reserved.attempt.attemptId, {
      expectedVersion: 0,
      moves: ["left"],
    });
    const finalized = await finalizeAttempt(dependencies, "debug", player, moved.attemptId, {
      idempotencyKey: "finish-1",
      finishEarly: true,
      returnAlias: "Bea",
    });
    const repeated = await finalizeAttempt(dependencies, "debug", player, moved.attemptId, {
      idempotencyKey: "finish-1",
      finishEarly: true,
      returnAlias: "Bea",
    });
    expect(finalized.result.resultId).toBe(repeated.result.resultId);
    await expect(
      finalizeAttempt(dependencies, "debug", player, moved.attemptId, {
        idempotencyKey: "finish-1",
        finishEarly: true,
        returnAlias: "Different",
      }),
    ).rejects.toMatchObject({ code: "idempotency_conflict" });
    expect(finalized.returnChallenge?.parentChallengeId).toBe(challenge.challenge.challengeId);
    expect(store.snapshot("debug").events.map((event) => event.type)).toContain(
      "relay_return_created",
    );
  });

  it("persists reservation expiry before returning the conflict", async () => {
    const { dependencies, clock, store } = setup();
    const challenge = await createChallenge(dependencies, "debug", session("owner"), {
      idempotencyKey: "create-3",
      creatorAlias: "Ada",
      checkpoint,
    });
    const attempt = await reserveAttempt(
      dependencies,
      "debug",
      session("player"),
      challenge.challenge.challengeId,
      { reservationKey: "reserve-2" },
    );
    clock.advance(25);
    await expect(
      submitMoves(dependencies, "debug", session("player"), attempt.attempt.attemptId, {
        expectedVersion: 0,
        moves: ["left"],
      }),
    ).rejects.toMatchObject({ code: "reservation_expired" });
    expect(store.snapshot("debug").attempts[0]?.status).toBe("abandoned");
    expect(store.snapshot("debug").events.map((event) => event.type)).toContain(
      "relay_attempt_abandoned",
    );
  });

  it("supports guest recovery and explicit account upgrade", async () => {
    const { dependencies, store } = setup();
    const guest = await createGuest(dependencies, "debug");
    await putSave(dependencies, "debug", session(guest.subject), "main", {
      expectedVersion: 0,
      schemaVersion: 1,
      payload: { score: 4 },
    });
    const recovered = await recoverGuest(dependencies, "debug", {
      recoveryToken: guest.recoveryToken,
    });
    expect(recovered.subject).toBe(guest.subject);
    const upgraded = await upgradeGuest(dependencies, "debug", session("account"), {
      recoveryToken: guest.recoveryToken,
    });
    expect(upgraded.upgradedSubject).toBe("account");
    expect(store.snapshot("debug").guests[0]?.upgradedSubject).toBe("account");
    expect(await getSave(dependencies, "debug", session("account"), "main")).toMatchObject({
      subject: "account",
      payload: { score: 4 },
    });
    expect(await getSave(dependencies, "debug", session(guest.subject), "main")).toBeNull();
  });

  it("serializes concurrent save writes behind optimistic versions", async () => {
    const { dependencies } = setup();
    const player = session("player");
    const writes = await Promise.allSettled([
      putSave(dependencies, "debug", player, "main", {
        expectedVersion: 0,
        schemaVersion: 1,
        payload: { score: 1 },
      }),
      putSave(dependencies, "debug", player, "main", {
        expectedVersion: 0,
        schemaVersion: 1,
        payload: { score: 2 },
      }),
    ]);
    expect(writes.filter((write) => write.status === "fulfilled")).toHaveLength(1);
    expect(writes.filter((write) => write.status === "rejected")).toHaveLength(1);
  });
});
