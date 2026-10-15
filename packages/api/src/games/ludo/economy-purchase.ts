import type { LudoCurrency } from "./economy-config";
import type {
  LudoBalanceRow,
  LudoInventoryItemType,
  LudoInventoryRow,
  LudoWalletTransactionRow,
} from "./economy-store-types";

/** Task 26g: one coin/diamond store purchase, applied by
 * `LudoEconomyStore.purchaseInventoryItem` as a single atomic
 * check-and-write (never a separate balance read followed by a debit). */
export interface LudoPurchaseInventoryItemInput {
  subject: string;
  itemId: string;
  itemType: LudoInventoryItemType;
  currency: LudoCurrency;
  price: number;
  /** Full ledger idempotency key for the debit (the route prefixes the
   * client's key with `store_purchase:`). */
  idempotencyKey: string;
  now: string;
}

/** `"purchased"`: debit and inventory row written together. `"duplicate"`:
 * the idempotency key was already applied for this same item, nothing new
 * written. `"idempotency_conflict"`: the key was already applied for a
 * different item. `"already_owned"`: the item is owned under another key,
 * nothing debited. `"insufficient_balance"`: nothing written. */
export type LudoPurchaseInventoryItemResult =
  | {
      outcome: "purchased";
      inventory: LudoInventoryRow;
      transaction: LudoWalletTransactionRow;
      balance: LudoBalanceRow;
    }
  | { outcome: "duplicate"; inventory: LudoInventoryRow; balance: number }
  | { outcome: "idempotency_conflict" }
  | { outcome: "already_owned"; inventory: LudoInventoryRow }
  | { outcome: "insufficient_balance"; balance: number };
