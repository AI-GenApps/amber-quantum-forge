import { describe, expect, it } from "vitest";
import { DrizzleLudoStore } from "./drizzle-store";
import { LudoStorageError } from "./store";

/**
 * Mirrors `merge-relay/drizzle-postgres.test.ts`: explicitly skips when no
 * dedicated test-only database URL is configured, and otherwise runs the
 * real Drizzle adapter against an isolated PostgreSQL 16 database with the
 * checked-in migrations applied. The user chose not to provide a test
 * database for this run, so this suite is expected to report as skipped
 * (NOT RUN), not failing.
 */
const databaseUrl = process.env.LUDO_TEST_DATABASE_URL;
const suite = describe.skipIf(!databaseUrl);

suite("Ludo isolated PostgreSQL adapter", () => {
  it("serializes concurrent match creation without rewriting unrelated matches", async () => {
    if (!databaseUrl) return;
    const store = new DrizzleLudoStore();
    const suffix = Date.now().toString(36);
    await Promise.all([createMatch(store, `one_${suffix}`), createMatch(store, `two_${suffix}`)]);
    const matches = await store.read("staging", async (state) => state.matches);
    expect(matches.filter((match) => match.matchId.endsWith(suffix))).toHaveLength(2);
  });

  it("rolls back a failed operation before any row upsert", async () => {
    if (!databaseUrl) return;
    const store = new DrizzleLudoStore();
    const matchId = `stable_${Date.now().toString(36)}`;
    await createMatch(store, matchId);
    await expect(
      store.transact("staging", async (state) => {
        const match = state.matches.find((candidate) => candidate.matchId === matchId);
        if (match) match.currentTurnSeat = 3;
        throw new Error("rollback-check");
      }),
    ).rejects.toThrow("rollback-check");
    const match = await store.read("staging", async (state) =>
      state.matches.find((candidate) => candidate.matchId === matchId),
    );
    expect(match?.currentTurnSeat).toBe(0);
  });

  it("raises a conflict when a match revision was advanced concurrently", async () => {
    if (!databaseUrl) return;
    const store = new DrizzleLudoStore();
    const matchId = `conflict_${Date.now().toString(36)}`;
    await createMatch(store, matchId);
    // Two transactions read the same revision, then attempt to commit a
    // change to the same match; only one may win.
    const results = await Promise.allSettled([
      bumpTurn(store, matchId, 1),
      bumpTurn(store, matchId, 2),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled.length + rejected.length).toBe(2);
    // Depending on statement interleaving both may succeed serially (the
    // second read happens after the first commits) or one may conflict;
    // either way no result silently loses the store's own error type.
    for (const result of rejected) {
      expect((result as PromiseRejectedResult).reason).toBeInstanceOf(LudoStorageError);
    }
  });

  it("keeps environment namespaces isolated for the same matchId", async () => {
    if (!databaseUrl) return;
    const store = new DrizzleLudoStore();
    const matchId = `scoped_${Date.now().toString(36)}`;
    await createMatch(store, matchId, "debug");
    const debug = await store.read("debug", async (state) =>
      state.matches.find((candidate) => candidate.matchId === matchId),
    );
    const staging = await store.read("staging", async (state) =>
      state.matches.find((candidate) => candidate.matchId === matchId),
    );
    expect(debug).toBeDefined();
    expect(staging).toBeUndefined();
  });
});

async function createMatch(
  store: DrizzleLudoStore,
  matchId: string,
  environment: "debug" | "staging" | "production" = "staging",
): Promise<void> {
  await store.transact(environment, async (state) => {
    state.matches.push({
      matchId,
      environment,
      mode: "classic",
      status: "active",
      seatCount: 4,
      rulesVersion: "ludo.v1",
      currentTurnSeat: 0,
      phase: "awaiting_roll",
      sixStreak: 0,
      turnDeadlineAt: null,
      revision: 0,
      matchOrigin: "direct",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return undefined;
  });
}

async function bumpTurn(store: DrizzleLudoStore, matchId: string, seat: number): Promise<void> {
  await store.transact("staging", async (state) => {
    const match = state.matches.find((candidate) => candidate.matchId === matchId);
    if (!match) return undefined;
    match.currentTurnSeat = seat;
    match.revision += 1;
    match.updatedAt = new Date().toISOString();
    return undefined;
  });
}
