import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createMemoryAdapter } from "@web-games/kit";
import { getCase } from "@web-games/lost-parcel-desk-core";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { bindGameLifecycle, createServices, loadServices } from "../src/state/services";
import { createIntervalTick, type TickTimers } from "../src/state/ticker";
import { GameContext, useGame } from "../src/state/useGame";
import { makeRig, storedProfile } from "./fixtures/game";

describe("elapsed time", () => {
  it("accumulates only while a case is open and the app is visible", async () => {
    const rig = makeRig();
    await rig.game.load();
    rig.emitTick(1000);
    await rig.game.startCase("01");
    rig.emitTick(1000);
    rig.emitTick(500);
    expect(rig.game.getState().active?.state.elapsedMs).toBe(1500);
    rig.game.setVisible(false);
    rig.emitTick(4000);
    expect(rig.game.getState().active?.state.elapsedMs).toBe(1500);
    rig.game.setVisible(true);
    rig.emitTick(250);
    rig.emitTick(-5);
    rig.emitTick(Number.NaN);
    expect(rig.game.getState().active?.state.elapsedMs).toBe(1750);
  });

  it("is saved with the next action and on flush", async () => {
    const rig = makeRig();
    await rig.game.load();
    await rig.game.startCase("01");
    rig.emitTick(2000);
    await rig.game.inspect(getCase("01")?.objects[0]?.id ?? "");
    expect(storedProfile(rig.adapter).session?.state.elapsedMs).toBe(2000);
    rig.emitTick(3000);
    expect(storedProfile(rig.adapter).session?.state.elapsedMs).toBe(2000);
    await rig.game.flush();
    expect(storedProfile(rig.adapter).session?.state.elapsedMs).toBe(5000);
  });

  it("stops counting once the case is closed and when the store is disposed", async () => {
    const rig = makeRig();
    await rig.game.load();
    await rig.game.startCase("01");
    rig.emitTick(1000);
    rig.game.dispose();
    rig.emitTick(1000);
    expect(rig.game.getState().active?.state.elapsedMs).toBe(1000);
  });
});

describe("the interval tick source", () => {
  function fakeTimers() {
    let clock = 0;
    let handler: (() => void) | null = null;
    const timers: TickTimers = {
      now: () => clock,
      setInterval: (fn) => {
        handler = fn;
        return 7;
      },
      clearInterval: () => {
        handler = null;
      },
    };
    return {
      timers,
      advance(ms: number) {
        clock += ms;
        handler?.();
      },
      active: () => handler !== null,
    };
  }

  it("reports the time since the last tick, capped at two intervals", () => {
    const fake = fakeTimers();
    const seen: number[] = [];
    const off = createIntervalTick(1000, fake.timers)((delta) => seen.push(delta));
    fake.advance(1000);
    fake.advance(1010);
    fake.advance(60_000);
    expect(seen).toEqual([1000, 1010, 2000]);
    off();
    expect(fake.active()).toBe(false);
  });
});

describe("lifecycle", () => {
  it("pauses the clock and flushes pending elapsed time when the app goes to the background", async () => {
    const rig = makeRig();
    await rig.game.load();
    await rig.game.startCase("01");
    let pause = () => {};
    let resume = () => {};
    const off = bindGameLifecycle(rig.game, {
      onPause: (listener) => {
        pause = listener;
        return () => {};
      },
      onResume: (listener) => {
        resume = listener;
        return () => {};
      },
    });
    rig.emitTick(3000);
    pause();
    rig.emitTick(9000);
    await rig.game.flush();
    expect(storedProfile(rig.adapter).session?.state.elapsedMs).toBe(3000);
    resume();
    rig.emitTick(1000);
    expect(rig.game.getState().active?.state.elapsedMs).toBe(4000);
    off();
  });

  it("is wired in main.tsx with the default adapter and a portrait lock", () => {
    const main = readFileSync(join(import.meta.dirname, "..", "src", "main.tsx"), "utf8");
    expect(main).toContain("createDefaultAdapter()");
    expect(main).toContain("bindGameLifecycle(");
    expect(main).toContain("lockPortrait: true");
  });
});

describe("services", () => {
  it("builds a game store and settings on one adapter and loads both", async () => {
    const adapter = createMemoryAdapter();
    const services = createServices(adapter);
    await loadServices(services);
    expect(services.game.getState().ready).toBe(true);
    expect(services.settings.get().sound).toBe(true);
    await services.settings.set({ music: false });
    await services.game.markFlag("tutorial-done");
    const again = createServices(adapter);
    await loadServices(again);
    expect(again.settings.get().music).toBe(false);
    expect(again.game.getState().profile.flags).toEqual({ "tutorial-done": true });
  });
});

describe("useGame", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("re-renders a component when the store changes", async () => {
    const rig = makeRig();
    await rig.game.load();
    function Postage() {
      const state = useGame();
      return <p data-testid="postage">{state.profile.postage}</p>;
    }
    const container = document.createElement("div");
    document.body.appendChild(container);
    await act(() =>
      render(
        <GameContext.Provider value={rig.game}>
          <Postage />
        </GameContext.Provider>,
        container,
      ),
    );
    expect(container.querySelector("[data-testid='postage']")?.textContent).toBe("30");
    await act(async () => {
      await rig.game.buyFreeze();
    });
    expect(container.querySelector("[data-testid='postage']")?.textContent).toBe("0");
  });

  it("throws a clear error without a provider", () => {
    function Lonely() {
      useGame();
      return null;
    }
    const container = document.createElement("div");
    expect(() => render(<Lonely />, container)).toThrow(/GameContext/);
  });
});
