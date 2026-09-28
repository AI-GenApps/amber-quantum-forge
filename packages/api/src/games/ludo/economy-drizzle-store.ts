import {
  and,
  db,
  eq,
  ludoAdRewardClaims,
  ludoBalances,
  ludoCoinTableEscrow,
  ludoDailyRewardState,
  ludoInventory,
  ludoProgression,
  ludoWalletTransactions,
  ludoXpClaims,
} from "@repo/db";
import type { LudoEnvironment } from "./contracts";
import type { LudoCoinTableTier, LudoCurrency, LudoWalletReason } from "./economy-config";
import {
  getSubscriptionImpl,
  processRevenueCatEventImpl,
} from "./economy-drizzle-store-revenuecat";
import {
  LUDO_ECONOMY_STORE_APP_ID,
  type LudoAdRewardClaimRow,
  type LudoAdRewardType,
  type LudoApplyProgressionAndLedgerInput,
  type LudoApplyProgressionAndLedgerResult,
  type LudoBalanceRow,
  type LudoCoinTableEscrowRow,
  type LudoCoinTableEscrowStatus,
  type LudoDailyRewardStateRow,
  type LudoEconomyStore,
  type LudoInventoryItemType,
  type LudoInventoryRow,
  type LudoLedgerAppendInput,
  type LudoLedgerAppendResult,
  type LudoProcessRevenueCatEventInput,
  type LudoProcessRevenueCatEventResult,
  type LudoProgressionRow,
  type LudoSubscriptionRow,
  type LudoWalletTransactionRow,
  type LudoXpClaimRow,
} from "./economy-store";

/** Matches `DrizzleLudoStore`'s `LudoDrizzleTransaction` alias: the
 * transaction handle type Drizzle hands `db.transaction`'s callback. */
type LudoEconomyDrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function toDate(value: string | null): Date | null {
  return value === null ? null : new Date(value);
}

