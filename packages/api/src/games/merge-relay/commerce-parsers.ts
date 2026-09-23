import type {
  MergeCommerceEntitlement,
  MergeCommercePurchase,
  MergePurchaseTokenEnvelope,
} from "./commerce-contracts";
import {
  MERGE_PLAY_PROVIDER,
  MERGE_RELAY_THEME_ENTITLEMENT_ID,
  MERGE_RELAY_THEME_PRODUCT_ID,
} from "./commerce-contracts";
import { asRecord, isEnvironment, isId, isTimestamp } from "./state-validation-helpers";

export const parseCommercePurchase = (value: unknown): MergeCommercePurchase =>
  parse(value, validatePurchase, "purchase");
export const parseCommerceEntitlement = (value: unknown): MergeCommerceEntitlement =>
  parse(value, validateEntitlement, "entitlement");

function parse<T>(value: unknown, validate: (value: T) => void, kind: string): T {
  if (!asRecord(value)) throw new Error(`Merge Relay commerce ${kind} artifact is invalid`);
  const copy = JSON.parse(JSON.stringify(value)) as T;
  validate(copy);
  return copy;
}

function validatePurchase(value: MergeCommercePurchase): void {
  if (
    !isId(value.purchaseId) ||
    !isEnvironment(value.environment) ||
    !isId(value.subject) ||
    value.provider !== MERGE_PLAY_PROVIDER ||
    value.productId !== MERGE_RELAY_THEME_PRODUCT_ID ||
    value.entitlementId !== MERGE_RELAY_THEME_ENTITLEMENT_ID ||
    !/^[a-f0-9]{64}$/.test(value.purchaseTokenDigest) ||
    !isTokenEnvelope(value.purchaseTokenEnvelope) ||
    (value.orderId !== null && !isText(value.orderId, 256)) ||
    !["pending", "purchased", "cancelled", "refunded", "revoked"].includes(value.state) ||
    typeof value.acknowledged !== "boolean" ||
    (value.clientRequestId !== null && !isId(value.clientRequestId)) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt)
  )
    throw new Error("Merge Relay commerce purchase is invalid");
}

function validateEntitlement(value: MergeCommerceEntitlement): void {
  if (
    value.entitlementId !== MERGE_RELAY_THEME_ENTITLEMENT_ID ||
    !isEnvironment(value.environment) ||
    !isId(value.subject) ||
    value.productId !== MERGE_RELAY_THEME_PRODUCT_ID ||
    !isId(value.purchaseId) ||
    !["active", "revoked"].includes(value.status) ||
    !isTimestamp(value.grantedAt) ||
    !isTimestamp(value.updatedAt)
  )
    throw new Error("Merge Relay commerce entitlement is invalid");
}

function isTokenEnvelope(value: MergePurchaseTokenEnvelope | null): boolean {
  return (
    value === null ||
    (asRecord(value) !== null &&
      value.version === 1 &&
      isEncoded(value.ciphertext) &&
      isEncoded(value.iv) &&
      isEncoded(value.authTag))
  );
}

function isEncoded(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,8192}$/.test(value);
}

function isText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}
