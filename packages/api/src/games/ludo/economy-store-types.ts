import type { LudoEnvironment } from "./contracts";
import type { LudoCoinTableTier, LudoCurrency, LudoWalletReason } from "./economy-config";
import type {
  LudoPurchaseInventoryItemInput,
  LudoPurchaseInventoryItemResult,
} from "./economy-purchase";

/** Row and input shapes for `economy-store.ts`, split out to keep that file
 * under the repo's max-file-lines limit. Re-exported from `economy-store.ts`,
 * so import them from there. */

export type LudoInventoryItemType = "dice" | "token" | "board" | "pass";
export type LudoAdRewardType = "coins" | "diamonds";
export type LudoCoinTableEscrowStatus = "held" | "paid_out" | "refunded";

export interface LudoWalletTransactionRow {
  id: string;
  environment: LudoEnvironment;
  subject: string;
  currency: LudoCurrency;
  delta: number;
  balanceAfter: number;
  reason: LudoWalletReason;
  sourceRef: string | null;
  idempotencyKey: string;
  createdAt: string;
}

export interface LudoBalanceRow {
  environment: LudoEnvironment;
  subject: string;
  currency: LudoCurrency;
  balance: number;
  updatedAt: string;
}

export interface LudoInventoryRow {
  environment: LudoEnvironment;
  subject: string;
  itemId: string;
  itemType: LudoInventoryItemType;
  acquiredVia: string;
  acquiredAt: string;
}

export interface LudoProgressionRow {
  environment: LudoEnvironment;
  subject: string;
  xp: number;
  level: number;
  updatedAt: string;
}

export interface LudoDailyRewardStateRow {
  environment: LudoEnvironment;
  subject: string;
  lastClaimDate: string | null;
  streakDay: number;
  updatedAt: string;
}

export interface LudoAdRewardClaimRow {
  environment: LudoEnvironment;
  subject: string;
  adTransactionId: string;
  rewardType: LudoAdRewardType;
  claimDate: string;
  createdAt: string;
}

export interface LudoXpClaimRow {
  environment: LudoEnvironment;
  subject: string;
  claimId: string;
  xpDelta: number;
  claimDate: string;
  createdAt: string;
}

export interface LudoCoinTableEscrowRow {
  environment: LudoEnvironment;
  matchId: string;
  tier: LudoCoinTableTier;
  pot: number;
  rake: number;
  status: LudoCoinTableEscrowStatus;
  createdAt: string;
  resolvedAt: string | null;
}

/** Result of `recordXpClaimWithCap`: `"recorded"` (applied within the cap),
 * `"duplicate"` (claimId already recorded, not re-applied) or
 * `"cap_exceeded"` (nothing written). */
export type LudoRecordXpClaimWithCapResult =
  | { outcome: "recorded"; claim: LudoXpClaimRow }
  | { outcome: "duplicate"; claim: LudoXpClaimRow }
  | { outcome: "cap_exceeded"; totalClaimedToday: number };

/** Task 26d: RevenueCat webhook event-id idempotency, one row per event. */
export interface LudoRevenueCatEventRow {
  environment: LudoEnvironment;
  eventId: string;
  eventType: string;
  productId: string;
  subject: string;
  createdAt: string;
}

export type LudoSubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "billing_issue"
  | "revoked";

/** Task 26d: Vortex Pass entitlement state, one row per subject (the only
 * subscription product). See `packages/db/src/schema.ts`'s
 * `ludoSubscriptions` doc comment for why this is a dedicated table rather
 * than an extension of `ludoInventory`. */
export interface LudoSubscriptionRow {
  environment: LudoEnvironment;
  subject: string;
  productId: string;
  status: LudoSubscriptionStatus;
  willRenew: boolean;
  expiresAt: string | null;
  updatedAt: string;
}

export interface LudoLedgerAppendInput {
  subject: string;
  currency: LudoCurrency;
  /** Positive to credit, negative to debit. */
  delta: number;
  reason: LudoWalletReason;
  sourceRef?: string | null;
  /** Unique per (environment, subject); a repeat is a no-op that returns
   * the original result instead of applying `delta` again. */
  idempotencyKey: string;
  now: string;
}

