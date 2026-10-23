import { PROFILE_KEY } from "@web-games/dress-rehearsal-core";
import { createLifecycle, createMemoryAdapter, type StorageAdapter } from "@web-games/kit";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bootGame } from "../src/state/boot";
import { createGame, type GameState, useGame } from "../src/state/game";

const LOOK = {
  top: "item-riviera-1",
  bottom: "item-riviera-4",
  shoes: "item-riviera-5",
  bag: "item-riviera-6",
  hat: "item-riviera-7",
  accessory: "item-riviera-8",
};

function clockAt(dateKey: string): { now: () => Date; set(dateKey: string): void } {
  let current = new Date(`${dateKey}T12:00:00`);
  return {
    now: () => current,
    set(next) {
      current = new Date(`${next}T12:00:00`);
    },
  };
}

function setup(dateKey = "2026-10-23") {
  const adapter = createMemoryAdapter();
  const clock = clockAt(dateKey);
  const game = createGame({ adapter, clock: clock.now });
  return { adapter, clock, game };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("loading", () => {
  it("starts in the loading state with default values", () => {
    const { game } = setup();
    const state = game.getState();
    expect(state.status).toBe("loading");
    expect(state.loadStatus).toBeNull();
    expect(state.profile.coins).toBe(40);
  });

  it("loads a fresh save and publishes it", async () => {
    const { game } = setup();
    const seen: GameState[] = [];
    game.subscribe((state) => seen.push(state));
    expect(await game.load()).toBe("fresh");
    expect(game.getState()).toMatchObject({ status: "ready", loadStatus: "fresh" });
    expect(seen.length).toBeGreaterThan(0);
  });

  it("loads saved progress", async () => {
    const adapter = createMemoryAdapter();
    const first = createGame({ adapter });
    await first.load();
    await first.recordCampaignResult("riv-01", { stars: 3, harmony: 83, spend: 308 });
    const second = createGame({ adapter });
    expect(await second.load()).toBe("loaded");
    expect(second.getState().profile.stars["riv-01"]).toBe(3);
  });

  it("recovers from a corrupt save without throwing", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: "garbage" });
    const game = createGame({ adapter });
    expect(await game.load()).toBe("recovered");
    expect(game.getState().profile.coins).toBe(40);
  });

  it("loads the settings with the profile", async () => {
    const adapter = createMemoryAdapter({
      "dress-rehearsal.settings": JSON.stringify({ v: 1, data: { sound: false } }),
    });
    const game = createGame({ adapter });
    await game.load();
    expect(game.getState().settings.sound).toBe(false);
  });
});

describe("campaign actions", () => {
  it("recordCampaignResult updates the profile, persists it and notifies", async () => {
    const { adapter, game } = setup();
    await game.load();
    const listener = vi.fn();
    game.subscribe(listener);
    const update = await game.recordCampaignResult("riv-01", { stars: 3, harmony: 83, spend: 308 });
    expect(update.events.length).toBeGreaterThan(0);
    expect(listener).toHaveBeenCalled();
    expect(game.getState().profile.coins).toBe(40 + 25 + 10);
    const stored = JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "");
    expect(stored.data.stars["riv-01"]).toBe(3);
    expect(stored.data.history[0].key).toBe("2026-10-23");
  });

  it("serialises quick successive actions", async () => {
    const { game } = setup();
    await game.load();
    await Promise.all([
      game.recordCampaignResult("riv-01", { stars: 1, harmony: 50, spend: 1 }),
      game.recordCampaignResult("riv-02", { stars: 1, harmony: 50, spend: 1 }),
      game.recordCampaignResult("riv-03", { stars: 1, harmony: 50, spend: 1 }),
    ]);
    expect(game.getState().profile.stars).toEqual({ "riv-01": 1, "riv-02": 1, "riv-03": 1 });
    expect(game.getState().profile.coins).toBe(40 + 45);
  });
});

