import type { MergeRelayArtifactTransaction } from "./artifact-store";
import type { MergePgsOutbox } from "./pgs-contracts";
import { parsePgsOutboxArtifact } from "./pgs-parsers";

export async function listPgsOutbox(
  transaction: MergeRelayArtifactTransaction,
): Promise<MergePgsOutbox[]> {
  const items: MergePgsOutbox[] = [];
  let afterRecordId: string | undefined;
  do {
    const page = await transaction.list(
      {
        recordType: "pgs_outbox",
        limit: 100,
        ...(afterRecordId === undefined ? {} : { afterRecordId }),
      },
      parsePgsOutboxArtifact,
    );
    items.push(...page.items);
    afterRecordId = page.nextCursor ?? undefined;
  } while (afterRecordId !== undefined);
  return items;
}
