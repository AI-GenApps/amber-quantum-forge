/// Coin-stake table helpers extracted from `service.ts` (task 26c): entry-fee
/// debit/rollback around match create/join, and escrow settlement (payout on
/// finish, refund on abandon) shared by every place `service.ts` can produce
/// a `finished`/`abandoned` match. Split out purely to keep `service.ts`
/// under this repo's max-file-lines limit — behavior is unchanged, these are
/// still called synchronously from `service.ts`.
import type { LudoEnvironment, LudoMatchView } from "./contracts";
import { getEconomyConfig, type LudoCoinTableTier, type LudoEconomyConfig } from "./economy-config";
import type { LudoEconomyStore } from "./economy-store";
import { LudoCoinTierInvalidError, LudoError, LudoInsufficientBalanceError } from "./errors";
import type { LudoServiceDependencies } from "./service-types";
import type { LudoStore } from "./store";

/** Computed once from the active `LudoEconomyConfig` and the match's seat
 * count: the full pot and rake a coin-stake match's escrow row holds. */
export interface CoinStakeTerms {
  tier: LudoCoinTableTier;
  entryFee: number;
  pot: number;
  rake: number;
}

export function resolveCoinStakeTerms(
  economyConfig: LudoEconomyConfig,
  tier: LudoCoinTableTier,
  seats: number,
): CoinStakeTerms {
  const tierConfig = economyConfig.coinTables[tier];
  if (!tierConfig) throw new LudoCoinTierInvalidError(tier);
  const pot = tierConfig.entryFee * seats;
  const rake = Math.round((pot * tierConfig.rakePercentOfGrossPot) / 100);
  return { tier, entryFee: tierConfig.entryFee, pot, rake };
}

export function requireEconomyStore(dependencies: LudoServiceDependencies): LudoEconomyStore {
  if (!dependencies.economyStore) {
    throw new LudoError(
      503,
      "ludo_unavailable",
      "Ludo economy service is unavailable for coin-stake tables",
    );
  }
  return dependencies.economyStore;
}

/** Debits `subject`'s coin balance for a coin-stake entry, idempotent per
 * `(matchId, subject)` so a retried create/join never double-charges. Throws
 * `LudoInsufficientBalanceError` *before* touching the ledger when the
 * balance is too low — the caller (`createMatch`/`joinMatch`) always runs
 * this before writing the match/player row, never after. */
export async function debitCoinStakeEntry(
  dependencies: LudoServiceDependencies,
  environment: LudoEnvironment,
  matchId: string,
  subject: string,
  entryFee: number,
): Promise<void> {
  const economyStore = requireEconomyStore(dependencies);
  const balance = await economyStore.getBalance(environment, subject, "coins");
  if (balance < entryFee) throw new LudoInsufficientBalanceError();
  await economyStore.appendLedgerEntry(environment, {
    subject,
    currency: "coins",
    delta: -entryFee,
    reason: "coin_table_entry",
    sourceRef: matchId,
    idempotencyKey: `coin_table_entry:${matchId}:${subject}`,
    now: new Date().toISOString(),
  });
}

/** Compensating refund for a coin-stake entry debited by
 * `debitCoinStakeEntry` whose match-row write subsequently failed (so the
 * subject was charged for a match that was never created/joined) — keyed
 * off the same `(matchId, subject)` pair via a distinct idempotency key, so
 * it can never collide with (or be replayed as) a real match-resolution
 * refund. Swallows its own errors: called from a `catch` block that must
 * still propagate the original failure. */
export async function rollbackCoinStakeEntry(
  dependencies: LudoServiceDependencies,
  environment: LudoEnvironment,
  matchId: string,
  subject: string,
  entryFee: number,
): Promise<void> {
  const economyStore = dependencies.economyStore;
  if (!economyStore) return;
  try {
    await economyStore.appendLedgerEntry(environment, {
      subject,
      currency: "coins",
      delta: entryFee,
      reason: "coin_table_refund",
      sourceRef: matchId,
      idempotencyKey: `coin_table_entry_rollback:${matchId}:${subject}`,
      now: new Date().toISOString(),
    });
  } catch {
    // Best-effort only — the original failure is what the caller reports.
  }
}

