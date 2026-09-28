/// Coin-stake tables, match-start escrow, and payout/refund (task 26c):
/// 2p/4p payout math, insufficient-balance rejection, timeout refund, and a
/// concurrency test proving two simultaneous resolution attempts for the
/// same match never double-pay or double-refund.
import { describe, expect, it } from "vitest";
import type { LudoEnvironment, LudoMatchState, LudoMode } from "./contracts";
import { FunctionDiceSource } from "./dice";
import { getEconomyConfig } from "./economy-config";
import { InMemoryLudoEconomyStore } from "./economy-store";
import { LUDO_RULESETS_BY_ID, pathLength } from "./engine";
import { LudoInsufficientBalanceError } from "./errors";
import { InMemoryLudoStore } from "./memory-store";
import { createMatch, getMatchState, joinMatch, processCommand, sweepTimeouts } from "./service";
import { LUDO_FORFEIT_MISS_THRESHOLD } from "./timeout";

const ENVIRONMENT: LudoEnvironment = "debug";
const CONFIG = getEconomyConfig();
const LOW_TIER = CONFIG.coinTables.low;

async function grantCoins(
  economyStore: InMemoryLudoEconomyStore,
  subject: string,
  amount: number,
): Promise<void> {
  await economyStore.appendLedgerEntry(ENVIRONMENT, {
    subject,
    currency: "coins",
    delta: amount,
    reason: "starter_grant",
    idempotencyKey: `starter:${subject}`,
    now: new Date().toISOString(),
  });
}

async function balanceOf(economyStore: InMemoryLudoEconomyStore, subject: string): Promise<number> {
  return economyStore.getBalance(ENVIRONMENT, subject, "coins");
}

/** Creates and fully seats a `low`-tier coin-stake match, funding every
 * seat with exactly one entry fee beforehand. */
async function createFundedCoinMatch(
  store: InMemoryLudoStore,
  economyStore: InMemoryLudoEconomyStore,
  seats: number,
): Promise<{ matchId: string; subjects: string[] }> {
  const subjects = Array.from({ length: seats }, (_, i) => `player-${seats}-${i}`);
  for (const subject of subjects) await grantCoins(economyStore, subject, LOW_TIER.entryFee);

  const created = await createMatch(
    store,
    ENVIRONMENT,
    {
      subject: subjects[0],
      mode: "quick",
      seats,
      idempotencyKey: `create-${seats}p-${subjects[0]}`,
      coinTier: "low",
    },
    "direct",
    { economyStore },
  );
  const matchId = created.matchState.matchId;
  for (let i = 1; i < subjects.length; i++) {
    await joinMatch(
      store,
      ENVIRONMENT,
      { subject: subjects[i], matchId, idempotencyKey: `join-${seats}p-${i}` },
      { economyStore },
    );
  }
  return { matchId, subjects };
}

/** Mirrors `service.test.ts`'s deterministic full-match simulation, driven
 * through `processCommand` with `economyStore` wired so a finish settles
 * the escrow exactly like the real command routes do. */
function seededRolls(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) & 0x7fffffff;
    return (value % 6) + 1;
  };
}

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

async function playToFinished(
  store: InMemoryLudoStore,
  economyStore: InMemoryLudoEconomyStore,
  matchId: string,
  subjects: readonly string[],
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
      { diceSource, economyStore },
    );
    matchState = rolled.matchState;
    if (matchState.phase === "finished") return matchState;
    if (matchState.phase === "awaiting_move") {
      const tokenId = pickLegalTokenId(matchState, "quick");
      const moved = await processCommand(
        store,
        ENVIRONMENT,
        actingSubject,
        { type: "move_token", matchId, tokenId, idempotencyKey: `move-${counter++}` },
        { diceSource, economyStore },
      );
      matchState = moved.matchState;
      if (matchState.phase === "finished") return matchState;
    }
  }
  throw new Error(`Match did not finish within ${maxSteps} steps`);
}

