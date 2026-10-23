import { createMemoryAdapter } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { createProfileStore, PROFILE_KEY } from "../../src/save/profile";
import { createRunsStore } from "../../src/save/runs";
import { createProgression } from "../../src/services/progression";

function setup(date = new Date(2026, 9, 23, 10, 0, 0)) {
  const adapter = createMemoryAdapter();
  const runs = createRunsStore(adapter);
  let clock = date;
  const progression = createProgression({
    store: createProfileStore(adapter),
    now: () => clock,
    runs,
  });
  return { adapter, runs, progression, setClock: (d: Date) => (clock = d) };
}

const run = (puzzleKey: string) => ({
  puzzleKey,
  tiles: "0".repeat(25),
  locked: [],
  hintCount: 0,
  elapsedMs: 10,
  moves: 1,
});

describe("progression service", () => {
  it("loads defaults, then persists after each call", async () => {
    const { adapter, progression } = setup();
    expect((await progression.load()).tokens).toBe(3);
    await progression.completePuzzle("harbor-01", { hints: 0, seconds: 30 });
    const stored = JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "{}");
    expect(stored.v).toBe(1);
    expect(stored.data.stars["harbor-01"]).toBe(3);
    expect(progression.current().stars["harbor-01"]).toBe(3);
  });

  it("removes the finished run for campaign, daily and archive solves", async () => {
    const { runs, progression } = setup();
    await runs.put(run("harbor-01"), 1);
    await runs.put(run("daily-2026-10-23"), 2);
    await runs.put(run("daily-2026-10-22"), 3);
    await progression.completePuzzle("harbor-01", { hints: 0, seconds: 30 });
    await progression.completeDaily({ hints: 0, seconds: 30 });
    await progression.completeArchive("2026-10-22", { hints: 0, seconds: 30 });
    expect(await runs.list()).toEqual([]);
  });

  it("uses the injected clock for the daily date", async () => {
    const { progression, setClock } = setup();
    const a = await progression.completeDaily({ hints: 0, seconds: 20 });
    expect(a).toMatchObject({ dateKey: "2026-10-23", streak: 1, tokensGranted: 2 });
    setClock(new Date(2026, 9, 24, 23, 59, 0));
    const b = await progression.completeDaily({ hints: 1, seconds: 20 });
    expect(b).toMatchObject({ dateKey: "2026-10-24", streak: 2, tokensGranted: 1 });
    expect(progression.current().lastDailyDate).toBe("2026-10-24");
  });

  it("spends hints until the jar is empty and then refuses", async () => {
    const { progression } = setup();
    await progression.load();
    const results = [];
    for (let k = 0; k < 5; k++) results.push((await progression.spendHint()).ok);
    expect(results).toEqual([true, true, true, false, false]);
    expect(progression.current()).toMatchObject({ tokens: 0, hintsUsed: 3 });
  });

  it("refreshes the freeze on open and survives a restart", async () => {
    const { adapter, progression } = setup();
    await progression.load();
    await progression.refreshOnOpen();
    expect(progression.current().freezeWeek).toBe("2026-W43");
    const second = createProgression({
      store: createProfileStore(adapter),
      now: () => new Date(2026, 9, 23),
    });
    expect((await second.load()).freezeWeek).toBe("2026-W43");
  });

  it("serialises concurrent calls so no reward is lost", async () => {
    const { progression } = setup();
    await progression.load();
    await Promise.all([
      progression.completePuzzle("harbor-01", { hints: 0, seconds: 10 }),
      progression.completePuzzle("harbor-02", { hints: 0, seconds: 10 }),
      progression.spendHint(),
    ]);
    expect(progression.current()).toMatchObject({ hintsUsed: 1, tokens: 2 });
    expect(Object.keys(progression.current().stars).sort()).toEqual(["harbor-01", "harbor-02"]);
  });

  it("notifies subscribers, patches preferences and resets", async () => {
    const { progression, runs } = setup();
    const seen: number[] = [];
    const off = progression.subscribe((p) => seen.push(p.tokens));
    await progression.patch({ showTimer: true, brush: "erase" });
    expect(progression.current()).toMatchObject({ showTimer: true, brush: "erase" });
    await progression.spendHint();
    off();
    await progression.spendHint();
    expect(seen).toEqual([3, 2]);
    await runs.put(run("harbor-01"), 1);
    const fresh = await progression.reset();
    expect(fresh.tokens).toBe(3);
    expect(fresh.brush).toBe("straight");
    expect(await runs.list()).toEqual([]);
  });
});
