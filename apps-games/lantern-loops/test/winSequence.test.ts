import { createMotion } from "@web-games/kit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { playWinSequence, WIN_MAX_MS, winTimeline } from "../src/board/winSequence";

describe("winTimeline", () => {
  it("lights loops one after another and ripples along each loop", () => {
    const { steps, totalMs } = winTimeline(
      [
        [1, 2, 3],
        [10, 11],
      ],
      false,
    );
    expect(steps.map((s) => s.cell)).toEqual([1, 2, 3, 10, 11]);
    const delays = steps.map((s) => s.delayMs);
    expect([...delays].sort((a, b) => a - b)).toEqual(delays);
    expect(steps[3]?.delayMs).toBeGreaterThan(steps[2]?.delayMs ?? 0);
    expect(totalMs).toBeGreaterThan(0);
  });

  it("is empty with reduced motion", () => {
    expect(winTimeline([[1, 2, 3]], true)).toEqual({ steps: [], totalMs: 0 });
  });

  it("squeezes very long sequences under the cap", () => {
    const loop = Array.from({ length: 200 }, (_, i) => i);
    expect(winTimeline([loop, loop, loop], false).totalMs).toBeLessThanOrEqual(WIN_MAX_MS + 2);
  });
});

describe("playWinSequence", () => {
  afterEach(() => {
    Reflect.deleteProperty(Element.prototype, "animate");
  });

  const board = (): HTMLElement => {
    const root = document.createElement("div");
    root.innerHTML = [1, 2, 3]
      .map((c) => `<div data-cell="${c}"><i class="ll-tile"></i></div>`)
      .join("");
    return root;
  };

  it("animates every tile when motion is allowed and nothing when reduced", async () => {
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: () => undefined }));
    Object.defineProperty(Element.prototype, "animate", { value: animate, configurable: true });
    const timeline = winTimeline([[1, 2, 3]], false);
    await playWinSequence(board(), timeline, createMotion(false));
    expect(animate).toHaveBeenCalledTimes(3);
    animate.mockClear();
    await playWinSequence(board(), winTimeline([[1, 2, 3]], true), createMotion(true));
    await playWinSequence(board(), timeline, createMotion(true));
    expect(animate).not.toHaveBeenCalled();
  });
});
