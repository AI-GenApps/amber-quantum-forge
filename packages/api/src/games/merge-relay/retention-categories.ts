import { adSsvRecordId, parseAdSsvRecord } from "./ad-ssv-service";
import {
  parseAttemptArtifact,
  parseChallengeArtifact,
  parseConfigArtifact,
  parseDailyArtifact,
  parseEventArtifact,
} from "./artifact-parsers";
import type { MergeRelayArtifactTransaction } from "./artifact-store";
import type { MergeAttempt, MergeChallenge } from "./contracts";
import { parsePgsOutboxArtifact } from "./pgs-parsers";
import { parseRateLimitRecord } from "./rate-limit";
import type { MergeRetentionPolicy } from "./retention-config";
import { cutoffIso, type RetentionCategoryReport, scanAndDelete } from "./retention-scan";

export interface CategoryContext {
  transaction: MergeRelayArtifactTransaction;
  policy: MergeRetentionPolicy;
  now: Date;
  dryRun: boolean;
  cursor: string | undefined;
}

export function pruneEvents(context: CategoryContext): Promise<RetentionCategoryReport> {
  const cutoff = cutoffIso(context.now, context.policy.eventDays);
  return scanAndDelete({
    ...context,
    recordType: "event",
    parse: parseEventArtifact,
    idOf: (item) => item.eventId,
    eligible: (item) => item.createdAt < cutoff,
  });
}

export function pruneAdSsv(context: CategoryContext): Promise<RetentionCategoryReport> {
  const cutoff = cutoffIso(context.now, context.policy.adSsvDays);
  return scanAndDelete({
    ...context,
    recordType: "ad_ssv",
    parse: parseAdSsvRecord,
    idOf: (item) => adSsvRecordId(item.transactionId),
    eligible: (item) => item.receivedAt < cutoff,
  });
}

export function pruneDeliveredOutbox(context: CategoryContext): Promise<RetentionCategoryReport> {
  const cutoff = cutoffIso(context.now, context.policy.deliveredOutboxDays);
  return scanAndDelete({
    ...context,
    recordType: "pgs_outbox",
    parse: parsePgsOutboxArtifact,
    idOf: (item) => item.outboxId,
    eligible: (item) => item.status === "succeeded" && item.updatedAt < cutoff,
  });
}

export async function pruneInactiveAttempts(
  context: CategoryContext,
): Promise<RetentionCategoryReport> {
  const cutoff = cutoffIso(context.now, context.policy.inactiveAttemptDays);
  const challenges = new Map<string, MergeChallenge | null>();
  const retired = async (challengeId: string): Promise<boolean> => {
    if (!challenges.has(challengeId))
      challenges.set(
        challengeId,
        await context.transaction.read(
          { recordType: "challenge", recordId: challengeId },
          parseChallengeArtifact,
        ),
      );
    return challenges.get(challengeId)?.status === "retired";
  };
  return scanAndDelete<MergeAttempt>({
    ...context,
    recordType: "attempt",
    parse: parseAttemptArtifact,
    idOf: (item) => item.attemptId,
    eligible: async (item) => {
      if (item.resultId !== null || item.status === "completed") return false;
      const inactive =
        item.status === "cancelled" ||
        item.status === "abandoned" ||
        (item.status === "reserved" && item.expiresAt < cutoff);
      return inactive && item.updatedAt < cutoff && (await retired(item.challengeId));
    },
  });
}

async function referencedRevisions(
  context: CategoryContext,
): Promise<{ revisions: Set<number>; complete: boolean }> {
  const revisions = new Set<number>();
  let scanned = 0;
  for (const recordType of ["challenge", "daily"] as const) {
    let cursor: string | undefined;
    do {
      const page = await context.transaction.list(
        {
          recordType,
          limit: 100,
          ...(cursor === undefined ? {} : { afterRecordId: cursor }),
        },
        recordType === "challenge"
          ? (payload: unknown) => parseChallengeArtifact(payload).configRevision
          : (payload: unknown) => parseDailyArtifact(payload).configRevision,
      );
      for (const revision of page.items) revisions.add(revision);
      scanned += page.items.length;
      if (scanned > context.policy.scanLimit) return { revisions, complete: false };
      cursor = page.nextCursor ?? undefined;
    } while (cursor !== undefined);
  }
  return { revisions, complete: true };
}

export async function pruneConfigRevisions(
  context: CategoryContext,
): Promise<RetentionCategoryReport> {
  const referenced = await referencedRevisions(context);
  if (!referenced.complete)
    return { scanned: 0, deleted: 0, nextCursor: null, skippedReason: "reference_scan_truncated" };
  let rank = 0;
  return scanAndDelete({
    ...context,
    cursor: undefined,
    direction: "desc",
    recordType: "config",
    parse: parseConfigArtifact,
    idOf: (item) => String(item.revision),
    eligible: (item) => {
      rank += 1;
      return (
        rank > context.policy.configRevisionsKeep &&
        !item.active &&
        !referenced.revisions.has(item.revision)
      );
    },
  });
}

export function pruneRateLimits(context: CategoryContext): Promise<RetentionCategoryReport> {
  const cutoffMs = context.now.getTime() - context.policy.rateLimitDays * 86_400_000;
  return scanAndDelete({
    ...context,
    recordType: "rate_limit",
    parse: parseRateLimitRecord,
    idOf: (item) => item.recordId,
    eligible: (item) => item.windowEndMs < cutoffMs,
  });
}