describe("Coin-stake tables: payout math (task 26c)", () => {
  it("credits a 2-player winner exactly pot * 0.95 and leaves the loser uncredited", async () => {
    const store = new InMemoryLudoStore();
    const economyStore = new InMemoryLudoEconomyStore();
    const { matchId, subjects } = await createFundedCoinMatch(store, economyStore, 2);

    const final = await playToFinished(store, economyStore, matchId, subjects, 10);
    expect(final.status).toBe("finished");

    const pot = LOW_TIER.entryFee * 2;
    const rake = Math.round((pot * LOW_TIER.rakePercentOfGrossPot) / 100);
    const winnerShare = pot - rake;
    expect(winnerShare).toBe(Math.round(pot * 0.95));

    const winnerSubject = subjects[final.winnerOrder[0]];
    const loserSubject = subjects.find((s) => s !== winnerSubject) as string;
    // Every subject started with exactly one entry fee, which was debited
    // on join, so a subject's final balance directly reflects what it was
    // credited back at settlement.
    expect(await balanceOf(economyStore, winnerSubject)).toBe(winnerShare);
    expect(await balanceOf(economyStore, loserSubject)).toBe(0);

    const escrow = await economyStore.getEscrow(ENVIRONMENT, matchId);
    expect(escrow?.status).toBe("paid_out");
  });

  it("credits a 4-player match's 1st place 70% and 2nd place 25% of the pot, with the remaining 5% credited to nobody (the rake)", async () => {
    const store = new InMemoryLudoStore();
    const economyStore = new InMemoryLudoEconomyStore();
    const { matchId, subjects } = await createFundedCoinMatch(store, economyStore, 4);

    const final = await playToFinished(store, economyStore, matchId, subjects, 20);
    expect(final.status).toBe("finished");
    expect(final.winnerOrder.length).toBeGreaterThanOrEqual(2);

    const pot = LOW_TIER.entryFee * 4;
    const first = Math.round((pot * LOW_TIER.fourPlayerFirstPlacePercentOfGrossPot) / 100);
    const second = Math.round((pot * LOW_TIER.fourPlayerSecondPlacePercentOfGrossPot) / 100);
    const rake = pot - first - second;
    expect(rake).toBe(Math.round(pot * (LOW_TIER.rakePercentOfGrossPot / 100)));

    const firstSubject = subjects[final.winnerOrder[0]];
    const secondSubject = subjects[final.winnerOrder[1]];
    expect(await balanceOf(economyStore, firstSubject)).toBe(first);
    expect(await balanceOf(economyStore, secondSubject)).toBe(second);

    // Every credit issued for this match sums to exactly pot - rake — the
    // remaining `rake` coins were debited from entry fees but never
    // credited to any player's wallet.
    let totalCredited = 0;
    for (const subject of subjects) totalCredited += await balanceOf(economyStore, subject);
    expect(totalCredited).toBe(pot - rake);

    const escrow = await economyStore.getEscrow(ENVIRONMENT, matchId);
    expect(escrow?.status).toBe("paid_out");
  });
});

describe("Coin-stake tables: insufficient balance (task 26c)", () => {
  it("rejects create_match for a coin tier before the match or escrow row is ever created", async () => {
    const store = new InMemoryLudoStore();
    const economyStore = new InMemoryLudoEconomyStore();
    // No starter grant at all: balance is 0, below the low tier's entry fee.

    await expect(
      createMatch(
        store,
        ENVIRONMENT,
        {
          subject: "broke-player",
          mode: "quick",
          seats: 2,
          idempotencyKey: "broke-create",
          coinTier: "low",
        },
        "direct",
        { economyStore },
      ),
    ).rejects.toBeInstanceOf(LudoInsufficientBalanceError);

    expect(store.snapshot(ENVIRONMENT).matches).toHaveLength(0);
    expect(await economyStore.listWalletTransactions(ENVIRONMENT, "broke-player", "coins")).toEqual(
      [],
    );
  });

  it("rejects join_match for a coin-stake table before the seat is filled", async () => {
    const store = new InMemoryLudoStore();
    const economyStore = new InMemoryLudoEconomyStore();
    await grantCoins(economyStore, "funded-creator", LOW_TIER.entryFee);

    const created = await createMatch(
      store,
      ENVIRONMENT,
      {
        subject: "funded-creator",
        mode: "quick",
        seats: 2,
        idempotencyKey: "funded-create",
        coinTier: "low",
      },
      "direct",
      { economyStore },
    );
    const matchId = created.matchState.matchId;

    await expect(
      joinMatch(
        store,
        ENVIRONMENT,
        { subject: "broke-joiner", matchId, idempotencyKey: "broke-join" },
        { economyStore },
      ),
    ).rejects.toBeInstanceOf(LudoInsufficientBalanceError);

    // The seat was never filled — the match stays `waiting`, single-seated.
    const row = store.snapshot(ENVIRONMENT).matches.find((m) => m.matchId === matchId);
    expect(row?.status).toBe("waiting");
    expect(store.snapshot(ENVIRONMENT).players.filter((p) => p.matchId === matchId)).toHaveLength(
      1,
    );
    expect(await balanceOf(economyStore, "broke-joiner")).toBe(0);
  });
});

/** Forces a 2-player match's escrow into the exact "every seat forfeited"
 * state `timeout.test.ts` exercises at the pure-function level, so
 * `sweepTimeouts` transitions the match to `abandoned` on its next sweep. */
