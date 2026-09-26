import { describe, expect, it } from "vitest";
import type { LudoEnvironment, LudoMatchState, LudoMode } from "./contracts";
import { FunctionDiceSource, ScriptedDiceSource } from "./dice";
import { LUDO_RULESETS_BY_ID, pathLength } from "./engine";
import {
  LudoForbiddenSeatError,
  LudoIdempotencyConflictError,
  LudoIllegalMoveError,
  LudoWrongTurnError,
} from "./errors";
import { InMemoryLudoStore } from "./memory-store";
import { createMatch, getMatchState, joinMatch, processCommand } from "./service";
import { LUDO_FORFEIT_MISS_THRESHOLD } from "./timeout";

const ENVIRONMENT: LudoEnvironment = "debug";

/** Mirrors `engine.ts`'s `legalMoves`, but against the wire `LudoMatchState` shape. */
function pickLegalTokenId(matchState: LudoMatchState, mode: LudoMode): number {
  const roll = matchState.currentRoll;
  if (roll == null) throw new Error("No pending roll to choose a move for");
  const ruleset = LUDO_RULESETS_BY_ID[mode];
  const player = matchState.players[matchState.currentPlayerIndex];
  const moves: number[] = [];
  for (const token of player.tokens) {
    if (token.pathPosition === -1) {
      if (ruleset.requiresYardExitRoll && roll === 6) moves.push(token.id);
      continue;
    }
    if (token.pathPosition >= pathLength(ruleset)) continue;
    if (token.pathPosition + roll <= pathLength(ruleset)) moves.push(token.id);
  }
  moves.sort((a, b) => a - b);
  const chosen = moves[0];
  if (chosen === undefined) throw new Error("No legal move available for the current roll");
  return chosen;
}

async function createActiveMatch(
  store: InMemoryLudoStore,
  mode: LudoMode,
  seats: number,
): Promise<{ matchId: string; subjects: string[] }> {
  const subjects = Array.from({ length: seats }, (_, i) => `subject-${i}`);
  const created = await createMatch(
    store,
    ENVIRONMENT,
    { subject: subjects[0], mode, seats, idempotencyKey: `create-${mode}-${seats}` },
    "direct",
  );
  const matchId = created.matchState.matchId;
  for (let i = 1; i < subjects.length; i++) {
    await joinMatch(store, ENVIRONMENT, {
      subject: subjects[i],
      matchId,
      idempotencyKey: `join-${i}`,
    });
  }
  return { matchId, subjects };
}

/** Deterministic seeded PRNG, mirroring `engine.test.ts`'s full-match simulation. */
function seededRolls(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) & 0x7fffffff;
    return (value % 6) + 1;
  };
}

async function playToFinished(
  store: InMemoryLudoStore,
  matchId: string,
  subjects: readonly string[],
  mode: LudoMode,
  seed: number,
): Promise<LudoMatchState> {
  const diceSource = new FunctionDiceSource(seededRolls(seed));
  let counter = 0;
  let matchState: LudoMatchState | undefined;
  const maxSteps = 20_000;
  for (let step = 0; step < maxSteps; step++) {
    const actingSubject = subjects[matchState?.currentPlayerIndex ?? 0];
    const rolled = await processCommand(
      store,
      ENVIRONMENT,
      actingSubject,
      { type: "roll_dice", matchId, idempotencyKey: `roll-${counter++}` },
      { diceSource },
    );
    matchState = rolled.matchState;
    if (matchState.phase === "finished") return matchState;
    if (matchState.phase === "awaiting_move") {
      const tokenId = pickLegalTokenId(matchState, mode);
      const moved = await processCommand(
        store,
        ENVIRONMENT,
        actingSubject,
        { type: "move_token", matchId, tokenId, idempotencyKey: `move-${counter++}` },
        { diceSource },
      );
      matchState = moved.matchState;
      if (matchState.phase === "finished") return matchState;
    }
  }
  throw new Error(`Match did not finish within ${maxSteps} steps`);
}

