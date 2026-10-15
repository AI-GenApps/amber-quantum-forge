// @vitest-environment node
import { describe, expect, it } from "vitest";
import { GameLoop, MAX_FRAME_SECONDS } from "../../src/game/loop";

function makeLoop() {
  const log = { steps: 0, renders: [] as { alpha: number; seconds: number }[] };
  const loop = new GameLoop({
    step: () => {
      log.steps++;
    },
    render: (alpha, seconds) => log.renders.push({ alpha, seconds }),
  });
  return { loop, log };
}

/** Feed `count` frames spaced `frameMs` apart, starting at t = 0. Returns the steps per frame. */
function feed(loop: GameLoop, frameMs: number, count: number): number[] {
  const perFrame: number[] = [];
  for (let i = 0; i <= count; i++) perFrame.push(loop.frame(i * frameMs));
  return perFrame.slice(1);
}

describe("GameLoop with a fake clock", () => {
  it("runs the right number of steps for 7 ms frames", () => {
    const { loop, log } = makeLoop();
    const perFrame = feed(loop, 7, 600); // 4.2 s of real time
    expect(log.steps).toBe(Math.floor(4200 / (1000 / 60)));
    expect(Math.max(...perFrame)).toBe(1);
    expect(perFrame.filter((n) => n === 0).length).toBeGreaterThan(0);
  });

  it("runs the right number of steps for 40 ms frames", () => {
    const { loop, log } = makeLoop();
    const perFrame = feed(loop, 40, 150); // 6 s of real time
    expect(log.steps).toBe(360);
    expect(Math.min(...perFrame)).toBeGreaterThanOrEqual(2);
    expect(Math.max(...perFrame)).toBeLessThanOrEqual(3);
  });

  it("runs one step per frame at 60 Hz (floating-point rounding may shift one by a frame)", () => {
    const { loop } = makeLoop();
    const perFrame = feed(loop, 1000 / 60, 120);
    const total = perFrame.reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(119);
    expect(total).toBeLessThanOrEqual(120);
    expect(Math.max(...perFrame)).toBeLessThanOrEqual(2);
  });

  it("caps a long stall at 5 steps and drops the backlog", () => {
    const { loop, log } = makeLoop();
    loop.frame(0);
    expect(loop.frame(2000)).toBe(5);
    expect(log.steps).toBe(5);
    expect(loop.frame(2000 + 1000 / 60)).toBe(1);
  });

  it("does not step on the very first frame", () => {
    const { loop, log } = makeLoop();
    expect(loop.frame(123456)).toBe(0);
    expect(log.steps).toBe(0);
    expect(log.renders).toHaveLength(1);
  });

  it("ignores time running backwards", () => {
    const { loop, log } = makeLoop();
    loop.frame(1000);
    expect(loop.frame(900)).toBe(0);
    expect(log.renders.at(-1)?.seconds).toBe(0);
  });

  it("renders once per frame with alpha in [0, 1) and a capped frame time", () => {
    const { loop, log } = makeLoop();
    feed(loop, 7, 100);
    loop.frame(100_000);
    expect(log.renders).toHaveLength(102);
    for (const r of log.renders) {
      expect(r.alpha).toBeGreaterThanOrEqual(0);
      expect(r.alpha).toBeLessThan(1);
      expect(r.seconds).toBeLessThanOrEqual(MAX_FRAME_SECONDS);
    }
  });

  it("reports total ticks", () => {
    const { loop } = makeLoop();
    feed(loop, 40, 10);
    expect(loop.ticks).toBe(24);
  });
});
