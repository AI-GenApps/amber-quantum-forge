import type { LudoCurrency } from "./economy-config";

export function balanceKey(subject: string, currency: LudoCurrency): string {
  return `${subject}\u0000${currency}`;
}

export function inventoryKey(subject: string, itemId: string): string {
  return `${subject}\u0000${itemId}`;
}

export function adClaimKey(subject: string, adTransactionId: string): string {
  return `${subject}\u0000${adTransactionId}`;
}

export function xpClaimKey(subject: string, claimId: string): string {
  return `${subject}\u0000${claimId}`;
}

export function idempotencyKeyLookup(subject: string, idempotencyKey: string): string {
  return `${subject}\u0000${idempotencyKey}`;
}
