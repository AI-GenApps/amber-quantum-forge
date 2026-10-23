import { CATALOG, starlightPerSecond } from "@web-games/cloud-observatory-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseDevSpeed } from "../../src/app/devspeed";
import { createGameLoop } from "../../src/app/game-loop";
import { MAX_TICK_SECONDS } from "../../src/session/game-session";
import { cleanup, fakeFrames, renderApp } from "./harness";

afterEach(cleanup);

describe("game loop", () => {
  function run(speed: number, frameMs: number, seconds: number) {
    const frames = fakeFrames();
    const ticks: number[] = [];
    const loop = createGameLoop({ tick: (dt) => void ticks.push(dt), frames, speed });
    loop.start();
    for (let time = 0; time <= seconds * 1000; time += frameMs) frames.fire(time);
    return { ticks, loop, frames };
  }

  it("ticks at most 10 times per second however many frames arrive", () => {
    const { ticks } = run(1, 1000 / 60, 3);
    expect(ticks.length).toBeLessThanOrEqual(31);
    expect(ticks.length).toBeGreaterThanOrEqual(25);
    const total = ticks.reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(2.85);
    expect(total).toBeLessThanOrEqual(3);
  });

  it("slow frames still deliver the elapsed time", () => {
    const { ticks } = run(1, 500, 4);
    expect(ticks.reduce((a, b) => a + b, 0)).toBeCloseTo(4, 5);
    expect(Math.max(...ticks)).toBeCloseTo(0.5, 5);
  });

  it("speed multiplies the delta and no tick exceeds the session step", () => {
    const { ticks } = run(600, 100, 2);
    expect(Math.max(...ticks)).toBeLessThanOrEqual(MAX_TICK_SECONDS);
    expect(ticks.reduce((a, b) => a + b, 0)).toBeCloseTo(2 * 600, 3);
  });

  it("a long stall is capped instead of becoming a giant step", () => {
    const frames = fakeFrames();
    const ticks: number[] = [];
    createGameLoop({ tick: (dt) => void ticks.push(dt), frames }).start();
    frames.fire(0);
    frames.fire(10 * 60 * 1000);
    expect(ticks.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(MAX_TICK_SECONDS);
  });

  it("pause stops the frames and resume does not replay the pause as game time", () => {
    const frames = fakeFrames();
    const ticks: number[] = [];
    const loop = createGameLoop({ tick: (dt) => void ticks.push(dt), frames });
    loop.start();
    frames.fire(0);
    frames.fire(200);
    loop.pause();
    expect(loop.running).toBe(false);
    expect(frames.pending).toBe(0);
    const before = ticks.reduce((a, b) => a + b, 0);
    loop.resume();
    frames.fire(60_000);
    frames.fire(60_200);
    expect(ticks.reduce((a, b) => a + b, 0) - before).toBeCloseTo(0.2, 5);
  });
});

describe("dev speed flag", () => {
  it("is read in dev builds and ignored in production builds", () => {
    expect(parseDevSpeed("?devspeed=60", true)).toBe(60);
    expect(parseDevSpeed("?devspeed=60", false)).toBe(1);
    expect(parseDevSpeed("?devspeed=600", false)).toBe(1);
    expect(parseDevSpeed("?other=1&devspeed=2.5", true)).toBe(2.5);
  });

  it("falls back to normal speed for missing, invalid or out of range values", () => {
    for (const search of [
      "",
      "?devspeed=",
      "?devspeed=0",
      "?devspeed=601",
      "?devspeed=abc",
      "?devspeed=-5",
    ]) {
      expect(parseDevSpeed(search, true), search).toBe(1);
    }
    expect(parseDevSpeed("?devspeed=1", true)).toBe(1);
    expect(parseDevSpeed("?devspeed=600", true)).toBe(600);
  });

  it("scales the game clock in the app only when a speed is given", async () => {
    const seed = { game: { owned: { telescope: 10 }, starlight: 0 } };
    const rate = starlightPerSecond(
      { ...(await renderApp({ seed })).harness.session.snapshot().profile.game },
      CATALOG,
    );
    cleanup();

    const normal = await renderApp({
      seed,
      props: { devSpeed: parseDevSpeed("?devspeed=60", false) },
    });
    normal.frames.fire(0);
    normal.frames.fire(1000);
    await normal.flush();
    expect(normal.harness.session.snapshot().profile.game.starlight).toBeCloseTo(rate, 5);
    expect(normal.container.querySelector("[data-dev-speed]")).toBeNull();
    cleanup();

    const fast = await renderApp({
      seed,
      props: { devSpeed: parseDevSpeed("?devspeed=60", true) },
    });
    fast.frames.fire(0);
    fast.frames.fire(1000);
    await fast.flush();
    expect(fast.harness.session.snapshot().profile.game.starlight).toBeCloseTo(rate * 60, 3);
    expect(fast.q("[data-dev-speed]").textContent).toBe("Dev speed ×60");
  });
});

describe("loop wiring in the app", () => {
  it("does not run on the title screen and starts once the player enters", async () => {
    const r = await renderApp({ start: "title" });
    expect(r.frames.pending).toBe(0);
    await r.click(
      Array.from(r.qa("button")).find((b) => b.textContent === "Begin Journey") ?? null,
    );
    expect(r.frames.pending).toBe(1);
  });

  it("pauses on the lifecycle pause and resumes with offline progress on return", async () => {
    const r = await renderApp({ seed: { game: { owned: { telescope: 10 } } } });
    expect(r.frames.pending).toBe(1);
    r.lifecycle.pause();
    expect(r.frames.pending).toBe(0);
    r.harness.clock.advance(3 * 3600 * 1000);
    r.lifecycle.resume();
    await r.flush();
    expect(r.frames.pending).toBe(1);
    expect(r.q("[data-sheet='welcome-back']").textContent).toContain("You were away for 3h 00m");
    expect(r.harness.session.snapshot().profile.game.starlight).toBeGreaterThan(100);
  });

  it("stops ticking when the app unmounts", async () => {
    const r = await renderApp({});
    expect(r.frames.pending).toBe(1);
    await r.unmount();
    expect(r.frames.pending).toBe(0);
  });
});

describe("long press on buy", () => {
  it("a tap buys once, holding repeats four times a second and the release click is swallowed", async () => {
    vi.useFakeTimers();
    try {
      const r = await renderApp({ seed: { game: { starlight: 1e6, owned: { telescope: 1 } } } });
      const { act } = await import("preact/test-utils");
      const owned = () => r.harness.session.snapshot().profile.game.owned.telescope ?? 0;
      await r.click(r.q("[role='tab']:nth-child(2)"));
      const button = r.q("[data-buy='telescope']");
      await r.click(button);
      expect(owned()).toBe(2);
      await act(() => {
        button.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      });
      await act(() => {
        vi.advanceTimersByTime(449);
      });
      expect(owned()).toBe(2);
      await act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(owned()).toBe(3);
      await act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(owned()).toBe(5);
      await act(() => {
        button.dispatchEvent(new Event("pointerup", { bubbles: true }));
        vi.advanceTimersByTime(1000);
      });
      expect(owned()).toBe(5);
      await r.click(button);
      expect(owned()).toBe(5);
      await r.click(button);
      expect(owned()).toBe(6);
    } finally {
      vi.useRealTimers();
    }
  });
});
