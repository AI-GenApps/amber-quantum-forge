import { createMemoryAdapter } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import {
  createRunsStore,
  isCampaignKey,
  MAX_RUNS,
  parseRuns,
  pruneRuns,
  RUNS_KEY,
  type RunEntry,
  type RunState,
} from "../../src/save/runs";

function run(key: string, extra: Partial<RunState> = {}): RunState {
  return {
    puzzleKey: key,
    tiles: "0".repeat(25),
    locked: [],
    hintCount: 0,
    elapsedMs: 1000,
    moves: 3,
    ...extra,
  };
}

function entry(key: string, updatedAt: number): RunEntry {
  return { ...run(key), updatedAt };
}

describe("runs store", () => {
  it("stores, reads, replaces and removes a run", async () => {
    const runs = createRunsStore(createMemoryAdapter());
    expect(await runs.get("harbor-01")).toBeNull();
    await runs.put(run("harbor-01", { moves: 4, locked: [3, 7], hintCount: 2 }), 100);
    expect(await runs.get("harbor-01")).toEqual({
      ...run("harbor-01", { moves: 4, locked: [3, 7], hintCount: 2 }),
      updatedAt: 100,
    });
    await runs.put(run("harbor-01", { moves: 9 }), 200);
    expect((await runs.get("harbor-01"))?.moves).toBe(9);
    expect(await runs.list()).toHaveLength(1);
    await runs.remove("harbor-01");
    expect(await runs.get("harbor-01")).toBeNull();
    await runs.remove("never-there");
  });

  it("keeps the daily board under daily-YYYY-MM-DD across a restart", async () => {
    const adapter = createMemoryAdapter();
    await createRunsStore(adapter).put(
      run("daily-2026-10-23", { tiles: "a".repeat(25).replace(/a/g, "0") }),
      5,
    );
    expect(await createRunsStore(adapter).get("daily-2026-10-23")).not.toBeNull();
    expect(adapter.entries.has(RUNS_KEY)).toBe(true);
  });

  it("clear empties the store", async () => {
    const runs = createRunsStore(createMemoryAdapter());
    await runs.put(run("harbor-02"), 1);
    await runs.clear();
    expect(await runs.list()).toEqual([]);
  });
});

describe("pruning", () => {
  it("caps at 160 entries", () => {
    expect(MAX_RUNS).toBe(160);
    const many: Record<string, RunEntry> = {};
    for (let k = 0; k < 200; k++) many[`daily-${k}`] = entry(`daily-${k}`, k);
    expect(Object.keys(pruneRuns(many))).toHaveLength(160);
  });

  it("drops the oldest daily runs first and the oldest campaign runs last", () => {
    const runs: Record<string, RunEntry> = {
      "harbor-01": entry("harbor-01", 1),
      "harbor-02": entry("harbor-02", 2),
      "daily-2026-10-01": entry("daily-2026-10-01", 50),
      "daily-2026-10-02": entry("daily-2026-10-02", 60),
    };
    expect(Object.keys(pruneRuns(runs, 3)).sort()).toEqual([
      "daily-2026-10-02",
      "harbor-01",
      "harbor-02",
    ]);
    expect(Object.keys(pruneRuns(runs, 2)).sort()).toEqual(["harbor-01", "harbor-02"]);
    expect(Object.keys(pruneRuns(runs, 1))).toEqual(["harbor-02"]);
    expect(pruneRuns(runs, 4)).toBe(runs);
  });

  it("prunes through put", async () => {
    const runs = createRunsStore(createMemoryAdapter(), 3);
    for (let k = 1; k <= 5; k++) await runs.put(run(`daily-2026-10-0${k}`), k);
    const keys = (await runs.list()).map((r) => r.puzzleKey).sort();
    expect(keys).toEqual(["daily-2026-10-03", "daily-2026-10-04", "daily-2026-10-05"]);
  });

  it("knows campaign keys", () => {
    expect(isCampaignKey("sky-30")).toBe(true);
    expect(isCampaignKey("daily-2026-10-23")).toBe(false);
  });
});

describe("parseRuns", () => {
  it("drops malformed entries but keeps good ones", () => {
    const good = entry("harbor-03", 5);
    const parsed = parseRuns({
      runs: {
        "harbor-03": good,
        "harbor-04": { ...entry("harbor-04", 1), tiles: "xyz" },
        "harbor-05": { ...entry("harbor-05", 1), puzzleKey: "other" },
        "harbor-06": { ...entry("harbor-06", 1), locked: ["a"] },
        "harbor-07": 7,
      },
    });
    expect(Object.keys(parsed?.runs ?? {})).toEqual(["harbor-03"]);
  });

  it("rejects a wrong container", () => {
    expect(parseRuns(null)).toBeNull();
    expect(parseRuns({})).toBeNull();
    expect(parseRuns({ runs: [] })).toBeNull();
  });

  it("recovers from corrupt stored runs", async () => {
    const adapter = createMemoryAdapter({ [RUNS_KEY]: "garbage" });
    const runs = createRunsStore(adapter);
    expect(await runs.list()).toEqual([]);
    expect(await runs.store.readBackup()).toBe("garbage");
  });
});
