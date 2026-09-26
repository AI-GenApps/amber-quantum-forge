import { describe, expect, it } from "vitest";
import { InMemoryLudoStore } from "./memory-store";
import type { LudoMatchRow } from "./store";

function match(overrides: Partial<LudoMatchRow> = {}): LudoMatchRow {
  return {
    matchId: "shared_match_id",
    environment: "debug",
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
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("Ludo app/environment scope isolation", () => {
  it("keeps a debug-scoped write invisible to a staging-scoped read for the same matchId", async () => {
    const store = new InMemoryLudoStore();
    await store.transact("debug", async (state) => {
      state.matches.push(match({ environment: "debug" }));
      state.players.push({
        matchId: "shared_match_id",
        environment: "debug",
        seat: 0,
        subject: "debug-owner",
        isBot: false,
        botDifficulty: null,
        displayNameCache: "Debug Player",
        connectedAt: null,
        missCount: 0,
      });
      return undefined;
    });

    const stagingMatches = await store.read("staging", async (state) => state.matches);
    const stagingPlayers = await store.read("staging", async (state) => state.players);
    expect(stagingMatches.find((row) => row.matchId === "shared_match_id")).toBeUndefined();
    expect(stagingPlayers).toHaveLength(0);

    const debugMatches = await store.read("debug", async (state) => state.matches);
    expect(debugMatches.find((row) => row.matchId === "shared_match_id")).toBeDefined();

    // A staging write to the SAME matchId does not clobber or merge with
    // the debug row: each environment owns its own independent copy.
    await store.transact("staging", async (state) => {
      state.matches.push(match({ environment: "staging", status: "waiting", seatCount: 2 }));
      return undefined;
    });
    const debugAfterStagingWrite = await store.read("debug", async (state) =>
      state.matches.find((row) => row.matchId === "shared_match_id"),
    );
    expect(debugAfterStagingWrite?.status).toBe("active");
    expect(debugAfterStagingWrite?.seatCount).toBe(4);
  });

  it("keeps production isolated from both debug and staging for events with the same sequence", async () => {
    const store = new InMemoryLudoStore();
    await store.transact("debug", async (state) => {
      state.events.push({
        matchId: "shared_match_id",
        environment: "debug",
        sequence: 1,
        eventType: "player_joined",
        payload: { seat: 0, env: "debug" },
        createdAt: "2026-01-01T00:00:00.000Z",
      });
      return undefined;
    });
    await store.transact("production", async (state) => {
      state.events.push({
        matchId: "shared_match_id",
        environment: "production",
        sequence: 1,
        eventType: "player_joined",
        payload: { seat: 0, env: "production" },
        createdAt: "2026-01-01T00:00:00.000Z",
      });
      return undefined;
    });
    const debugEvents = await store.read("debug", async (state) => state.events);
    const productionEvents = await store.read("production", async (state) => state.events);
    const stagingEvents = await store.read("staging", async (state) => state.events);
    expect(debugEvents).toHaveLength(1);
    expect(debugEvents[0]?.payload).toEqual({ seat: 0, env: "debug" });
    expect(productionEvents).toHaveLength(1);
    expect(productionEvents[0]?.payload).toEqual({ seat: 0, env: "production" });
    expect(stagingEvents).toHaveLength(0);
  });
});