describe("Ludo command service", () => {
  it("records match_origin exactly as given for a direct-created match", async () => {
    const store = new InMemoryLudoStore();
    const created = await createMatch(
      store,
      ENVIRONMENT,
      { subject: "creator", mode: "classic", seats: 2, idempotencyKey: "create-origin" },
      "direct",
    );
    const row = store
      .snapshot(ENVIRONMENT)
      .matches.find((m) => m.matchId === created.matchState.matchId);
    expect(row?.matchOrigin).toBe("direct");
  });

  it("short-circuits a repeated idempotency key before any engine logic runs", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveMatch(store, "classic", 2);
    // Every token starts in the yard, so only a 6 (Classic requires a 6 to
    // exit) yields a legal move — anything else auto-forfeits and emits a
    // second event, which would break this test's "exactly one event" check.
    const diceSource = new ScriptedDiceSource([6, 6, 6]);
    const first = await processCommand(
      store,
      ENVIRONMENT,
      subjects[0],
      { type: "roll_dice", matchId, idempotencyKey: "dup-roll" },
      { diceSource },
    );
    expect(first.idempotent).toBe(false);
    expect(first.matchState.currentRoll).toBe(6);

    const second = await processCommand(
      store,
      ENVIRONMENT,
      subjects[0],
      { type: "roll_dice", matchId, idempotencyKey: "dup-roll" },
      { diceSource },
    );
    expect(second.idempotent).toBe(true);
    expect(second.matchState).toEqual(first.matchState);

    const events = store.snapshot(ENVIRONMENT).events.filter((e) => e.matchId === matchId);
    expect(events).toHaveLength(1);
    const rollCommands = store
      .snapshot(ENVIRONMENT)
      .commands.filter((c) => c.matchId === matchId && c.idempotencyKey === "dup-roll");
    expect(rollCommands).toHaveLength(1);
  });

  it("rejects a duplicate idempotency key attached to a mismatched command type", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveMatch(store, "classic", 2);
    await processCommand(
      store,
      ENVIRONMENT,
      subjects[0],
      { type: "roll_dice", matchId, idempotencyKey: "shared-key" },
      { diceSource: new ScriptedDiceSource([6]) },
    );
    await expect(
      processCommand(store, ENVIRONMENT, subjects[0], {
        type: "move_token",
        matchId,
        tokenId: 0,
        idempotencyKey: "shared-key",
      }),
    ).rejects.toBeInstanceOf(LudoIdempotencyConflictError);
  });

  it("leaves no partial event when an illegal move is rejected (transactional rollback)", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveMatch(store, "classic", 2);
    // A roll of 6 makes every yarded token (ids 0-3) legal, so the match
    // reaches awaitingMove; request a token id that does not exist on the
    // board at all, which `legalMoves` never includes.
    await processCommand(
      store,
      ENVIRONMENT,
      subjects[0],
      { type: "roll_dice", matchId, idempotencyKey: "setup-roll" },
      { diceSource: new ScriptedDiceSource([6]) },
    );
    const beforeEvents = store.snapshot(ENVIRONMENT).events.filter((e) => e.matchId === matchId);
    const beforeCommands = store
      .snapshot(ENVIRONMENT)
      .commands.filter((c) => c.matchId === matchId);

    await expect(
      processCommand(store, ENVIRONMENT, subjects[0], {
        type: "move_token",
        matchId,
        tokenId: 99, // no such token exists on the board
        idempotencyKey: "illegal-move",
      }),
    ).rejects.toBeInstanceOf(LudoIllegalMoveError);

    const afterEvents = store.snapshot(ENVIRONMENT).events.filter((e) => e.matchId === matchId);
    const afterCommands = store.snapshot(ENVIRONMENT).commands.filter((c) => c.matchId === matchId);
    expect(afterEvents).toEqual(beforeEvents);
    expect(afterCommands).toEqual(beforeCommands);
  });

  it("rejects a command from a seat whose turn it is not", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveMatch(store, "classic", 2);
    await expect(
      processCommand(store, ENVIRONMENT, subjects[1], {
        type: "roll_dice",
        matchId,
        idempotencyKey: "wrong-turn",
      }),
    ).rejects.toBeInstanceOf(LudoWrongTurnError);
  });

  it("rejects a command from a subject that does not hold a seat in the match", async () => {
    const store = new InMemoryLudoStore();
    const { matchId } = await createActiveMatch(store, "classic", 2);
    await expect(
      processCommand(store, ENVIRONMENT, "not-a-player", {
        type: "roll_dice",
        matchId,
        idempotencyKey: "not-a-participant",
      }),
    ).rejects.toBeInstanceOf(LudoForbiddenSeatError);
  });

  // Both full-match simulations use Quick mode (short win condition: one
  // token home plus one capture) with seeds chosen to finish in well under
  // a hundred turns — Classic's allTokensHome condition can take thousands
  // of turns against this naive "always play the lowest legal token id"
  // strategy (see `engine.test.ts`'s own full-match simulation), which
  // would make this in-memory-store-backed, full-transaction-per-turn test
  // needlessly slow without exercising any additional service.ts logic.
  it("plays a full 2-player match end-to-end through processCommand to a single winner", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveMatch(store, "quick", 2);
    const final = await playToFinished(store, matchId, subjects, "quick", 10);
    expect(final.status).toBe("finished");
    expect(final.winnerOrder).toHaveLength(2);
  });

  it("plays a full 4-player match end-to-end through processCommand to a ranked winner order", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveMatch(store, "quick", 4);
    const final = await playToFinished(store, matchId, subjects, "quick", 20);
    expect(final.status).toBe("finished");
    expect(final.winnerOrder.length).toBeGreaterThanOrEqual(1);
    expect(new Set(final.winnerOrder).size).toBe(final.winnerOrder.length);
  });
});

