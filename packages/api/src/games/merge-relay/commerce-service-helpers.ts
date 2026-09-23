import { createHash } from "node:crypto";
import { parseConfigArtifact } from "./artifact-parsers";
import type { MergeRelayArtifactTransaction } from "./artifact-store";
import {
  MERGE_RELAY_THEME_ENTITLEMENT_ID,
  type MergeCommercePurchase,
  type MergeCommerceSettlement,
} from "./commerce-contracts";
import { parseCommerceEntitlement, parseCommercePurchase } from "./commerce-parsers";
import { GooglePlayPurchaseProviderError } from "./commerce-provider";
import type { MergeEnvironment } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { MergeRelayError } from "./errors";

export async function findExistingPurchase(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  subject: string,
  purchaseId: string,
  tokenDigest: string,
  clientRequestId: string | undefined,
): Promise<MergeCommercePurchase | null> {
  const byToken = (
    await dependencies.store.readArtifacts(
      environment,
      { recordType: "commerce_purchase", recordId: purchaseId, limit: 1 },
      parseCommercePurchase,
    )
  ).items[0];
  if (byToken && byToken.subject !== subject)
    throw new MergeRelayError(
      409,
      "purchase_token_owner_conflict",
      "The purchase token is already attached to another account",
    );
  if (byToken && byToken.purchaseTokenDigest !== tokenDigest)
    throw new MergeRelayError(409, "purchase_token_conflict", "The purchase token conflicts");
  if (clientRequestId) {
    const byRequest = (
      await dependencies.store.readArtifacts(
        environment,
        { recordType: "commerce_purchase", idempotencyKey: clientRequestId, limit: 2 },
        parseCommercePurchase,
      )
    ).items;
    const conflict = byRequest.find(
      (purchase) => purchase.subject !== subject || purchase.purchaseTokenDigest !== tokenDigest,
    );
    if (conflict)
      throw new MergeRelayError(
        409,
        "purchase_request_conflict",
        "The purchase request ID is attached to another purchase",
      );
  }
  return byToken ?? null;
}

export async function settlementFromExisting(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  purchase: MergeCommercePurchase,
  restored: boolean,
  replayed: boolean,
): Promise<MergeCommerceSettlement> {
  const entitlement =
    (
      await dependencies.store.readArtifacts(
        environment,
        {
          recordType: "commerce_entitlement",
          recordId: entitlementRecordId(purchase.subject),
          limit: 1,
        },
        parseCommerceEntitlement,
      )
    ).items[0] ?? null;
  return { purchase, entitlement, replayed, restored };
}

export async function currentConfig(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
) {
  return (
    await dependencies.store.readArtifacts(
      environment,
      { recordType: "config", direction: "desc", limit: 1 },
      parseConfigArtifact,
    )
  ).items[0];
}

export function mapProviderError(error: unknown): MergeRelayError {
  if (error instanceof GooglePlayPurchaseProviderError) {
    if (error.code === "provider_product_mismatch")
      return new MergeRelayError(
        422,
        "purchase_product_mismatch",
        "The purchase product is invalid",
      );
    if (error.code === "purchase_not_found")
      return new MergeRelayError(422, "purchase_not_found", "The purchase could not be verified");
  }
  return new MergeRelayError(
    503,
    "purchase_verification_unavailable",
    "Purchase verification is unavailable",
  );
}

export function nextState(
  current: MergeCommercePurchase["state"] | undefined,
  next: MergeCommercePurchase["state"],
): MergeCommercePurchase["state"] {
  if (!current || current === next) return next;
  if (current === "purchased" && next === "pending") return current;
  if (current === "cancelled" || current === "refunded" || current === "revoked") return current;
  return next;
}

export function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function entitlementRecordId(subject: string): string {
  return `entitlement_${digest(`${subject}\u0000${MERGE_RELAY_THEME_ENTITLEMENT_ID}`)}`;
}

export type CommerceTransaction = MergeRelayArtifactTransaction;
