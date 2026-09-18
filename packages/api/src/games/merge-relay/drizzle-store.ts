import { and, db, eq, mergeRelayRecords, mergeRelayScopes } from "@repo/db";
import {
  type MergeRelayArtifactFilter,
  type MergeRelayArtifactPage,
  type MergeRelayArtifactTransaction,
  validateArtifactPageLimit,
} from "./artifact-store";
import type { MergeEnvironment, MergeRelayState } from "./contracts";
import { MERGE_RELAY_APP_ID } from "./contracts";
import { artifactTransaction, lockScope, selectArtifacts } from "./drizzle-artifacts";
import { fromRows, rowKey, rowsForState } from "./drizzle-legacy-state";
import { parseMergeRelayState } from "./state-validation";
import { cloneMergeState, emptyMergeRelayState, type MergeRelayStore } from "./store";

export class DrizzleMergeRelayStore implements MergeRelayStore {
  constructor(private readonly database: typeof db = db) {}

  async readArtifacts<T>(
    environment: MergeEnvironment,
    filter: MergeRelayArtifactFilter,
    parse: (payload: unknown) => T,
  ): Promise<MergeRelayArtifactPage<T>> {
    validateArtifactPageLimit(filter.limit);
    return this.database.transaction(async (transaction) => {
      const rows = await selectArtifacts(transaction, environment, filter);
      const selected = rows.slice(0, filter.limit);
      return {
        items: selected.map((row) => parse(row.payload)),
        nextCursor: rows.length > filter.limit ? (selected.at(-1)?.recordId ?? null) : null,
      };
    });
  }

  async transactArtifacts<T>(
    environment: MergeEnvironment,
    operation: (transaction: MergeRelayArtifactTransaction) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction(async (transaction) => {
      const scope = await lockScope(transaction, environment);
      const result = await operation(artifactTransaction(transaction, environment));
      await transaction
        .update(mergeRelayScopes)
        .set({ revision: scope.revision + 1, updatedAt: new Date() })
        .where(
          and(
            eq(mergeRelayScopes.appId, MERGE_RELAY_APP_ID),
            eq(mergeRelayScopes.environment, environment),
            eq(mergeRelayScopes.revision, scope.revision),
          ),
        );
      return result;
    });
  }

  async read<T>(
    environment: MergeEnvironment,
    operation: (state: MergeRelayState) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction(async (transaction) => {
      const rows = await transaction
        .select()
        .from(mergeRelayRecords)
        .where(
          and(
            eq(mergeRelayRecords.appId, MERGE_RELAY_APP_ID),
            eq(mergeRelayRecords.environment, environment),
          ),
        );
      const state = parseMergeRelayState(
        rows.length === 0 ? emptyMergeRelayState() : fromRows(rows),
        environment,
      );
      return operation(cloneMergeState(state));
    });
  }

  async transact<T>(
    environment: MergeEnvironment,
    operation: (state: MergeRelayState) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction(async (transaction) => {
      await transaction
        .insert(mergeRelayScopes)
        .values({ appId: MERGE_RELAY_APP_ID, environment })
        .onConflictDoNothing({ target: [mergeRelayScopes.appId, mergeRelayScopes.environment] });
      const scope = await lockScope(transaction, environment);
      const rows = await transaction
        .select()
        .from(mergeRelayRecords)
        .where(
          and(
            eq(mergeRelayRecords.appId, MERGE_RELAY_APP_ID),
            eq(mergeRelayRecords.environment, environment),
          ),
        );
      const state = parseMergeRelayState(
        rows.length === 0 ? emptyMergeRelayState() : fromRows(rows),
        environment,
      );
      const working = cloneMergeState(state);
      const result = await operation(working);
      const valid = parseMergeRelayState(working);
      await this.syncRows(transaction, environment, rows, valid);
      await transaction
        .update(mergeRelayScopes)
        .set({ revision: scope.revision + 1, updatedAt: new Date() })
        .where(
          and(
            eq(mergeRelayScopes.appId, MERGE_RELAY_APP_ID),
            eq(mergeRelayScopes.environment, environment),
            eq(mergeRelayScopes.revision, scope.revision),
          ),
        );
      return result;
    });
  }

  private async syncRows(
    transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
    environment: MergeEnvironment,
    beforeRows: Array<{ recordType: string; recordId: string; payload: unknown }>,
    state: MergeRelayState,
  ): Promise<void> {
    const afterRows = rowsForState(environment, state);
    const afterKeys = new Set(afterRows.map((row) => rowKey(row.recordType, row.recordId)));
    for (const row of beforeRows) {
      if (!afterKeys.has(rowKey(row.recordType, row.recordId)))
        await transaction
          .delete(mergeRelayRecords)
          .where(
            and(
              eq(mergeRelayRecords.appId, MERGE_RELAY_APP_ID),
              eq(mergeRelayRecords.environment, environment),
              eq(mergeRelayRecords.recordType, row.recordType),
              eq(mergeRelayRecords.recordId, row.recordId),
            ),
          );
    }
    for (const row of afterRows) {
      const before = beforeRows.find(
        (candidate) =>
          rowKey(candidate.recordType, candidate.recordId) === rowKey(row.recordType, row.recordId),
      );
      if (before && JSON.stringify(before.payload) === JSON.stringify(row.payload)) continue;
      await transaction
        .insert(mergeRelayRecords)
        .values([row])
        .onConflictDoUpdate({
          target: [
            mergeRelayRecords.appId,
            mergeRelayRecords.environment,
            mergeRelayRecords.recordType,
            mergeRelayRecords.recordId,
          ],
          set: { payload: row.payload, updatedAt: new Date() },
        });
    }
  }
}
