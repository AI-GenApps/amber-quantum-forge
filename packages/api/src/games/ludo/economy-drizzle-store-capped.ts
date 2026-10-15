import {
  and,
  type db,
  eq,
  ludoAdRewardClaims,
  ludoBalances,
  ludoDailyRewardState,
  ludoFreePlayWinClaims,
} from "@repo/db";
import type { LudoEnvironment } from "./contracts";
import type { LudoCurrency } from "./economy-config";
import { dailyRewardLedgerEntries, planDailyRewardClaim } from "./economy-daily-reward";
import { lockSubjectWallet } from "./economy-drizzle-store-purchase";
import {
  LUDO_ECONOMY_STORE_APP_ID,
  type LudoAdRewardClaimRow,
  type LudoAdRewardType,
  type LudoClaimAdRewardInput,
  type LudoClaimAdRewardResult,
  type LudoClaimDailyRewardInput,
  type LudoClaimDailyRewardResult,
  type LudoClaimFreePlayWinInput,
  type LudoClaimFreePlayWinResult,
  type LudoFreePlayWinClaimRow,
  type LudoLedgerAppendInput,
  type LudoLedgerAppendResult,
} from "./economy-store";

type LudoEconomyDrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** `DrizzleLudoEconomyStore.appendLedgerEntryTx`, passed in so this module
 * does not need access to the class's private method. */
export type AppendLedgerEntryTx = (
  transaction: LudoEconomyDrizzleTransaction,
  environment: LudoEnvironment,
  input: LudoLedgerAppendInput,
) => Promise<LudoLedgerAppendResult>;

