import type { db } from "@repo/db";
import {
  ludoCommands,
  ludoEvents,
  ludoMatches,
  ludoMatchmakingTickets,
  ludoPlayers,
  ludoRooms,
} from "@repo/db";
import { Column, is, Param, SQL, StringChunk } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { DrizzleLudoStore } from "./drizzle-store";
import { type LudoState, LudoStorageError } from "./store";

/**
 * Flattens a drizzle `and(eq(col, value), ...)` condition tree into
 * `{ column, value }` pairs by walking the public `queryChunks`/`value`
 * fields drizzle-orm exposes on `SQL`/`StringChunk`/`Param`/`Column`. This
 * is enough to make the fake driver below actually honor `.where(...)`
 * instead of ignoring it, so the optimistic-revision-conflict assertions
 * exercise the real predicate the production code builds.
 */
function extractEqualities(condition: unknown): Array<{ column: string; value: unknown }> {
  const flat: unknown[] = [];
  const flatten = (chunk: unknown): void => {
    if (is(chunk, SQL)) {
      for (const inner of chunk.queryChunks) flatten(inner);
      return;
    }
    if (is(chunk, StringChunk)) {
      flat.push(chunk.value.join(""));
      return;
    }
    flat.push(chunk);
  };
  flatten(condition);
  const pairs: Array<{ column: string; value: unknown }> = [];
  for (let i = 0; i < flat.length; i += 1) {
    const column = flat[i];
    if (!is(column, Column)) continue;
    const operator = flat[i + 1];
    const value = flat[i + 2];
    if (typeof operator === "string" && operator.trim() === "=" && is(value, Param))
      pairs.push({ column: column.name, value: value.value });
  }
  return pairs;
}

function matchesRow(row: Record<string, unknown>, condition: unknown): boolean {
  return extractEqualities(condition).every(({ column, value }) => row[toCamel(column)] === value);
}

