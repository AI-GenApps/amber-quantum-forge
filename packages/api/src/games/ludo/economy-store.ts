import type { LudoEnvironment } from "./contracts";
import type { LudoCoinTableTier, LudoCurrency, LudoWalletReason } from "./economy-config";

export const LUDO_ECONOMY_STORE_APP_ID = "ludo" as const;

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

/** Result of `LudoEconomyStore.recordXpClaimWithCap`: `"recorded"` when the
 * claim was newly applied (within the cap), `"duplicate"` when `claimId`
 * had already been recorded (the original row is returned, not
 * re-applied), and `"cap_exceeded"` when applying `xpDelta` would push the
 * subject's `claimDate` total over `dailyCap` — nothing was written. */
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

  /** Sum of `xpDelta` across every XP claim already recorded for `subject`
   * on `claimDate` (a UTC `YYYY-MM-DD` string). Exposed for read paths
   * (e.g. a profile/debug view); the daily-cap check itself must go
   * through `recordXpClaimWithCap`, not a separate call to this method,
   * since the two together would be a check-then-write race. */
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

interface EconomyEnvironmentState {
  transactions: LudoWalletTransactionRow[];
  balances: Map<string, LudoBalanceRow>;
  inventory: Map<string, LudoInventoryRow>;
  progression: Map<string, LudoProgressionRow>;
  dailyRewardState: Map<string, LudoDailyRewardStateRow>;
  adClaims: Map<string, LudoAdRewardClaimRow>;
  xpClaims: Map<string, LudoXpClaimRow>;
  escrow: Map<string, LudoCoinTableEscrowRow>;
  revenueCatEvents: Map<string, LudoRevenueCatEventRow>;
  subscriptions: Map<string, LudoSubscriptionRow>;
}

function emptyEnvironmentState(): EconomyEnvironmentState {
  return {
    transactions: [],
    balances: new Map(),
    inventory: new Map(),
    progression: new Map(),
    dailyRewardState: new Map(),
    adClaims: new Map(),
    xpClaims: new Map(),
    escrow: new Map(),
    revenueCatEvents: new Map(),
    subscriptions: new Map(),
  };
}

function balanceKey(subject: string, currency: LudoCurrency): string {
  return `${subject}\u0000${currency}`;
}

function inventoryKey(subject: string, itemId: string): string {
  return `${subject}\u0000${itemId}`;
}

function adClaimKey(subject: string, adTransactionId: string): string {
  return `${subject}\u0000${adTransactionId}`;
}

function xpClaimKey(subject: string, claimId: string): string {
  return `${subject}\u0000${claimId}`;
}

function idempotencyKeyLookup(subject: string, idempotencyKey: string): string {
  return `${subject}\u0000${idempotencyKey}`;
}

/**
 * In-process economy store, matching `InMemoryLudoStore`'s single-flight
 * tail-per-environment concurrency pattern: a duplicate idempotency key
 * arriving while an earlier append for the same key is still in flight is
 * serialized behind it, never double-applied.
 */
export class InMemoryLudoEconomyStore implements LudoEconomyStore {
  private readonly states = new Map<LudoEnvironment, EconomyEnvironmentState>();
  private readonly appliedIdempotencyKeys = new Map<LudoEnvironment, Map<string, string>>();
  private readonly tails = new Map<LudoEnvironment, Promise<void>>();

  private state(environment: LudoEnvironment): EconomyEnvironmentState {
    let state = this.states.get(environment);
    if (!state) {
      state = emptyEnvironmentState();
      this.states.set(environment, state);
    }
    return state;
  }

  private async serialize<T>(environment: LudoEnvironment, operation: () => T): Promise<T> {
    const previous = this.tails.get(environment) ?? Promise.resolve();
    let result!: T;
    const current = previous
      .then(
        () => undefined,
        () => undefined,
      )
      .then(() => {
        result = operation();
      });
    const tail: Promise<void> = current.then(
      () => undefined,
      () => undefined,
    );
    this.tails.set(environment, tail);
    await current;
    if (this.tails.get(environment) === tail) this.tails.delete(environment);
    return result;
  }

