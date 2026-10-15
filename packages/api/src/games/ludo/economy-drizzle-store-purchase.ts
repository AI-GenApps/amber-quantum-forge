import {
  and,
  type db,
  eq,
  ludoBalances,
  ludoInventory,
  ludoWalletTransactions,
  sql,
} from "@repo/db";
import type { LudoEnvironment } from "./contracts";
import type {
  LudoPurchaseInventoryItemInput,
  LudoPurchaseInventoryItemResult,
} from "./economy-purchase";
import {
  LUDO_ECONOMY_STORE_APP_ID,
  type LudoInventoryItemType,
  type LudoInventoryRow,
  type LudoLedgerAppendInput,
  type LudoLedgerAppendResult,
} from "./economy-store";

type LudoEconomyDrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function toInventoryRow(
  row: { subject: string; itemId: string; itemType: string; acquiredVia: string; acquiredAt: Date },
  environment: LudoEnvironment,
): LudoInventoryRow {
  return {
    environment,
    subject: row.subject,
    itemId: row.itemId,
    itemType: row.itemType as LudoInventoryItemType,
    acquiredVia: row.acquiredVia,
    acquiredAt: row.acquiredAt.toISOString(),
  };
}

/** Takes the per-subject wallet lock for the rest of the transaction. Every
 * ledger write on `DrizzleLudoEconomyStore` takes this same lock, so a
 * purchase's balance check can never interleave with another credit/debit
 * for the subject. Re-entrant within one transaction. */
export async function lockSubjectWallet(
  transaction: LudoEconomyDrizzleTransaction,
  environment: LudoEnvironment,
  subject: string,
): Promise<void> {
  const lockKey = `${LUDO_ECONOMY_STORE_APP_ID}\u0000${environment}\u0000${subject}\u0000wallet`;
  await transaction.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`);
}

/**
 * Split out of `economy-drizzle-store.ts` for file size. Implements
 * `DrizzleLudoEconomyStore.purchaseInventoryItem` — the atomic
 * check-and-write for coin/diamond store purchases (commit f755ac1's
 * pattern): the wallet lock, duplicate-key check, owned check, balance
 * check, debit and inventory insert all run in one transaction, so two
 * concurrent purchases can never both pass the balance check.
 */
export async function purchaseInventoryItemImpl(
  database: typeof db,
  environment: LudoEnvironment,
  input: LudoPurchaseInventoryItemInput,
  appendLedgerEntryTx: (
    transaction: LudoEconomyDrizzleTransaction,
    environment: LudoEnvironment,
    input: LudoLedgerAppendInput,
  ) => Promise<LudoLedgerAppendResult>,
): Promise<LudoPurchaseInventoryItemResult> {
  return database.transaction(async (transaction) => {
    await lockSubjectWallet(transaction, environment, input.subject);

    const [inventoryRow] = await transaction
      .select()
      .from(ludoInventory)
      .where(
        and(
          eq(ludoInventory.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoInventory.environment, environment),
          eq(ludoInventory.subject, input.subject),
          eq(ludoInventory.itemId, input.itemId),
        ),
      )
      .limit(1);
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
    const balance = balanceRow?.balance ?? 0;

    const [replay] = await transaction
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
    if (replay) {
      if (replay.sourceRef !== input.itemId || !inventoryRow) {
        return { outcome: "idempotency_conflict" };
      }
      return {
        outcome: "duplicate",
        inventory: toInventoryRow(inventoryRow, environment),
        balance,
      };
    }
    if (inventoryRow) {
      return { outcome: "already_owned", inventory: toInventoryRow(inventoryRow, environment) };
    }
    if (balance < input.price) return { outcome: "insufficient_balance", balance };

    const ledger = await appendLedgerEntryTx(transaction, environment, {
      subject: input.subject,
      currency: input.currency,
      delta: -input.price,
      reason: "store_purchase",
      sourceRef: input.itemId,
      idempotencyKey: input.idempotencyKey,
      now: input.now,
    });
    const values = {
      appId: LUDO_ECONOMY_STORE_APP_ID,
      environment,
      subject: input.subject,
      itemId: input.itemId,
      itemType: input.itemType,
      acquiredVia: "store_purchase",
      acquiredAt: new Date(input.now),
    };
    await transaction.insert(ludoInventory).values(values);
    return {
      outcome: "purchased",
      inventory: toInventoryRow(values, environment),
      transaction: ledger.transaction,
      balance: ledger.balance,
    };
  });
}