export interface LudoLedgerAppendResult {
  transaction: LudoWalletTransactionRow;
  balance: LudoBalanceRow;
  /** `false` when this call was a replay of an already-applied
   * idempotency key — the ledger was not written to a second time. */
  applied: boolean;
}

export interface LudoApplyProgressionAndLedgerInput {
  subject: string;
  xp: number;
  level: number;
  now: string;
  /** Zero or more reward credits (level-up coin/diamond bonuses) that must
   * land in the same transaction as the progression write, per task 26b's
   * `applyXpAndLevelRewards`. Each entry's idempotency key must already be
   * unique per (subject, entry) — a duplicate key here is a no-op, exactly
   * like a duplicate `appendLedgerEntry` call. */
  ledgerEntries: Omit<LudoLedgerAppendInput, "subject" | "now">[];
}

export interface LudoApplyProgressionAndLedgerResult {
  progression: LudoProgressionRow;
  ledgerResults: LudoLedgerAppendResult[];
}

/** Task 26d: one RevenueCat webhook event's full effect — zero or more
 * wallet credits/debits and/or a Vortex Pass subscription upsert — applied
 * atomically and gated on the event id never having been processed before. */
export interface LudoProcessRevenueCatEventInput {
  eventId: string;
  eventType: string;
  productId: string;
  subject: string;
  now: string;
  ledgerEntries: Omit<LudoLedgerAppendInput, "subject" | "now">[];
  subscription?: Omit<LudoSubscriptionRow, "environment" | "subject" | "updatedAt">;
}

export interface LudoProcessRevenueCatEventResult {
  /** `false` when `eventId` was already processed — nothing below was
   * (re-)applied. */
  applied: boolean;
  ledgerResults: LudoLedgerAppendResult[];
  subscription: LudoSubscriptionRow | null;
}

// ---------------------------------------------------------------------------
// Task 26h: atomic capped claims. Each one is a single check-and-write: the
// duplicate check, the daily-cap count, the claim row and the ledger credit
// all run in one locked step (`recordXpClaimWithCap`'s pattern, commit
// f755ac1), never a separate read followed by a write.
// ---------------------------------------------------------------------------

/** One rewarded-ad (AdMob SSV) credit, claimed against the per-type daily
 * cap. `adTransactionId` is AdMob's signed `transaction_id`. */
export interface LudoClaimAdRewardInput {
  subject: string;
  adTransactionId: string;
  rewardType: LudoAdRewardType;
  /** UTC `YYYY-MM-DD` the cap is counted against. */
  claimDate: string;
  /** Maximum claims of `rewardType` per `claimDate` (5 coins / 2 diamonds). */
  dailyCap: number;
  /** Currency units credited (the config's `coinsPerAd`/`diamondsPerAd`). */
  amount: number;
  now: string;
}

/** `"credited"`: claim row and ledger credit written together.
 * `"duplicate"`: `adTransactionId` already claimed (never re-checked against
 * the cap, never credited again). `"cap_exceeded"`: nothing written. */
export type LudoClaimAdRewardResult =
  | {
      outcome: "credited";
      claim: LudoAdRewardClaimRow;
      transaction: LudoWalletTransactionRow;
      balance: LudoBalanceRow;
    }
  | { outcome: "duplicate"; claim: LudoAdRewardClaimRow }
  | { outcome: "cap_exceeded"; claimedToday: number };

/** One online free-play match-win reward claim, one row per (subject, match). */
export interface LudoFreePlayWinClaimRow {
  environment: LudoEnvironment;
  subject: string;
  matchId: string;
  claimDate: string;
  createdAt: string;
}

export interface LudoClaimFreePlayWinInput {
  subject: string;
  matchId: string;
  claimDate: string;
  /** `onlineFreePlayWinDailyCap` (10/day). */
  dailyCap: number;
  /** `onlineFreePlayWinCoins` (50 coins). */
  amount: number;
  now: string;
}