function toCamel(snake: string): string {
  return snake.replace(/_([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

type Row = Record<string, unknown>;

class FakeTable {
  readonly rows: Row[] = [];
  constructor(readonly primaryKey: string[]) {}

  key(row: Row): string {
    return this.primaryKey.map((field) => String(row[field])).join("\u0000");
  }
}

class FakeTransaction {
  readonly matches = new FakeTable(["appId", "environment", "matchId"]);
  readonly players = new FakeTable(["appId", "environment", "matchId", "seat"]);
  readonly events = new FakeTable(["appId", "environment", "matchId", "sequence"]);
  readonly commands = new FakeTable(["appId", "environment", "matchId", "idempotencyKey"]);
  readonly tickets = new FakeTable(["appId", "environment", "ticketId"]);
  readonly rooms = new FakeTable(["appId", "environment", "roomCode"]);

  private tableFor(table: unknown): FakeTable {
    if (table === ludoMatches) return this.matches;
    if (table === ludoPlayers) return this.players;
    if (table === ludoEvents) return this.events;
    if (table === ludoCommands) return this.commands;
    if (table === ludoMatchmakingTickets) return this.tickets;
    if (table === ludoRooms) return this.rooms;
    throw new Error("unknown ludo table in fake transaction");
  }

  select() {
    return {
      from: (table: unknown) => ({
        where: async (condition: unknown) =>
          this.tableFor(table).rows.filter((row) => matchesRow(row, condition)),
      }),
    };
  }

  insert(table: unknown) {
    const fake = this.tableFor(table);
    return {
      values: (value: Row) => ({
        onConflictDoNothing: async () => {
          const key = fake.key(value);
          if (!fake.rows.some((row) => fake.key(row) === key)) fake.rows.push({ ...value });
        },
        onConflictDoUpdate: async ({ set }: { set: Row }) => {
          const key = fake.key(value);
          const existing = fake.rows.find((row) => fake.key(row) === key);
          if (existing) Object.assign(existing, set);
          else fake.rows.push({ ...value });
        },
        // A plain `insert(...).values(...)` with no conflict clause (as
        // used for a brand-new match row) is awaited directly with no
        // method call, exactly like a real drizzle query builder — which
        // is itself thenable. Mirroring that here is what makes `await`
        // work without an explicit execute call.
        // biome-ignore lint/suspicious/noThenProperty: mirrors drizzle's own thenable query builder for this fake.
        then: (resolve: (value: undefined) => void) => {
          fake.rows.push({ ...value });
          resolve(undefined);
        },
      }),
    };
  }

  update(table: unknown) {
    const fake = this.tableFor(table);
    return {
      set: (value: Row) => ({
        where: (condition: unknown) => ({
          returning: async (selection: Record<string, unknown>) => {
            const matched = fake.rows.filter((row) => matchesRow(row, condition));
            for (const row of matched) Object.assign(row, value);
            return matched.map((row) =>
              Object.fromEntries(Object.keys(selection).map((field) => [field, row[field]])),
            );
          },
        }),
      }),
    };
  }

  delete(table: unknown) {
    const fake = this.tableFor(table);
    return {
      where: async (condition: unknown) => {
        const remaining = fake.rows.filter((row) => !matchesRow(row, condition));
        fake.rows.splice(0, fake.rows.length, ...remaining);
      },
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

/** A row shaped like what the fake table stores, including the `appId`
 * scoping column that lives alongside — but outside — `LudoMatchRow`. */
function seedMatchRow(overrides: Partial<LudoState["matches"][number]> = {}): Row {
  return { appId: "ludo", ...baseMatch(overrides) };
}

function baseMatch(overrides: Partial<LudoState["matches"][number]> = {}) {
  return {
    matchId: "match_1",
    environment: "debug" as const,
    mode: "classic" as const,
    status: "active",
    seatCount: 4,
    rulesVersion: "ludo.v1",
    currentTurnSeat: 0,
    phase: "awaiting_roll",
    sixStreak: 0,
    turnDeadlineAt: null,
    revision: 0,
    matchOrigin: "direct" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("Drizzle Ludo persistence", () => {
  it("reads an empty environment without creating any rows", async () => {
    const fake = new FakeTransaction();
    const store = new DrizzleLudoStore(fakeDatabase(fake));
    const state = await store.read("debug", async (current) => current);
    expect(state.matches).toHaveLength(0);
    expect(fake.matches.rows).toHaveLength(0);
  });

  it("inserts a new match as a single targeted row", async () => {
    const fake = new FakeTransaction();
    const store = new DrizzleLudoStore(fakeDatabase(fake));
    await store.transact("debug", async (state) => {
      state.matches.push(baseMatch());
      return undefined;
    });
    expect(fake.matches.rows).toHaveLength(1);
    expect(fake.matches.rows[0]?.matchId).toBe("match_1");
  });

  it("upserts only the changed match row while leaving other tables untouched", async () => {
    const fake = new FakeTransaction();
    const store = new DrizzleLudoStore(fakeDatabase(fake));
    await store.transact("debug", async (state) => {
      state.matches.push(baseMatch());
      state.players.push({
        matchId: "match_1",
        environment: "debug",
        seat: 0,
        subject: "user-1",
        isBot: false,
        botDifficulty: null,
        displayNameCache: "Ada",
        connectedAt: null,
        missCount: 0,
      });
      return undefined;
    });
    await store.transact("debug", async (state) => {
      const match = state.matches.find((candidate) => candidate.matchId === "match_1");
      if (match) {
        match.currentTurnSeat = 1;
        match.revision += 1;
      }
      return undefined;
    });
    expect(fake.matches.rows).toHaveLength(1);
    expect(fake.matches.rows[0]?.currentTurnSeat).toBe(1);
    expect(fake.matches.rows[0]?.revision).toBe(1);
    // The untouched player row was never rewritten.
    expect(fake.players.rows).toHaveLength(1);
  });

  it("rejects a match update whose revision was already advanced by another writer", async () => {
    const fake = new FakeTransaction();
    fake.matches.rows.push(seedMatchRow({ revision: 5 }));
    const store = new DrizzleLudoStore(fakeDatabase(fake));
    // Simulate a racing writer bumping the row to revision 6 between this
    // store's read and its write by mutating the fake table directly.
    await expect(
      store.transact("debug", async (state) => {
        const match = state.matches.find((candidate) => candidate.matchId === "match_1");
        if (match) {
          const raced = fake.matches.rows.find((row) => row.matchId === "match_1");
          if (raced) raced.revision = 6;
          match.revision = 6;
          match.currentTurnSeat = 2;
        }
        return undefined;
      }),
    ).rejects.toThrow(/modified by another writer/);
  });

  it("does not persist any row when the operation throws", async () => {
    const fake = new FakeTransaction();
    const store = new DrizzleLudoStore(fakeDatabase(fake));
    await store.transact("debug", async (state) => {
      state.matches.push(baseMatch());
      return undefined;
    });
    await expect(
      store.transact("debug", async (state) => {
        state.matches.push(baseMatch({ matchId: "match_2" }));
        throw new Error("operation failed");
      }),
    ).rejects.toThrow("operation failed");
    // Because the throw happens inside the `operation` callback, before
    // any sync* call runs, the fake never observes the second match.
    expect(fake.matches.rows.map((row) => row.matchId)).toEqual(["match_1"]);
  });

  it("keeps app/environment scopes isolated for the same matchId", async () => {
    const fake = new FakeTransaction();
    const store = new DrizzleLudoStore(fakeDatabase(fake));
    await store.transact("debug", async (state) => {
      state.matches.push(baseMatch({ matchOrigin: "matchmaking" }));
      return undefined;
    });
    const staging = await store.read("staging", async (state) => state.matches);
    expect(staging).toHaveLength(0);
    const debug = await store.read("debug", async (state) => state.matches);
    expect(debug).toHaveLength(1);
  });

  it("appends events without rewriting earlier sequence rows", async () => {
    const fake = new FakeTransaction();
    const store = new DrizzleLudoStore(fakeDatabase(fake));
    await store.transact("debug", async (state) => {
      state.events.push({
        matchId: "match_1",
        environment: "debug",
        sequence: 1,
        eventType: "player_joined",
        payload: { seat: 0 },
        createdAt: "2026-01-01T00:00:00.000Z",
      });
      return undefined;
    });
    await store.transact("debug", async (state) => {
      state.events.push({
        matchId: "match_1",
        environment: "debug",
        sequence: 2,
        eventType: "dice_rolled",
        payload: { seat: 0, roll: 4 },
        createdAt: "2026-01-01T00:00:01.000Z",
      });
      return undefined;
    });
    expect(fake.events.rows).toHaveLength(2);
    expect(fake.events.rows[0]?.payload).toEqual({ seat: 0 });
  });

  it("short-circuits a repeated idempotency key instead of overwriting the ledger", async () => {
    const fake = new FakeTransaction();
    const store = new DrizzleLudoStore(fakeDatabase(fake));
    await store.transact("debug", async (state) => {
      state.commands.push({
        matchId: "match_1",
        environment: "debug",
        idempotencyKey: "cmd-1",
        commandType: "roll_dice",
        resultSummary: { roll: 4 },
        createdAt: "2026-01-01T00:00:00.000Z",
      });
      return undefined;
    });
    await store.transact("debug", async (state) => {
      // A caller replaying the same idempotency key would find the
      // existing row already present and skip re-executing; the store
      // still receives the same row unchanged.
      state.commands.push({
        matchId: "match_1",
        environment: "debug",
        idempotencyKey: "cmd-1",
        commandType: "roll_dice",
        resultSummary: { roll: 4 },
        createdAt: "2026-01-01T00:00:00.000Z",
      });
      return undefined;
    });
    expect(fake.commands.rows).toHaveLength(1);
    expect(fake.commands.rows[0]?.resultSummary).toEqual({ roll: 4 });
  });

  it("throws LudoStorageError as the conflict error type", async () => {
    const fake = new FakeTransaction();
    fake.matches.rows.push(seedMatchRow({ revision: 1 }));
    const store = new DrizzleLudoStore(fakeDatabase(fake));
    let caught: unknown;
    try {
      await store.transact("debug", async (state) => {
        const match = state.matches.find((candidate) => candidate.matchId === "match_1");
        if (match) {
          const raced = fake.matches.rows.find((row) => row.matchId === "match_1");
          if (raced) raced.revision = 2;
          match.revision = 2;
        }
        return undefined;
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(LudoStorageError);
    expect((caught as LudoStorageError).code).toBe("ludo_match_conflict");
  });
});
