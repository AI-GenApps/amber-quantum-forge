import type { MergeRelayArtifactFilter, MergeRelayArtifactTransaction } from "./artifact-store";

export async function listAll<T>(
  transaction: MergeRelayArtifactTransaction,
  filter: Omit<MergeRelayArtifactFilter, "limit" | "afterRecordId">,
  parse: (payload: unknown) => T,
): Promise<T[]> {
  const items: T[] = [];
  let afterRecordId: string | undefined;
  do {
    const page = await transaction.list(
      { ...filter, limit: 100, ...(afterRecordId === undefined ? {} : { afterRecordId }) },
      parse,
    );
    items.push(...page.items);
    afterRecordId = page.nextCursor ?? undefined;
  } while (afterRecordId !== undefined);
  return items;
}