export type LudoClaimFreePlayWinResult =
  | {
      outcome: "credited";
      claim: LudoFreePlayWinClaimRow;
      transaction: LudoWalletTransactionRow;
      balance: LudoBalanceRow;
    }
  | { outcome: "duplicate"; claim: LudoFreePlayWinClaimRow }
  | { outcome: "cap_exceeded"; claimedToday: number };

/** One daily-calendar claim. The store derives the streak day from the
 * persisted state (`yesterday` continues a streak, anything else restarts at
 * day 1) so two simultaneous claims cannot both advance it. */
export interface LudoClaimDailyRewardInput {
  subject: string;
  /** UTC `YYYY-MM-DD` for "today" and the day before it. */
  today: string;
  yesterday: string;
  calendar: { day: number; coins: number; diamonds: number }[];
  /** Vortex Pass bonus applied on top of the calendar day (rounded down per
   * currency); `0` for a subject without an active pass. */
  passBonusPercent: number;
  now: string;
}

export type LudoClaimDailyRewardResult =
  | {
      outcome: "claimed";
      streakDay: number;
      coinsGranted: number;
      diamondsGranted: number;
      bonusCoins: number;
      bonusDiamonds: number;
      coins: number;
      diamonds: number;
    }
  | { outcome: "already_claimed"; streakDay: number };

/**
 * Server-authoritative wallet/progression/inventory store for the Ludo
 * economy. Every implementation must uphold the ledger invariant: for a
 * given (environment, subject, currency), `SUM(delta)` across
 * `ludo_wallet_transactions` always equals `ludo_balances.balance`, and a
 * duplicate `idempotencyKey` never applies `delta` twice.
 */
export interface LudoEconomyStore {
  appendLedgerEntry(
    environment: LudoEnvironment,
    input: LudoLedgerAppendInput,
  ): Promise<LudoLedgerAppendResult>;

  getBalance(
    environment: LudoEnvironment,
    subject: string,
    currency: LudoCurrency,
  ): Promise<number>;

  listWalletTransactions(
    environment: LudoEnvironment,
    subject: string,
    currency: LudoCurrency,
  ): Promise<LudoWalletTransactionRow[]>;

  listInventory(environment: LudoEnvironment, subject: string): Promise<LudoInventoryRow[]>;

  /** Idempotent by (subject, itemId): granting an already-owned item is a
   * no-op that returns the existing row. */
  grantInventoryItem(
    environment: LudoEnvironment,
    row: Omit<LudoInventoryRow, "environment">,
  ): Promise<LudoInventoryRow>;

  /** Task 26g: atomic coin/diamond purchase (duplicate-key, owned and
   * balance checks plus debit and inventory insert in one locked step). */
  purchaseInventoryItem(
    environment: LudoEnvironment,
    input: LudoPurchaseInventoryItemInput,
  ): Promise<LudoPurchaseInventoryItemResult>;

  getProgression(environment: LudoEnvironment, subject: string): Promise<LudoProgressionRow | null>;

  setProgression(
    environment: LudoEnvironment,
    subject: string,
    xp: number,
    level: number,
    now: string,
  ): Promise<LudoProgressionRow>;

  /** Writes the new progression row and every level-up reward ledger entry
   * atomically (one SQL transaction for `DrizzleLudoEconomyStore`), so a
   * crash between the two never leaves a level-up applied without its
   * reward or vice versa. Used by `progression-service.ts`'s
   * `applyXpAndLevelRewards`, never called directly from a route. */
  applyProgressionAndLedger(
    environment: LudoEnvironment,
    input: LudoApplyProgressionAndLedgerInput,
  ): Promise<LudoApplyProgressionAndLedgerResult>;

  /** Idempotent by (subject, claimId): a repeat claim id never counts
   * twice toward the daily XP cap. */
  recordXpClaim(
    environment: LudoEnvironment,
    row: Omit<LudoXpClaimRow, "environment" | "createdAt">,
    now: string,
  ): Promise<{ claim: LudoXpClaimRow; applied: boolean }>;

