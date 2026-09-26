import { describe, expect, it } from "vitest";
import type { LudoEnvironment } from "./contracts";
import { ScriptedDiceSource } from "./dice";
import { createMatchState, LUDO_RULESETS_BY_ID, type LudoMatchState } from "./engine";
import { LudoForbiddenSeatError, LudoTimeoutNotElapsedError } from "./errors";
import { InMemoryLudoStore } from "./memory-store";
import { createMatch, getMatchState, joinMatch, processCommand } from "./service";
import {
  applyTimeoutIfExpired,
  computeTurnDeadline,
  LUDO_FORFEIT_MISS_THRESHOLD,
  LUDO_TURN_TIMEOUT_MS,
} from "./timeout";

const ENVIRONMENT: LudoEnvironment = "debug";

function classicState(seats: number): LudoMatchState {
  const subjects = Array.from({ length: seats }, (_, i) => `subject-${i}`);
  return createMatchState({ ruleset: LUDO_RULESETS_BY_ID.classic, subjects });
}

const PAST = new Date("2026-01-01T00:00:00.000Z");
const PAST_DEADLINE = new Date(PAST.getTime() - 1_000).toISOString();
const FUTURE_DEADLINE = new Date(PAST.getTime() + 60_000).toISOString();

describe("computeTurnDeadline", () => {
  it("adds LUDO_TURN_TIMEOUT_MS to the given instant", () => {
    const now = "2026-01-01T00:00:00.000Z";
    expect(computeTurnDeadline(now)).toBe(
      new Date(Date.parse(now) + LUDO_TURN_TIMEOUT_MS).toISOString(),
    );
  });
});