/**
 * Resolves a coin-stake match's escrow once its match reaches `finished`
 * (credit payouts + rake) or `abandoned` (refund every seated human's entry
 * fee in full) — task 26c. Called after every place `service.ts` can
 * produce one of those two statuses (a gameplay command's own finish,
 * `claim_timeout`, the lazy check inside `getMatchState`, and the Cron
 * sweeper), always *after* the triggering `store.transact()` has already
 * committed, exactly like `publishMatchView`.
 *
 * Idempotent and race-safe by construction, not by locking: `getEscrow`'s
 * `status !== "held"` check makes a second call for an already-resolved
 * match a no-op, and every ledger credit below carries a deterministic
 * `(matchId, subject, reason)` idempotency key, so two overlapping callers
 * (e.g. a duplicate `claim_timeout` racing the Cron sweeper) can each
 * attempt the same credits without either double-paying or double-refunding
 * — the second writer's `appendLedgerEntry` calls are no-ops. A no-op
 * `economyStore` (free-play call sites, or a match with no escrow row at
 * all) returns immediately.
 */
export async function settleCoinStakeMatch(
  store: LudoStore,
  environment: LudoEnvironment,
  matchState: LudoMatchView["matchState"],
  dependencies: LudoServiceDependencies,
): Promise<void> {
  const economyStore = dependencies.economyStore;
  if (!economyStore) return;
  if (matchState.status !== "finished" && matchState.status !== "abandoned") return;

  const escrow = await economyStore.getEscrow(environment, matchState.matchId);
  if (escrow?.status !== "held") return;

  const botSeats = await store.read(environment, async (state) => {
    const seats = new Set<number>();
    for (const p of state.players) {
      if (p.matchId === matchState.matchId && p.isBot) seats.add(p.seat);
    }
    return seats;
  });
  const isBotSubject = new Set(
    matchState.players.filter((p) => botSeats.has(p.seat)).map((p) => p.subject),
  );
  const subjectAtSeat = (seat: number | undefined): string | undefined =>
    seat === undefined ? undefined : matchState.players.find((p) => p.seat === seat)?.subject;
  const now = new Date().toISOString();

  const credit = async (
    subject: string | undefined,
    amount: number,
    reason: "coin_table_refund" | "coin_table_payout",
  ): Promise<void> => {
    if (!subject || amount <= 0 || isBotSubject.has(subject)) return;
    await economyStore.appendLedgerEntry(environment, {
      subject,
      currency: "coins",
      delta: amount,
      reason,
      sourceRef: matchState.matchId,
      idempotencyKey: `${reason}:${matchState.matchId}:${subject}`,
      now,
    });
  };

  if (matchState.status === "abandoned") {
    const entryFee = Math.floor(escrow.pot / matchState.players.length);
    for (const player of matchState.players) {
      await credit(player.subject, entryFee, "coin_table_refund");
    }
    await economyStore.resolveEscrow(environment, matchState.matchId, "refunded", now);
    return;
  }

  // "finished" with a winner: pay out per the 2p/4p rules (task 26c's
  // Context/Decisions). The rake is never credited to any subject — it is
  // simply whatever the gross pot leaves uncredited, which is exactly what
  // this task's acceptance criteria verifies directly.
  const economyConfig = dependencies.economyConfig ?? getEconomyConfig();
  const tierConfig = economyConfig.coinTables[escrow.tier];
  const [firstSeat, secondSeat] = matchState.winnerOrder;
  if (matchState.players.length === 2) {
    const rake = Math.round((escrow.pot * tierConfig.rakePercentOfGrossPot) / 100);
    await credit(subjectAtSeat(firstSeat), escrow.pot - rake, "coin_table_payout");
  } else {
    const first = Math.round((escrow.pot * tierConfig.fourPlayerFirstPlacePercentOfGrossPot) / 100);
    const second = Math.round(
      (escrow.pot * tierConfig.fourPlayerSecondPlacePercentOfGrossPot) / 100,
    );
    await credit(subjectAtSeat(firstSeat), first, "coin_table_payout");
    await credit(subjectAtSeat(secondSeat), second, "coin_table_payout");
  }
  await economyStore.resolveEscrow(environment, matchState.matchId, "paid_out", now);
}
