import type { MergeEnvironment } from "./contracts";

export const mergeRelayRecordTypes = [
  "challenge",
  "attempt",
  "result",
  "save",
  "guest",
  "daily",
  "config",
  "event",
  "social",
  "reward",
  "alias",
] as const;

export const mergeRelayPlatformRecordTypes = [
  "pgs_identity",
  "pgs_credential",
  "pgs_outbox",
  "save_write_receipt",
  "commerce_purchase",
  "commerce_entitlement",
] as const;

export type MergeRelayRecordType =
  | (typeof mergeRelayRecordTypes)[number]
  | (typeof mergeRelayPlatformRecordTypes)[number];

export interface MergeRelayArtifactFilter {
  recordType: MergeRelayRecordType;
  recordId?: string;
  ownerSubject?: string;
  challengeId?: string;
  resultId?: string;
  idempotencyKey?: string;
  alias?: string;
  targetSubject?: string;
  lookupKey?: string;
  afterRecordId?: string;
  direction?: "asc" | "desc";
  limit: number;
}

export interface MergeRelayArtifactPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface MergeRelayArtifactMetadata {
  ownerSubject?: string | null;
  challengeId?: string | null;
  resultId?: string | null;
  idempotencyKey?: string | null;
  alias?: string | null;
  targetSubject?: string | null;
  lookupKey?: string | null;
  parentRecordType?: MergeRelayRecordType | null;
  parentRecordId?: string | null;
}

export interface MergeRelayArtifactTransaction {
  read<T>(
    filter: Omit<MergeRelayArtifactFilter, "limit" | "afterRecordId">,
    parse: (payload: unknown) => T,
  ): Promise<T | null>;
  list<T>(
    filter: MergeRelayArtifactFilter,
    parse: (payload: unknown) => T,
  ): Promise<MergeRelayArtifactPage<T>>;
  put(
    recordType: MergeRelayRecordType,
    recordId: string,
    payload: unknown,
    metadata?: MergeRelayArtifactMetadata,
  ): Promise<void>;
  remove(recordType: MergeRelayRecordType, recordId: string): Promise<void>;
}

export interface MergeRelayArtifactStore {
  readArtifacts<T>(
    environment: MergeEnvironment,
    filter: MergeRelayArtifactFilter,
    parse: (payload: unknown) => T,
  ): Promise<MergeRelayArtifactPage<T>>;
  transactArtifacts<T>(
    environment: MergeEnvironment,
    operation: (transaction: MergeRelayArtifactTransaction) => Promise<T>,
  ): Promise<T>;
}

const MERGE_RELAY_MAX_ARTIFACT_PAGE = 100;

export function validateArtifactPageLimit(limit: number): void {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MERGE_RELAY_MAX_ARTIFACT_PAGE)
    throw new Error("Merge Relay artifact page limit is invalid");
}

export function artifactRecordId(subject: string, saveId: string): string {
  return JSON.stringify([subject, saveId]);
}
