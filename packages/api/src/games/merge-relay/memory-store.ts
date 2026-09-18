import {
  type MemoryArtifact,
  pageStateArtifacts,
  putStateArtifact,
  removeStateArtifact,
} from "./artifact-state";
import { clone, matches } from "./artifact-state-helpers";
import {
  type MergeRelayArtifactFilter,
  type MergeRelayArtifactMetadata,
  type MergeRelayArtifactPage,
  type MergeRelayArtifactTransaction,
  type MergeRelayRecordType,
  mergeRelayPlatformRecordTypes,
  validateArtifactPageLimit,
} from "./artifact-store";
import type { MergeEnvironment, MergeRelayState } from "./contracts";
import { parseMergeRelayState } from "./state-validation";
import { cloneMergeState, emptyMergeRelayState, type MergeRelayStore } from "./store";

export class InMemoryMergeRelayStore implements MergeRelayStore {
  private readonly states = new Map<MergeEnvironment, MergeRelayState>();
  private readonly platformStates = new Map<MergeEnvironment, Map<string, MemoryArtifact>>();
  private readonly tails = new Map<MergeEnvironment, Promise<void>>();

  constructor(initial?: Partial<Record<MergeEnvironment, MergeRelayState>>) {
    for (const environment of ["debug", "staging", "production"] as const) {
      const state = initial?.[environment];
      if (state) this.states.set(environment, cloneMergeState(state));
    }
  }

  async transact<T>(
    environment: MergeEnvironment,
    operation: (state: MergeRelayState) => Promise<T>,
  ): Promise<T> {
    const previous = this.tails.get(environment) ?? Promise.resolve();
    let result!: T;
    const current = previous
      .then(
        () => undefined,
        () => undefined,
      )
      .then(async () => {
        const original = parseMergeRelayState(
          this.states.get(environment) ?? emptyMergeRelayState(),
          environment,
        );
        const working = cloneMergeState(original);
        result = await operation(working);
        this.states.set(environment, parseMergeRelayState(working, environment));
      });
    const tail: Promise<void> = current.then(() => undefined).catch(() => Promise.resolve());
    this.tails.set(environment, tail);
    await current;
    if (this.tails.get(environment) === tail) this.tails.delete(environment);
    return result;
  }

  async read<T>(
    environment: MergeEnvironment,
    operation: (state: MergeRelayState) => Promise<T>,
  ): Promise<T> {
    const state = parseMergeRelayState(
      this.states.get(environment) ?? emptyMergeRelayState(),
      environment,
    );
    return operation(cloneMergeState(state));
  }

  async readArtifacts<T>(
    environment: MergeEnvironment,
    filter: MergeRelayArtifactFilter,
    parse: (payload: unknown) => T,
  ): Promise<MergeRelayArtifactPage<T>> {
    if (isPlatformRecordType(filter.recordType))
      return pagePlatformArtifacts(this.platformStates.get(environment), filter, parse);
    const state = parseMergeRelayState(
      this.states.get(environment) ?? emptyMergeRelayState(),
      environment,
    );
    return pageStateArtifacts(state, filter, parse);
  }

  async transactArtifacts<T>(
    environment: MergeEnvironment,
    operation: (transaction: MergeRelayArtifactTransaction) => Promise<T>,
  ): Promise<T> {
    return this.transact(environment, async (state) => {
      const workingPlatform = new Map(
        Array.from(this.platformStates.get(environment) ?? new Map()).map(([key, value]) => [
          key,
          { ...value, payload: clone(value.payload) },
        ]),
      );
      const transaction: MergeRelayArtifactTransaction = {
        read: async (filter, parse) => {
          if (isPlatformRecordType(filter.recordType)) {
            const page = pagePlatformArtifacts(workingPlatform, { ...filter, limit: 1 }, parse);
            return page.items[0] ?? null;
          }
          const page = pageStateArtifacts(state, { ...filter, limit: 1 }, parse);
          return page.items[0] ?? null;
        },
        list: async (filter, parse) =>
          isPlatformRecordType(filter.recordType)
            ? pagePlatformArtifacts(workingPlatform, filter, parse)
            : pageStateArtifacts(state, filter, parse),
        put: async (recordType, recordId, payload, metadata) => {
          if (isPlatformRecordType(recordType)) {
            workingPlatform.set(
              platformKey(recordType, recordId),
              platformArtifact(recordType, recordId, payload, metadata),
            );
            return;
          }
          putStateArtifact(state, recordType, recordId, payload);
        },
        remove: async (recordType, recordId) => {
          if (isPlatformRecordType(recordType)) {
            workingPlatform.delete(platformKey(recordType, recordId));
            return;
          }
          removeStateArtifact(state, recordType, recordId);
        },
      };
      const result = await operation(transaction);
      this.platformStates.set(environment, workingPlatform);
      return result;
    });
  }

  snapshot(environment: MergeEnvironment): MergeRelayState {
    return cloneMergeState(this.states.get(environment) ?? emptyMergeRelayState());
  }
}

function isPlatformRecordType(
  value: MergeRelayRecordType,
): value is (typeof mergeRelayPlatformRecordTypes)[number] {
  return (mergeRelayPlatformRecordTypes as readonly string[]).includes(value);
}

function platformKey(recordType: MergeRelayRecordType, recordId: string): string {
  return `${recordType}\u0000${recordId}`;
}

function platformArtifact(
  recordType: MergeRelayRecordType,
  recordId: string,
  payload: unknown,
  metadata: MergeRelayArtifactMetadata = {},
): MemoryArtifact {
  return {
    recordType,
    recordId,
    payload: clone(payload),
    ownerSubject: metadata.ownerSubject ?? null,
    challengeId: metadata.challengeId ?? null,
    resultId: metadata.resultId ?? null,
    idempotencyKey: metadata.idempotencyKey ?? null,
    alias: metadata.alias ?? null,
    targetSubject: metadata.targetSubject ?? null,
    lookupKey: metadata.lookupKey ?? null,
    parentRecordType: metadata.parentRecordType ?? null,
    parentRecordId: metadata.parentRecordId ?? null,
  };
}

function pagePlatformArtifacts<T>(
  source: Map<string, MemoryArtifact> | undefined,
  filter: MergeRelayArtifactFilter,
  parse: (payload: unknown) => T,
): MergeRelayArtifactPage<T> {
  validateArtifactPageLimit(filter.limit);
  const rows = Array.from(source?.values() ?? [])
    .filter((row) => matches(row, filter))
    .sort((left, right) => left.recordId.localeCompare(right.recordId));
  if (filter.direction === "desc") rows.reverse();
  const selected = rows
    .filter(
      (row) =>
        filter.afterRecordId === undefined ||
        (filter.direction === "desc"
          ? row.recordId < filter.afterRecordId
          : row.recordId > filter.afterRecordId),
    )
    .slice(0, filter.limit + 1);
  const items = selected.slice(0, filter.limit).map((row) => parse(clone(row.payload)));
  return {
    items,
    nextCursor:
      selected.length > filter.limit ? (selected[filter.limit - 1]?.recordId ?? null) : null,
  };
}