  /** Sum of `xpDelta` claimed by `subject` on `claimDate` (UTC). Read
   * paths only; the cap check itself must use `recordXpClaimWithCap`. */
  sumXpClaimed(environment: LudoEnvironment, subject: string, claimDate: string): Promise<number>;

  /** Atomically checks the daily XP cap and records the claim in one
   * locked operation, closing the TOCTOU race a separate
   * `sumXpClaimed` + `recordXpClaim` pair would have under concurrent
   * requests (both could read the same pre-claim sum and both pass the
   * cap check before either write lands). Idempotent by `claimId`: a
   * replay of an already-recorded claim id returns `"duplicate"` with
   * the original row, never re-checked against the cap and never
   * double-counted. */
  recordXpClaimWithCap(
    environment: LudoEnvironment,
    input: {
      subject: string;
      claimId: string;
      xpDelta: number;
      claimDate: string;
      dailyCap: number;
    },
    now: string,
  ): Promise<LudoRecordXpClaimWithCapResult>;

  getDailyRewardState(
    environment: LudoEnvironment,
    subject: string,
  ): Promise<LudoDailyRewardStateRow | null>;

  setDailyRewardState(
    environment: LudoEnvironment,
    row: Omit<LudoDailyRewardStateRow, "environment">,
  ): Promise<LudoDailyRewardStateRow>;

  /** Idempotent by (subject, adTransactionId): a repeat claim of the same
   * ad transaction does not count twice against the daily cap. */
  recordAdClaim(
    environment: LudoEnvironment,
    row: Omit<LudoAdRewardClaimRow, "environment" | "createdAt">,
    now: string,
  ): Promise<{ claim: LudoAdRewardClaimRow; applied: boolean }>;

  countAdClaims(
    environment: LudoEnvironment,
    subject: string,
    rewardType: LudoAdRewardType,
    claimDate: string,
  ): Promise<number>;

  /** Task 26h: atomic rewarded-ad credit. Duplicate `adTransactionId`
   * check, the per-type daily-cap count, the claim row and the ledger
   * credit happen in one locked step, so simultaneous callbacks can never
   * credit more than `dailyCap` claims. */
  claimAdRewardWithCap(
    environment: LudoEnvironment,
    input: LudoClaimAdRewardInput,
  ): Promise<LudoClaimAdRewardResult>;

  /** Task 26h: atomic online free-play match-win coin credit with the
   * per-day win cap (same single-step discipline as `claimAdRewardWithCap`). */
  claimFreePlayWinWithCap(
    environment: LudoEnvironment,
    input: LudoClaimFreePlayWinInput,
  ): Promise<LudoClaimFreePlayWinResult>;

  /** Task 26h: atomic daily-calendar claim (streak read, ledger credits and
   * state write in one locked step), so two simultaneous claims credit one
   * day once. */
  claimDailyReward(
    environment: LudoEnvironment,
    input: LudoClaimDailyRewardInput,
  ): Promise<LudoClaimDailyRewardResult>;

  createEscrow(
    environment: LudoEnvironment,
    row: Omit<LudoCoinTableEscrowRow, "environment" | "status" | "resolvedAt">,
  ): Promise<LudoCoinTableEscrowRow>;

  getEscrow(environment: LudoEnvironment, matchId: string): Promise<LudoCoinTableEscrowRow | null>;

  resolveEscrow(
    environment: LudoEnvironment,
    matchId: string,
    status: Exclude<LudoCoinTableEscrowStatus, "held">,
    resolvedAt: string,
  ): Promise<LudoCoinTableEscrowRow>;

  /** Applies one RevenueCat webhook event's ledger entries and/or
   * subscription upsert atomically, gated on `input.eventId` never having
   * been processed before for this (environment, subject is not part of
   * the idempotency key — the event id alone is globally unique per
   * RevenueCat). A replayed event id is a no-op (`applied: false`). */
  processRevenueCatEvent(
    environment: LudoEnvironment,
    input: LudoProcessRevenueCatEventInput,
  ): Promise<LudoProcessRevenueCatEventResult>;

  getSubscription(
    environment: LudoEnvironment,
    subject: string,
  ): Promise<LudoSubscriptionRow | null>;
}
