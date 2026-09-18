import { and, asc, type db, desc, eq, gt, lt, mergeRelayRecords, mergeRelayScopes } from "@repo/db";
import {
  type MergeRelayArtifactFilter,
  type MergeRelayArtifactMetadata,
  type MergeRelayArtifactTransaction,
  type MergeRelayRecordType,
  validateArtifactPageLimit,
} from "./artifact-store";
import type { MergeEnvironment } from "./contracts";
import { MERGE_RELAY_APP_ID } from "./contracts";
import { MergeRelayStorageError } from "./store";

export type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function lockScope(
  transaction: DrizzleTransaction,
  environment: MergeEnvironment,
): Promise<{ revision: number }> {
  await transaction
    .insert(mergeRelayScopes)
    .values({ appId: MERGE_RELAY_APP_ID, environment })
    .onConflictDoNothing({ target: [mergeRelayScopes.appId, mergeRelayScopes.environment] });
  const scopes = await transaction
    .select()
    .from(mergeRelayScopes)
    .where(
      and(
        eq(mergeRelayScopes.appId, MERGE_RELAY_APP_ID),
        eq(mergeRelayScopes.environment, environment),
      ),
    )
    .for("update")
    .limit(1);
  const scope = scopes[0];
  if (!scope) throw new MergeRelayStorageError("Merge Relay scope was not initialized");
  return scope;
}

export async function selectArtifacts(
  transaction: DrizzleTransaction,
  environment: MergeEnvironment,
  filter: MergeRelayArtifactFilter,
) {
  validateArtifactPageLimit(filter.limit);
  const conditions = [
    eq(mergeRelayRecords.appId, MERGE_RELAY_APP_ID),
    eq(mergeRelayRecords.environment, environment),
    eq(mergeRelayRecords.recordType, filter.recordType),
  ];
  if (filter.recordId !== undefined)
    conditions.push(eq(mergeRelayRecords.recordId, filter.recordId));
  if (filter.ownerSubject !== undefined)
    conditions.push(eq(mergeRelayRecords.ownerSubject, filter.ownerSubject));
  if (filter.challengeId !== undefined)
    conditions.push(eq(mergeRelayRecords.challengeId, filter.challengeId));
  if (filter.resultId !== undefined)
    conditions.push(eq(mergeRelayRecords.resultId, filter.resultId));
  if (filter.idempotencyKey !== undefined)
    conditions.push(eq(mergeRelayRecords.idempotencyKey, filter.idempotencyKey));
  if (filter.alias !== undefined) conditions.push(eq(mergeRelayRecords.alias, filter.alias));
  if (filter.targetSubject !== undefined)
    conditions.push(eq(mergeRelayRecords.targetSubject, filter.targetSubject));
  if (filter.lookupKey !== undefined)
    conditions.push(eq(mergeRelayRecords.lookupKey, filter.lookupKey));
  const isConfig = filter.recordType === "config";
  const cursorRevision =
    isConfig && filter.afterRecordId !== undefined ? Number(filter.afterRecordId) : null;
  if (filter.afterRecordId !== undefined) {
    if (isConfig && cursorRevision !== null && Number.isSafeInteger(cursorRevision)) {
      conditions.push(
        filter.direction === "desc"
          ? lt(mergeRelayRecords.revision, cursorRevision)
          : gt(mergeRelayRecords.revision, cursorRevision),
      );
    } else if (!isConfig) {
      conditions.push(
        filter.direction === "desc"
          ? lt(mergeRelayRecords.recordId, filter.afterRecordId)
          : gt(mergeRelayRecords.recordId, filter.afterRecordId),
      );
    } else {
      conditions.push(eq(mergeRelayRecords.recordId, ""));
    }
  }
  const ordered = isConfig
    ? filter.direction === "desc"
      ? desc(mergeRelayRecords.revision)
      : asc(mergeRelayRecords.revision)
    : filter.direction === "desc"
      ? desc(mergeRelayRecords.recordId)
      : asc(mergeRelayRecords.recordId);
  return transaction
    .select()
    .from(mergeRelayRecords)
    .where(and(...conditions))
    .orderBy(ordered)
    .limit(filter.limit + 1);
}

async function upsertArtifact(
  transaction: DrizzleTransaction,
  environment: MergeEnvironment,
  recordType: MergeRelayRecordType,
  recordId: string,
  payload: unknown,
  metadata: MergeRelayArtifactMetadata = {},
): Promise<void> {
  const values = artifactRow(environment, recordType, recordId, payload, metadata);
  await transaction
    .insert(mergeRelayRecords)
    .values(values)
    .onConflictDoUpdate({
      target: [
        mergeRelayRecords.appId,
        mergeRelayRecords.environment,
        mergeRelayRecords.recordType,
        mergeRelayRecords.recordId,
      ],
      set: {
        revision: values.revision,
        ownerSubject: values.ownerSubject,
        challengeId: values.challengeId,
        resultId: values.resultId,
        idempotencyKey: values.idempotencyKey,
        alias: values.alias,
        targetSubject: values.targetSubject,
        lookupKey: values.lookupKey,
        parentRecordType: values.parentRecordType,
        parentRecordId: values.parentRecordId,
        payload: values.payload,
        updatedAt: new Date(),
      },
    });
}

export function artifactRow(
  environment: MergeEnvironment,
  recordType: MergeRelayRecordType,
  recordId: string,
  payload: unknown,
  metadata: MergeRelayArtifactMetadata = {},
) {
  return {
    appId: MERGE_RELAY_APP_ID,
    environment,
    recordType,
    recordId,
    revision: configRevision(recordType, payload),
    ownerSubject: metadata.ownerSubject ?? null,
    challengeId: metadata.challengeId ?? null,
    resultId: metadata.resultId ?? null,
    idempotencyKey: metadata.idempotencyKey ?? null,
    alias: metadata.alias ?? null,
    targetSubject: metadata.targetSubject ?? null,
    lookupKey: metadata.lookupKey ?? null,
    parentRecordType: metadata.parentRecordType ?? null,
    parentRecordId: metadata.parentRecordId ?? null,
    payload,
  };
}

function configRevision(recordType: MergeRelayRecordType, payload: unknown): number | null {
  if (recordType !== "config" || typeof payload !== "object" || payload === null) return null;
  const revision = (payload as { revision?: unknown }).revision;
  return typeof revision === "number" && Number.isSafeInteger(revision) ? revision : null;
}

export function artifactTransaction(
  transaction: DrizzleTransaction,
  environment: MergeEnvironment,
): MergeRelayArtifactTransaction {
  return {
    read: async (filter, parse) => {
      const rows = await selectArtifacts(transaction, environment, { ...filter, limit: 1 });
      return rows[0] ? parse(rows[0].payload) : null;
    },
    list: async (filter, parse) => {
      const rows = await selectArtifacts(transaction, environment, filter);
      const selected = rows.slice(0, filter.limit);
      return {
        items: selected.map((row) => parse(row.payload)),
        nextCursor: rows.length > filter.limit ? (selected.at(-1)?.recordId ?? null) : null,
      };
    },
    put: async (recordType, recordId, payload, metadata) => {
      await upsertArtifact(transaction, environment, recordType, recordId, payload, metadata);
    },
    remove: async (recordType, recordId) => {
      await transaction
        .delete(mergeRelayRecords)
        .where(
          and(
            eq(mergeRelayRecords.appId, MERGE_RELAY_APP_ID),
            eq(mergeRelayRecords.environment, environment),
            eq(mergeRelayRecords.recordType, recordType),
            eq(mergeRelayRecords.recordId, recordId),
          ),
        );
    },
  };
}
