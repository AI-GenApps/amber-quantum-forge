import {
  type Evaluation,
  PROFILE_KEY,
  START_COINS,
  type StarCount,
} from "@web-games/floodplain-dispatch-core";
import { createMemoryAdapter, localDateKey, type StorageAdapter } from "@web-games/kit";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGameStore, type GameStore } from "../src/state/game";
import { createProfileStore } from "../src/state/saveStores";
import { createServices, loadServices } from "../src/state/services";
import { GameContext, useGame } from "../src/state/useGame";

function evaluation(stars: StarCount, score = 100 * stars): Evaluation {
  return {
    housesTotal: 2,
    housesSupplied: 2,
    housesFlooded: stars >= 2 ? 0 : 1,
    fieldsTotal: 1,
    fieldsIrrigated: 1,
    spend: 8,
    par: 8,
    budgetLeft: 3,
    starSupply: stars >= 1,
    starDry: stars >= 2,
    starThrift: stars >= 3,
    stars,
    cleared: stars >= 1,
    score,
  };
}

interface Rig {
  game: GameStore;
  adapter: ReturnType<typeof createMemoryAdapter>;
  setDay(year: number, month: number, day: number): void;
}

function rig(adapter = createMemoryAdapter()): Rig {
  let now = new Date(2026, 9, 20, 12);
  const game = createGameStore({
    store: createProfileStore(adapter),
    clock: () => now,
    localDateKey,
  });
  return {
    game,
    adapter,
    setDay(year, month, day) {
      now = new Date(year, month - 1, day, 12);
    },
  };
}

