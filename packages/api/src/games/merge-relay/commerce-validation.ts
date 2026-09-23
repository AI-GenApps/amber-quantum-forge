import type { JsonObject } from "../contracts";
import {
  MERGE_RELAY_THEME_PRODUCT_ID,
  type MergeCommercePurchaseInput,
} from "./commerce-contracts";

export function parseCommercePurchase(value: unknown): MergeCommercePurchaseInput | null {
  if (!isObject(value)) return null;
  if ("app_id" in value || "environment" in value) return null;
  const productId = value.product_id;
  const purchaseToken = value.purchase_token;
  const clientRequestId = value.client_request_id;
  if (
    productId !== MERGE_RELAY_THEME_PRODUCT_ID ||
    !isPurchaseToken(purchaseToken) ||
    (clientRequestId !== undefined && !isRequestId(clientRequestId))
  )
    return null;
  return {
    productId: MERGE_RELAY_THEME_PRODUCT_ID,
    purchaseToken,
    ...(clientRequestId === undefined ? {} : { clientRequestId }),
  };
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPurchaseToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 4096 &&
    /^[A-Za-z0-9._~+/=-]+$/.test(value)
  );
}

function isRequestId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    /^[A-Za-z0-9._:-]+$/.test(value)
  );
}