function toIso(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

/**
 * Targeted per-row Drizzle implementation of `LudoEconomyStore`, matching
 * `DrizzleLudoStore`'s discipline: every write is a direct, keyed upsert
 * inside a transaction, never a whole-scope read-and-rewrite. The ledger
 * invariant (`SUM(delta) == balance`) is enforced by `appendLedgerEntry`
 * reading the current balance and writing the ledger insert + balance
 * upsert inside the same transaction, guarded by the unique idempotency
 * index on `ludo_wallet_transactions`.
 */
export class DrizzleLudoEconomyStore implements LudoEconomyStore {
  constructor(private readonly database: typeof db = db) {}

  async appendLedgerEntry(
    environment: LudoEnvironment,
    input: LudoLedgerAppendInput,
  ): Promise<LudoLedgerAppendResult> {
    return this.database.transaction((transaction) =>
      this.appendLedgerEntryTx(transaction, environment, input),
    );
  }

  /** Core of `appendLedgerEntry`, scoped to a caller-supplied transaction
   * so `applyProgressionAndLedger` can run the progression write and every
   * reward ledger entry inside one SQL transaction instead of nesting
   * `this.database.transaction()` calls (which Drizzle does not support
   * as independent commits). */
  private async appendLedgerEntryTx(
    transaction: LudoEconomyDrizzleTransaction,
    environment: LudoEnvironment,
    input: LudoLedgerAppendInput,
  ): Promise<LudoLedgerAppendResult> {
    {
      const [existing] = await transaction
        .select()
        .from(ludoWalletTransactions)
        .where(
          and(
            eq(ludoWalletTransactions.appId, LUDO_ECONOMY_STORE_APP_ID),
            eq(ludoWalletTransactions.environment, environment),
            eq(ludoWalletTransactions.subject, input.subject),
            eq(ludoWalletTransactions.idempotencyKey, input.idempotencyKey),
          ),
        )
        .limit(1);
      if (existing) {
        const [balanceRow] = await transaction
          .select()
          .from(ludoBalances)
          .where(
            and(
              eq(ludoBalances.appId, LUDO_ECONOMY_STORE_APP_ID),
              eq(ludoBalances.environment, environment),
              eq(ludoBalances.subject, input.subject),
              eq(ludoBalances.currency, input.currency),
            ),
          )
          .limit(1);
        if (!balanceRow) throw new Error("ludo economy store: transaction without a balance row");
        return {
          transaction: toWalletTransactionRow(existing),
          balance: toBalanceRow(balanceRow),
          applied: false,
        };
      }
      const [currentBalance] = await transaction
        .select()
        .from(ludoBalances)
        .where(
          and(
            eq(ludoBalances.appId, LUDO_ECONOMY_STORE_APP_ID),
            eq(ludoBalances.environment, environment),
            eq(ludoBalances.subject, input.subject),
            eq(ludoBalances.currency, input.currency),
          ),
        )
        .limit(1);
      const balanceAfter = (currentBalance?.balance ?? 0) + input.delta;
      const id = `wtx_${environment}_${input.subject}_${input.idempotencyKey}`;
      const now = toDate(input.now) as Date;
      const [inserted] = await transaction
        .insert(ludoWalletTransactions)
        .values({
          id,
          appId: LUDO_ECONOMY_STORE_APP_ID,
          environment,
          subject: input.subject,
          currency: input.currency,
          delta: input.delta,
          balanceAfter,
          reason: input.reason,
          sourceRef: input.sourceRef ?? null,
          idempotencyKey: input.idempotencyKey,
          createdAt: now,
        })
        .onConflictDoNothing({
          target: [
            ludoWalletTransactions.appId,
            ludoWalletTransactions.environment,
            ludoWalletTransactions.subject,
            ludoWalletTransactions.idempotencyKey,
          ],
        })
        .returning();
      if (!inserted) {
        // Lost a race against a concurrent writer using the same
        // idempotency key: re-read what it wrote instead of double-applying.
        const [raced] = await transaction
          .select()
          .from(ludoWalletTransactions)
          .where(
            and(
              eq(ludoWalletTransactions.appId, LUDO_ECONOMY_STORE_APP_ID),
              eq(ludoWalletTransactions.environment, environment),
              eq(ludoWalletTransactions.subject, input.subject),
              eq(ludoWalletTransactions.idempotencyKey, input.idempotencyKey),
            ),
          )
          .limit(1);
        if (!raced) throw new Error("ludo economy store: idempotent insert raced but row missing");
        const [balanceRow] = await transaction
          .select()
          .from(ludoBalances)
          .where(
            and(
              eq(ludoBalances.appId, LUDO_ECONOMY_STORE_APP_ID),
              eq(ludoBalances.environment, environment),
              eq(ludoBalances.subject, input.subject),
              eq(ludoBalances.currency, input.currency),
            ),
          )
          .limit(1);
        if (!balanceRow)
          throw new Error("ludo economy store: raced transaction without a balance row");
        return {
          transaction: toWalletTransactionRow(raced),
          balance: toBalanceRow(balanceRow),
          applied: false,
        };
      }
      const balanceValues = {
        appId: LUDO_ECONOMY_STORE_APP_ID,
        environment,
        subject: input.subject,
        currency: input.currency,
        balance: balanceAfter,
        updatedAt: now,
      };
      await transaction
        .insert(ludoBalances)
        .values(balanceValues)
        .onConflictDoUpdate({
          target: [
            ludoBalances.appId,
            ludoBalances.environment,
            ludoBalances.subject,
            ludoBalances.currency,
          ],
          set: { balance: balanceValues.balance, updatedAt: balanceValues.updatedAt },
        });
      return {
        transaction: toWalletTransactionRow(inserted),
        balance: toBalanceRow(balanceValues),
        applied: true,
      };
    }
  }

  async applyProgressionAndLedger(
    environment: LudoEnvironment,
    input: LudoApplyProgressionAndLedgerInput,
  ): Promise<LudoApplyProgressionAndLedgerResult> {
    return this.database.transaction(async (transaction) => {
      const progressionValues = {
        appId: LUDO_ECONOMY_STORE_APP_ID,
        environment,
        subject: input.subject,
        xp: input.xp,
        level: input.level,
        updatedAt: toDate(input.now) as Date,
      };
      await transaction
        .insert(ludoProgression)
        .values(progressionValues)
        .onConflictDoUpdate({
          target: [ludoProgression.appId, ludoProgression.environment, ludoProgression.subject],
          set: {
            xp: progressionValues.xp,
            level: progressionValues.level,
            updatedAt: progressionValues.updatedAt,
          },
        });
      const progression: LudoProgressionRow = {
        environment,
        subject: input.subject,
        xp: input.xp,
        level: input.level,
        updatedAt: input.now,
      };
      const ledgerResults: LudoLedgerAppendResult[] = [];
      for (const entry of input.ledgerEntries) {
        const result = await this.appendLedgerEntryTx(transaction, environment, {
          ...entry,
          subject: input.subject,
          now: input.now,
        });
        ledgerResults.push(result);
      }
      return { progression, ledgerResults };
    });
  }

  async recordXpClaim(
    environment: LudoEnvironment,
    row: Omit<LudoXpClaimRow, "environment" | "createdAt">,
    now: string,
  ): Promise<{ claim: LudoXpClaimRow; applied: boolean }> {
    return this.database.transaction(async (transaction) => {
      const [existing] = await transaction
        .select()
        .from(ludoXpClaims)
        .where(
          and(
            eq(ludoXpClaims.appId, LUDO_ECONOMY_STORE_APP_ID),
            eq(ludoXpClaims.environment, environment),
            eq(ludoXpClaims.subject, row.subject),
            eq(ludoXpClaims.claimId, row.claimId),
          ),
        )
        .limit(1);
      if (existing) return { claim: toXpClaimRow(existing, environment), applied: false };
      const values = {
        appId: LUDO_ECONOMY_STORE_APP_ID,
        environment,
        subject: row.subject,
        claimId: row.claimId,
        xpDelta: row.xpDelta,
        claimDate: row.claimDate,
        createdAt: toDate(now) as Date,
      };
      await transaction.insert(ludoXpClaims).values(values);
      return { claim: toXpClaimRow(values, environment), applied: true };
    });
  }

  async sumXpClaimed(
    environment: LudoEnvironment,
    subject: string,
    claimDate: string,
  ): Promise<number> {
    const rows = await this.database
      .select()
      .from(ludoXpClaims)
      .where(
        and(
          eq(ludoXpClaims.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoXpClaims.environment, environment),
          eq(ludoXpClaims.subject, subject),
          eq(ludoXpClaims.claimDate, claimDate),
        ),
      );
    return rows.reduce((total, row) => total + row.xpDelta, 0);
  }

  async getBalance(
    environment: LudoEnvironment,
    subject: string,
    currency: LudoCurrency,
  ): Promise<number> {
    const [row] = await this.database
      .select()
      .from(ludoBalances)
      .where(
        and(
          eq(ludoBalances.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoBalances.environment, environment),
          eq(ludoBalances.subject, subject),
          eq(ludoBalances.currency, currency),
        ),
      )
      .limit(1);
    return row?.balance ?? 0;
  }

  async listWalletTransactions(
    environment: LudoEnvironment,
    subject: string,
    currency: LudoCurrency,
  ): Promise<LudoWalletTransactionRow[]> {
    const rows = await this.database
      .select()
      .from(ludoWalletTransactions)
      .where(
        and(
          eq(ludoWalletTransactions.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoWalletTransactions.environment, environment),
          eq(ludoWalletTransactions.subject, subject),
          eq(ludoWalletTransactions.currency, currency),
        ),
      );
    return rows.map(toWalletTransactionRow);
  }

  async listInventory(environment: LudoEnvironment, subject: string): Promise<LudoInventoryRow[]> {
    const rows = await this.database
      .select()
      .from(ludoInventory)
      .where(
        and(
          eq(ludoInventory.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoInventory.environment, environment),
          eq(ludoInventory.subject, subject),
        ),
      );
    return rows.map((row) => ({
      environment,
      subject: row.subject,
      itemId: row.itemId,
      itemType: row.itemType as LudoInventoryItemType,
      acquiredVia: row.acquiredVia,
      acquiredAt: row.acquiredAt.toISOString(),
    }));
  }

  async grantInventoryItem(
    environment: LudoEnvironment,
    row: Omit<LudoInventoryRow, "environment">,
  ): Promise<LudoInventoryRow> {
    const values = {
      appId: LUDO_ECONOMY_STORE_APP_ID,
      environment,
      subject: row.subject,
      itemId: row.itemId,
      itemType: row.itemType,
      acquiredVia: row.acquiredVia,
      acquiredAt: toDate(row.acquiredAt) as Date,
    };
    await this.database
      .insert(ludoInventory)
      .values(values)
      .onConflictDoNothing({
        target: [
          ludoInventory.appId,
          ludoInventory.environment,
          ludoInventory.subject,
          ludoInventory.itemId,
        ],
      });
    const [existing] = await this.database
      .select()
      .from(ludoInventory)
      .where(
        and(
          eq(ludoInventory.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoInventory.environment, environment),
          eq(ludoInventory.subject, row.subject),
          eq(ludoInventory.itemId, row.itemId),
        ),
      )
      .limit(1);
    if (!existing) throw new Error("ludo economy store: inventory row missing after grant");
    return {
      environment,
      subject: existing.subject,
      itemId: existing.itemId,
      itemType: existing.itemType as LudoInventoryItemType,
      acquiredVia: existing.acquiredVia,
      acquiredAt: existing.acquiredAt.toISOString(),
    };
  }

  async getProgression(
    environment: LudoEnvironment,
    subject: string,
  ): Promise<LudoProgressionRow | null> {
    const [row] = await this.database
      .select()
      .from(ludoProgression)
      .where(
        and(
          eq(ludoProgression.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoProgression.environment, environment),
          eq(ludoProgression.subject, subject),
        ),
      )
      .limit(1);
    return row
      ? {
          environment,
          subject: row.subject,
          xp: row.xp,
          level: row.level,
          updatedAt: row.updatedAt.toISOString(),
        }
      : null;
  }

  async setProgression(
    environment: LudoEnvironment,
    subject: string,
    xp: number,
    level: number,
    now: string,
  ): Promise<LudoProgressionRow> {
    const values = {
      appId: LUDO_ECONOMY_STORE_APP_ID,
      environment,
      subject,
      xp,
      level,
      updatedAt: toDate(now) as Date,
    };
    await this.database
      .insert(ludoProgression)
      .values(values)
      .onConflictDoUpdate({
        target: [ludoProgression.appId, ludoProgression.environment, ludoProgression.subject],
        set: { xp: values.xp, level: values.level, updatedAt: values.updatedAt },
      });
    return { environment, subject, xp, level, updatedAt: now };
  }

  async getDailyRewardState(
    environment: LudoEnvironment,
    subject: string,
  ): Promise<LudoDailyRewardStateRow | null> {
    const [row] = await this.database
      .select()
      .from(ludoDailyRewardState)
      .where(
        and(
          eq(ludoDailyRewardState.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoDailyRewardState.environment, environment),
          eq(ludoDailyRewardState.subject, subject),
        ),
      )
      .limit(1);
    return row
      ? {
          environment,
          subject: row.subject,
          lastClaimDate: row.lastClaimDate,
          streakDay: row.streakDay,
          updatedAt: row.updatedAt.toISOString(),
        }
      : null;
  }

  async setDailyRewardState(
    environment: LudoEnvironment,
    row: Omit<LudoDailyRewardStateRow, "environment">,
  ): Promise<LudoDailyRewardStateRow> {
    const values = {
      appId: LUDO_ECONOMY_STORE_APP_ID,
      environment,
      subject: row.subject,
      lastClaimDate: row.lastClaimDate,
      streakDay: row.streakDay,
      updatedAt: toDate(row.updatedAt) as Date,
    };
    await this.database
      .insert(ludoDailyRewardState)
      .values(values)
      .onConflictDoUpdate({
        target: [
          ludoDailyRewardState.appId,
          ludoDailyRewardState.environment,
          ludoDailyRewardState.subject,
        ],
        set: {
          lastClaimDate: values.lastClaimDate,
          streakDay: values.streakDay,
          updatedAt: values.updatedAt,
        },
      });
    return { ...row, environment };
  }

  async recordAdClaim(
    environment: LudoEnvironment,
    row: Omit<LudoAdRewardClaimRow, "environment" | "createdAt">,
    now: string,
  ): Promise<{ claim: LudoAdRewardClaimRow; applied: boolean }> {
    return this.database.transaction(async (transaction) => {
      const [existing] = await transaction
        .select()
        .from(ludoAdRewardClaims)
        .where(
          and(
            eq(ludoAdRewardClaims.appId, LUDO_ECONOMY_STORE_APP_ID),
            eq(ludoAdRewardClaims.environment, environment),
            eq(ludoAdRewardClaims.subject, row.subject),
            eq(ludoAdRewardClaims.adTransactionId, row.adTransactionId),
          ),
        )
        .limit(1);
      if (existing) return { claim: toAdClaimRow(existing, environment), applied: false };
      const values = {
        appId: LUDO_ECONOMY_STORE_APP_ID,
        environment,
        subject: row.subject,
        adTransactionId: row.adTransactionId,
        rewardType: row.rewardType,
        claimDate: row.claimDate,
        createdAt: toDate(now) as Date,
      };
      await transaction.insert(ludoAdRewardClaims).values(values);
      return { claim: toAdClaimRow(values, environment), applied: true };
    });
  }

  async countAdClaims(
    environment: LudoEnvironment,
    subject: string,
    rewardType: LudoAdRewardType,
    claimDate: string,
  ): Promise<number> {
    const rows = await this.database
      .select()
      .from(ludoAdRewardClaims)
      .where(
        and(
          eq(ludoAdRewardClaims.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoAdRewardClaims.environment, environment),
          eq(ludoAdRewardClaims.subject, subject),
          eq(ludoAdRewardClaims.rewardType, rewardType),
          eq(ludoAdRewardClaims.claimDate, claimDate),
        ),
      );
    return rows.length;
  }

  async createEscrow(
    environment: LudoEnvironment,
    row: Omit<LudoCoinTableEscrowRow, "environment" | "status" | "resolvedAt">,
  ): Promise<LudoCoinTableEscrowRow> {
    const values = {
      appId: LUDO_ECONOMY_STORE_APP_ID,
      environment,
      matchId: row.matchId,
      tier: row.tier,
      pot: row.pot,
      rake: row.rake,
      status: "held" as const,
      createdAt: toDate(row.createdAt) as Date,
      resolvedAt: null,
    };
    await this.database
      .insert(ludoCoinTableEscrow)
      .values(values)
      .onConflictDoNothing({
        target: [
          ludoCoinTableEscrow.appId,
          ludoCoinTableEscrow.environment,
          ludoCoinTableEscrow.matchId,
        ],
      });
    const existing = await this.getEscrow(environment, row.matchId);
    if (!existing) throw new Error("ludo economy store: escrow row missing after create");
    return existing;
  }

  async getEscrow(
    environment: LudoEnvironment,
    matchId: string,
  ): Promise<LudoCoinTableEscrowRow | null> {
    const [row] = await this.database
      .select()
      .from(ludoCoinTableEscrow)
      .where(
        and(
          eq(ludoCoinTableEscrow.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoCoinTableEscrow.environment, environment),
          eq(ludoCoinTableEscrow.matchId, matchId),
        ),
      )
      .limit(1);
    return row
      ? {
          environment,
          matchId: row.matchId,
          tier: row.tier as LudoCoinTableTier,
          pot: row.pot,
          rake: row.rake,
          status: row.status as LudoCoinTableEscrowStatus,
          createdAt: row.createdAt.toISOString(),
          resolvedAt: toIso(row.resolvedAt),
        }
      : null;
  }

  async resolveEscrow(
    environment: LudoEnvironment,
    matchId: string,
    status: Exclude<LudoCoinTableEscrowStatus, "held">,
    resolvedAt: string,
  ): Promise<LudoCoinTableEscrowRow> {
    await this.database
      .update(ludoCoinTableEscrow)
      .set({ status, resolvedAt: toDate(resolvedAt) as Date })
      .where(
        and(
          eq(ludoCoinTableEscrow.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoCoinTableEscrow.environment, environment),
          eq(ludoCoinTableEscrow.matchId, matchId),
        ),
      );
    const updated = await this.getEscrow(environment, matchId);
    if (!updated) throw new Error(`ludo economy store: no escrow row for match ${matchId}`);
    return updated;
  }

  async processRevenueCatEvent(
    environment: LudoEnvironment,
    input: LudoProcessRevenueCatEventInput,
  ): Promise<LudoProcessRevenueCatEventResult> {
    return processRevenueCatEventImpl(this.database, environment, input, (transaction, env, i) =>
      this.appendLedgerEntryTx(transaction, env, i),
    );
  }

  async getSubscription(
    environment: LudoEnvironment,
    subject: string,
  ): Promise<LudoSubscriptionRow | null> {
    return getSubscriptionImpl(this.database, environment, subject);
  }
}

function toWalletTransactionRow(row: {
  id: string;
  environment: string;
  subject: string;
  currency: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  sourceRef: string | null;
  idempotencyKey: string;
  createdAt: Date;
}): LudoWalletTransactionRow {
  return {
    id: row.id,
    environment: row.environment as LudoEnvironment,
    subject: row.subject,
    currency: row.currency as LudoCurrency,
    delta: row.delta,
    balanceAfter: row.balanceAfter,
    reason: row.reason as LudoWalletReason,
    sourceRef: row.sourceRef,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt.toISOString(),
  };
}

function toBalanceRow(row: {
  appId?: string;
  environment: string;
  subject: string;
  currency: string;
  balance: number;
  updatedAt: Date;
}): LudoBalanceRow {
  return {
    environment: row.environment as LudoEnvironment,
    subject: row.subject,
    currency: row.currency as LudoCurrency,
    balance: row.balance,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toXpClaimRow(
  row: {
    subject: string;
    claimId: string;
    xpDelta: number;
    claimDate: string;
    createdAt: Date;
  },
  environment: LudoEnvironment,
): LudoXpClaimRow {
  return {
    environment,
    subject: row.subject,
    claimId: row.claimId,
    xpDelta: row.xpDelta,
    claimDate: row.claimDate,
    createdAt: row.createdAt.toISOString(),
  };
}

function toAdClaimRow(
  row: {
    subject: string;
    adTransactionId: string;
    rewardType: string;
    claimDate: string;
    createdAt: Date;
  },
  environment: LudoEnvironment,
): LudoAdRewardClaimRow {
  return {
    environment,
    subject: row.subject,
    adTransactionId: row.adTransactionId,
    rewardType: row.rewardType as LudoAdRewardType,
    claimDate: row.claimDate,
    createdAt: row.createdAt.toISOString(),
  };
}
