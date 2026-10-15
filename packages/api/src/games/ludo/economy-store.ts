import type { LudoEnvironment } from "./contracts";
import type { LudoCurrency } from "./economy-config";
import { dailyRewardLedgerEntries, planDailyRewardClaim } from "./economy-daily-reward";
import type {
  LudoPurchaseInventoryItemInput,
  LudoPurchaseInventoryItemResult,
} from "./economy-purchase";
import {
  adClaimKey,
  balanceKey,
  freePlayWinKey,
  idempotencyKeyLookup,
  inventoryKey,
  xpClaimKey,
} from "./economy-store-keys";

import type {
  LudoAdRewardClaimRow,
  LudoAdRewardType,
  LudoApplyProgressionAndLedgerInput,
  LudoApplyProgressionAndLedgerResult,
  LudoBalanceRow,
  LudoClaimAdRewardInput,
  LudoClaimAdRewardResult,
  LudoClaimDailyRewardInput,
  LudoClaimDailyRewardResult,
  LudoClaimFreePlayWinInput,
  LudoClaimFreePlayWinResult,
  LudoCoinTableEscrowRow,
  LudoCoinTableEscrowStatus,
  LudoDailyRewardStateRow,
  LudoEconomyStore,
  LudoFreePlayWinClaimRow,
  LudoInventoryRow,
  LudoLedgerAppendInput,
  LudoLedgerAppendResult,
  LudoProcessRevenueCatEventInput,
  LudoProcessRevenueCatEventResult,
  LudoProgressionRow,
  LudoRecordXpClaimWithCapResult,
  LudoRevenueCatEventRow,
  LudoSubscriptionRow,
  LudoWalletTransactionRow,
  LudoXpClaimRow,
} from "./economy-store-types";

export const LUDO_ECONOMY_STORE_APP_ID = "ludo" as const;

export type {
  LudoAdRewardClaimRow,
  LudoAdRewardType,
  LudoApplyProgressionAndLedgerInput,
  LudoApplyProgressionAndLedgerResult,
  LudoBalanceRow,
  LudoClaimAdRewardInput,
  LudoClaimAdRewardResult,
  LudoClaimDailyRewardInput,
  LudoClaimDailyRewardResult,
  LudoClaimFreePlayWinInput,
  LudoClaimFreePlayWinResult,
  LudoCoinTableEscrowRow,
  LudoCoinTableEscrowStatus,
  LudoDailyRewardStateRow,
  LudoEconomyStore,
  LudoFreePlayWinClaimRow,
  LudoInventoryItemType,
  LudoInventoryRow,
  LudoLedgerAppendInput,
  LudoLedgerAppendResult,
  LudoProcessRevenueCatEventInput,
  LudoProcessRevenueCatEventResult,
  LudoProgressionRow,
  LudoRecordXpClaimWithCapResult,
  LudoRevenueCatEventRow,
  LudoSubscriptionRow,
  LudoSubscriptionStatus,
  LudoWalletTransactionRow,
  LudoXpClaimRow,
} from "./economy-store-types";

