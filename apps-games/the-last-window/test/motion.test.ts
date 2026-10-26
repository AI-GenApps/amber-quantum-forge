import { describe, expect, it, vi } from "vitest";
import {
  ARRIVE_FRAMES,
  COIN_FRAMES,
  createGameMotion,
  HEART_FRAMES,
  PAGE_FRAMES,
  PULSE_FRAMES,
  SHEET_FRAMES,
  STAR_FRAMES,
  STEAM_FRAMES,
} from "../src/motion/game";

function target() {
  const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: vi.fn() }));
  const style = document.createElement("div").style;
  return { style, animate };
}

const HELPERS = [
  ["customerArrive", ARRIVE_FRAMES],
  ["patiencePulse", PULSE_FRAMES],
  ["steamRise", STEAM_FRAMES],
  ["coinPop", COIN_FRAMES],
  ["heartFill", HEART_FRAMES],
  ["pageTurn", PAGE_FRAMES],
  ["sheetSlide", SHEET_FRAMES],
] as const;

describe("motion helpers with reduced motion", () => {
  it("apply the final frame and never call animate", async () => {
    const motion = createGameMotion(true);
    expect(motion.reduced).toBe(true);
    for (const [name, frames] of HELPERS) {
      const el = target();
      await motion[name](el as never);
      expect(el.animate, name).not.toHaveBeenCalled();
      const last = frames[frames.length - 1] as Record<string, string | number>;
      expect(el.style.getPropertyValue("transform"), name).toBe(String(last.transform));
      expect(el.style.getPropertyValue("opacity"), name).toBe(String(last.opacity ?? ""));
    }
  });

  it("shows every star in its final state without animating", async () => {
    const motion = createGameMotion(true);
    const stars = [target(), target(), target()];
    await motion.starReveal(stars as never);
    for (const star of stars) {
      expect(star.animate).not.toHaveBeenCalled();
      expect(star.style.getPropertyValue("opacity")).toBe("1");
      expect(star.style.getPropertyValue("transform")).toBe("scale(1) rotate(0deg)");
    }
    expect(STAR_FRAMES).toHaveLength(2);
  });
});

describe("motion helpers with full motion", () => {
  it("animate each helper once", async () => {
    const motion = createGameMotion(false);
    for (const [name] of HELPERS) {
      const el = target();
      await motion[name](el as never);
      expect(el.animate, name).toHaveBeenCalledTimes(1);
    }
  });

  it("staggers the star reveal by 120 ms", async () => {
    const motion = createGameMotion(false);
    const stars = [target(), target(), target()];
    await motion.starReveal(stars as never);
    const delays = stars.map(
      (star) => (star.animate.mock.calls[0] as unknown as [unknown, { delay: number }])[1].delay,
    );
    expect(delays).toEqual([0, 120, 240]);
  });

  it("follows a reduced-motion source that changes", async () => {
    let reduced = false;
    const motion = createGameMotion(() => reduced);
    const first = target();
    await motion.coinPop(first as never);
    expect(first.animate).toHaveBeenCalledTimes(1);
    reduced = true;
    const second = target();
    await motion.coinPop(second as never);
    expect(second.animate).not.toHaveBeenCalled();
  });
});
