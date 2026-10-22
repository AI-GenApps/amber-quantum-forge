import type { AdSsvRecord } from "./ad-ssv-contracts";
import { verifyAdSsvQuery } from "./ad-ssv-verify";
import { digest } from "./commerce-service-helpers";
import type { MergeEnvironment } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { MergeRelayError } from "./errors";
import type { MergeRewardProvider } from "./provider";
import type { MergeRelayStore } from "./store";

export function adSsvRecordId(transactionId: string): string {
  return `ad_ssv_${digest(transactionId)}`;
}

export function parseAdSsvRecord(value: unknown): AdSsvRecord {
  if (typeof value !== "object" || value === null)
    throw new Error("Merge Relay ad SSV artifact is invalid");
  const record = value as AdSsvRecord;
  if (typeof record.transactionId !== "string" || typeof record.subject !== "string")
    throw new Error("Merge Relay ad SSV artifact is invalid");
  return record;
}

export async function recordAdSsv(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  rawQuery: string,
): Promise<{ record: AdSsvRecord; replayed: boolean }> {
  const runtime = dependencies.adSsvRuntimeForEnvironment?.(environment);
  if (!runtime)
    throw new MergeRelayError(503, "ad_ssv_unconfigured", "Ad verification is unavailable");
  const now = dependencies.clock.now();
  const verified = await verifyAdSsvQuery(rawQuery, runtime, now.getTime());
  if (!verified) throw new MergeRelayError(403, "ad_ssv_invalid", "The ad callback is invalid");
  const record: AdSsvRecord = { ...verified, environment, receivedAt: now.toISOString() };
  const recordId = adSsvRecordId(record.transactionId);
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const current = await transaction.read({ recordType: "ad_ssv", recordId }, parseAdSsvRecord);
    if (current) {
      if (current.subject !== record.subject || current.resultId !== record.resultId)
        throw new MergeRelayError(409, "ad_ssv_conflict", "The ad transaction conflicts");
      return { record: current, replayed: true };
    }
    await transaction.put("ad_ssv", recordId, record, {
      ownerSubject: record.subject,
      resultId: record.resultId,
      idempotencyKey: record.transactionId,
    });
    return { record, replayed: false };
  });
}

export function createAdSsvRewardProvider(store: MergeRelayStore): MergeRewardProvider {
  return {
    async verifySettlement(input, context) {
      const recorded = (
        await store.readArtifacts(
          context.environment,
          { recordType: "ad_ssv", recordId: adSsvRecordId(input.providerTransactionId), limit: 1 },
          parseAdSsvRecord,
        )
      ).items[0];
      const verified =
        input.kind === "ad_reward" &&
        recorded !== undefined &&
        recorded.environment === context.environment &&
        recorded.subject === context.subject &&
        recorded.resultId === context.resultId;
      return {
        verified,
        providerTransactionId: input.providerTransactionId,
        environment: context.environment,
        subject: context.subject,
        resultId: context.resultId,
        productId: context.productId,
        kind: context.kind,
        refunded: false,
        cancelled: false,
      };
    },
  };
}
