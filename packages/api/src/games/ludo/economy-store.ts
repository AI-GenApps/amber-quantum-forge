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
}

interface EconomyEnvironmentState {
  transactions: LudoWalletTransactionRow[];
  balances: Map<string, LudoBalanceRow>;
  inventory: Map<string, LudoInventoryRow>;
  progression: Map<string, LudoProgressionRow>;
  dailyRewardState: Map<string, LudoDailyRewardStateRow>;
  adClaims: Map<string, LudoAdRewardClaimRow>;
  escrow: Map<string, LudoCoinTableEscrowRow>;
}

function emptyEnvironmentState(): EconomyEnvironmentState {
  return {
    transactions: [],
    balances: new Map(),
    inventory: new Map(),
    progression: new Map(),
    dailyRewardState: new Map(),
    adClaims: new Map(),
    escrow: new Map(),
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

  async appendLedgerEntry(
    environment: LudoEnvironment,
    input: LudoLedgerAppendInput,
  ): Promise<LudoLedgerAppendResult> {
    return this.serialize(environment, () => {
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
}