interface EconomyEnvironmentState {
  transactions: LudoWalletTransactionRow[];
  balances: Map<string, LudoBalanceRow>;
  inventory: Map<string, LudoInventoryRow>;
  progression: Map<string, LudoProgressionRow>;
  dailyRewardState: Map<string, LudoDailyRewardStateRow>;
  adClaims: Map<string, LudoAdRewardClaimRow>;
  freePlayWinClaims: Map<string, LudoFreePlayWinClaimRow>;
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
    freePlayWinClaims: new Map(),
    xpClaims: new Map(),
    escrow: new Map(),
    revenueCatEvents: new Map(),
    subscriptions: new Map(),
  };
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

  /** Synchronous core of `appendLedgerEntry`, reusable inside other
   * serialized operations without nesting `serialize` calls. */
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
    // One `serialize()` call: duplicate check, cap sum and insert are atomic.
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

  async purchaseInventoryItem(
    environment: LudoEnvironment,
    input: LudoPurchaseInventoryItemInput,
  ): Promise<LudoPurchaseInventoryItemResult> {
    return this.serialize(environment, () => {
      const state = this.state(environment);
      const ownedKey = inventoryKey(input.subject, input.itemId);
      const balanceOf = () =>
        state.balances.get(balanceKey(input.subject, input.currency))?.balance ?? 0;
      const lookup = idempotencyKeyLookup(input.subject, input.idempotencyKey);
      const replayId = this.appliedIdempotencyKeys.get(environment)?.get(lookup);
      if (replayId) {
        const original = state.transactions.find((row) => row.id === replayId);
        const inventory = state.inventory.get(ownedKey);
        if (!original || original.sourceRef !== input.itemId || !inventory) {
          return { outcome: "idempotency_conflict" };
        }
        return { outcome: "duplicate", inventory, balance: balanceOf() };
      }
      const owned = state.inventory.get(ownedKey);
      if (owned) return { outcome: "already_owned", inventory: owned };
      if (balanceOf() < input.price) {
        return { outcome: "insufficient_balance", balance: balanceOf() };
      }
      const ledger = this.appendLedgerEntrySync(environment, {
        subject: input.subject,
        currency: input.currency,
        delta: -input.price,
        reason: "store_purchase",
        sourceRef: input.itemId,
        idempotencyKey: input.idempotencyKey,
        now: input.now,
      });
      const inventory: LudoInventoryRow = {
        environment,
        subject: input.subject,
        itemId: input.itemId,
        itemType: input.itemType,
        acquiredVia: "store_purchase",
        acquiredAt: input.now,
      };
      state.inventory.set(ownedKey, inventory);
      return {
        outcome: "purchased",
        inventory,
        transaction: ledger.transaction,
        balance: ledger.balance,
      };
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

  async claimAdRewardWithCap(
    environment: LudoEnvironment,
    input: LudoClaimAdRewardInput,
  ): Promise<LudoClaimAdRewardResult> {
    // One `serialize()` call: duplicate check, cap count, claim insert and
    // ledger credit are atomic with respect to every other store write.
    return this.serialize(environment, () => {
      const state = this.state(environment);
      const key = adClaimKey(input.subject, input.adTransactionId);
      const existing = state.adClaims.get(key);
      if (existing) return { outcome: "duplicate", claim: existing };
      const claimedToday = Array.from(state.adClaims.values()).filter(
        (row) =>
          row.subject === input.subject &&
          row.rewardType === input.rewardType &&
          row.claimDate === input.claimDate,
      ).length;
      if (claimedToday >= input.dailyCap) return { outcome: "cap_exceeded", claimedToday };
      const claim: LudoAdRewardClaimRow = {
        environment,
        subject: input.subject,
        adTransactionId: input.adTransactionId,
        rewardType: input.rewardType,
        claimDate: input.claimDate,
        createdAt: input.now,
      };
      state.adClaims.set(key, claim);
      const ledger = this.appendLedgerEntrySync(environment, {
        subject: input.subject,
        currency: input.rewardType,
        delta: input.amount,
        reason: "rewarded_ad",
        sourceRef: input.adTransactionId,
        idempotencyKey: `rewarded_ad:${input.adTransactionId}`,
        now: input.now,
      });
      return {
        outcome: "credited",
        claim,
        transaction: ledger.transaction,
        balance: ledger.balance,
      };
    });
  }

  async claimFreePlayWinWithCap(
    environment: LudoEnvironment,
    input: LudoClaimFreePlayWinInput,
  ): Promise<LudoClaimFreePlayWinResult> {
    return this.serialize(environment, () => {
      const state = this.state(environment);
      const key = freePlayWinKey(input.subject, input.matchId);
      const existing = state.freePlayWinClaims.get(key);
      if (existing) return { outcome: "duplicate", claim: existing };
      const claimedToday = Array.from(state.freePlayWinClaims.values()).filter(
        (row) => row.subject === input.subject && row.claimDate === input.claimDate,
      ).length;
      if (claimedToday >= input.dailyCap) return { outcome: "cap_exceeded", claimedToday };
      const claim: LudoFreePlayWinClaimRow = {
        environment,
        subject: input.subject,
        matchId: input.matchId,
        claimDate: input.claimDate,
        createdAt: input.now,
      };
      state.freePlayWinClaims.set(key, claim);
      const ledger = this.appendLedgerEntrySync(environment, {
        subject: input.subject,
        currency: "coins",
        delta: input.amount,
        reason: "online_match_win",
        sourceRef: input.matchId,
        idempotencyKey: `online_match_win:${input.matchId}`,
        now: input.now,
      });
      return {
        outcome: "credited",
        claim,
        transaction: ledger.transaction,
        balance: ledger.balance,
      };
    });
  }

  async claimDailyReward(
    environment: LudoEnvironment,
    input: LudoClaimDailyRewardInput,
  ): Promise<LudoClaimDailyRewardResult> {
    return this.serialize(environment, () => {
      const state = this.state(environment);
      const current = state.dailyRewardState.get(input.subject);
      if (current?.lastClaimDate === input.today) {
        return { outcome: "already_claimed", streakDay: current.streakDay };
      }
      const plan = planDailyRewardClaim(current ?? null, input);
      const ledgerEntries = dailyRewardLedgerEntries(input.today, plan);
      for (const entry of ledgerEntries) {
        this.appendLedgerEntrySync(environment, {
          ...entry,
          subject: input.subject,
          now: input.now,
        });
      }
      state.dailyRewardState.set(input.subject, {
        environment,
        subject: input.subject,
        lastClaimDate: input.today,
        streakDay: plan.streakDay,
        updatedAt: input.now,
      });
      const balanceOf = (currency: LudoCurrency) =>
        state.balances.get(balanceKey(input.subject, currency))?.balance ?? 0;
      return {
        outcome: "claimed",
        streakDay: plan.streakDay,
        coinsGranted: plan.coins + plan.bonusCoins,
        diamondsGranted: plan.diamonds + plan.bonusDiamonds,
        bonusCoins: plan.bonusCoins,
        bonusDiamonds: plan.bonusDiamonds,
        coins: balanceOf("coins"),
        diamonds: balanceOf("diamonds"),
      };
    });
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