describe("daily actions", () => {
  it("starts a streak, then continues it on the next day", async () => {
    const { clock, game } = setup("2026-10-23");
    await game.load();
    await game.recordDailyResult({ stars: 2, harmony: 75 });
    expect(game.getState().profile.daily).toMatchObject({ lastKey: "2026-10-23", streak: 1 });
    clock.set("2026-10-24");
    await game.recordDailyResult({ stars: 1, harmony: 60 });
    expect(game.getState().profile.daily).toMatchObject({ lastKey: "2026-10-24", streak: 2 });
    expect(game.getState().profile.coins).toBe(40 + 12 + 2 + 8 + 4);
  });

  it("a second clear on the same day pays only the upgrade", async () => {
    const { game } = setup();
    await game.load();
    await game.recordDailyResult({ stars: 1, harmony: 60 });
    const before = game.getState().profile.coins;
    await game.recordDailyResult({ stars: 3, harmony: 90 });
    expect(game.getState().profile.coins - before).toBe(8);
    expect(game.getState().profile.daily.streak).toBe(1);
  });

  it("uses a freeze to cover one missed day", async () => {
    const { clock, game } = setup("2026-10-20");
    await game.load();
    await game.recordDailyResult({ stars: 1, harmony: 60 });
    await game.buyFreeze();
    clock.set("2026-10-22");
    await game.recordDailyResult({ stars: 1, harmony: 60 });
    expect(game.getState().profile.daily.streak).toBe(2);
    expect(game.getState().profile.streakFreezes).toBe(0);
  });

  it("resets the streak when the gap is wider than the freezes", async () => {
    const { clock, game } = setup("2026-10-20");
    await game.load();
    await game.recordDailyResult({ stars: 1, harmony: 60 });
    await game.buyFreeze();
    clock.set("2026-10-23");
    await game.recordDailyResult({ stars: 1, harmony: 60 });
    expect(game.getState().profile.daily.streak).toBe(1);
    expect(game.getState().profile.streakFreezes).toBe(1);
  });

  it("treats a clock that went back as neutral", async () => {
    const { clock, game } = setup("2026-10-23");
    await game.load();
    await game.recordDailyResult({ stars: 2, harmony: 75 });
    const before = game.getState().profile;
    clock.set("2026-10-20");
    const update = await game.recordDailyResult({ stars: 3, harmony: 99 });
    expect(update.events).toEqual([]);
    expect(game.getState().profile.coins).toBe(before.coins);
    expect(game.getState().profile.daily).toEqual(before.daily);
  });

  it("accepts an explicit date key", async () => {
    const { game } = setup("2026-10-23");
    await game.load();
    await game.recordDailyResult({ stars: 1, harmony: 60, dateKey: "2026-10-23" });
    expect(Object.keys(game.getState().profile.daily.results)).toEqual(["2026-10-23"]);
  });
});

describe("purchases", () => {
  it("buyHint, buyFreeze and buyFrame spend coins and persist", async () => {
    const { adapter, game } = setup();
    await game.load();
    await game.recordCampaignResult("riv-01", { stars: 3, harmony: 83, spend: 1 });
    const coins = game.getState().profile.coins;
    expect((await game.buyHint("campaign")).ok).toBe(true);
    expect((await game.buyFreeze()).ok).toBe(true);
    expect((await game.buyFrame("paper")).ok).toBe(true);
    expect(game.getState().profile.coins).toBe(coins - 20 - 25 - 30);
    expect((await game.selectFrame("paper")).ok).toBe(true);
    const stored = JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "").data;
    expect(stored).toMatchObject({ streakFreezes: 1, frameSelected: "paper" });
    expect(stored.stats.hintsUsed).toBe(1);
  });

  it("rejects purchases the player cannot afford and leaves the profile alone", async () => {
    const { game } = setup();
    await game.load();
    const before = game.getState().profile;
    expect(await game.buyFrame("magazine")).toEqual({ ok: false, reason: "INSUFFICIENT_COINS" });
    expect(await game.selectFrame("polaroid")).toEqual({ ok: false, reason: "NOT_OWNED" });
    expect(game.getState().profile).toEqual(before);
  });
});

describe("gallery, flags and stats", () => {
  it("saveBoard stamps today's key and deleteBoard removes the entry", async () => {
    const { game } = setup("2026-10-23");
    await game.load();
    const saved = await game.saveBoard({
      kind: "campaign",
      ref: "riv-01",
      look: LOOK,
      stars: 3,
      harmony: 83,
    });
    expect(saved.ok).toBe(true);
    const entry = game.getState().profile.gallery[0];
    expect(entry?.savedKey).toBe("2026-10-23");
    await game.deleteBoard(entry?.id ?? "");
    expect(game.getState().profile.gallery).toEqual([]);
  });

  it("saveBoard reports a typed failure for zero stars", async () => {
    const { game } = setup();
    await game.load();
    const result = await game.saveBoard({
      kind: "campaign",
      ref: "riv-01",
      look: LOOK,
      stars: 0,
      harmony: 10,
    });
    expect(result).toEqual({ ok: false, reason: "NO_STARS" });
    expect(game.getState().profile.gallery).toEqual([]);
  });

  it("markFlag stores tutorial, how-to and rule card flags", async () => {
    const { game } = setup();
    await game.load();
    await game.markFlag("tutorial");
    await game.markFlag("howTo");
    await game.markFlag("card-warmth");
    expect(game.getState().profile.flags).toEqual({
      tutorial: true,
      howTo: true,
      ruleCards: { warmth: true },
    });
  });

  it("recordExport counts exported boards", async () => {
    const { game } = setup();
    await game.load();
    await game.recordExport();
    await game.recordExport();
    expect(game.getState().profile.stats.boardsExported).toBe(2);
  });
});