describe("applyTimeoutIfExpired (pure)", () => {
  it("is a no-op when the deadline has not elapsed", () => {
    const state = classicState(2);
    const outcome = applyTimeoutIfExpired({
      matchState: state,
      missCounts: [0, 0],
      deadlineAt: FUTURE_DEADLINE,
      now: PAST,
    });
    expect(outcome.timedOut).toBe(false);
    expect(outcome.matchState).toBe(state);
    expect(outcome.events).toHaveLength(0);
  });

  it("is a no-op when there is no tracked deadline", () => {
    const state = classicState(2);
    const outcome = applyTimeoutIfExpired({
      matchState: state,
      missCounts: [0, 0],
      deadlineAt: null,
      now: PAST,
    });
    expect(outcome.timedOut).toBe(false);
  });

  it("is a no-op once the match has already finished", () => {
    const state = { ...classicState(2), phase: "finished" as const };
    const outcome = applyTimeoutIfExpired({
      matchState: state,
      missCounts: [0, 0],
      deadlineAt: PAST_DEADLINE,
      now: PAST,
    });
    expect(outcome.timedOut).toBe(false);
  });

  it("advances the turn and increments the acting seat's miss count when the deadline has elapsed", () => {
    const state = classicState(2);
    const outcome = applyTimeoutIfExpired({
      matchState: state,
      missCounts: [0, 0],
      deadlineAt: PAST_DEADLINE,
      now: PAST,
    });
    expect(outcome.timedOut).toBe(true);
    expect(outcome.events).toEqual([{ type: "turnTimedOut", seat: 0 }]);
    expect(outcome.missCounts).toEqual([1, 0]);
    expect(outcome.matchState.currentPlayerIndex).toBe(1);
    expect(outcome.matchState.phase).toBe("awaitingRoll");
    expect(outcome.matchState.currentRoll).toBeNull();
    expect(outcome.forfeitedSeats).toHaveLength(0);
    expect(outcome.abandoned).toBe(false);
  });

  it("times out identically regardless of whether the acting seat was awaiting a roll or a move", () => {
    const rolled = applyTimeoutIfExpired({
      matchState: classicState(2),
      missCounts: [0, 0],
      deadlineAt: PAST_DEADLINE,
      now: PAST,
    });
    const awaitingMoveState: LudoMatchState = {
      ...classicState(2),
      phase: "awaitingMove",
      currentRoll: 6,
    };
    const moved = applyTimeoutIfExpired({
      matchState: awaitingMoveState,
      missCounts: [0, 0],
      deadlineAt: PAST_DEADLINE,
      now: PAST,
    });
    expect(moved.matchState.currentPlayerIndex).toBe(rolled.matchState.currentPlayerIndex);
    expect(moved.matchState.phase).toBe(rolled.matchState.phase);
    expect(moved.events).toEqual(rolled.events);
  });

  it("forfeits a seat on its third consecutive missed deadline and skips it going forward", () => {
    const state: LudoMatchState = { ...classicState(3), currentPlayerIndex: 1 };
    const outcome = applyTimeoutIfExpired({
      matchState: state,
      missCounts: [0, LUDO_FORFEIT_MISS_THRESHOLD - 1, 0],
      deadlineAt: PAST_DEADLINE,
      now: PAST,
    });
    expect(outcome.timedOut).toBe(true);
    expect(outcome.missCounts[1]).toBe(LUDO_FORFEIT_MISS_THRESHOLD);
    expect(outcome.forfeitedSeats).toEqual([1]);
    expect(outcome.events.map((e) => e.type)).toEqual(["turnTimedOut", "seatForfeited"]);
    // Seat 1 is forfeited, so the turn skips straight to seat 2.
    expect(outcome.matchState.players[outcome.matchState.currentPlayerIndex].seat).toBe(2);
  });

  it("declares the sole remaining seat the winner once every other seat is forfeited", () => {
    const state: LudoMatchState = { ...classicState(2), currentPlayerIndex: 0 };
    const outcome = applyTimeoutIfExpired({
      matchState: state,
      missCounts: [LUDO_FORFEIT_MISS_THRESHOLD - 1, 0],
      deadlineAt: PAST_DEADLINE,
      now: PAST,
    });
    expect(outcome.forfeitedSeats).toEqual([0]);
    expect(outcome.matchState.phase).toBe("finished");
    expect(outcome.matchState.winnerOrder).toEqual([1, 0]);
    expect(outcome.abandoned).toBe(false);
    expect(outcome.events.some((e) => e.type === "matchFinished")).toBe(true);
  });

  it("marks the match abandoned once every seat has been forfeited", () => {
    const state: LudoMatchState = { ...classicState(2), currentPlayerIndex: 0 };
    const outcome = applyTimeoutIfExpired({
      matchState: state,
      missCounts: [LUDO_FORFEIT_MISS_THRESHOLD - 1, LUDO_FORFEIT_MISS_THRESHOLD],
      deadlineAt: PAST_DEADLINE,
      now: PAST,
    });
    expect(outcome.forfeitedSeats).toEqual([0]);
    expect(outcome.abandoned).toBe(true);
    expect(outcome.matchState.phase).toBe("finished");
    expect(outcome.events.some((e) => e.type === "matchAbandoned")).toBe(true);
  });

  it("is idempotent: re-running against its own output (freshly-not-expired) is a no-op", () => {
    const first = applyTimeoutIfExpired({
      matchState: classicState(2),
      missCounts: [0, 0],
      deadlineAt: PAST_DEADLINE,
      now: PAST,
    });
    const rerun = applyTimeoutIfExpired({
      matchState: first.matchState,
      missCounts: first.missCounts,
      deadlineAt: computeTurnDeadline(PAST.toISOString()),
      now: PAST,
    });
    expect(rerun.timedOut).toBe(false);
    expect(rerun.matchState).toBe(first.matchState);
  });
});