  /** Synchronous core of `appendLedgerEntry`, callable both directly (under
   * `serialize`) and from within `applyProgressionAndLedger`'s single
   * serialized operation, so the two never deadlock by nesting `serialize`
   * calls for the same environment. */
  private appendLedgerEntrySync(
    environment: LudoEnvironment,
    input: LudoLedgerAppendInput,
  ): LudoLedgerAppendResult {
    const state = this.state(environment);
    let byKey = this.appliedIdempotencyKeys.get(environment);
    if (!byKey) {
      byKey = new Map();
      this.appliedIdempotencyKeys.set(environment, byKey);
    }
    const lookup = idempotencyKeyLookup(input.subject, input.idempotencyKey);
    const existingTransactionId = byKey.get(lookup);
    if (existingTransactionId) {
      const transaction = state.transactions.find((row) => row.id === existingTransactionId);
      if (!transaction) throw new Error("ludo economy store: idempotency key/transaction desync");
      const balance = state.balances.get(balanceKey(input.subject, input.currency));
      if (!balance) throw new Error("ludo economy store: transaction without a balance row");
      return { transaction, balance, applied: false };
    }
    const key = balanceKey(input.subject, input.currency);
    const previousBalance = state.balances.get(key)?.balance ?? 0;
    const balanceAfter = previousBalance + input.delta;
    const transaction: LudoWalletTransactionRow = {
      id: `wtx_${environment}_${state.transactions.length + 1}_${input.idempotencyKey}`,
      environment,
      subject: input.subject,
      currency: input.currency,
      delta: input.delta,
      balanceAfter,
      reason: input.reason,
      sourceRef: input.sourceRef ?? null,
      idempotencyKey: input.idempotencyKey,
      createdAt: input.now,
    };
    state.transactions.push(transaction);
    const balance: LudoBalanceRow = {
      environment,
      subject: input.subject,
      currency: input.currency,
      balance: balanceAfter,
      updatedAt: input.now,
    };
    state.balances.set(key, balance);
    byKey.set(lookup, transaction.id);
    return { transaction, balance, applied: true };
  }

  async appendLedgerEntry(
    environment: LudoEnvironment,
    input: LudoLedgerAppendInput,
  ): Promise<LudoLedgerAppendResult> {
    return this.serialize(environment, () => this.appendLedgerEntrySync(environment, input));
  }

  async applyProgressionAndLedger(
    environment: LudoEnvironment,
    input: LudoApplyProgressionAndLedgerInput,
  ): Promise<LudoApplyProgressionAndLedgerResult> {
    return this.serialize(environment, () => {
      const progression: LudoProgressionRow = {
        environment,
        subject: input.subject,
        xp: input.xp,
        level: input.level,
        updatedAt: input.now,
      };
      this.state(environment).progression.set(input.subject, progression);
      const ledgerResults = input.ledgerEntries.map((entry) =>
        this.appendLedgerEntrySync(environment, {
          ...entry,
          subject: input.subject,
          now: input.now,
        }),
      );
      return { progression, ledgerResults };
    });
  }

  async recordXpClaim(
    environment: LudoEnvironment,
    row: Omit<LudoXpClaimRow, "environment" | "createdAt">,
    now: string,
  ): Promise<{ claim: LudoXpClaimRow; applied: boolean }> {
    return this.serialize(environment, () => {
      const state = this.state(environment);
      const key = xpClaimKey(row.subject, row.claimId);
      const existing = state.xpClaims.get(key);
      if (existing) return { claim: existing, applied: false };
      const claim: LudoXpClaimRow = { ...row, environment, createdAt: now };
      state.xpClaims.set(key, claim);
      return { claim, applied: true };
    });
  }

