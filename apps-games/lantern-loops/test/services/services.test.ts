import { createMemoryAdapter } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { createServices } from "../../src/services";

describe("createServices", () => {
  it("wires settings, runs and progression on one adapter and starts cleanly", async () => {
    const adapter = createMemoryAdapter();
    const services = createServices({ adapter, now: () => new Date(2026, 9, 23, 9) });
    await services.start();
    expect(services.settings.get()).toMatchObject({ sound: true, haptics: true });
    expect(services.progression.current()).toMatchObject({
      tokens: 3,
      freezes: 1,
      freezeWeek: "2026-W43",
    });
    await services.settings.set({ sound: false });
    expect(adapter.entries.has("lantern-loops.settings")).toBe(true);
    await services.progression.completePuzzle("harbor-01", { hints: 0, seconds: 20 });
    expect(adapter.entries.has("lantern-loops.profile")).toBe(true);
    await services.runs.put(
      {
        puzzleKey: "harbor-02",
        tiles: "0".repeat(25),
        locked: [],
        hintCount: 0,
        elapsedMs: 5,
        moves: 0,
      },
      1,
    );
    expect(adapter.entries.has("lantern-loops.runs")).toBe(true);
  });

  it("reloads the same state in a second session", async () => {
    const adapter = createMemoryAdapter();
    const first = createServices({ adapter, now: () => new Date(2026, 9, 23) });
    await first.start();
    await first.progression.completeDaily({ hints: 0, seconds: 44 });
    const second = createServices({ adapter, now: () => new Date(2026, 9, 24) });
    await second.start();
    expect(second.progression.current()).toMatchObject({
      streak: 1,
      lastDailyDate: "2026-10-23",
      tokens: 5,
    });
  });
});
