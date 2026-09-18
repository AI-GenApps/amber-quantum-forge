import type { MergeRelayArtifactStore } from "./artifact-store";
import type { MergeEnvironment, MergeRelayState } from "./contracts";
import {
  MERGE_RELAY_CONTENT_VERSION,
  MERGE_RELAY_RULE_VERSION,
  MERGE_RELAY_SCHEMA_VERSION,
} from "./contracts";

export interface MergeRelayStore extends MergeRelayArtifactStore {
  read<T>(
    environment: MergeEnvironment,
    operation: (state: MergeRelayState) => Promise<T>,
  ): Promise<T>;
  transact<T>(
    environment: MergeEnvironment,
    operation: (state: MergeRelayState) => Promise<T>,
  ): Promise<T>;
}

export function emptyMergeRelayState(now = new Date(0).toISOString()): MergeRelayState {
  return {
    schemaVersion: MERGE_RELAY_SCHEMA_VERSION,
    challenges: [],
    attempts: [],
    results: [],
    saves: [],
    guests: [],
    daily: [],
    configs: [
      {
        revision: 1,
        rulesVersion: MERGE_RELAY_RULE_VERSION,
        contentRevision: MERGE_RELAY_CONTENT_VERSION,
        spawnTwoWeight: 90,
        spawnFourWeight: 10,
        features: {
          daily: true,
          endless: true,
          rankedRelay: false,
          rewardedAds: false,
          cosmetics: false,
        },
        active: true,
        createdAt: now,
      },
    ],
    events: [],
    social: [],
    rewards: [],
    aliases: [],
  };
}

export function cloneMergeState(state: MergeRelayState): MergeRelayState {
  return JSON.parse(JSON.stringify(state)) as MergeRelayState;
}

export class MergeRelayStorageError extends Error {
  readonly code = "merge_relay_storage_unavailable";
}

export class UnavailableMergeRelayStore implements MergeRelayStore {
  async readArtifacts<T>(): Promise<{
    items: T[];
    nextCursor: string | null;
  }> {
    throw new MergeRelayStorageError("No Merge Relay database is configured");
  }

  async transactArtifacts<T>(): Promise<T> {
    throw new MergeRelayStorageError("No Merge Relay database is configured");
  }

  async read<T>(): Promise<T> {
    throw new MergeRelayStorageError("No Merge Relay database is configured");
  }

  async transact<T>(): Promise<T> {
    throw new MergeRelayStorageError("No Merge Relay database is configured");
  }
}
