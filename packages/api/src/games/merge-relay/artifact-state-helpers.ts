import type { MemoryArtifact } from "./artifact-state";
import type { MergeRelayArtifactFilter } from "./artifact-store";

export function matches(row: MemoryArtifact, filter: MergeRelayArtifactFilter): boolean {
  return (
    row.recordType === filter.recordType &&
    (filter.recordId === undefined || row.recordId === filter.recordId) &&
    (filter.ownerSubject === undefined || row.ownerSubject === filter.ownerSubject) &&
    (filter.challengeId === undefined || row.challengeId === filter.challengeId) &&
    (filter.resultId === undefined || row.resultId === filter.resultId) &&
    (filter.idempotencyKey === undefined || row.idempotencyKey === filter.idempotencyKey) &&
    (filter.alias === undefined || row.alias === filter.alias) &&
    (filter.targetSubject === undefined || row.targetSubject === filter.targetSubject) &&
    (filter.lookupKey === undefined || row.lookupKey === filter.lookupKey)
  );
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
