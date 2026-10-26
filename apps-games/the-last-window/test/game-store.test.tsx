import { createMemoryAdapter, localDateKey, type StorageAdapter } from "@web-games/kit";
import {
  type ChoiceMade,
  defaultProfile,
  type Profile,
  type ShiftResult,
  START_COINS,
} from "@web-games/the-last-window-core";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGameStore, type GameStore } from "../src/state/game";
import { createProfileStore, PROFILE_KEY } from "../src/state/saveStores";
import { createServices, loadServices } from "../src/state/services";
import { GameContext, useGame } from "../src/state/useGame";

function shift(
  overrides: Partial<ShiftResult> = {},
  kind: ShiftResult["kind"] = "day",
): ShiftResult {
  return {
    kind,
    day: kind === "late" ? 15 : 1,
    payments: 40,
    tips: 6,
    bonusCoins: 20,
    coins: 66,
    grade: { stars: 3, bonusCoins: 20, good: 1 },
    arrived: 6,
    counts: { delighted: 4, satisfied: 2, disappointed: 0, left: 0 },
    turnedAway: 0,
    mistakes: 1,
    longestDelightedRun: 4,
    fpGains: [{ regularId: 1, fp: 2 }],
    regularOutcomes: [{ regularId: 1, outcome: "delighted" }],
    ...overrides,
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

async function finishedCampaign(game: GameStore): Promise<void> {
  await game.load();
  for (let day = 1; day <= 14; day++) await game.finishShift(day, shift({ day }));
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
    await game.finishShift(1, shift());
    await game.buyStock({ pastries: ["pastry-1"], books: ["book-1"] });
    expect(seen).toEqual([START_COINS + 66, START_COINS + 66 - 5]);
    stop();
    await game.markFlag("tutorial");
    expect(seen).toHaveLength(2);
  });

  it("finishes a campaign shift through the save store", async () => {
    const { game, adapter } = rig();
    await game.load();
    const applied = await game.finishShift(1, shift());
    expect(applied.accepted).toBe(true);
    expect(applied.advanced).toBe(true);
    const stored = JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "") as { data: Profile };
    expect(stored.data.day).toBe(2);
    expect(stored.data.coins).toBe(START_COINS + 66);
    expect(game.getState().profile.diary).toEqual([1]);
  });

  it("serialises overlapping actions without losing any", async () => {
    const { game } = rig();
    await game.load();
    await Promise.all([
      game.finishShift(1, shift({ coins: 10, payments: 10, tips: 0, bonusCoins: 0 })),
      game.markFlag("a"),
      game.setPreference("relaxed", true),
      game.markFlag("b"),
    ]);
    const { profile } = game.getState();
    expect(profile.coins).toBe(START_COINS + 10);
    expect(profile.flags).toEqual({ a: true, b: true });
    expect(profile.settings.relaxed).toBe(true);
  });

  it("completes a scene once and pays the gift once", async () => {
    const { game } = rig();
    await game.load();
    await game.finishShift(1, shift());
    const first = await game.finishScene("scene-1-1");
    expect(first.status).toBe("completed");
    expect(first.gift).toBe(5);
    const again = await game.finishScene("scene-1-1");
    expect(again.status).toBe("replay");
    expect(game.getState().profile.coins).toBe(START_COINS + 66 + 5);
    expect(game.getState().profile.regulars[1]?.scenesDone).toBe(1);
  });

  it("records the choice made in a scene", async () => {
    const { game } = rig();
    await game.load();
    const choice: ChoiceMade = { choice: "r2-c1", option: "b", lean: "b" };
    await game.finishShift(
      1,
      shift({
        fpGains: [{ regularId: 2, fp: 8 }],
        regularOutcomes: [{ regularId: 2, outcome: "delighted" }],
      }),
    );
    for (let day = 2; day <= 4; day++) {
      await game.finishShift(
        day,
        shift({ day, fpGains: [], regularOutcomes: [{ regularId: 2, outcome: "satisfied" }] }),
      );
    }
    await game.finishScene("scene-2-1");
    await game.finishScene("scene-2-2", choice);
    expect(game.getState().profile.regulars[2]?.choices).toEqual({ "r2-c1": "b" });
  });

  it("builds the Late Shift streak from the injected clock", async () => {
    const { game, setDay } = rig();
    await finishedCampaign(game);
    const late = shift({}, "late");
    setDay(2026, 10, 20);
    const first = await game.finishLateShift(late);
    expect(first.lampBonus).toBe(15);
    expect(first.streakBonus).toBe(2);
    expect(first.dateKey).toBe("2026-10-20");
    const same = await game.finishLateShift(late);
    expect(same.lampBonus).toBe(0);
    setDay(2026, 10, 21);
    const next = await game.finishLateShift(late);
    expect(next.streakBonus).toBe(4);
    expect(game.getState().profile.late.streak).toBe(2);
    setDay(2026, 10, 25);
    const gap = await game.finishLateShift(late);
    expect(gap.streakBonus).toBe(2);
    expect(game.getState().profile.late.streak).toBe(1);
    expect(game.getState().profile.late.bestStreak).toBe(2);
  });

  it("ignores the bonus when the clock went back", async () => {
    const { game, setDay } = rig();
    await finishedCampaign(game);
    setDay(2026, 10, 20);
    await game.finishLateShift(shift({}, "late"));
    const before = game.getState().profile.late;
    setDay(2026, 10, 10);
    const back = await game.finishLateShift(shift({}, "late"));
    expect(back.lampBonus).toBe(0);
    expect(back.streakBonus).toBe(0);
    expect(game.getState().profile.late.lastKey).toBe(before.lastKey);
    expect(game.getState().profile.late.streak).toBe(before.streak);
  });

  it("refuses a Late Shift before the campaign is complete", async () => {
    const { game } = rig();
    await game.load();
    const outcome = await game.finishLateShift(shift({}, "late"));
    expect(outcome.accepted).toBe(false);
    expect(game.getState().profile.coins).toBe(START_COINS);
  });

  it("reports today's Late Shift seed and index", async () => {
    const { game, setDay } = rig();
    await finishedCampaign(game);
    const first = game.lateToday();
    expect(first.dateKey).toBe("2026-10-20");
    expect(first.index).toBe(0);
    await game.finishLateShift(shift({}, "late"));
    expect(game.lateToday().index).toBe(1);
    expect(game.lateToday().seed).toBe(first.seed);
    setDay(2026, 10, 21);
    expect(game.lateToday().seed).not.toBe(first.seed);
    expect(game.lateToday().index).toBe(0);
  });

  it("buys decor only once it is unlocked and affordable", async () => {
    const { game } = rig();
    await game.load();
    expect(await game.buyDecor("decor-1")).toEqual({ ok: false, reason: "locked" });
    await game.finishShift(1, shift());
    expect(await game.buyDecor("decor-2")).toEqual({ ok: false, reason: "locked" });
    const bought = await game.buyDecor("decor-1");
    expect(bought.ok).toBe(true);
    expect(game.getState().profile.coins).toBe(16);
    expect(game.getState().profile.owned).toEqual(["decor-1"]);
    expect(await game.buyDecor("decor-1")).toEqual({ ok: false, reason: "owned" });
  });

  it("buys a stock plan and remembers it", async () => {
    const { game } = rig();
    await game.load();
    const bought = await game.buyStock({ pastries: ["pastry-1"], books: ["book-1"] });
    expect(bought.ok).toBe(true);
    expect(game.getState().profile.coins).toBe(START_COINS - 5);
    expect(game.getState().profile.stock.pastries).toEqual(["pastry-1"]);
  });

  it("rejects an unaffordable stock plan without charging", async () => {
    const adapter = createMemoryAdapter();
    await createProfileStore(adapter).save({ ...defaultProfile(), day: 5, coins: 4 });
    const { game } = rig(adapter);
    await game.load();
    const result = await game.buyStock({ pastries: ["pastry-3"], books: ["book-1"] });
    expect(result.ok).toBe(false);
    expect(game.getState().profile.coins).toBe(4);
    expect(game.getState().profile.stock.pastries).toEqual([]);
  });

  it("marks flags once", async () => {
    const { game } = rig();
    await game.load();
    await game.markFlag("tutorial");
    await game.markFlag("tutorial");
    await game.markFlag("");
    expect(game.getState().profile.flags).toEqual({ tutorial: true });
  });

  it("stores accessibility preferences", async () => {
    const { game, adapter } = rig();
    await game.load();
    await game.setPreference("recipeGuide", false);
    await game.setPreference("textSize", "large");
    const fresh = createGameStore({
      store: createProfileStore(adapter),
      clock: () => new Date(),
      localDateKey,
    });
    await fresh.load();
    expect(fresh.getState().profile.settings).toEqual({
      recipeGuide: false,
      relaxed: false,
      textSize: "large",
    });
  });

  it("resets progress to defaults and keeps the kit settings and preferences", async () => {
    const adapter = createMemoryAdapter();
    const services = createServices(adapter);
    await loadServices(services);
    await services.settings.set({ sound: false });
    await services.game.setPreference("relaxed", true);
    await services.game.finishShift(1, shift());
    expect(services.game.getState().profile.coins).toBe(START_COINS + 66);
    await services.game.resetProgress();
    const reset = services.game.getState().profile;
    expect(reset.coins).toBe(START_COINS);
    expect(reset.day).toBe(1);
    expect(reset.diary).toEqual([]);
    expect(reset.settings.relaxed).toBe(true);
    const fresh = createServices(adapter);
    await loadServices(fresh);
    expect(fresh.game.getState().profile.coins).toBe(START_COINS);
    expect(fresh.settings.get().sound).toBe(false);
    expect(fresh.game.getState().profile).toEqual({
      ...defaultProfile(),
      settings: reset.settings,
    });
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
    const action = game.finishShift(1, shift());
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
    await game.finishShift(1, shift());
    expect(game.getState().profile.day).toBe(2);
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
    expect(container.querySelector("[data-testid='coins']")?.textContent).toBe("30");
    await act(async () => {
      await game.load();
      await game.finishShift(1, shift());
    });
    expect(container.querySelector("[data-testid='coins']")?.textContent).toBe("96");
  });

  it("throws a clear error without a provider", () => {
    const container = document.createElement("div");
    expect(() => render(<Coins />, container)).toThrow(/GameContext/);
  });
});
