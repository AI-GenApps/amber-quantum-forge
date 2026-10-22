import { requireRole } from "./authorization";
import type {
  MergeCommercePurchaseState,
  MergeCommerceRuntime,
  MergeCommerceSettlement,
  MergeVoidedPurchase,
} from "./commerce-contracts";
import { parseCommerceEntitlement, parseCommercePurchase } from "./commerce-parsers";
import { writeEntitlement } from "./commerce-service";
import {
  digest,
  entitlementRecordId,
  mapProviderError,
  nextState,
} from "./commerce-service-helpers";
import type { MergeEnvironment, MergeSession } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { configuredCommerceRuntime } from "./dependencies";
import { MergeRelayError } from "./errors";

const voidedLookbackMs = 30 * 24 * 60 * 60 * 1000;

export function purchaseIdForToken(purchaseToken: string): string {
  return `play_purchase_${digest(purchaseToken)}`;
}

function requireRuntime(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
): MergeCommerceRuntime {
  const runtime = configuredCommerceRuntime(dependencies, environment);
  if (!runtime) throw new MergeRelayError(503, "commerce_unconfigured", "Commerce is unavailable");
  return runtime;
}

export async function applyKnownPurchaseState(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  purchaseId: string,
  state: MergeCommercePurchaseState,
  acknowledgedNow = false,
): Promise<MergeCommerceSettlement | null> {
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const current = await transaction.read(
      { recordType: "commerce_purchase", recordId: purchaseId },
      parseCommercePurchase,
    );
    if (!current) return null;
    const next = nextState(current.state, state);
    if (next === current.state && !(acknowledgedNow && !current.acknowledged)) {
      const entitlement = await transaction.read(
        { recordType: "commerce_entitlement", recordId: entitlementRecordId(current.subject) },
        parseCommerceEntitlement,
      );
      return { purchase: current, entitlement, replayed: true, restored: false };
    }
    const now = dependencies.clock.now().toISOString();
    const purchase = {
      ...current,
      state: next,
      acknowledged: current.acknowledged || acknowledgedNow || next !== "purchased",
      updatedAt: now,
    };
    await transaction.put("commerce_purchase", purchase.purchaseId, purchase, {
      ownerSubject: purchase.subject,
      idempotencyKey: purchase.clientRequestId,
      lookupKey: purchase.purchaseTokenDigest,
    });
    const entitlement = await writeEntitlement(transaction, purchase, now);
    return { purchase, entitlement, replayed: false, restored: false };
  });
}

export async function requeryPurchase(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  purchaseToken: string,
): Promise<MergeCommerceSettlement | null> {
  const runtime = requireRuntime(dependencies, environment);
  const purchaseId = purchaseIdForToken(purchaseToken);
  const known = await dependencies.store.readArtifacts(
    environment,
    { recordType: "commerce_purchase", recordId: purchaseId, limit: 1 },
    parseCommercePurchase,
  );
  if (known.items.length === 0) return null;
  const request = { productId: runtime.config.productId, purchaseToken };
  try {
    const attestation = await runtime.provider.verifyPurchase(request);
    const acknowledgedNow = attestation.state === "purchased" && !attestation.acknowledged;
    if (acknowledgedNow) await runtime.provider.acknowledgePurchase(request);
    if (attestation.productId !== request.productId)
      throw new MergeRelayError(
        422,
        "purchase_product_mismatch",
        "The purchase product is invalid",
      );
    return await applyKnownPurchaseState(
      dependencies,
      environment,
      purchaseId,
      attestation.state,
      acknowledgedNow || attestation.acknowledged,
    );
  } catch (error) {
    throw error instanceof MergeRelayError ? error : mapProviderError(error);
  }
}

export async function reconcileVoidedPurchases(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  tokens?: string[],
): Promise<{ voided: number; applied: number }> {
  requireRole(session, "service");
  return reconcileVoided(dependencies, environment, tokens);
}

export async function reconcileVoided(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  tokens?: string[],
): Promise<{ voided: number; applied: number }> {
  const runtime = requireRuntime(dependencies, environment);
  if (!runtime.voidedProvider)
    throw new MergeRelayError(
      503,
      "commerce_unconfigured",
      "Voided purchase lookup is unavailable",
    );
  let voided: MergeVoidedPurchase[];
  try {
    voided = await runtime.voidedProvider.listVoidedPurchases({
      startTimeMillis: dependencies.clock.now().getTime() - voidedLookbackMs,
    });
  } catch (error) {
    throw mapProviderError(error);
  }
  const wanted = tokens ? new Set(tokens) : null;
  let applied = 0;
  let matched = 0;
  for (const entry of voided) {
    if (wanted && !wanted.has(entry.purchaseToken)) continue;
    matched += 1;
    const result = await applyKnownPurchaseState(
      dependencies,
      environment,
      purchaseIdForToken(entry.purchaseToken),
      "refunded",
    );
    if (result && !result.replayed) applied += 1;
  }
  return { voided: matched, applied };
}
