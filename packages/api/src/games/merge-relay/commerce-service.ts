import type { MergeRelayArtifactTransaction } from "./artifact-store";
import { requirePlayer } from "./authorization";
import {
  MERGE_PLAY_PROVIDER,
  MERGE_RELAY_THEME_ENTITLEMENT_ID,
  MERGE_RELAY_THEME_PRODUCT_ID,
  type MergeCommerceCatalog,
  type MergeCommerceEntitlement,
  type MergeCommercePurchase,
  type MergeCommercePurchaseInput,
  type MergeCommerceSettlement,
  type MergePlayPurchaseAttestation,
} from "./commerce-contracts";
import { parseCommerceEntitlement, parseCommercePurchase } from "./commerce-parsers";
import {
  currentConfig,
  digest,
  entitlementRecordId,
  findExistingPurchase,
  mapProviderError,
  nextState,
  settlementFromExisting,
} from "./commerce-service-helpers";
import type { MergeEnvironment, MergeSession } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { configuredCommerceRuntime } from "./dependencies";
import { MergeRelayError } from "./errors";

export async function getCommerceCatalog(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
): Promise<MergeCommerceCatalog> {
  const runtime = configuredCommerceRuntime(dependencies, environment);
  const config = await currentConfig(dependencies, environment);
  const enabled = Boolean(runtime && config?.features.cosmetics);
  return {
    enabled,
    products: enabled
      ? [
          {
            productId: MERGE_RELAY_THEME_PRODUCT_ID,
            entitlementId: MERGE_RELAY_THEME_ENTITLEMENT_ID,
            kind: "non_consumable",
          },
        ]
      : [],
  };
}

export async function listCommerceEntitlements(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
): Promise<MergeCommerceEntitlement[]> {
  requirePlayer(session);
  return (
    await dependencies.store.readArtifacts(
      environment,
      { recordType: "commerce_entitlement", ownerSubject: session.subject, limit: 100 },
      parseCommerceEntitlement,
    )
  ).items;
}

export async function settleCommercePurchase(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  input: MergeCommercePurchaseInput,
  restored: boolean,
): Promise<MergeCommerceSettlement> {
  requirePlayer(session);
  const tokenDigest = digest(input.purchaseToken);
  const purchaseId = `play_purchase_${tokenDigest}`;
  const existing = await findExistingPurchase(
    dependencies,
    environment,
    session.subject,
    purchaseId,
    tokenDigest,
    input.clientRequestId,
  );
  if (existing && !restored && existing.state !== "pending")
    return settlementFromExisting(dependencies, environment, existing, false, true);
  const runtime = configuredCommerceRuntime(dependencies, environment);
  if (!runtime) throw new MergeRelayError(503, "commerce_unconfigured", "Commerce is unavailable");
  if (runtime.config.productId !== input.productId)
    throw new MergeRelayError(503, "commerce_unconfigured", "Commerce catalog is unavailable");
  if (!restored) {
    const config = await currentConfig(dependencies, environment);
    if (!config?.features.cosmetics)
      throw new MergeRelayError(503, "commerce_disabled", "The Merge Relay shop is disabled");
  }
  let attestation: MergePlayPurchaseAttestation;
  try {
    attestation = await runtime.provider.verifyPurchase({
      productId: input.productId,
      purchaseToken: input.purchaseToken,
    });
    if (attestation.state === "purchased" && !attestation.acknowledged)
      await runtime.provider.acknowledgePurchase({
        productId: input.productId,
        purchaseToken: input.purchaseToken,
      });
    if (attestation.state === "purchased" && !attestation.acknowledged)
      attestation = { ...attestation, acknowledged: true };
  } catch (error) {
    throw mapProviderError(error);
  }
  if (attestation.productId !== input.productId)
    throw new MergeRelayError(422, "purchase_product_mismatch", "The purchase product is invalid");
  const tokenEnvelope =
    runtime.tokenVault?.seal({
      environment,
      subject: session.subject,
      purchaseToken: input.purchaseToken,
    }) ?? null;
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const current = await transaction.read(
      { recordType: "commerce_purchase", recordId: purchaseId },
      parseCommercePurchase,
    );
    if (current && current.subject !== session.subject)
      throw new MergeRelayError(
        409,
        "purchase_token_owner_conflict",
        "The purchase token is already attached to another account",
      );
    const now = dependencies.clock.now().toISOString();
    const purchase: MergeCommercePurchase = {
      purchaseId,
      environment,
      subject: session.subject,
      provider: MERGE_PLAY_PROVIDER,
      productId: input.productId,
      entitlementId: MERGE_RELAY_THEME_ENTITLEMENT_ID,
      purchaseTokenDigest: tokenDigest,
      purchaseTokenEnvelope: current?.purchaseTokenEnvelope ?? tokenEnvelope,
      orderId: attestation.orderId ?? current?.orderId ?? null,
      state: nextState(current?.state, attestation.state),
      acknowledged:
        current?.acknowledged || attestation.acknowledged || attestation.state !== "purchased",
      clientRequestId: current?.clientRequestId ?? input.clientRequestId ?? null,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    await transaction.put("commerce_purchase", purchase.purchaseId, purchase, {
      ownerSubject: purchase.subject,
      idempotencyKey: purchase.clientRequestId,
      lookupKey: purchase.purchaseTokenDigest,
    });
    const entitlement = await writeEntitlement(transaction, purchase, now);
    return {
      purchase,
      entitlement,
      replayed: Boolean(current && purchase.state === current.state),
      restored,
    };
  });
}

async function writeEntitlement(
  transaction: MergeRelayArtifactTransaction,
  purchase: MergeCommercePurchase,
  now: string,
): Promise<MergeCommerceEntitlement | null> {
  const recordId = entitlementRecordId(purchase.subject);
  const current = await transaction.read(
    { recordType: "commerce_entitlement", recordId },
    parseCommerceEntitlement,
  );
  if (purchase.state !== "purchased") {
    if (current && current.status !== "revoked") {
      const revoked = { ...current, status: "revoked" as const, updatedAt: now };
      await transaction.put("commerce_entitlement", recordId, revoked, {
        ownerSubject: revoked.subject,
        parentRecordType: "commerce_purchase",
        parentRecordId: purchase.purchaseId,
      });
      return revoked;
    }
    return current;
  }
  const entitlement: MergeCommerceEntitlement = {
    entitlementId: MERGE_RELAY_THEME_ENTITLEMENT_ID,
    environment: purchase.environment,
    subject: purchase.subject,
    productId: purchase.productId,
    purchaseId: purchase.purchaseId,
    status: "active",
    grantedAt: current?.grantedAt ?? now,
    updatedAt: now,
  };
  await transaction.put("commerce_entitlement", recordId, entitlement, {
    ownerSubject: entitlement.subject,
    parentRecordType: "commerce_purchase",
    parentRecordId: purchase.purchaseId,
  });
  return entitlement;
}