function toAdClaim(
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

function toFreePlayWinClaim(
  row: { subject: string; matchId: string; claimDate: string; createdAt: Date },
  environment: LudoEnvironment,
): LudoFreePlayWinClaimRow {
  return {
    environment,
    subject: row.subject,
    matchId: row.matchId,
    claimDate: row.claimDate,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Atomic rewarded-ad claim for `DrizzleLudoEconomyStore.claimAdRewardWithCap`
 * (task 26h; `recordXpClaimWithCap`'s pattern, commit f755ac1). The per-subject
 * wallet advisory lock is taken first and held to commit, so the duplicate
 * check, the same-day count, the claim insert and the ledger credit are one
 * serialized step for a subject: two simultaneous callbacks can never both
 * observe the pre-claim count and both pass the cap.
 */
export async function claimAdRewardWithCapImpl(
  database: typeof db,
  environment: LudoEnvironment,
  input: LudoClaimAdRewardInput,
  appendLedgerEntryTx: AppendLedgerEntryTx,
): Promise<LudoClaimAdRewardResult> {
  return database.transaction(async (transaction) => {
    await lockSubjectWallet(transaction, environment, input.subject);
    const [existing] = await transaction
      .select()
      .from(ludoAdRewardClaims)
      .where(
        and(
          eq(ludoAdRewardClaims.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoAdRewardClaims.environment, environment),
          eq(ludoAdRewardClaims.subject, input.subject),
          eq(ludoAdRewardClaims.adTransactionId, input.adTransactionId),
        ),
      )
      .limit(1);
    if (existing) return { outcome: "duplicate", claim: toAdClaim(existing, environment) };

    const todays = await transaction
      .select()
      .from(ludoAdRewardClaims)
      .where(
        and(
          eq(ludoAdRewardClaims.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoAdRewardClaims.environment, environment),
          eq(ludoAdRewardClaims.subject, input.subject),
          eq(ludoAdRewardClaims.rewardType, input.rewardType),
          eq(ludoAdRewardClaims.claimDate, input.claimDate),
        ),
      );
    if (todays.length >= input.dailyCap) {
      return { outcome: "cap_exceeded", claimedToday: todays.length };
    }

    const values = {
      appId: LUDO_ECONOMY_STORE_APP_ID,
      environment,
      subject: input.subject,
      adTransactionId: input.adTransactionId,
      rewardType: input.rewardType,
      claimDate: input.claimDate,
      createdAt: new Date(input.now),
    };
    await transaction.insert(ludoAdRewardClaims).values(values);
    const ledger = await appendLedgerEntryTx(transaction, environment, {
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
      claim: toAdClaim(values, environment),
      transaction: ledger.transaction,
      balance: ledger.balance,
    };
  });
}

/** Atomic online free-play match-win claim (task 26h), same locking and
 * single-transaction discipline as [claimAdRewardWithCapImpl]. */
export async function claimFreePlayWinWithCapImpl(
  database: typeof db,
  environment: LudoEnvironment,
  input: LudoClaimFreePlayWinInput,
  appendLedgerEntryTx: AppendLedgerEntryTx,
): Promise<LudoClaimFreePlayWinResult> {
  return database.transaction(async (transaction) => {
    await lockSubjectWallet(transaction, environment, input.subject);
    const [existing] = await transaction
      .select()
      .from(ludoFreePlayWinClaims)
      .where(
        and(
          eq(ludoFreePlayWinClaims.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoFreePlayWinClaims.environment, environment),
          eq(ludoFreePlayWinClaims.subject, input.subject),
          eq(ludoFreePlayWinClaims.matchId, input.matchId),
        ),
      )
      .limit(1);
    if (existing) {
      return { outcome: "duplicate", claim: toFreePlayWinClaim(existing, environment) };
    }
    const todays = await transaction
      .select()
      .from(ludoFreePlayWinClaims)
      .where(
        and(
          eq(ludoFreePlayWinClaims.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoFreePlayWinClaims.environment, environment),
          eq(ludoFreePlayWinClaims.subject, input.subject),
          eq(ludoFreePlayWinClaims.claimDate, input.claimDate),
        ),
      );
    if (todays.length >= input.dailyCap) {
      return { outcome: "cap_exceeded", claimedToday: todays.length };
    }
    const values = {
      appId: LUDO_ECONOMY_STORE_APP_ID,
      environment,
      subject: input.subject,
      matchId: input.matchId,
      claimDate: input.claimDate,
      createdAt: new Date(input.now),
    };
    await transaction.insert(ludoFreePlayWinClaims).values(values);
    const ledger = await appendLedgerEntryTx(transaction, environment, {
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
      claim: toFreePlayWinClaim(values, environment),
      transaction: ledger.transaction,
      balance: ledger.balance,
    };
  });
}

/** Atomic daily-calendar claim (task 26h): state read, ledger credits and
 * state upsert under the subject's wallet lock, so a simultaneous second
 * claim sees `lastClaimDate === today` and reports `already_claimed`. */
export async function claimDailyRewardImpl(
  database: typeof db,
  environment: LudoEnvironment,
  input: LudoClaimDailyRewardInput,
  appendLedgerEntryTx: AppendLedgerEntryTx,
): Promise<LudoClaimDailyRewardResult> {
  return database.transaction(async (transaction) => {
    await lockSubjectWallet(transaction, environment, input.subject);
    const [current] = await transaction
      .select()
      .from(ludoDailyRewardState)
      .where(
        and(
          eq(ludoDailyRewardState.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoDailyRewardState.environment, environment),
          eq(ludoDailyRewardState.subject, input.subject),
        ),
      )
      .limit(1);
    if (current?.lastClaimDate === input.today) {
      return { outcome: "already_claimed", streakDay: current.streakDay };
    }
    const plan = planDailyRewardClaim(current ?? null, input);
    for (const entry of dailyRewardLedgerEntries(input.today, plan)) {
      await appendLedgerEntryTx(transaction, environment, {
        ...entry,
        subject: input.subject,
        now: input.now,
      });
    }
    const stateValues = {
      appId: LUDO_ECONOMY_STORE_APP_ID,
      environment,
      subject: input.subject,
      lastClaimDate: input.today,
      streakDay: plan.streakDay,
      updatedAt: new Date(input.now),
    };
    await transaction
      .insert(ludoDailyRewardState)
      .values(stateValues)
      .onConflictDoUpdate({
        target: [
          ludoDailyRewardState.appId,
          ludoDailyRewardState.environment,
          ludoDailyRewardState.subject,
        ],
        set: {
          lastClaimDate: stateValues.lastClaimDate,
          streakDay: stateValues.streakDay,
          updatedAt: stateValues.updatedAt,
        },
      });
    const balanceOf = async (currency: LudoCurrency): Promise<number> => {
      const [row] = await transaction
        .select()
        .from(ludoBalances)
        .where(
          and(
            eq(ludoBalances.appId, LUDO_ECONOMY_STORE_APP_ID),
            eq(ludoBalances.environment, environment),
            eq(ludoBalances.subject, input.subject),
            eq(ludoBalances.currency, currency),
          ),
        )
        .limit(1);
      return row?.balance ?? 0;
    };
    return {
      outcome: "claimed",
      streakDay: plan.streakDay,
      coinsGranted: plan.coins + plan.bonusCoins,
      diamondsGranted: plan.diamonds + plan.bonusDiamonds,
      bonusCoins: plan.bonusCoins,
      bonusDiamonds: plan.bonusDiamonds,
      coins: await balanceOf("coins"),
      diamonds: await balanceOf("diamonds"),
    };
  });
}

/** Idempotent-by-transaction-id ad claim row insert (no cap, no credit);
 * the capped, crediting path is [claimAdRewardWithCapImpl]. */
export async function recordAdClaimImpl(
  database: typeof db,
  environment: LudoEnvironment,
  row: Omit<LudoAdRewardClaimRow, "environment" | "createdAt">,
  now: string,
): Promise<{ claim: LudoAdRewardClaimRow; applied: boolean }> {
  return database.transaction(async (transaction) => {
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
    if (existing) return { claim: toAdClaim(existing, environment), applied: false };
    const values = {
      appId: LUDO_ECONOMY_STORE_APP_ID,
      environment,
      subject: row.subject,
      adTransactionId: row.adTransactionId,
      rewardType: row.rewardType,
      claimDate: row.claimDate,
      createdAt: new Date(now),
    };
    await transaction.insert(ludoAdRewardClaims).values(values);
    return { claim: toAdClaim(values, environment), applied: true };
  });
}

export async function countAdClaimsImpl(
  database: typeof db,
  environment: LudoEnvironment,
  subject: string,
  rewardType: LudoAdRewardType,
  claimDate: string,
): Promise<number> {
  const rows = await database
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