describe("game store", () => {
  it("starts unloaded with the default profile, then loads", async () => {
    const { game } = rig();
    expect(game.getState().ready).toBe(false);
    expect(game.getState().profile.coins).toBe(START_COINS);
    expect(await game.load()).toBe("fresh");
    expect(game.getState().ready).toBe(true);
    expect(game.getState().loadStatus).toBe("fresh");
  });

  it("notifies subscribers on every change and stops after unsubscribing", async () => {
    const { game } = rig();
    await game.load();
    const seen: number[] = [];
    const stop = game.subscribe((state) => seen.push(state.profile.coins));
    await game.recordCampaignResult("v01", evaluation(3));
    await game.buyHint("campaign");
    expect(seen).toEqual([START_COINS + 25, START_COINS]);
    stop();
    await game.buyFreeze();
    expect(seen).toHaveLength(2);
  });

  it("records a campaign result through the save store", async () => {
    const { game, adapter } = rig();
    await game.load();
    const events = await game.recordCampaignResult("v01", evaluation(3));
    expect(events).toContainEqual({ type: "star-gained", mapId: "v01", stars: 3, previous: 0 });
    expect(game.getState().profile.stars.v01).toBe(3);
    const stored = JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "{}") as {
      data: { coins: number };
    };
    expect(stored.data.coins).toBe(START_COINS + 25);
    expect(game.getState().saveFailed).toBe(false);
  });

  it("serialises overlapping actions without losing any", async () => {
    const { game } = rig();
    await game.load();
    await Promise.all([
      game.recordCampaignResult("v01", evaluation(1)),
      game.recordCampaignResult("v02", evaluation(1)),
      game.recordCampaignResult("v03", evaluation(1)),
    ]);
    expect(Object.keys(game.getState().profile.stars).sort()).toEqual(["v01", "v02", "v03"]);
    expect(game.getState().profile.coins).toBe(START_COINS + 45);
  });

  it("builds the daily streak from the injected clock", async () => {
    const { game, setDay } = rig();
    await game.load();
    const first = await game.recordDailyResult({ stars: 2, score: 300 });
    expect(first.dateKey).toBe("2026-10-20");
    expect(first.counted).toBe(true);
    expect(game.getState().profile.daily.streak).toBe(1);
    setDay(2026, 10, 21);
    await game.recordDailyResult({ stars: 3, score: 400 });
    expect(game.getState().profile.daily.streak).toBe(2);
    expect(game.getState().profile.coins).toBe(START_COINS + 15 + 2 + 20 + 4);
  });

  it("uses a freeze for one missed day and resets when two are missed", async () => {
    const { game, setDay } = rig();
    await game.load();
    await game.recordCampaignResult("v01", evaluation(3));
    await game.recordCampaignResult("v02", evaluation(3));
    await game.buyFreeze();
    await game.recordDailyResult({ stars: 1, score: 100 });
    setDay(2026, 10, 22);
    await game.recordDailyResult({ stars: 1, score: 100 });
    expect(game.getState().profile.daily.streak).toBe(2);
    expect(game.getState().profile.streakFreezes).toBe(0);
    setDay(2026, 10, 25);
    await game.recordDailyResult({ stars: 1, score: 100 });
    expect(game.getState().profile.daily.streak).toBe(1);
  });

  it("ignores a daily result when the clock went back", async () => {
    const { game, setDay } = rig();
    await game.load();
    setDay(2026, 10, 22);
    await game.recordDailyResult({ stars: 2, score: 200 });
    const before = game.getState().profile;
    setDay(2026, 10, 20);
    const out = await game.recordDailyResult({ stars: 3, score: 900 });
    expect(out.counted).toBe(false);
    expect(game.getState().profile.coins).toBe(before.coins);
    expect(game.getState().profile.daily.streak).toBe(before.daily.streak);
  });

  it("rejects purchases the player cannot afford", async () => {
    const { game } = rig();
    await game.load();
    const bought = await game.buyHint("campaign");
    expect(bought.ok).toBe(true);
    expect(game.getState().profile.coins).toBe(25);
    expect(game.getState().profile.stats.hintsUsed).toBe(1);
    expect(await game.buyHint("daily")).toEqual({ ok: false, reason: "insufficient-coins" });
    expect(await game.buyFreeze()).toEqual({ ok: false, reason: "insufficient-coins" });
    expect(game.getState().profile.coins).toBe(25);
    expect((await game.buyHint("campaign")).ok).toBe(true);
    expect(game.getState().profile.coins).toBe(0);
  });

  it("caps held freezes at two", async () => {
    const { game } = rig();
    await game.load();
    for (const id of ["v01", "v02", "v03", "v04"])
      await game.recordCampaignResult(id, evaluation(3));
    expect((await game.buyFreeze()).ok).toBe(true);
    expect((await game.buyFreeze()).ok).toBe(true);
    expect(await game.buyFreeze()).toEqual({ ok: false, reason: "freezes-full" });
    expect(game.getState().profile.streakFreezes).toBe(2);
  });

  it("selects only unlocked themes", async () => {
    const { game } = rig();
    await game.load();
    expect(await game.selectTheme("harvest-ochre")).toBe(false);
    expect(await game.selectTheme("no-such-theme")).toBe(false);
    for (const id of ["v01", "v02", "v03"]) await game.recordCampaignResult(id, evaluation(3));
    expect(await game.selectTheme("harvest-ochre")).toBe(true);
    expect(game.getState().profile.themeSelected).toBe("harvest-ochre");
  });

  it("marks flags once", async () => {
    const { game } = rig();
    await game.load();
    await game.markFlag("tutorial");
    await game.markFlag("tutorial");
    await game.markFlag("");
    expect(game.getState().profile.flags).toEqual({ tutorial: true });
  });

  it("resets progress to defaults and keeps the settings", async () => {
    const adapter = createMemoryAdapter();
    const services = createServices(adapter);
    await loadServices(services);
    await services.settings.set({ sound: false });
    await services.game.recordCampaignResult("v01", evaluation(3));
    expect(services.game.getState().profile.coins).toBe(START_COINS + 25);
    await services.game.resetProgress();
    expect(services.game.getState().profile.coins).toBe(START_COINS);
    expect(services.game.getState().profile.stars).toEqual({});
    const fresh = createServices(adapter);
    await loadServices(fresh);
    expect(fresh.game.getState().profile.coins).toBe(START_COINS);
    expect(fresh.settings.get().sound).toBe(false);
  });

  it("flush waits for pending saves", async () => {
    const base = createMemoryAdapter();
    const releases: Array<() => void> = [];
    const slow: StorageAdapter = {
      ...base,
      set: (key, value) =>
        new Promise<void>((resolve) => {
          releases.push(() => {
            void base.set(key, value).then(resolve);
          });
        }),
    };
    const game = createGameStore({
      store: createProfileStore(slow),
      clock: () => new Date(2026, 9, 20),
      localDateKey,
    });
    const action = game.recordCampaignResult("v01", evaluation(1));
    let flushed = false;
    const flushing = game.flush().then(() => {
      flushed = true;
    });
    await Promise.resolve();
    expect(flushed).toBe(false);
    for (let i = 0; i < 20 && releases.length === 0; i++) await Promise.resolve();
    releases.shift()?.();
    await action;
    await flushing;
    expect(flushed).toBe(true);
    expect(base.entries.has(PROFILE_KEY)).toBe(true);
  });

  it("keeps the in-memory change and flags the failure when saving fails", async () => {
    const base = createMemoryAdapter();
    const failing: StorageAdapter = {
      ...base,
      set: async () => {
        throw new Error("disk full");
      },
    };
    const game = createGameStore({
      store: createProfileStore(failing),
      clock: () => new Date(2026, 9, 20),
      localDateKey,
    });
    await game.load();
    await game.recordCampaignResult("v01", evaluation(3));
    expect(game.getState().profile.stars.v01).toBe(3);
    expect(game.getState().saveFailed).toBe(true);
  });

  it("recovers a corrupt save into defaults and reports it", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: "garbage" });
    const { game } = rig(adapter);
    expect(await game.load()).toBe("recovered");
    expect(game.getState().profile.coins).toBe(START_COINS);
  });
});

describe("services and lifecycle", () => {
  it("flushes pending saves when the app is paused", async () => {
    let onPause: (() => void) | null = null;
    const services = createServices(createMemoryAdapter(), {
      lifecycle: {
        onPause: (listener: () => void) => {
          onPause = listener;
          return () => undefined;
        },
      },
    });
    const flush = vi.spyOn(services.game, "flush");
    expect(onPause).not.toBeNull();
    (onPause as (() => void) | null)?.();
    expect(flush).toHaveBeenCalledTimes(1);
  });
});

describe("useGame", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  function Coins() {
    const state = useGame();
    return <p data-testid="coins">{state.profile.coins}</p>;
  }

  it("re-renders when the store changes", async () => {
    const { game } = rig();
    const container = document.createElement("div");
    document.body.appendChild(container);
    await act(() =>
      render(
        <GameContext.Provider value={game}>
          <Coins />
        </GameContext.Provider>,
        container,
      ),
    );
    expect(container.querySelector("[data-testid='coins']")?.textContent).toBe("50");
    await act(async () => {
      await game.load();
      await game.recordCampaignResult("v01", evaluation(3));
    });
    expect(container.querySelector("[data-testid='coins']")?.textContent).toBe("75");
  });

  it("throws a clear error without a provider", () => {
    const container = document.createElement("div");
    expect(() => render(<Coins />, container)).toThrow(/GameContext/);
  });
});