describe("Matchmaking-origin bot-fill vs direct-origin forfeit (task 20)", () => {
  async function createActiveMatchWithOrigin(
    store: InMemoryLudoStore,
    matchOrigin: "matchmaking" | "direct" | "room",
  ): Promise<{ matchId: string; subjects: string[] }> {
    const subjects = ["alice", "bob"];
    const created = await createMatch(
      store,
      ENVIRONMENT,
      { subject: subjects[0], mode: "classic", seats: 2, idempotencyKey: `create-${matchOrigin}` },
      matchOrigin,
    );
    const matchId = created.matchState.matchId;
    await joinMatch(store, ENVIRONMENT, {
      subject: subjects[1],
      matchId,
      idempotencyKey: `join-${matchOrigin}`,
    });
    return { matchId, subjects };
  }

  /** Primes seat 0 one miss away from `LUDO_FORFEIT_MISS_THRESHOLD`, with an already-elapsed deadline. */
  async function primeThirdMiss(store: InMemoryLudoStore, matchId: string): Promise<void> {
    await store.transact(ENVIRONMENT, async (state) => {
      const row = state.matches.find((m) => m.matchId === matchId);
      if (row) row.turnDeadlineAt = new Date(Date.now() - 1_000).toISOString();
      const seat0 = state.players.find((p) => p.matchId === matchId && p.seat === 0);
      if (seat0) seat0.missCount = LUDO_FORFEIT_MISS_THRESHOLD - 1;
      return undefined;
    });
  }

  it("bot-fills seat 0 on its third consecutive miss in a matchmaking-origin match, instead of forfeiting it", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveMatchWithOrigin(store, "matchmaking");
    await primeThirdMiss(store, matchId);

    const result = await getMatchState(store, ENVIRONMENT, subjects[1], matchId);
    expect(result.matchState.status).toBe("active");
    expect(result.matchState.players).toHaveLength(2);

    const seat0Row = store
      .snapshot(ENVIRONMENT)
      .players.find((p) => p.matchId === matchId && p.seat === 0);
    expect(seat0Row?.isBot).toBe(true);
    expect(seat0Row?.botDifficulty).toBe("medium");
    // The seat's miss streak resets once it is bot-filled (task 20).
    expect(seat0Row?.missCount).toBe(0);
  });

  it("still forfeits seat 0 on its third consecutive miss in a direct-origin match (task 19 behavior unchanged)", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveMatchWithOrigin(store, "direct");
    await primeThirdMiss(store, matchId);

    const result = await getMatchState(store, ENVIRONMENT, subjects[1], matchId);
    expect(result.matchState.status).toBe("finished");
    expect(result.matchState.winnerOrder).toEqual([1, 0]);

    const seat0Row = store
      .snapshot(ENVIRONMENT)
      .players.find((p) => p.matchId === matchId && p.seat === 0);
    expect(seat0Row?.isBot).toBe(false);
  });

  it("still forfeits seat 0 on its third consecutive miss in a room-originated match (task 21: task 19 behavior unchanged, not bot-filled)", async () => {
    const store = new InMemoryLudoStore();
    const { matchId, subjects } = await createActiveMatchWithOrigin(store, "room");
    await primeThirdMiss(store, matchId);

    const result = await getMatchState(store, ENVIRONMENT, subjects[1], matchId);
    expect(result.matchState.status).toBe("finished");
    expect(result.matchState.winnerOrder).toEqual([1, 0]);

    const seat0Row = store
      .snapshot(ENVIRONMENT)
      .players.find((p) => p.matchId === matchId && p.seat === 0);
    expect(seat0Row?.isBot).toBe(false);
  });
});
