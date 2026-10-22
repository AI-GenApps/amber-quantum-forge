import { adSsvRecordId, parseAdSsvRecord } from "./ad-ssv-service";
import { listAll } from "./artifact-list";
import type { MergeRelayArtifactTransaction } from "./artifact-store";
import type { MergePurchaseTokenVault } from "./commerce-contracts";
import { parseCommerceEntitlement, parseCommercePurchase } from "./commerce-parsers";
import { entitlementRecordId } from "./commerce-service-helpers";
import { MergeRelayError } from "./errors";

export async function migrateCommerceArtifacts(
  transaction: MergeRelayArtifactTransaction,
  guestSubject: string,
  accountSubject: string,
  tokenVault: MergePurchaseTokenVault | null,
): Promise<void> {
  const purchases = await listAll(
    transaction,
    { recordType: "commerce_purchase", ownerSubject: guestSubject },
    parseCommercePurchase,
  );
  for (const purchase of purchases) {
    let envelope = purchase.purchaseTokenEnvelope;
    if (envelope) {
      if (!tokenVault)
        throw new MergeRelayError(503, "commerce_unavailable", "Commerce is unavailable");
      const purchaseToken = tokenVault.open({
        environment: purchase.environment,
        subject: guestSubject,
        envelope,
      });
      envelope = tokenVault.seal({
        environment: purchase.environment,
        subject: accountSubject,
        purchaseToken,
      });
    }
    await transaction.put(
      "commerce_purchase",
      purchase.purchaseId,
      { ...purchase, subject: accountSubject, purchaseTokenEnvelope: envelope },
      {
        ownerSubject: accountSubject,
        idempotencyKey: purchase.clientRequestId,
        lookupKey: purchase.purchaseTokenDigest,
      },
    );
  }

  const guestEntitlementId = entitlementRecordId(guestSubject);
  const accountEntitlementId = entitlementRecordId(accountSubject);
  const guestEntitlement = await transaction.read(
    { recordType: "commerce_entitlement", recordId: guestEntitlementId },
    parseCommerceEntitlement,
  );
  if (guestEntitlement) {
    const accountEntitlement = await transaction.read(
      { recordType: "commerce_entitlement", recordId: accountEntitlementId },
      parseCommerceEntitlement,
    );
    if (accountEntitlement?.status !== "active") {
      if (guestEntitlement.status === "active" || !accountEntitlement)
        await transaction.put(
          "commerce_entitlement",
          accountEntitlementId,
          { ...guestEntitlement, subject: accountSubject },
          {
            ownerSubject: accountSubject,
            parentRecordType: "commerce_purchase",
            parentRecordId: guestEntitlement.purchaseId,
          },
        );
    }
    await transaction.remove("commerce_entitlement", guestEntitlementId);
  }

  const adRecords = await listAll(
    transaction,
    { recordType: "ad_ssv", ownerSubject: guestSubject },
    parseAdSsvRecord,
  );
  for (const record of adRecords)
    await transaction.put(
      "ad_ssv",
      adSsvRecordId(record.transactionId),
      { ...record, subject: accountSubject },
      {
        ownerSubject: accountSubject,
        resultId: record.resultId,
        idempotencyKey: record.transactionId,
      },
    );
}