async function forceAbandon(store: InMemoryLudoStore, matchId: string): Promise<void> {
  await store.transact(ENVIRONMENT, async (state) => {
    const row = state.matches.find((m) => m.matchId === matchId);
    if (!row) throw new Error("match not found");
    row.turnDeadlineAt = new Date(Date.now() - 60_000).toISOString();
    const players = state.players
      .filter((p) => p.matchId === matchId)
      .sort((a, b) => a.seat - b.seat);
    players[0].missCount = LUDO_FORFEIT_MISS_THRESHOLD - 1;
    players[1].missCount = LUDO_FORFEIT_MISS_THRESHOLD;
    row.currentTurnSeat = players[1].seat;
    return undefined;
  });
}

describe("Coin-stake tables: timeout refund (task 26c)", () => {
  it("refunds every seated player's entry fee in full when a coin-stake match times out into abandoned", async () => {
    const store = new InMemoryLudoStore();
    const economyStore = new InMemoryLudoEconomyStore();
    const { matchId, subjects } = await createFundedCoinMatch(store, economyStore, 2);
    for (const subject of subjects) expect(await balanceOf(economyStore, subject)).toBe(0);

    await forceAbandon(store, matchId);
    const swept = await sweepTimeouts(store, ENVIRONMENT, undefined, { economyStore });
    expect(swept).toBe(1);

    const row = store.snapshot(ENVIRONMENT).matches.find((m) => m.matchId === matchId);
    expect(row?.status).toBe("abandoned");
    for (const subject of subjects) {
      expect(await balanceOf(economyStore, subject)).toBe(LOW_TIER.entryFee);
    }
    const escrow = await economyStore.getEscrow(ENVIRONMENT, matchId);
    expect(escrow?.status).toBe("refunded");
  });
});

describe("Coin-stake tables: concurrent resolution (task 26c)", () => {
  it("never double-refunds when the timeout sweeper and a direct poll race to resolve the same abandoned match", async () => {
    const store = new InMemoryLudoStore();
    const economyStore = new InMemoryLudoEconomyStore();
    const { matchId, subjects } = await createFundedCoinMatch(store, economyStore, 2);

    await forceAbandon(store, matchId);

    // Both calls independently observe the expired deadline and race to
    // apply the abandon transition and settle the escrow — exactly the
    // "duplicate command and the timeout sweeper racing" scenario this
    // task's Context/Decisions calls out.
    await Promise.all([
      sweepTimeouts(store, ENVIRONMENT, undefined, { economyStore }),
      getMatchState(store, ENVIRONMENT, subjects[0], matchId, { economyStore }),
    ]);

    for (const subject of subjects) {
      expect(await balanceOf(economyStore, subject)).toBe(LOW_TIER.entryFee);
    }
    const escrow = await economyStore.getEscrow(ENVIRONMENT, matchId);
    expect(escrow?.status).toBe("refunded");
    const refundTxns = (
      await economyStore.listWalletTransactions(ENVIRONMENT, subjects[0], "coins")
    ).filter((t) => t.reason === "coin_table_refund");
    expect(refundTxns).toHaveLength(1);
  });

  it("never double-pays when two concurrent pollers settle the same finished match", async () => {
    const store = new InMemoryLudoStore();
    const economyStore = new InMemoryLudoEconomyStore();
    const { matchId, subjects } = await createFundedCoinMatch(store, economyStore, 2);
    const final = await playToFinished(store, economyStore, matchId, subjects, 10);
    expect(final.status).toBe("finished");
    const winnerSubject = subjects[final.winnerOrder[0]];
    const pot = LOW_TIER.entryFee * 2;
    const rake = Math.round((pot * LOW_TIER.rakePercentOfGrossPot) / 100);
    const winnerShare = pot - rake;
    // The match already settled once as a side effect of the winning move
    // itself (processCommand's own post-finish settlement); race two more
    // observers against the now-already-`paid_out` escrow to prove a
    // repeat settlement attempt is a pure no-op.
    await Promise.all([
      getMatchState(store, ENVIRONMENT, subjects[0], matchId, { economyStore }),
      getMatchState(store, ENVIRONMENT, subjects[1], matchId, { economyStore }),
    ]);
    expect(await balanceOf(economyStore, winnerSubject)).toBe(winnerShare);
    const payoutTxns = (
      await economyStore.listWalletTransactions(ENVIRONMENT, winnerSubject, "coins")
    ).filter((t) => t.reason === "coin_table_payout");
    expect(payoutTxns).toHaveLength(1);
  });
});
