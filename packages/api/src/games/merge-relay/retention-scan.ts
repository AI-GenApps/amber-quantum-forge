import type { MergeRelayArtifactFilter, MergeRelayArtifactTransaction } from "./artifact-store";
import type { MergeRetentionPolicy } from "./retention-config";

export interface RetentionCategoryReport {
  scanned: number;
  deleted: number;
  nextCursor: string | null;
  skippedReason: string | null;
}

export interface RetentionScanInput<T> {
  transaction: MergeRelayArtifactTransaction;
  recordType: MergeRelayArtifactFilter["recordType"];
  parse: (payload: unknown) => T;
  idOf: (item: T) => string;
  policy: MergeRetentionPolicy;
  dryRun: boolean;
  cursor: string | undefined;
  direction?: "asc" | "desc";
  eligible: (item: T) => Promise<boolean> | boolean;
}

export async function scanAndDelete<T>(
  input: RetentionScanInput<T>,
): Promise<RetentionCategoryReport> {
  const { transaction, policy } = input;
  let cursor = input.cursor;
  let scanned = 0;
  let deleted = 0;
  for (;;) {
    const page = await transaction.list(
      {
        recordType: input.recordType,
        limit: 100,
        ...(input.direction === undefined ? {} : { direction: input.direction }),
        ...(cursor === undefined ? {} : { afterRecordId: cursor }),
      },
      input.parse,
    );
    for (const item of page.items) {
      if (scanned >= policy.scanLimit)
        return { scanned, deleted, nextCursor: cursor ?? null, skippedReason: null };
      const eligible = await input.eligible(item);
      if (eligible && deleted >= policy.batchLimit)
        return { scanned, deleted, nextCursor: cursor ?? null, skippedReason: null };
      scanned += 1;
      const id = input.idOf(item);
      if (eligible) {
        if (!input.dryRun) await transaction.remove(input.recordType, id);
        deleted += 1;
      }
      cursor = id;
    }
    if (page.nextCursor === null)
      return { scanned, deleted, nextCursor: null, skippedReason: null };
  }
}

export function cutoffIso(now: Date, days: number): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}
