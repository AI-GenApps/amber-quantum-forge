import { and, type db, eq, ludoRevenueCatEvents, ludoSubscriptions } from "@repo/db";
import type { LudoEnvironment } from "./contracts";
import {
  LUDO_ECONOMY_STORE_APP_ID,
  type LudoLedgerAppendInput,
  type LudoLedgerAppendResult,
  type LudoProcessRevenueCatEventInput,
  type LudoProcessRevenueCatEventResult,
  type LudoSubscriptionRow,
  type LudoSubscriptionStatus,
} from "./economy-store";

/** Matches `DrizzleLudoEconomyStore`'s transaction alias. */
type LudoEconomyDrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function toDate(value: string | null): Date | null {
  return value === null ? null : new Date(value);
}

function toIso(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

/**
 * Split out of `economy-drizzle-store.ts` to keep that file under the
 * repo's max-line limit. Implements `DrizzleLudoEconomyStore.
 * processRevenueCatEvent`, taking the database handle and the store's
 * private `appendLedgerEntryTx` as parameters since both are class-private.
 */
export async function processRevenueCatEventImpl(
  database: typeof db,
  environment: LudoEnvironment,
  input: LudoProcessRevenueCatEventInput,
  appendLedgerEntryTx: (
    transaction: LudoEconomyDrizzleTransaction,
    environment: LudoEnvironment,
    input: LudoLedgerAppendInput,
  ) => Promise<LudoLedgerAppendResult>,
): Promise<LudoProcessRevenueCatEventResult> {
  return database.transaction(async (transaction) => {
    const now = toDate(input.now) as Date;
    const [insertedEvent] = await transaction
      .insert(ludoRevenueCatEvents)
      .values({
        appId: LUDO_ECONOMY_STORE_APP_ID,
        environment,
        eventId: input.eventId,
        eventType: input.eventType,
        productId: input.productId,
        subject: input.subject,
        createdAt: now,
      })
      .onConflictDoNothing({
        target: [
          ludoRevenueCatEvents.appId,
          ludoRevenueCatEvents.environment,
          ludoRevenueCatEvents.eventId,
        ],
      })
      .returning();
    if (!insertedEvent) return { applied: false, ledgerResults: [], subscription: null };

    const ledgerResults: LudoLedgerAppendResult[] = [];
    for (const entry of input.ledgerEntries) {
      const result = await appendLedgerEntryTx(transaction, environment, {
        ...entry,
        subject: input.subject,
        now: input.now,
      });
      ledgerResults.push(result);
    }

    let subscription: LudoSubscriptionRow | null = null;
    if (input.subscription) {
      const subscriptionValues = {
        appId: LUDO_ECONOMY_STORE_APP_ID,
        environment,
        subject: input.subject,
        productId: input.subscription.productId,
        status: input.subscription.status,
        willRenew: input.subscription.willRenew,
        expiresAt: toDate(input.subscription.expiresAt),
        updatedAt: now,
      };
      await transaction
        .insert(ludoSubscriptions)
        .values(subscriptionValues)
        .onConflictDoUpdate({
          target: [
            ludoSubscriptions.appId,
            ludoSubscriptions.environment,
            ludoSubscriptions.subject,
          ],
          set: {
            productId: subscriptionValues.productId,
            status: subscriptionValues.status,
            willRenew: subscriptionValues.willRenew,
            expiresAt: subscriptionValues.expiresAt,
            updatedAt: subscriptionValues.updatedAt,
          },
        });
      subscription = {
        environment,
        subject: input.subject,
        productId: subscriptionValues.productId,
        status: subscriptionValues.status,
        willRenew: subscriptionValues.willRenew,
        expiresAt: input.subscription.expiresAt,
        updatedAt: input.now,
      };
    }

    return { applied: true, ledgerResults, subscription };
  });
}

export async function getSubscriptionImpl(
  database: typeof db,
  environment: LudoEnvironment,
  subject: string,
): Promise<LudoSubscriptionRow | null> {
  const [row] = await database
    .select()
    .from(ludoSubscriptions)
    .where(
      and(
        eq(ludoSubscriptions.appId, LUDO_ECONOMY_STORE_APP_ID),
        eq(ludoSubscriptions.environment, environment),
        eq(ludoSubscriptions.subject, subject),
      ),
    )
    .limit(1);
  return row
    ? {
        environment,
        subject: row.subject,
        productId: row.productId,
        status: row.status as LudoSubscriptionStatus,
        willRenew: row.willRenew,
        expiresAt: toIso(row.expiresAt),
        updatedAt: row.updatedAt.toISOString(),
      }
    : null;
}
