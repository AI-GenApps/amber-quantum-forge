import { buildCampaignShift, TICK_MS } from "@web-games/the-last-window-core";
import { describe, expect, it } from "vitest";
import { MAX_CATCH_UP_TICKS, Runner } from "../src/shift/Runner";
import { browserScheduler, createManualScheduler } from "../src/shift/scheduler";
import { createFakeVisibility } from "./helpers";

function make(day = 2, visibility = createFakeVisibility()) {
  const scheduler = createManualScheduler();
  const runner = new Runner({
    def: buildCampaignShift(day),
    stock: { pastries: ["pastry-1"], books: ["book-1"] },
    scheduler,
    visibility,
  });
  return { runner, scheduler, visibility };
}

describe("Runner", () => {
  it("ticks once per 100 ms of accumulated time", () => {
    const { runner, scheduler } = make();
    runner.start();
    scheduler.advance(100, 100);
    expect(runner.state.tick).toBe(0);
    scheduler.advance(1000, 100);
    expect(runner.state.tick).toBe(10);
    scheduler.advance(250, 50);
    expect(runner.state.tick).toBe(12);
    expect(TICK_MS).toBe(100);
  });

  it("accumulates fractions of a tick across frames", () => {
    const { runner, scheduler } = make();
    runner.start();
    scheduler.advance(16, 16);
    scheduler.advance(16 * 25, 16);
    expect(runner.state.tick).toBe(4);
  });

  it("caps catch-up at five ticks per frame and drops the rest", () => {
    const { runner, scheduler } = make();
    runner.start();
    scheduler.advance(16, 16);
    scheduler.advance(5000, 5000);
    expect(runner.state.tick).toBe(MAX_CATCH_UP_TICKS);
    scheduler.advance(16, 16);
    expect(runner.state.tick).toBeLessThanOrEqual(MAX_CATCH_UP_TICKS + 1);
  });

  it("stands still while paused and ignores the paused time after resuming", () => {
    const { runner, scheduler } = make();
    runner.start();
    scheduler.advance(500, 100);
    const before = runner.state.tick;
    runner.pause();
    scheduler.advance(10000, 100);
    expect(runner.state.tick).toBe(before);
    expect(runner.paused).toBe(true);
    runner.resume();
    scheduler.advance(100, 100);
    expect(runner.state.tick).toBe(before);
    scheduler.advance(300, 100);
    expect(runner.state.tick).toBe(before + 3);
  });

  it("pauses while the document is hidden and while a sheet is open", () => {
    const { runner, scheduler, visibility } = make();
    runner.start();
    scheduler.advance(300, 100);
    visibility.setHidden(true);
    runner.pause("sheet");
    const held = runner.state.tick;
    scheduler.advance(2000, 100);
    expect(runner.state.tick).toBe(held);
    visibility.setHidden(false);
    scheduler.advance(500, 100);
    expect(runner.state.tick).toBe(held);
    runner.resume("sheet");
    scheduler.advance(400, 100);
    expect(runner.state.tick).toBeGreaterThan(held);
  });

  it("starts paused when the document is already hidden", () => {
    const visibility = createFakeVisibility();
    visibility.hidden = true;
    const { runner, scheduler } = make(2, visibility);
    runner.start();
    scheduler.advance(2000, 100);
    expect(runner.state.tick).toBe(0);
    expect(runner.paused).toBe(true);
  });

  it("applies actions, reports events and counts finished items", () => {
    const { runner, scheduler } = make(1);
    runner.start();
    const seen: string[] = [];
    runner.onEvents((events) => seen.push(...events.map((event) => event.type)));
    scheduler.advance(1200, 100);
    expect(seen).toContain("customer-seated");
    runner.dispatch({ type: "selectSeat", seat: 0 });
    for (const token of ["cup", "brew"] as const) runner.dispatch({ type: "drinkStep", token });
    scheduler.advance(900, 100);
    runner.dispatch({ type: "drinkStep", token: "pour" });
    expect(runner.itemsMade).toBe(1);
    const events = runner.dispatch({ type: "serve" });
    expect(events.some((event) => event.type === "served")).toBe(true);
  });

  it("stops scheduling when the shift is closed and after dispose", () => {
    const { runner, scheduler } = make(2);
    runner.start();
    scheduler.advance(300000, 100);
    expect(runner.closed).toBe(true);
    expect(runner.dispatch({ type: "serve" })).toEqual([]);
    expect(scheduler.pending).toBe(false);
    expect(runner.result().kind).toBe("day");
    const other = make(1);
    other.runner.start();
    other.runner.dispose();
    other.scheduler.advance(1000, 100);
    expect(other.runner.state.tick).toBe(0);
    expect(other.scheduler.pending).toBe(false);
  });

  it("notifies state listeners and lets them unsubscribe", () => {
    const { runner, scheduler } = make();
    runner.start();
    const ticks: number[] = [];
    const stop = runner.onState((state) => ticks.push(state.tick));
    scheduler.advance(500, 100);
    stop();
    scheduler.advance(300, 100);
    expect(ticks.length).toBeGreaterThan(0);
    expect(Math.max(...ticks)).toBeLessThan(runner.state.tick);
  });

  it("starts only once and ticks manually in whole steps", () => {
    const { runner } = make();
    runner.start();
    runner.start();
    runner.tick(3);
    expect(runner.state.tick).toBe(3);
  });
});

describe("schedulers", () => {
  it("runs one callback per frame in order and supports cancel", () => {
    const scheduler = createManualScheduler();
    const calls: number[] = [];
    const first = scheduler.request((now) => calls.push(now));
    scheduler.cancel(first);
    expect(scheduler.advance(32, 16)).toBe(0);
    scheduler.request((now) => calls.push(now));
    scheduler.advance(48, 16);
    expect(calls).toEqual([48]);
    expect(scheduler.now).toBe(80);
  });

  it("builds a browser scheduler that can cancel", () => {
    const scheduler = browserScheduler();
    const handle = scheduler.request(() => undefined);
    expect(handle).toBeDefined();
    scheduler.cancel(handle);
  });
});