  async sumXpClaimed(
    environment: LudoEnvironment,
    subject: string,
    claimDate: string,
  ): Promise<number> {
    return Array.from(this.state(environment).xpClaims.values())
      .filter((row) => row.subject === subject && row.claimDate === claimDate)
      .reduce((total, row) => total + row.xpDelta, 0);
  }

  async recordXpClaimWithCap(
    environment: LudoEnvironment,
    input: {
      subject: string;
      claimId: string;
      xpDelta: number;
      claimDate: string;
      dailyCap: number;
    },
    now: string,
  ): Promise<LudoRecordXpClaimWithCapResult> {
    // Single `serialize()` call: the duplicate check, the daily-cap sum
    // re-read, and the insert all happen inside one queued operation, so
    // no concurrent call for the same environment can observe the sum
    // before this claim's row lands.
    return this.serialize(environment, () => {
      const state = this.state(environment);
      const key = xpClaimKey(input.subject, input.claimId);
      const existing = state.xpClaims.get(key);
      if (existing) return { outcome: "duplicate", claim: existing };

      const totalClaimedToday = Array.from(state.xpClaims.values())
        .filter((row) => row.subject === input.subject && row.claimDate === input.claimDate)
        .reduce((total, row) => total + row.xpDelta, 0);
      if (totalClaimedToday + input.xpDelta > input.dailyCap) {
        return { outcome: "cap_exceeded", totalClaimedToday };
      }

      const claim: LudoXpClaimRow = {
        environment,
        subject: input.subject,
        claimId: input.claimId,
        xpDelta: input.xpDelta,
        claimDate: input.claimDate,
        createdAt: now,
      };
      state.xpClaims.set(key, claim);
      return { outcome: "recorded", claim };
    });
  }

  async getBalance(
    environment: LudoEnvironment,
    subject: string,
    currency: LudoCurrency,
  ): Promise<number> {
    return this.state(environment).balances.get(balanceKey(subject, currency))?.balance ?? 0;
  }

  async listWalletTransactions(
    environment: LudoEnvironment,
    subject: string,
    currency: LudoCurrency,
  ): Promise<LudoWalletTransactionRow[]> {
    return this.state(environment).transactions.filter(
      (row) => row.subject === subject && row.currency === currency,
    );
  }

  async listInventory(environment: LudoEnvironment, subject: string): Promise<LudoInventoryRow[]> {
    return Array.from(this.state(environment).inventory.values()).filter(
      (row) => row.subject === subject,
    );
  }

  async grantInventoryItem(
    environment: LudoEnvironment,
    row: Omit<LudoInventoryRow, "environment">,
  ): Promise<LudoInventoryRow> {
    return this.serialize(environment, () => {
      const state = this.state(environment);
      const key = inventoryKey(row.subject, row.itemId);
      const existing = state.inventory.get(key);
      if (existing) return existing;
      const full: LudoInventoryRow = { ...row, environment };
      state.inventory.set(key, full);
      return full;
    });
  }

  async getProgression(
    environment: LudoEnvironment,
    subject: string,
  ): Promise<LudoProgressionRow | null> {
    return this.state(environment).progression.get(subject) ?? null;
  }

  async setProgression(
    environment: LudoEnvironment,
    subject: string,
    xp: number,
    level: number,
    now: string,
  ): Promise<LudoProgressionRow> {
    return this.serialize(environment, () => {
      const row: LudoProgressionRow = { environment, subject, xp, level, updatedAt: now };
      this.state(environment).progression.set(subject, row);
      return row;
    });
  }

  async getDailyRewardState(
    environment: LudoEnvironment,
    subject: string,
  ): Promise<LudoDailyRewardStateRow | null> {
    return this.state(environment).dailyRewardState.get(subject) ?? null;
  }

  async setDailyRewardState(
    environment: LudoEnvironment,
    row: Omit<LudoDailyRewardStateRow, "environment">,
  ): Promise<LudoDailyRewardStateRow> {
    return this.serialize(environment, () => {
      const full: LudoDailyRewardStateRow = { ...row, environment };
      this.state(environment).dailyRewardState.set(row.subject, full);
      return full;
    });
  }