describe("resetProgress", () => {
  it("returns the defaults and keeps the settings", async () => {
    const { adapter, game } = setup();
    await game.load();
    await game.settings.set({ sound: false });
    await game.recordCampaignResult("riv-01", { stars: 3, harmony: 83, spend: 1 });
    await game.resetProgress();
    expect(game.getState().profile.coins).toBe(40);
    expect(game.getState().profile.stars).toEqual({});
    expect(game.getState().settings.sound).toBe(false);
    expect(JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "").data.coins).toBe(40);
    expect(JSON.parse(adapter.entries.get("dress-rehearsal.settings") ?? "").data.sound).toBe(
      false,
    );
  });
});

describe("write failures", () => {
  it("keeps the in-memory result and flags the failed save", async () => {
    const memory = createMemoryAdapter();
    const flaky: StorageAdapter = {
      ...memory,
      name: "flaky",
      get: memory.get,
      remove: memory.remove,
      set: async (key, value) => {
        if (key === PROFILE_KEY) throw new Error("quota");
        await memory.set(key, value);
      },
    };
    const game = createGame({ adapter: flaky });
    await game.load();
    await game.recordCampaignResult("riv-01", { stars: 1, harmony: 50, spend: 1 });
    expect(game.getState().saveFailed).toBe(true);
    expect(game.getState().profile.stars["riv-01"]).toBe(1);
  });
});

describe("flush", () => {
  it("waits for pending saves", async () => {
    const memory = createMemoryAdapter();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const slow: StorageAdapter = {
      ...memory,
      set: async (key, value) => {
        await gate;
        await memory.set(key, value);
      },
    };
    const game = createGame({ adapter: slow });
    const pending = game.recordCampaignResult("riv-01", { stars: 1, harmony: 50, spend: 1 });
    let flushed = false;
    const flushing = game.flush().then(() => {
      flushed = true;
    });
    await Promise.resolve();
    expect(flushed).toBe(false);
    release();
    await pending;
    await flushing;
    expect(flushed).toBe(true);
    expect(JSON.parse(memory.entries.get(PROFILE_KEY) ?? "").data.stars["riv-01"]).toBe(1);
  });

  it("resolves at once when nothing is pending", async () => {
    const { game } = setup();
    await expect(game.flush()).resolves.toBeUndefined();
  });
});

describe("boot", () => {
  it("flushes pending saves when the app is paused", async () => {
    const adapter = createMemoryAdapter();
    const listeners = new Set<() => void>();
    const lifecycle = {
      onPause(listener: () => void) {
        listeners.add(listener);
        return () => void listeners.delete(listener);
      },
    };
    const { game, dispose } = bootGame(lifecycle, adapter);
    const flush = vi.spyOn(game, "flush");
    expect(listeners.size).toBe(1);
    for (const listener of listeners) listener();
    expect(flush).toHaveBeenCalledTimes(1);
    dispose();
    expect(listeners.size).toBe(0);
  });

  it("works with the real kit lifecycle on a visibility change", async () => {
    const adapter = createMemoryAdapter();
    const visibility = {
      hidden: false,
      handlers: new Set<() => void>(),
      addEventListener(_type: "visibilitychange", listener: () => void) {
        this.handlers.add(listener);
      },
      removeEventListener(_type: "visibilitychange", listener: () => void) {
        this.handlers.delete(listener);
      },
    };
    const lifecycle = createLifecycle({ isNative: () => false, visibility });
    const { game } = bootGame(lifecycle, adapter);
    const flush = vi.spyOn(game, "flush");
    visibility.hidden = true;
    for (const handler of visibility.handlers) handler();
    expect(flush).toHaveBeenCalledTimes(1);
    lifecycle.dispose();
  });
});

describe("useGame", () => {
  it("re-renders when the profile changes", async () => {
    const { game } = setup();
    await game.load();
    function Coins() {
      const state = useGame(game);
      return <p data-testid="coins">{state.profile.coins}</p>;
    }
    const container = document.createElement("div");
    document.body.appendChild(container);
    await act(() => render(<Coins />, container));
    expect(container.querySelector("[data-testid='coins']")?.textContent).toBe("40");
    await act(async () => {
      await game.recordCampaignResult("riv-01", { stars: 1, harmony: 50, spend: 1 });
    });
    expect(container.querySelector("[data-testid='coins']")?.textContent).toBe("55");
  });
});
