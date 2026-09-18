import type { db } from "@repo/db";
import { mergeRelayRecords, mergeRelayScopes } from "@repo/db";
import { describe, expect, it } from "vitest";
import type { MergeRelayState } from "./contracts";
import { DrizzleMergeRelayStore } from "./drizzle-store";
import { checkpointHash } from "./engine";
import { emptyMergeRelayState } from "./store";

interface ScopeRow {
  appId: string;
  environment: string;
  revision: number;
}

interface RecordRow {
  appId: string;
  environment: string;
  recordType: string;
  recordId: string;
  payload: unknown;
}

class FakeTransaction {
  readonly scopes: ScopeRow[] = [];
  readonly records: RecordRow[] = [];

  insert(table: unknown) {
    return {
      values: (value: unknown) => {
        if (table === mergeRelayScopes) {
          const row = value as ScopeRow;
          if (
            !this.scopes.some(
              (scope) => scope.appId === row.appId && scope.environment === row.environment,
            )
          )
            this.scopes.push({ ...row });
        }
        const rows = Array.isArray(value) ? (value as RecordRow[]) : [value as RecordRow];
        return {
          onConflictDoNothing: async () => undefined,
          onConflictDoUpdate: async ({ set }: { set: Partial<RecordRow> }) => {
            if (table !== mergeRelayRecords) return;
            for (const row of rows) {
              const existing = this.records.find(
                (candidate) =>
                  candidate.appId === row.appId &&
                  candidate.environment === row.environment &&
                  candidate.recordType === row.recordType &&
                  candidate.recordId === row.recordId,
              );
              if (existing) Object.assign(existing, row, set);
              else this.records.push({ ...row });
            }
          },
        };
      },
    };
  }

  select() {
    return {
      from: (table: unknown) => {
        const values = table === mergeRelayScopes ? this.scopes : this.records;
        if (table === mergeRelayScopes) {
          return {
            where: () => ({
              for: () => ({ limit: async (count: number) => values.slice(0, count) }),
            }),
          };
        }
        return { where: async () => values };
      },
    };
  }

  delete(table: unknown) {
    return {
      where: async () => {
        if (table === mergeRelayRecords) this.records.splice(0, this.records.length);
      },
    };
  }

  update(_table: unknown) {
    return {
      set: (value: Partial<ScopeRow>) => ({
        where: async () => {
          const scope = this.scopes[0];
          if (scope && value.revision !== undefined) scope.revision = value.revision;
        },
      }),
    };
  }
}

class FakeDatabase {
  constructor(readonly transactionState = new FakeTransaction()) {}

  transaction<T>(callback: (transaction: FakeTransaction) => Promise<T>): Promise<T> {
    return callback(this.transactionState);
  }
}

function fakeDatabase(state: FakeTransaction): typeof db {
  return new FakeDatabase(state) as unknown as typeof db;
}

describe("Drizzle Merge Relay persistence", () => {
  it("reads an empty namespace without creating a scope or writing a row", async () => {
    const fake = new FakeTransaction();
    const store = new DrizzleMergeRelayStore(fakeDatabase(fake));
    const config = await store.read("debug", async (state) => state.configs[0]);
    expect(config?.revision).toBe(1);
    expect(fake.scopes).toHaveLength(0);
    expect(fake.records).toHaveLength(0);
  });

  it("stores artifacts as separate rows under a locked app/environment scope", async () => {
    const fake = new FakeTransaction();
    const store = new DrizzleMergeRelayStore(fakeDatabase(fake));
    await store.transact("debug", async (state) => {
      state.saves.push({
        saveId: "save-1",
        subject: "user",
        schemaVersion: 1,
        version: 1,
        payload: {},
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
      return undefined;
    });
    expect(fake.scopes).toHaveLength(1);
    expect(fake.records).toHaveLength(2);
    expect(fake.records.map((record) => record.recordType)).toEqual(["save", "config"]);
    expect(fake.records[0]).not.toHaveProperty("state");
    const restored = await store.transact("debug", async (state) => state.saves[0]);
    expect(restored?.saveId).toBe("save-1");
  });

  it("does not replace normalized rows when an operation fails", async () => {
    const fake = new FakeTransaction();
    const store = new DrizzleMergeRelayStore(fakeDatabase(fake));
    await store.transact("debug", async (state) => {
      state.saves.push({
        saveId: "stable",
        subject: "user",
        schemaVersion: 1,
        version: 1,
        payload: {},
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
      return undefined;
    });
    await expect(
      store.transact("debug", async () => {
        throw new Error("operation failed");
      }),
    ).rejects.toThrow("operation failed");
    expect(fake.records.map((record) => record.recordId)).toEqual([
      JSON.stringify(["user", "stable"]),
      "1",
    ]);
  });

  it("upserts only the changed artifact while preserving the config row", async () => {
    const fake = new FakeTransaction();
    const store = new DrizzleMergeRelayStore(fakeDatabase(fake));
    await store.transact("debug", async (state) => {
      state.saves.push({
        saveId: "stable",
        subject: "user",
        schemaVersion: 1,
        version: 1,
        payload: { score: 1 },
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
      return undefined;
    });
    await store.transact("debug", async (state) => {
      const save = state.saves[0];
      if (save) save.payload = { score: 2 };
      return undefined;
    });
    expect(fake.records.filter((record) => record.recordType === "config")).toHaveLength(1);
    expect(fake.records.find((record) => record.recordType === "save")?.payload).toMatchObject({
      payload: { score: 2 },
    });
  });

  it("rejects malformed restored state before it reaches a service operation", async () => {
    const fake = new FakeTransaction();
    fake.scopes.push({ appId: "merge_relay", environment: "debug", revision: 0 });
    fake.records.push({
      appId: "merge_relay",
      environment: "debug",
      recordType: "config",
      recordId: "1",
      payload: { revision: 1 },
    });
    const store = new DrizzleMergeRelayStore(fakeDatabase(fake));
    await expect(
      store.transact("debug", async (_state: MergeRelayState) => undefined),
    ).rejects.toThrow("Merge Relay config is invalid");
  });

  it("rejects a record copied into a different environment scope", async () => {
    const fake = new FakeTransaction();
    const checkpoint = {
      board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      score: 0,
      moveCount: 0,
      seed: 7,
      rngState: 123,
      ruleVersion: "MR-2D-1" as const,
    };
    fake.scopes.push({ appId: "merge_relay", environment: "debug", revision: 0 });
    fake.records.push({
      appId: "merge_relay",
      environment: "debug",
      recordType: "config",
      recordId: "1",
      payload: emptyMergeRelayState().configs[0],
    });
    fake.records.push({
      appId: "merge_relay",
      environment: "debug",
      recordType: "challenge",
      recordId: "ch_1",
      payload: {
        challengeId: "ch_1",
        environment: "staging",
        ownerSubject: "owner",
        creatorAlias: "Ada",
        checkpoint,
        checkpointHash: checkpointHash(checkpoint),
        parentChallengeId: null,
        idempotencyKey: "create-1",
        status: "open",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    const store = new DrizzleMergeRelayStore(fakeDatabase(fake));
    await expect(
      store.transact("debug", async (_state: MergeRelayState) => undefined),
    ).rejects.toThrow("Merge Relay challenge is invalid");
  });
});