  async recordAdClaim(
    environment: LudoEnvironment,
    row: Omit<LudoAdRewardClaimRow, "environment" | "createdAt">,
    now: string,
  ): Promise<{ claim: LudoAdRewardClaimRow; applied: boolean }> {
    return this.serialize(environment, () => {
      const state = this.state(environment);
      const key = adClaimKey(row.subject, row.adTransactionId);
      const existing = state.adClaims.get(key);
      if (existing) return { claim: existing, applied: false };
      const claim: LudoAdRewardClaimRow = { ...row, environment, createdAt: now };
      state.adClaims.set(key, claim);
      return { claim, applied: true };
    });
  }

  async countAdClaims(
    environment: LudoEnvironment,
    subject: string,
    rewardType: LudoAdRewardType,
    claimDate: string,
  ): Promise<number> {
    return Array.from(this.state(environment).adClaims.values()).filter(
      (row) =>
        row.subject === subject && row.rewardType === rewardType && row.claimDate === claimDate,
    ).length;
  }

  async createEscrow(
    environment: LudoEnvironment,
    row: Omit<LudoCoinTableEscrowRow, "environment" | "status" | "resolvedAt">,
  ): Promise<LudoCoinTableEscrowRow> {
    return this.serialize(environment, () => {
      const state = this.state(environment);
      const existing = state.escrow.get(row.matchId);
      if (existing) return existing;
      const full: LudoCoinTableEscrowRow = {
        ...row,
        environment,
        status: "held",
        resolvedAt: null,
      };
      state.escrow.set(row.matchId, full);
      return full;
    });
  }

  async getEscrow(
    environment: LudoEnvironment,
    matchId: string,
  ): Promise<LudoCoinTableEscrowRow | null> {
    return this.state(environment).escrow.get(matchId) ?? null;
  }

  async resolveEscrow(
    environment: LudoEnvironment,
    matchId: string,
    status: Exclude<LudoCoinTableEscrowStatus, "held">,
    resolvedAt: string,
  ): Promise<LudoCoinTableEscrowRow> {
    return this.serialize(environment, () => {
      const state = this.state(environment);
      const existing = state.escrow.get(matchId);
      if (!existing) throw new Error(`ludo economy store: no escrow row for match ${matchId}`);
      const updated: LudoCoinTableEscrowRow = { ...existing, status, resolvedAt };
      state.escrow.set(matchId, updated);
      return updated;
    });
  }

  async processRevenueCatEvent(
    environment: LudoEnvironment,
    input: LudoProcessRevenueCatEventInput,
  ): Promise<LudoProcessRevenueCatEventResult> {
    return this.serialize(environment, () => {
      const state = this.state(environment);
      if (state.revenueCatEvents.has(input.eventId)) {
        return { applied: false, ledgerResults: [], subscription: null };
      }
      state.revenueCatEvents.set(input.eventId, {
        environment,
        eventId: input.eventId,
        eventType: input.eventType,
        productId: input.productId,
        subject: input.subject,
        createdAt: input.now,
      });
      const ledgerResults = input.ledgerEntries.map((entry) =>
        this.appendLedgerEntrySync(environment, {
          ...entry,
          subject: input.subject,
          now: input.now,
        }),
      );
      let subscription: LudoSubscriptionRow | null = null;
      if (input.subscription) {
        subscription = {
          ...input.subscription,
          environment,
          subject: input.subject,
          updatedAt: input.now,
        };
        state.subscriptions.set(input.subject, subscription);
      }
      return { applied: true, ledgerResults, subscription };
    });
  }

  async getSubscription(
    environment: LudoEnvironment,
    subject: string,
  ): Promise<LudoSubscriptionRow | null> {
    return this.state(environment).subscriptions.get(subject) ?? null;
  }
}