describe("Turn timeout enforcement (service integration)", () => {
  async function createActiveTwoSeatMatch(store: InMemoryLudoStore) {
    const created = await createMatch(
      store,
      ENVIRONMENT,
      { subject: "alice", mode: "classic", seats: 2, idempotencyKey: "create" },
      "direct",
    );
    const matchId = created.matchState.matchId;
    await joinMatch(store, ENVIRONMENT, { subject: "bob", matchId, idempotencyKey: "join" });
    return { matchId, subjects: ["alice", "bob"] };
  }

  async function expireDeadline(store: InMemoryLudoStore, matchId: string): Promise<void> {
    await store.transact(ENVIRONMENT, async (state) => {
      const row = state.matches.find((m) => m.matchId === matchId);
      if (row) row.turnDeadlineAt = PAST_DEADLINE;
      return undefined;
    });
  }

  it("applies the lazy timeout check on the very next read, with no client action required", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveTwoSeatMatch(store);
    await expireDeadline(store, matchId);

    const before = store.snapshot(ENVIRONMENT).matches.find((m) => m.matchId === matchId);
    expect(before?.currentTurnSeat).toBe(0);

    const result = await getMatchState(store, ENVIRONMENT, subjects[1], matchId);
    expect(result.matchState.currentPlayerIndex).toBe(1);
    expect(result.matchState.phase).toBe("awaiting_roll");

    const events = store.snapshot(ENVIRONMENT).events.filter((e) => e.matchId === matchId);
    expect(events.map((e) => e.eventType)).toEqual(["turn_timed_out"]);
    const playerRow = store
      .snapshot(ENVIRONMENT)
      .players.find((p) => p.matchId === matchId && p.seat === 0);
    expect(playerRow?.missCount).toBe(1);
  });

  it("applies the lazy timeout check before processing any other command", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveTwoSeatMatch(store);
    await expireDeadline(store, matchId);

    // seat 0 (alice) is now stale — its own roll should be rejected as
    // wrong-turn, because the lazy check already advanced play to seat 1.
    await expect(
      processCommand(store, ENVIRONMENT, subjects[0], {
        type: "roll_dice",
        matchId,
        idempotencyKey: "stale-roll",
      }),
    ).rejects.toThrow();

    const rolled = await processCommand(
      store,
      ENVIRONMENT,
      subjects[1],
      { type: "roll_dice", matchId, idempotencyKey: "bob-roll" },
      { diceSource: new ScriptedDiceSource([6]) },
    );
    expect(rolled.matchState.currentPlayerIndex).toBe(1);
  });

  it("claim_timeout produces the identical result as the lazy path", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveTwoSeatMatch(store);
    await expireDeadline(store, matchId);

    const claimed = await processCommand(store, ENVIRONMENT, subjects[1], {
      type: "claim_timeout",
      matchId,
      idempotencyKey: "claim-1",
    });
    expect(claimed.matchState.currentPlayerIndex).toBe(1);
    expect(claimed.matchState.phase).toBe("awaiting_roll");
    const events = store.snapshot(ENVIRONMENT).events.filter((e) => e.matchId === matchId);
    expect(events).toHaveLength(1);
  });

  it("claim_timeout is idempotent when called twice with the same idempotency key", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveTwoSeatMatch(store);
    await expireDeadline(store, matchId);

    const first = await processCommand(store, ENVIRONMENT, subjects[1], {
      type: "claim_timeout",
      matchId,
      idempotencyKey: "claim-dup",
    });
    expect(first.idempotent).toBe(false);
    const second = await processCommand(store, ENVIRONMENT, subjects[1], {
      type: "claim_timeout",
      matchId,
      idempotencyKey: "claim-dup",
    });
    expect(second.idempotent).toBe(true);
    expect(second.matchState).toEqual(first.matchState);

    const events = store.snapshot(ENVIRONMENT).events.filter((e) => e.matchId === matchId);
    expect(events).toHaveLength(1);
  });

  it("rejects claim_timeout when the deadline has not actually elapsed", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveTwoSeatMatch(store);
    await expect(
      processCommand(store, ENVIRONMENT, subjects[1], {
        type: "claim_timeout",
        matchId,
        idempotencyKey: "premature",
      }),
    ).rejects.toBeInstanceOf(LudoTimeoutNotElapsedError);
  });

  it("rejects claim_timeout from a subject that does not hold a seat", async () => {
    const store = new InMemoryLudoStore();
    const { matchId } = await createActiveTwoSeatMatch(store);
    await expireDeadline(store, matchId);
    await expect(
      processCommand(store, ENVIRONMENT, "not-a-player", {
        type: "claim_timeout",
        matchId,
        idempotencyKey: "outsider",
      }),
    ).rejects.toBeInstanceOf(LudoForbiddenSeatError);
  });

  it("resets a seat's miss streak once it successfully acts again, rather than accumulating forever", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveTwoSeatMatch(store);

    // Alice (seat 0) times out once: her miss_count goes 0 -> 1 and play
    // passes to Bob.
    await expireDeadline(store, matchId);
    await getMatchState(store, ENVIRONMENT, subjects[1], matchId);
    let players = store.snapshot(ENVIRONMENT).players.filter((p) => p.matchId === matchId);
    expect(players.find((p) => p.seat === 0)?.missCount).toBe(1);

    // Bob rolls a non-6: every token is still in the yard, so the engine's
    // own no-legal-move auto-forfeit hands the turn straight back to Alice
    // without touching either seat's miss_count.
    await processCommand(
      store,
      ENVIRONMENT,
      subjects[1],
      { type: "roll_dice", matchId, idempotencyKey: "bob-roll" },
      { diceSource: new ScriptedDiceSource([2]) },
    );

    // Alice now acts on time — this is a real action within her deadline,
    // so her miss streak resets rather than carrying the earlier miss
    // forward toward forfeiture.
    await processCommand(
      store,
      ENVIRONMENT,
      subjects[0],
      { type: "roll_dice", matchId, idempotencyKey: "alice-roll" },
      { diceSource: new ScriptedDiceSource([6]) },
    );
    players = store.snapshot(ENVIRONMENT).players.filter((p) => p.matchId === matchId);
    expect(players.find((p) => p.seat === 0)?.missCount).toBe(0);
    expect(players.find((p) => p.seat === 1)?.missCount).toBe(0);
  });

  it("forfeits a seat after three consecutive lazily-detected timeouts", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveTwoSeatMatch(store);

    for (let i = 0; i < LUDO_FORFEIT_MISS_THRESHOLD; i++) {
      // It's alice's (seat 0) turn each time this loop reaches here; force
      // her deadline into the past and let bob's next read trigger the lazy
      // check that times her out.
      await expireDeadline(store, matchId);
      await getMatchState(store, ENVIRONMENT, subjects[1], matchId);

      const row = store.snapshot(ENVIRONMENT).matches.find((m) => m.matchId === matchId);
      if (row?.status !== "active") break;

      // Bob's turn: roll a non-6 so every yarded token stays illegal and the
      // engine's own no-legal-move auto-forfeit hands the turn straight back
      // to alice, without touching either seat's miss_count.
      await processCommand(
        store,
        ENVIRONMENT,
        subjects[1],
        { type: "roll_dice", matchId, idempotencyKey: `bob-roll-${i}` },
        { diceSource: new ScriptedDiceSource([2]) },
      );
    }

    const row = store.snapshot(ENVIRONMENT).matches.find((m) => m.matchId === matchId);
    expect(row?.status).toBe("finished");
    const finalPlayers = store.snapshot(ENVIRONMENT).players.filter((p) => p.matchId === matchId);
    expect(finalPlayers.find((p) => p.seat === 0)?.missCount).toBe(LUDO_FORFEIT_MISS_THRESHOLD);
    const state = await getMatchState(store, ENVIRONMENT, subjects[1], matchId);
    expect(state.matchState.winnerOrder[0]).toBe(1);
  });
});
